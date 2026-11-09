/* eslint-disable no-console */
import { readFileSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import { db } from "../src/lib/db";
import * as https from "https";
import { pipeline } from "stream/promises";

interface ExerciseData {
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
  id: string;
}

// Function to download an image from URL to local path
async function downloadImage(url: string, localPath: string): Promise<boolean> {
  try {
    // Create directory if it doesn't exist
    const dir = localPath.substring(0, localPath.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });

    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode === 200) {
            const writeStream = createWriteStream(localPath);
            pipeline(response, writeStream)
              .then(() => resolve(true))
              .catch(reject);
          } else {
            console.warn(
              `Failed to download ${url}: HTTP ${response.statusCode}`,
            );
            resolve(false);
          }
        })
        .on("error", (error) => {
          console.warn(`Error downloading ${url}:`, error.message);
          resolve(false);
        });
    });
  } catch (error) {
    console.warn(`Error creating directory or downloading ${url}:`, error);
    return false;
  }
}

// Function to sanitize exercise name for folder creation
function sanitizeExerciseName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .toLowerCase();
}

async function transformExerciseData(exercise: ExerciseData, index: number) {
  // Generate a unique exerciseId based on index since the JSON doesn't have one
  const exerciseId = index + 1;

  // Sanitize exercise name for folder creation
  const sanitizedName = sanitizeExerciseName(exercise.name);
  const exerciseFolder = join(
    process.cwd(),
    "data",
    "exercises",
    sanitizedName,
  );

  // Download images and create local image data
  const localImages: Record<string, string> = {};
  const imageUrls = exercise.images.map(
    (image) =>
      `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${image}`,
  );

  // Download images with numbered indexes for animation
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const extension = url.split(".").pop() || "jpg";
    const fileName = url.split("/").pop() || `${i + 1}.${extension}`;
    const localImagePath = join(exerciseFolder, fileName);
    const relativeImagePath = `/exercises/${sanitizedName}/${fileName}`;

    console.log(
      `Downloading image ${i + 1}/${imageUrls.length} for ${exercise.name}...`,
    );
    const success = await downloadImage(url, localImagePath);

    if (success) {
      localImages[`image_${i + 1}`] = relativeImagePath;
    }
  }

  // Create image data structure for the Exercise model (keep original GitHub URLs as backup)
  // Keep original GitHub URLs as backup (unused for now)
  const _img =
    imageUrls.length > 0
      ? {
          male: imageUrls[0],
          female: imageUrls[0], // Use the same image for both unless we have gender-specific ones
        }
      : null;

  // Determine if it's cardio based on category
  const isCardio =
    exercise.category === "cardio" ||
    exercise.category === "plyometrics" ||
    (exercise.force === "static" && exercise.category === "stretching");

  // Determine if it's yoga (basic check)
  const isYoga =
    exercise.category === "stretching" &&
    (exercise.name.toLowerCase().includes("yoga") ||
      exercise.name.toLowerCase().includes("pose"));

  // Map category to our type system
  const getExerciseType = (category: string): string => {
    switch (category.toLowerCase()) {
      case "strength":
        return "Strength";
      case "cardio":
      case "plyometrics":
        return "Cardio";
      case "stretching":
        return "Flexibility";
      case "powerlifting":
        return "Powerlifting";
      case "strongman":
        return "Strongman";
      case "olympic weightlifting":
        return "Olympic Weightlifting";
      default:
        return "Work Out";
    }
  };

  return {
    exerciseId,
    title: exercise.name,
    titleRaw: exercise.name,
    img: null,
    imgPng: null,
    anim: null,
    singleAnim: null,
    localImages: Object.keys(localImages).length > 0 ? localImages : null,
    permalink: null,
    type: getExerciseType(exercise.category),
    tags: exercise.category,
    isCardio,
    isNewEx: false,
    presetNotes:
      exercise.instructions.length > 0 ? exercise.instructions[0] : null,
    isPersonalPresetNote: false,
    isYoga,
    sanskrit: null,
    sanskritRaw: null,
    alignmentCues: null,
    commonName: exercise.name,
    eet: null,
    isYogaPremium: false,
    audio: null,
    isFav: false,
    equipment: exercise.equipment || "None",
    primaryMuscles: exercise.primaryMuscles.join(", "),
    secondaryMuscles: exercise.secondaryMuscles.join(", "),
    instructions: exercise.instructions.join("\n\n"),
  };
}

async function main() {
  try {
    console.log("Starting exercise data upload with image downloads...");

    // Create the exercises directory if it doesn't exist
    const exercisesDir = join(process.cwd(), "data", "exercises");
    mkdirSync(exercisesDir, { recursive: true });

    // Read the JSON file
    const filePath = join(process.cwd(), "data", "exercises.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const exercises: ExerciseData[] = JSON.parse(fileContent);

    console.log(`Found ${exercises.length} exercises to upload`);
    console.log(
      "Note: This will download images for each exercise, which may take a while...",
    );

    let successCount = 0;
    let errorCount = 0;

    // Process exercises in smaller batches to avoid overwhelming the database and network
    const batchSize = 10; // Reduced batch size due to image downloads
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(exercises.length / batchSize)} (exercises ${i + 1}-${Math.min(i + batchSize, exercises.length)})...`,
      );

      const batchPromises = batch.map(async (exercise, batchIndex) => {
        try {
          const transformedExercise = await transformExerciseData(
            exercise,
            i + batchIndex,
          );

          await db.exercise.upsert({
            where: { exerciseId: transformedExercise.exerciseId },
            update: transformedExercise,
            create: transformedExercise,
          });

          return { success: true, exercise: exercise.name };
        } catch (error) {
          console.error(`Error processing exercise "${exercise.name}":`, error);
          return { success: false, exercise: exercise.name, error };
        }
      });

      const results = await Promise.all(batchPromises);

      results.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // Add a small delay between batches to be gentle on the database and network
      if (i + batchSize < exercises.length) {
        console.log("Waiting 2 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log(`\nUpload completed!`);
    console.log(`Successfully uploaded: ${successCount} exercises`);
    console.log(`Errors: ${errorCount} exercises`);

    if (errorCount > 0) {
      console.log("Check the logs above for specific error details.");
    }
  } catch (error) {
    console.error("Fatal error during upload:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

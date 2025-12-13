import { readFileSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import { db } from "../src/lib/db";
import * as https from "https";
/* eslint-disable no-console */
import { pipeline } from "stream/promises";

interface ExerciseData2 {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

// Function to download a GIF from URL to local path
async function downloadGif(url: string, localPath: string): Promise<boolean> {
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

// Function to generate a numeric exerciseId from the string exerciseId
function generateNumericId(stringId: string): number {
  // Convert string to a number by taking hash code
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    const char = stringId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function transformExerciseData(exercise: ExerciseData2, _index: number) {
  // Generate a unique numeric exerciseId from the string ID
  const numericExerciseId = generateNumericId(exercise.exerciseId);

  // Sanitize exercise name for folder creation
  const sanitizedName = sanitizeExerciseName(exercise.name);
  const exerciseFolder = join(
    process.cwd(),
    "data",
    "exercises",
    sanitizedName,
  );

  // Download GIF and create local image data
  const localImages: Record<string, string> = {};

  if (exercise.gifUrl) {
    const fileName = `${exercise.exerciseId}.gif`;
    const localGifPath = join(exerciseFolder, fileName);
    const relativeGifPath = `/exercises/${sanitizedName}/${fileName}`;

    console.log(`Downloading GIF for ${exercise.name}...`);
    const success = await downloadGif(exercise.gifUrl, localGifPath);

    if (success) {
      localImages["animation"] = relativeGifPath;
    }
  }

  // Determine exercise type based on body parts and equipment
  const getExerciseType = (
    bodyParts: string[],
    equipments: string[],
  ): string => {
    const bodyPartsLower = bodyParts.map((bp) => bp.toLowerCase());
    const equipmentsLower = equipments.map((eq) => eq.toLowerCase());

    // Check for cardio exercises
    if (
      bodyPartsLower.includes("cardio") ||
      equipmentsLower.some((eq) =>
        ["treadmill", "stationary bike", "elliptical"].includes(eq),
      )
    ) {
      return "Cardio";
    }

    // Check for strength training
    if (
      equipmentsLower.some((eq) =>
        ["barbell", "dumbbell", "kettlebell", "smith machine"].includes(eq),
      )
    ) {
      return "Strength";
    }

    // Check for bodyweight
    if (equipmentsLower.includes("body weight")) {
      return "Bodyweight";
    }

    // Check for flexibility/yoga
    if (
      bodyPartsLower.some((bp) => bp.includes("stretch")) ||
      exercise.name.toLowerCase().includes("stretch")
    ) {
      return "Flexibility";
    }

    return "Work Out"; // Default
  };

  // Determine if it's cardio
  const isCardio =
    exercise.bodyParts.some((bp) => bp.toLowerCase() === "cardio") ||
    exercise.equipments.some((eq) =>
      ["treadmill", "stationary bike", "elliptical"].includes(eq.toLowerCase()),
    );

  // Determine if it's yoga (basic check)
  const isYoga =
    exercise.name.toLowerCase().includes("yoga") ||
    exercise.name.toLowerCase().includes("pose") ||
    exercise.name.toLowerCase().includes("asana");

  // Create tags from body parts and target muscles
  const allTags = exercise.bodyParts.concat(exercise.targetMuscles);
  const uniqueTags = Array.from(new Set(allTags));
  const tags = uniqueTags.join(", ");

  return {
    exerciseId: numericExerciseId,
    title: exercise.name,
    titleRaw: exercise.name,
    img: null, // We'll use localImages for the GIF
    imgPng: null,
    anim: exercise.gifUrl ? { url: exercise.gifUrl } : null,
    singleAnim: exercise.gifUrl ? { url: exercise.gifUrl } : null,
    localImages: Object.keys(localImages).length > 0 ? localImages : null,
    permalink: null,
    type: getExerciseType(exercise.bodyParts, exercise.equipments),
    tags,
    isCardio,
    isNewEx: false,
    presetNotes:
      exercise.instructions.length > 0
        ? exercise.instructions[0].replace(/^Step:\d+\s*/, "")
        : null,
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
    equipment: exercise.equipments.join(", "),
    primaryMuscles: exercise.targetMuscles.join(", "),
    secondaryMuscles: exercise.secondaryMuscles.join(", "),
    instructions: exercise.instructions
      .map((inst) => inst.replace(/^Step:\d+\s*/, ""))
      .join("\n\n"),
  };
}

async function main() {
  try {
    console.log(
      "Starting exercise data upload from exercises-2.json with GIF downloads...",
    );

    // Create the exercises directory if it doesn't exist
    const exercisesDir = join(process.cwd(), "data", "exercises");
    mkdirSync(exercisesDir, { recursive: true });

    // Read the JSON file
    const filePath = join(process.cwd(), "data", "exercises-2.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const exercises: ExerciseData2[] = JSON.parse(fileContent);

    // Filter out incomplete exercises (those without names or IDs)
    const validExercises = exercises.filter(
      (exercise) =>
        exercise.exerciseId && exercise.name && exercise.name.trim() !== "",
    );

    console.log(
      `Found ${exercises.length} total exercises, ${validExercises.length} valid exercises to upload`,
    );
    console.log(
      "Note: This will download GIFs for each exercise, which may take a while...",
    );

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process exercises in smaller batches to avoid overwhelming the database and network
    const batchSize = 5; // Smaller batch size due to GIF downloads
    for (let i = 0; i < validExercises.length; i += batchSize) {
      const batch = validExercises.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validExercises.length / batchSize)} (exercises ${i + 1}-${Math.min(i + batchSize, validExercises.length)})...`,
      );

      const batchPromises = batch.map(async (exercise, batchIndex) => {
        try {
          const transformedExercise = await transformExerciseData(
            exercise,
            i + batchIndex,
          );

          // Check if exercise already exists
          const existingExercise = await db.exercise.findUnique({
            where: { exerciseId: transformedExercise.exerciseId },
          });

          if (existingExercise) {
            console.log(
              `Exercise "${exercise.name}" already exists, skipping...`,
            );
            return { success: true, skipped: true, exercise: exercise.name };
          }

          await db.exercise.create({
            data: transformedExercise,
          });

          return { success: true, skipped: false, exercise: exercise.name };
        } catch (error) {
          console.error(`Error processing exercise "${exercise.name}":`, error);
          return {
            success: false,
            skipped: false,
            exercise: exercise.name,
            error,
          };
        }
      });

      const results = await Promise.all(batchPromises);

      results.forEach((result) => {
        if (result.success) {
          if (result.skipped) {
            skippedCount++;
          } else {
            successCount++;
          }
        } else {
          errorCount++;
        }
      });

      // Add a small delay between batches to be gentle on the database and network
      if (i + batchSize < validExercises.length) {
        console.log("Waiting 3 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log(`\nUpload completed!`);
    console.log(`Successfully uploaded: ${successCount} exercises`);
    console.log(`Skipped (already exists): ${skippedCount} exercises`);
    console.log(`Errors: ${errorCount} exercises`);
    console.log(
      `Invalid/empty exercises skipped: ${exercises.length - validExercises.length}`,
    );

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

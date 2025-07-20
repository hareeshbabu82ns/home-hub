import fs from "fs/promises";
import path from "path";
import { db } from "../src/lib/db";
import { ExerciseCreateInput } from "../src/types/exercise";

interface WorkoutLabsResponse {
  pages: Array<
    Array<{
      id: number;
      title: string;
      title_raw: string;
      img: {
        male: string | null;
        female: string | null;
        mid?: string;
        fid?: string;
      };
      img_png: {
        male: string | null;
        female: string | null;
        mid?: string;
        fid?: string;
      };
      anim: {
        female: string | null;
        female_id?: string;
        male: string | null;
        male_id?: string;
      };
      single_anim: {
        female: string | null;
        female_id?: string;
        male: string | null;
        male_id?: string;
      };
      permalink: string;
      type: string;
      tags: string;
      is_cardio: boolean;
      is_new_ex: boolean;
      preset_notes: string;
      is_personal_preset_note: boolean;
      is_yoga: boolean;
      sanskrit: string;
      sanskrit_raw: string;
      alignment_cues: string;
      common_name: string;
      eet: string;
      is_yoga_premium: boolean;
      audio: string;
      is_fav: boolean;
    }>
  >;
  totalRecords?: number;
  totalPages?: number;
}

const WORKOUT_LABS_CONFIG = {
  url: "https://workoutlabs.com/fit/custom-ajax.php",
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    connection: "keep-alive",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    origin: "https://workoutlabs.com",
    referer: "https://workoutlabs.com/exercise-guide",
    "sec-ch-ua":
      '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
    cookie:
      "cgc_trigger=1; PHPSESSID=7ki1vhclajl257lr8r3ldanaa3; goi-tooltip-shown-wl1=1; animateShareButtons=0; timeOnWebsite=50; _fbp=fb.1.1752866213526.571079195216412065; intercom-id-swzakf94=5ead7f30-739b-446c-bded-19b450502680; intercom-session-swzakf94=; intercom-device-id-swzakf94=974be761-4022-4884-b163-9235a0d014dd; shared_wokrout_limit=1; user_gender=m; ecb-popup-v2=1; utm_source=internal; intercom-id-qhtjvn4d=6cee9681-211d-4ac0-90b3-5486095735ef; intercom-session-qhtjvn4d=; intercom-device-id-qhtjvn4d=08681666-1a33-4234-9a1a-5bdb1d2dc671",
  },
};
/**
 * data[eq][] : Equipment filter
 */
const EQUIPMENT_QUERY_OPTIONS = [
  "Full gym",
  "NO EQUIPMENT",
  "Agility Ladder",
  "Barbell / EZ-Bar",
  "Battle Rope",
  "Bosu Ball",
  "Cable Station",
  "Climbing Rope",
  "Dumbbells",
  "Foam roller",
  "Gymnastic Rings",
  "Kettlebells",
  "Medicine Ball",
  "Plyo Box",
  "Powerbag / Sandbag",
  "Resistance Bands",
  "Sled",
  "Stationary Bike",
  "Suspension Straps / TRX",
  "Swiss / Exercise Ball",
  "Treadmill",
  "Water Bottles",
];

/**
 * Downloads exercise data from WorkoutLabs API for a specific page
 */
async function downloadExercisePage(
  page: number,
): Promise<WorkoutLabsResponse | null> {
  const formData = new URLSearchParams({
    "data[eq][]": EQUIPMENT_QUERY_OPTIONS[2],
    "data[page]": page.toString(),
    action: "filter_sidebar_exercises",
    bypsec: "1",
    c: "1", // color images
  });

  try {
    console.log(`📥 Downloading page ${page}...`);

    const response = await fetch(WORKOUT_LABS_CONFIG.url, {
      method: "POST",
      headers: WORKOUT_LABS_CONFIG.headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `🔍 Raw response for page ${page}:`,
      JSON.stringify(data, null, 2).substring(0, 500) + "...",
    );

    if (
      !data.pages ||
      !Array.isArray(data.pages) ||
      data.pages.length === 0 ||
      !data.pages[0] ||
      data.pages[0].length === 0
    ) {
      console.log(`⚠️  No exercise data found on page ${page}`);
      return null;
    }

    console.log(
      `✅ Downloaded ${data.pages[0].length} exercises from page ${page}`,
    );
    return data;
  } catch (error) {
    console.error(`❌ Error downloading page ${page}:`, error);
    return null;
  }
}

/**
 * Saves exercise data to JSON file
 */
async function saveExercisesToFile(
  exercises: WorkoutLabsResponse[],
  fileName: string,
): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");

  // Ensure data directory exists
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, fileName);

  try {
    await fs.writeFile(filePath, JSON.stringify(exercises, null, 2));
    console.log(`💾 Saved exercise data to ${filePath}`);
  } catch (error) {
    console.error(`❌ Error saving to file:`, error);
    throw error;
  }
}

/**
 * Transforms WorkoutLabs exercise data to our database format with downloaded assets
 */
async function transformExerciseData(
  exercise: WorkoutLabsResponse["pages"][0][0],
  forceDownload: boolean = false,
): Promise<ExerciseCreateInput> {
  console.log(`🔄 Processing exercise: ${exercise.title}`);

  // Download all assets for this exercise
  const assets = await downloadExerciseAssets(exercise, forceDownload);

  return {
    exerciseId: exercise.id, // Use 'id' instead of 'eid'
    title: exercise.title,
    titleRaw: exercise.title_raw,
    img: assets.img,
    imgPng: assets.imgPng,
    anim: assets.anim,
    singleAnim: assets.singleAnim,
    permalink: exercise.permalink || undefined,
    type: exercise.type || "Work Out",
    tags: exercise.tags || undefined,
    isCardio: exercise.is_cardio || false,
    isNewEx: exercise.is_new_ex || false,
    presetNotes: exercise.preset_notes || undefined,
    isPersonalPresetNote: exercise.is_personal_preset_note || false,
    isYoga: exercise.is_yoga || false,
    sanskrit: exercise.sanskrit || undefined,
    sanskritRaw: exercise.sanskrit_raw || undefined,
    alignmentCues: exercise.alignment_cues || undefined,
    commonName: exercise.common_name || undefined,
    eet: exercise.eet || undefined,
    isYogaPremium: exercise.is_yoga_premium || false,
    audio: exercise.audio || undefined,
    isFav: exercise.is_fav || false,
  };
}

/**
 * Uploads exercises to the database with upsert logic
 */
async function uploadExercisesToDatabase(
  exercises: ExerciseCreateInput[],
): Promise<void> {
  console.log(`🏗️  Uploading ${exercises.length} exercises to database...`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const exercise of exercises) {
    try {
      const exerciseData = {
        exerciseId: exercise.exerciseId,
        title: exercise.title,
        titleRaw: exercise.titleRaw,
        img: exercise.img ? JSON.parse(JSON.stringify(exercise.img)) : null,
        imgPng: exercise.imgPng
          ? JSON.parse(JSON.stringify(exercise.imgPng))
          : null,
        anim: exercise.anim ? JSON.parse(JSON.stringify(exercise.anim)) : null,
        singleAnim: exercise.singleAnim
          ? JSON.parse(JSON.stringify(exercise.singleAnim))
          : null,
        permalink: exercise.permalink,
        type: exercise.type,
        tags: exercise.tags,
        isCardio: exercise.isCardio,
        isNewEx: exercise.isNewEx,
        presetNotes: exercise.presetNotes,
        isPersonalPresetNote: exercise.isPersonalPresetNote,
        isYoga: exercise.isYoga,
        sanskrit: exercise.sanskrit,
        sanskritRaw: exercise.sanskritRaw,
        alignmentCues: exercise.alignmentCues,
        commonName: exercise.commonName,
        eet: exercise.eet,
        isYogaPremium: exercise.isYogaPremium,
        audio: exercise.audio,
        isFav: exercise.isFav,
      };

      const result = await db.exercise.upsert({
        where: { exerciseId: exercise.exerciseId },
        update: exerciseData,
        create: exerciseData,
      });

      if (result.createdAt === result.updatedAt) {
        created++;
      } else {
        updated++;
      }

      if ((created + updated) % 10 === 0) {
        console.log(
          `📊 Progress: ${created} created, ${updated} updated, ${errors} errors`,
        );
      }
    } catch (error) {
      errors++;
      console.error(
        `❌ Error upserting exercise ${exercise.exerciseId}:`,
        error,
      );
    }
  }

  console.log(
    `✅ Database upload complete: ${created} created, ${updated} updated, ${errors} errors`,
  );
}

/**
 * Main function to download all exercises
 */
async function downloadAllExercises(
  forceDownload: boolean = false,
): Promise<void> {
  console.log("🚀 Starting exercise download process...");

  if (forceDownload) {
    console.log("💪 Force download enabled - will re-download existing files");
  }

  const allExercises: WorkoutLabsResponse[] = [];
  let page = 0; // Start from page 0 as per curl command
  let hasMorePages = true; // Download all pages
  while (hasMorePages) {
    const pageData = await downloadExercisePage(page);

    if (
      !pageData ||
      !pageData.pages ||
      pageData.pages.length === 0 ||
      !pageData.pages[0] ||
      pageData.pages[0].length === 0
    ) {
      hasMorePages = false;
      break;
    }

    allExercises.push(pageData);

    // Continue to next page (we'll stop when we get no data)
    page++;

    // Add delay to be respectful to the API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (allExercises.length === 0) {
    console.log("❌ No exercises downloaded");
    return;
  }

  // Save raw data to file
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, "-")
    .replace(/(\d{2}):(\d{2}):(\d{2}).*/, "$1-$2-$3");
  await saveExercisesToFile(allExercises, `exercises-raw-${timestamp}.json`);

  // Transform and flatten exercise data
  const transformedExercises: ExerciseCreateInput[] = [];
  for (const pageData of allExercises) {
    for (const exerciseArray of pageData.pages) {
      for (const exercise of exerciseArray) {
        const transformedExercise = await transformExerciseData(
          exercise,
          forceDownload,
        );
        transformedExercises.push(transformedExercise);
      }
    }
  }

  // Save transformed data
  await saveExercisesToFile(
    [{ transformedExercises }] as any,
    `exercises-transformed-${timestamp}.json`,
  );

  console.log(`📋 Total exercises downloaded: ${transformedExercises.length}`);

  // Upload to database
  await uploadExercisesToDatabase(transformedExercises);

  console.log("🎉 Exercise download and upload process completed!");
}

/**
 * Function to upload exercises from a previously saved JSON file
 */
async function uploadFromFile(
  filePath: string,
  forceDownload: boolean = false,
): Promise<void> {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    let exercises: ExerciseCreateInput[] = [];

    // Handle different file formats
    if (Array.isArray(data)) {
      // Raw format - new structure with pages
      for (const pageData of data) {
        if (pageData.pages && Array.isArray(pageData.pages)) {
          for (const exerciseArray of pageData.pages) {
            for (const exercise of exerciseArray) {
              const transformedExercise = await transformExerciseData(
                exercise,
                forceDownload,
              );
              exercises.push(transformedExercise);
            }
          }
        }
      }
    } else if (data.transformedExercises) {
      // Transformed format
      exercises = data.transformedExercises;
    }

    if (exercises.length === 0) {
      console.log("❌ No exercises found in file");
      return;
    }

    await uploadExercisesToDatabase(exercises);
  } catch (error) {
    console.error("❌ Error uploading from file:", error);
    throw error;
  }
}

/**
 * Downloads a file from URL and saves it locally
 */
async function downloadFile(
  url: string,
  localPath: string,
  forceDownload: boolean = false,
): Promise<string | null> {
  if (!url || url.trim() === "") {
    return null;
  }

  try {
    // Ensure directory exists
    const dir = path.dirname(localPath);
    await fs.mkdir(dir, { recursive: true });

    // Skip if file already exists (unless force download is enabled)
    if (!forceDownload) {
      try {
        await fs.access(localPath);
        console.log(`⏭️  File already exists: ${path.basename(localPath)}`);
        return localPath;
      } catch {
        // File doesn't exist, continue with download
      }
    }

    if (forceDownload) {
      console.log(`🔄 Force downloading: ${path.basename(localPath)}`);
    } else {
      console.log(`📥 Downloading: ${path.basename(localPath)}`);
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️  Failed to download ${url}: ${response.status}`);
      return null;
    }

    if (!response.body) {
      console.warn(`⚠️  No response body for ${url}`);
      return null;
    }

    // Convert ReadableStream to Buffer and write to file
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(localPath, buffer);

    console.log(`✅ Downloaded: ${path.basename(localPath)}`);
    return localPath;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error);
    return null;
  }
}

/**
 * Downloads exercise images and animations
 */
async function downloadExerciseAssets(
  exercise: WorkoutLabsResponse["pages"][0][0],
  forceDownload: boolean = false,
): Promise<{
  img: {
    male: string | null;
    female: string | null;
    mid?: string;
    fid?: string;
  };
  imgPng: {
    male: string | null;
    female: string | null;
    mid?: string;
    fid?: string;
  };
  anim: {
    female: string | null;
    female_id?: string;
    male: string | null;
    male_id?: string;
  };
  singleAnim: {
    female: string | null;
    female_id?: string;
    male: string | null;
    male_id?: string;
  };
}> {
  const exerciseDir = path.join(
    process.cwd(),
    "data",
    "exercises",
    exercise.id.toString(),
  );

  // Download SVG images
  const imgMale = exercise.img.male
    ? await downloadFile(
        exercise.img.male,
        path.join(exerciseDir, "img", "male.svg"),
        forceDownload,
      )
    : null;

  const imgFemale = exercise.img.female
    ? await downloadFile(
        exercise.img.female,
        path.join(exerciseDir, "img", "female.svg"),
        forceDownload,
      )
    : null;

  // Download PNG images
  const imgPngMale = exercise.img_png.male
    ? await downloadFile(
        exercise.img_png.male,
        path.join(exerciseDir, "img_png", "male.png"),
        forceDownload,
      )
    : null;

  const imgPngFemale = exercise.img_png.female
    ? await downloadFile(
        exercise.img_png.female,
        path.join(exerciseDir, "img_png", "female.png"),
        forceDownload,
      )
    : null;

  // Download animations (SVG)
  const animMale = exercise.anim.male
    ? await downloadFile(
        exercise.anim.male,
        path.join(exerciseDir, "anim", "male.svg"),
        forceDownload,
      )
    : null;

  const animFemale = exercise.anim.female
    ? await downloadFile(
        exercise.anim.female,
        path.join(exerciseDir, "anim", "female.svg"),
        forceDownload,
      )
    : null;

  // Download single animations (GIF)
  const singleAnimMale = exercise.single_anim.male
    ? await downloadFile(
        exercise.single_anim.male,
        path.join(exerciseDir, "single_anim", "male.gif"),
        forceDownload,
      )
    : null;

  const singleAnimFemale = exercise.single_anim.female
    ? await downloadFile(
        exercise.single_anim.female,
        path.join(exerciseDir, "single_anim", "female.gif"),
        forceDownload,
      )
    : null;

  // Return local paths (relative to public directory for serving)
  const baseUrl = `/exercises/${exercise.id}`;

  return {
    img: {
      male: imgMale ? `${baseUrl}/img/male.svg` : null,
      female: imgFemale ? `${baseUrl}/img/female.svg` : null,
      mid: exercise.img.mid,
      fid: exercise.img.fid,
    },
    imgPng: {
      male: imgPngMale ? `${baseUrl}/img_png/male.png` : null,
      female: imgPngFemale ? `${baseUrl}/img_png/female.png` : null,
      mid: exercise.img_png.mid,
      fid: exercise.img_png.fid,
    },
    anim: {
      male: animMale ? `${baseUrl}/anim/male.svg` : null,
      male_id: exercise.anim.male_id,
      female: animFemale ? `${baseUrl}/anim/female.svg` : null,
      female_id: exercise.anim.female_id,
    },
    singleAnim: {
      male: singleAnimMale ? `${baseUrl}/single_anim/male.gif` : null,
      male_id: exercise.single_anim.male_id,
      female: singleAnimFemale ? `${baseUrl}/single_anim/female.gif` : null,
      female_id: exercise.single_anim.female_id,
    },
  };
}

/**
 * Refreshes existing exercise data by re-downloading assets and updating database
 */
async function refreshExerciseData(
  forceDownload: boolean = false,
): Promise<void> {
  console.log("🔄 Refreshing exercise data...");

  if (forceDownload) {
    console.log("💪 Force download enabled - will re-download existing files");
  }

  // Get all exercises from database
  const exercises = await db.exercise.findMany({
    select: { exerciseId: true, title: true },
  });

  console.log(`🔍 Found ${exercises.length} exercises in database to refresh`);

  if (exercises.length === 0) {
    console.log(
      "⚠️  No exercises found in database. Run 'download' command first.",
    );
    return;
  }

  // Load the raw data file to get original URLs
  const dataFiles = await fs.readdir(path.join(process.cwd(), "data"));
  const rawFile = dataFiles.find(
    (f) => f.startsWith("exercises-raw-") && f.endsWith(".json"),
  );

  if (!rawFile) {
    console.log(
      "⚠️  No raw exercise data file found. Run 'download' command first.",
    );
    return;
  }

  const rawData = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "data", rawFile), "utf-8"),
  );

  // Process each exercise
  let updated = 0;
  let errors = 0;

  for (const pageData of rawData) {
    for (const exerciseArray of pageData.pages) {
      for (const exercise of exerciseArray) {
        try {
          console.log(`🔄 Refreshing: ${exercise.title}`);
          const transformedExercise = await transformExerciseData(
            exercise,
            forceDownload,
          );

          await db.exercise.update({
            where: { exerciseId: exercise.id },
            data: {
              img: transformedExercise.img
                ? JSON.parse(JSON.stringify(transformedExercise.img))
                : null,
              imgPng: transformedExercise.imgPng
                ? JSON.parse(JSON.stringify(transformedExercise.imgPng))
                : null,
              anim: transformedExercise.anim
                ? JSON.parse(JSON.stringify(transformedExercise.anim))
                : null,
              singleAnim: transformedExercise.singleAnim
                ? JSON.parse(JSON.stringify(transformedExercise.singleAnim))
                : null,
            },
          });

          updated++;

          if (updated % 10 === 0) {
            console.log(`📊 Progress: ${updated} updated, ${errors} errors`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error refreshing exercise ${exercise.id}:`, error);
        }
      }
    }
  }

  console.log(`✅ Refresh complete: ${updated} updated, ${errors} errors`);
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];
const filePath = args[1];
const forceFlag = args.includes("--force") || args.includes("-f");

async function main() {
  try {
    if (command === "download") {
      await downloadAllExercises(forceFlag);
    } else if (command === "upload" && filePath) {
      await uploadFromFile(filePath, forceFlag);
    } else if (command === "refresh") {
      await refreshExerciseData(forceFlag);
    } else {
      console.log(`
Usage:
  npm run download-exercises download [--force]    # Download all exercises from API
  npm run download-exercises upload <filepath> [--force]  # Upload from JSON file
  npm run download-exercises refresh [--force]     # Refresh existing data with downloaded assets

Options:
  --force, -f    Force re-download of existing image files

Examples:
  npm run download-exercises download
  npm run download-exercises download --force
  npm run download-exercises upload data/exercises-raw-2025-01-19.json
  npm run download-exercises upload data/exercises-raw-2025-01-19.json --force
  npm run download-exercises refresh
  npm run download-exercises refresh --force
      `);
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module) {
  main();
}

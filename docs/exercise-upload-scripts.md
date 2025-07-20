# Exercise Upload Scripts

This project contains two scripts for uploading exercise data to the Exercise table in the database.

## Sources

- [/data/excercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)
- [/data/excercises-2.json](https://github.com/ExerciseDB/exercisedb-api/blob/main/src/data/exercises.json)

## Scripts Overview

### 1. `upload-exercises.ts` (Original)

- Uploads exercises from `data/exercises.json`
- Downloads images from GitHub URLs
- Designed for the original exercise data format

### 2. `upload-exercises-2.ts` (New)

- Uploads exercises from `data/exercises-2.json`
- Downloads GIFs from ExerciseDB URLs (`https://v1.cdn.exercisedb.dev/media/*.gif`)
- Designed for the new exercise data format with different structure

## Usage

### Running the new script:

```bash
# Using pnpm script
pnpm run upload-exercises-2

# Or directly with tsx
npx tsx scripts/upload-exercises-2.ts
```

## Features of the New Script

### Data Transformation

- **Exercise ID**: Converts string `exerciseId` to numeric ID using hash function
- **Images**: Downloads GIFs from `gifUrl` field to local directories
- **Categories**: Maps body parts and equipment to exercise types (Strength, Cardio, Bodyweight, etc.)
- **Muscles**: Combines `targetMuscles` and `secondaryMuscles` appropriately
- **Instructions**: Processes step-by-step instructions, removing "Step:N" prefixes

### Directory Structure

Creates organized directories under `data/exercises/`:

```
data/exercises/
├── exercise_name_1/
│   └── exerciseId.gif
├── exercise_name_2/
│   └── exerciseId.gif
└── ...
```

### Batch Processing

- Processes exercises in batches of 5 to avoid overwhelming the database
- 3-second delay between batches for network courtesy
- Duplicate detection - skips exercises that already exist

### Error Handling

- Validates exercise data (requires `exerciseId` and `name`)
- Handles network errors during GIF downloads
- Continues processing if individual exercises fail
- Provides detailed progress and error reporting

## Data Source Differences

### Original Format (`exercises.json`)

```json
{
  "name": "exercise name",
  "images": ["path1.jpg", "path2.jpg"],
  "primaryMuscles": ["muscle1"],
  "secondaryMuscles": ["muscle2"],
  "equipment": "equipment_name"
}
```

### New Format (`exercises-2.json`)

```json
{
  "exerciseId": "abc123",
  "name": "exercise name",
  "gifUrl": "https://v1.cdn.exercisedb.dev/media/abc123.gif",
  "targetMuscles": ["muscle1"],
  "secondaryMuscles": ["muscle2"],
  "equipments": ["equipment_name"],
  "bodyParts": ["body_part"],
  "instructions": ["Step:1 instruction..."]
}
```

## Database Schema Compatibility

Both scripts populate the same `Exercise` table with fields:

- `exerciseId` (unique numeric ID)
- `title` and `titleRaw`
- `localImages` (JSON with local file paths)
- `type`, `tags`, `equipment`
- `primaryMuscles`, `secondaryMuscles`
- `instructions`
- Various flags (`isCardio`, `isYoga`, etc.)

## Prerequisites

1. Database connection configured in `.env`
2. Prisma client generated: `pnpm run db:gen`
3. Exercise data file exists: `data/exercises-2.json`
4. Network access for downloading GIFs

## Output

The script provides detailed logging including:

- Total exercises found and valid exercises to process
- Batch processing progress
- GIF download status for each exercise
- Success/skip/error counts
- Final summary statistics

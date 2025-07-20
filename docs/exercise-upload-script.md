# Exercise Data Upload Script

This script uploads exercise data from `data/exercises.json` to the Exercise table in the database.

## Prerequisites

1. Ensure you have a valid `DATABASE_URL` in your `.env` file
2. Generate the Prisma client: `pnpm db:gen`
3. Make sure your database is accessible

## Usage

Run the upload script using one of these commands:

```bash
# Using pnpm script (recommended)
pnpm upload-exercises

# Or directly with tsx
npx tsx scripts/upload-exercises.ts
```

## What the Script Does

1. **Reads** the `data/exercises.json` file containing exercise data in the free-exercise-db format
2. **Transforms** the data to match our Exercise Prisma model:
   - Maps exercise names to `title` and `titleRaw`
   - Converts images array to full GitHub URLs with prefix `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`
   - Determines exercise type based on category (Strength, Cardio, Flexibility, etc.)
   - Sets `isCardio` flag for cardio and plyometric exercises
   - Joins muscle groups and instructions into comma-separated strings
   - Generates unique `exerciseId` based on array index
3. **Uploads** data in batches of 50 to avoid overwhelming the database
4. **Uses upsert** operations to avoid duplicates (based on `exerciseId`)

## Data Transformation

The script transforms the original JSON format:

```json
{
  "name": "Push-ups",
  "equipment": "body only",
  "primaryMuscles": ["chest", "triceps"],
  "secondaryMuscles": ["shoulders"],
  "instructions": ["Step 1", "Step 2"],
  "category": "strength",
  "images": ["push-ups/0.jpg", "push-ups/1.jpg"]
}
```

Into our Exercise model format:

```json
{
  "exerciseId": 1,
  "title": "Push-ups",
  "titleRaw": "Push-ups",
  "img": {
    "male": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/push-ups/0.jpg",
    "female": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/push-ups/0.jpg"
  },
  "type": "Strength",
  "equipment": "body only",
  "primaryMuscles": "chest, triceps",
  "secondaryMuscles": "shoulders",
  "instructions": "Step 1\n\nStep 2",
  "isCardio": false
}
```

## Error Handling

- The script processes exercises in batches and reports success/failure counts
- Individual exercise failures don't stop the entire process
- Detailed error logs are provided for debugging

## Performance

- Processes ~1000 exercises in batches of 50
- Includes small delays between batches to be gentle on the database
- Uses upsert operations for idempotency (safe to run multiple times)

## Notes

- The script generates sequential `exerciseId` values starting from 1
- Images default to the first available image for both male/female versions
- Category mapping determines exercise type and cardio flags
- All instructions are joined with double newlines for readability

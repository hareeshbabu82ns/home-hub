# Exercise Download Script

This script downloads exercise data from WorkoutLabs API and saves it to the database.

## Usage

### Download All Exercises from API

```bash
pnpm download-exercises download
```

This will:
1. Download all exercise pages from WorkoutLabs API
2. Save raw data to `data/exercises-raw-{date}.json`
3. Transform the data to match our database schema
4. Save transformed data to `data/exercises-transformed-{date}.json`
5. Upload all exercises to the database (upsert mode)

### Upload from Previously Downloaded File

```bash
pnpm download-exercises upload data/exercises-raw-2025-01-19.json
```

This will:
1. Load exercise data from the specified JSON file
2. Transform the data if needed
3. Upload to the database (upsert mode)

## Features

- **Rate Limiting**: Adds 1-second delay between API requests
- **Error Handling**: Graceful error handling with detailed logging
- **Upsert Logic**: Updates existing exercises or creates new ones
- **Progress Tracking**: Shows progress during upload
- **Multiple Formats**: Supports both raw and transformed JSON formats
- **Data Backup**: Saves raw API responses for backup

## API Details

The script calls the WorkoutLabs API with these parameters:
- Equipment filter: "NO EQUIPMENT"
- Action: "filter_sidebar_exercises"
- Pagination: Automatically handles all pages

## Database Schema

Exercises are stored with the following fields:
- `exerciseId`: Unique ID from WorkoutLabs
- `title`: Exercise name
- `titleRaw`: Raw title from API
- `img`: Image URLs (JSON object)
- `imgPng`: PNG image URLs (JSON object)
- `anim`: Animation URLs (JSON object)
- `singleAnim`: Single animation URLs (JSON object)
- `permalink`: Exercise permalink
- `type`: Exercise type
- `tags`: Exercise tags
- `isCardio`: Boolean flag
- `isYoga`: Boolean flag
- And many other fields...

## Output Files

Files are saved to the `data/` directory:
- `exercises-raw-{date}.json`: Raw API responses
- `exercises-transformed-{date}.json`: Transformed exercise data

## Error Handling

The script includes comprehensive error handling:
- API request failures are logged and skipped
- Database upload errors are counted and reported
- Partial failures don't stop the entire process
- Final summary shows success/error counts

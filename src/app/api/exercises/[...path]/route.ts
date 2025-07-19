import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    const { path: exercisePath } = await params;
    // Construct the file path
    const filePath = path.join(
      process.cwd(),
      "data",
      "exercises",
      ...exercisePath,
    );

    // Security check - ensure path is within exercises directory
    const exercisesDir = path.join(process.cwd(), "data", "exercises");
    const resolvedPath = path.resolve(filePath);
    const resolvedExercisesDir = path.resolve(exercisesDir);

    if (!resolvedPath.startsWith(resolvedExercisesDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".svg":
        contentType = "image/svg+xml";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("Error serving exercise file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

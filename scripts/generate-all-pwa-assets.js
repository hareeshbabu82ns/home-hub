#!/usr/bin/env node

/**
 * Complete PWA Assets Generator
 *
 * This script generates all required PWA assets:
 * - PNG icons for PWA manifest
 * - favicon.ico for browser tabs
 * - Placeholder screenshots
 *
 * Run with: node scripts/generate-all-pwa-assets.js
 *
 * Requirements:
 * - sharp package: pnpm add -D sharp
 */

const fs = require("fs");
const path = require("path");

async function generateAllPWAAssets() {
  try {
    const sharp = await import("sharp");
    const sharpModule = sharp.default;

    const publicDir = path.join(process.cwd(), "public");
    const iconSvgPath = path.join(publicDir, "icon-192.svg");

    if (!fs.existsSync(iconSvgPath)) {
      console.error("❌ Source SVG icon not found at:", iconSvgPath);
      return;
    }

    console.log("🚀 Generating all PWA assets...\n");

    // 1. Generate PNG icons
    console.log("📱 Generating PNG icons...");
    const iconSizes = [
      { size: 180, name: "icon-180.png", description: "iOS home screen" },
      { size: 192, name: "icon-192.png", description: "Standard PWA" },
      { size: 512, name: "icon-512.png", description: "Large icon" },
    ];

    for (const { size, name, description } of iconSizes) {
      const outputPath = path.join(publicDir, name);

      await sharpModule(iconSvgPath)
        .resize(size, size)
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

      console.log(`  ✅ ${name} (${size}x${size}) - ${description}`);
    }

    // 2. Generate favicon.ico
    console.log("\n🌐 Generating favicon.ico...");
    const faviconSizes = [16, 32, 48];
    const pngBuffers = [];

    for (const size of faviconSizes) {
      const buffer = await sharpModule(iconSvgPath)
        .resize(size, size)
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer();

      pngBuffers.push({ size, buffer });
    }

    // Create ICO file
    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // Reserved
    icoHeader.writeUInt16LE(1, 2); // Image type (icon)
    icoHeader.writeUInt16LE(faviconSizes.length, 4); // Number of images

    let directoryEntries = Buffer.alloc(0);
    let imageData = Buffer.alloc(0);
    let currentOffset = 6 + faviconSizes.length * 16;

    for (let i = 0; i < pngBuffers.length; i++) {
      const { size, buffer } = pngBuffers[i];

      const entry = Buffer.alloc(16);
      entry.writeUInt8(size, 0); // Width
      entry.writeUInt8(size, 1); // Height
      entry.writeUInt8(0, 2); // Color palette
      entry.writeUInt8(0, 3); // Reserved
      entry.writeUInt16LE(1, 4); // Color planes
      entry.writeUInt16LE(32, 6); // Bits per pixel
      entry.writeUInt32LE(buffer.length, 8); // Image size
      entry.writeUInt32LE(currentOffset, 12); // Image offset

      directoryEntries = Buffer.concat([directoryEntries, entry]);
      imageData = Buffer.concat([imageData, buffer]);
      currentOffset += buffer.length;
    }

    const icoFile = Buffer.concat([icoHeader, directoryEntries, imageData]);
    const faviconPath = path.join(publicDir, "favicon.ico");
    fs.writeFileSync(faviconPath, icoFile);

    console.log(`  ✅ favicon.ico (${faviconSizes.join("x, ")}x pixels)`);

    // 3. Generate placeholder screenshots
    console.log("\n📸 Generating placeholder screenshots...");

    const wideSvg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="720" fill="#0ea5e9"/>
        <text x="640" y="320" font-family="Arial, sans-serif" font-size="48" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          HomeHub Dashboard
        </text>
        <text x="640" y="400" font-family="Arial, sans-serif" font-size="24" 
              fill="#e0f2fe" text-anchor="middle" dominant-baseline="middle">
          Replace with actual app screenshot
        </text>
      </svg>
    `;

    await sharpModule(Buffer.from(wideSvg))
      .png()
      .toFile(path.join(publicDir, "screenshot-wide.png"));

    const narrowSvg = `
      <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
        <rect width="750" height="1334" fill="#0ea5e9"/>
        <text x="375" y="620" font-family="Arial, sans-serif" font-size="36" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          HomeHub Mobile
        </text>
        <text x="375" y="700" font-family="Arial, sans-serif" font-size="18" 
              fill="#e0f2fe" text-anchor="middle" dominant-baseline="middle">
          Replace with actual app screenshot
        </text>
      </svg>
    `;

    await sharpModule(Buffer.from(narrowSvg))
      .png()
      .toFile(path.join(publicDir, "screenshot-narrow.png"));

    console.log("  ✅ screenshot-wide.png (1280x720)");
    console.log("  ✅ screenshot-narrow.png (750x1334)");

    // 4. Summary
    console.log("\n🎉 All PWA assets generated successfully!\n");

    console.log("📋 Generated files:");
    console.log("  • favicon.ico - Browser tab icon");
    console.log("  • icon-180.png - iOS home screen icon");
    console.log("  • icon-192.png - Standard PWA icon");
    console.log("  • icon-512.png - Large PWA icon");
    console.log("  • screenshot-wide.png - Desktop/tablet screenshot");
    console.log("  • screenshot-narrow.png - Mobile screenshot");

    console.log(
      "\n✅ Your app is now ready for PWA installation on iOS Safari!",
    );
    console.log("\n📝 Next steps:");
    console.log(
      "  1. Replace placeholder screenshots with actual app screenshots",
    );
    console.log("  2. Deploy to HTTPS domain");
    console.log("  3. Test installation on iOS devices");
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.error("\n❌ Sharp package not found.");
      console.log("\nTo generate all PWA assets, run:");
      console.log("  pnpm add -D sharp");
      console.log("  node scripts/generate-all-pwa-assets.js");
    } else {
      console.error("❌ Error generating assets:", error);
    }
  }
}

// Run the script
generateAllPWAAssets();

# PWA Screenshots Guide

For optimal PWA installation experience, you need to create screenshot images:

## Required Screenshots

### 1. Wide Screenshot (Desktop/Tablet)
- **File**: `public/screenshot-wide.png`
- **Size**: 1280x720 pixels
- **Content**: Show your app's main dashboard/interface on desktop
- **Format**: PNG

### 2. Narrow Screenshot (Mobile)
- **File**: `public/screenshot-narrow.png`
- **Size**: 750x1334 pixels (iPhone aspect ratio)
- **Content**: Show your app's mobile interface
- **Format**: PNG

## How to Create Screenshots

1. **Open your app in the browser**
2. **Use browser dev tools** to simulate different screen sizes
3. **Take screenshots** of key app screens
4. **Resize and optimize** using tools like:
   - Figma/Sketch for design
   - Online image resizers
   - Command line tools like ImageMagick

## Tips

- Use real app content, not placeholder content
- Show the most important features
- Ensure good contrast and readability
- Test on actual devices after adding screenshots

## Current Status

- ✅ Manifest.json updated for iOS compatibility
- ⏳ PNG icons need to be generated (run the icon generation script)
- ⏳ Screenshots need to be created

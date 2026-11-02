const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// iOS icon sizes
const iosIcons = [
  { size: 20, name: 'Icon-App-20x20@1x.png' },
  { size: 40, name: 'Icon-App-20x20@2x.png' },
  { size: 60, name: 'Icon-App-20x20@3x.png' },
  { size: 29, name: 'Icon-App-29x29@1x.png' },
  { size: 58, name: 'Icon-App-29x29@2x.png' },
  { size: 87, name: 'Icon-App-29x29@3x.png' },
  { size: 40, name: 'Icon-App-40x40@1x.png' },
  { size: 80, name: 'Icon-App-40x40@2x.png' },
  { size: 120, name: 'Icon-App-40x40@3x.png' },
  { size: 57, name: 'Icon-App-57x57@1x.png' },
  { size: 114, name: 'Icon-App-57x57@2x.png' },
  { size: 120, name: 'Icon-App-60x60@2x.png' },
  { size: 180, name: 'Icon-App-60x60@3x.png' },
  { size: 72, name: 'Icon-App-72x72@1x.png' },
  { size: 144, name: 'Icon-App-72x72@2x.png' },
  { size: 76, name: 'Icon-App-76x76@1x.png' },
  { size: 152, name: 'Icon-App-76x76@2x.png' },
  { size: 167, name: 'Icon-App-83.5x83.5@2x.png' },
  { size: 1024, name: 'Icon-App-1024x1024@1x.png' },
];

async function fixiOSIcons() {
  console.log('🔧 Fixing iOS icons - removing alpha channel...\n');
  
  const iosPath = path.resolve(__dirname, '../../ios/DoDoneMobile/Images.xcassets/AppIcon.appiconset');
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  for (const { size, name } of iosIcons) {
    // Generate icon with white background (no alpha channel)
    await sharp(svgBuffer)
      .resize(size, size)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background, removes alpha
      .png({ 
        quality: 100,
        compressionLevel: 9,
        palette: false // Ensure RGB, not palette
      })
      .toFile(path.join(iosPath, name));
    
    console.log(`✓ Fixed ${name} (${size}x${size}) - removed alpha channel`);
  }
  
  console.log('\n✅ All iOS icons fixed successfully!');
  console.log('\nThe icons now have a white background with no transparency.');
  console.log('They should pass App Store validation.');
}

fixiOSIcons().catch(error => {
  console.error('❌ Error fixing icons:', error);
  process.exit(1);
});

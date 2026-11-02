const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Android icon sizes and locations
const androidIcons = [
  { size: 48, density: 'mdpi', path: '../../android/app/src/main/res/mipmap-mdpi' },
  { size: 72, density: 'hdpi', path: '../../android/app/src/main/res/mipmap-hdpi' },
  { size: 96, density: 'xhdpi', path: '../../android/app/src/main/res/mipmap-xhdpi' },
  { size: 144, density: 'xxhdpi', path: '../../android/app/src/main/res/mipmap-xxhdpi' },
  { size: 192, density: 'xxxhdpi', path: '../../android/app/src/main/res/mipmap-xxxhdpi' },
];

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

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function generateAndroidIcons() {
  console.log('Generating Android icons...');
  
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  for (const { size, density, path: iconPath } of androidIcons) {
    const outputPath = path.resolve(__dirname, iconPath);
    await ensureDirectoryExists(outputPath);
    
    // Generate regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(path.join(outputPath, 'ic_launcher.png'));
    
    // Generate round icon (same for now, but could be customized)
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(path.join(outputPath, 'ic_launcher_round.png'));
    
    console.log(`✓ Generated ${density} icons (${size}x${size})`);
  }
}

async function generateiOSIcons() {
  console.log('Generating iOS icons...');
  
  const iosPath = path.resolve(__dirname, '../../ios/DoDoneMobile/Images.xcassets/AppIcon.appiconset');
  await ensureDirectoryExists(iosPath);
  
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  for (const { size, name } of iosIcons) {
    // iOS App Store requires NO alpha channel - flatten with white background
    await sharp(svgBuffer)
      .resize(size, size)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Remove alpha channel
      .png({ 
        quality: 100,
        compressionLevel: 9,
        palette: false // Ensure RGB, not palette
      })
      .toFile(path.join(iosPath, name));
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  // Generate Contents.json for iOS
  const contentsJson = {
    images: [
      {
        "filename": "Icon-App-20x20@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "20x20"
      },
      {
        "filename": "Icon-App-20x20@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "20x20"
      },
      {
        "filename": "Icon-App-29x29@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "29x29"
      },
      {
        "filename": "Icon-App-29x29@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "29x29"
      },
      {
        "filename": "Icon-App-40x40@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "40x40"
      },
      {
        "filename": "Icon-App-40x40@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "40x40"
      },
      {
        "filename": "Icon-App-60x60@2x.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "60x60"
      },
      {
        "filename": "Icon-App-60x60@3x.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "60x60"
      },
      {
        "filename": "Icon-App-20x20@1x.png",
        "idiom": "ipad",
        "scale": "1x",
        "size": "20x20"
      },
      {
        "filename": "Icon-App-20x20@2x.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "20x20"
      },
      {
        "filename": "Icon-App-29x29@1x.png",
        "idiom": "ipad",
        "scale": "1x",
        "size": "29x29"
      },
      {
        "filename": "Icon-App-29x29@2x.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "29x29"
      },
      {
        "filename": "Icon-App-40x40@1x.png",
        "idiom": "ipad",
        "scale": "1x",
        "size": "40x40"
      },
      {
        "filename": "Icon-App-40x40@2x.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "40x40"
      },
      {
        "filename": "Icon-App-76x76@1x.png",
        "idiom": "ipad",
        "scale": "1x",
        "size": "76x76"
      },
      {
        "filename": "Icon-App-76x76@2x.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "76x76"
      },
      {
        "filename": "Icon-App-83.5x83.5@2x.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "83.5x83.5"
      },
      {
        "filename": "Icon-App-1024x1024@1x.png",
        "idiom": "ios-marketing",
        "scale": "1x",
        "size": "1024x1024"
      }
    ],
    info: {
      author: "xcode",
      version: 1
    }
  };
  
  await fs.writeFile(
    path.join(iosPath, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  
  console.log('✓ Generated Contents.json for iOS');
}

async function generatePlayStoreIcon() {
  console.log('Generating Google Play Store icon...');
  
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  // Generate 512x512 icon for Google Play Console
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile('./play-store-icon-512.png');
  
  console.log('✓ Generated play-store-icon-512.png (512x512)');
}


async function generateFeatureGraphic() {
  console.log('Generating Google Play Feature Graphic...');
  
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  // Create app icon at appropriate size
  const iconSize = 180;
  const iconBuffer = await sharp(svgBuffer)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();
  
  // Create enhanced feature graphic with text and design elements
  const featureGraphic = sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 } // Light background
    }
  })
  .composite([
    // Gradient overlay
    {
      input: Buffer.from(`
        <svg width="1024" height="500">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF9800;stop-opacity:0.1" />
              <stop offset="100%" style="stop-color:#F57C00;stop-opacity:0.2" />
            </linearGradient>
          </defs>
          <rect width="1024" height="500" fill="url(#bg)" />
        </svg>
      `),
      top: 0,
      left: 0
    },
    // App icon with shadow
    {
      input: iconBuffer,
      top: 80,
      left: 80
    },
    // Main text and promotional elements
    {
      input: Buffer.from(`
        <svg width="1024" height="500">
          <!-- App Name -->
          <text x="320" y="140" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#FF9800">DoDone</text>
          
          <!-- Tagline -->
          <text x="320" y="190" font-family="Arial, sans-serif" font-size="32" font-weight="normal" fill="#424242">Turn Family Chores Into Rewards</text>
          
          <!-- Feature bullets -->
          <circle cx="340" cy="240" r="8" fill="#4CAF50"/>
          <text x="360" y="248" font-family="Arial, sans-serif" font-size="24" fill="#424242">Task Management Made Fun</text>
          
          <circle cx="340" cy="280" r="8" fill="#4CAF50"/>
          <text x="360" y="288" font-family="Arial, sans-serif" font-size="24" fill="#424242">Reward System for Kids</text>
          
          <circle cx="340" cy="320" r="8" fill="#4CAF50"/>
          <text x="360" y="328" font-family="Arial, sans-serif" font-size="24" fill="#424242">Family Organization Tool</text>
          
          <!-- Decorative elements -->
          <path d="M750 120 L780 150 L850 80" stroke="#4CAF50" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="820" cy="200" r="30" fill="#FFD700" opacity="0.3"/>
          <text x="820" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#F57C00">$</text>
          
          <!-- Diamond/reward icon -->
          <path d="M900 280 L920 300 L900 320 L880 300 Z" fill="#2196F3" opacity="0.7"/>
        </svg>
      `),
      top: 0,
      left: 0
    }
  ])
  .png({ quality: 100 });

  await featureGraphic.toFile('./feature-graphic-1024x500.png');
  
  console.log('✓ Generated enhanced feature-graphic-1024x500.png (1024x500)');
}

async function main() {
  try {
    console.log('🎨 DoDone Mobile Icon Generator');
    console.log('================================\n');
    
    // await generateAndroidIcons();
    // console.log('');
    // await generateiOSIcons();
    // await generatePlayStoreIcon();
    // console.log('');
    await generateFeatureGraphic();
    console.log('\n✅ All icons generated successfully!');
    // console.log('\nNext steps:');
    // console.log('1. Clean and rebuild your project');
    // console.log('2. For Android: npx react-native run-android');
    // console.log('3. For iOS: cd ios && pod install && cd .. && npx react-native run-ios');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();
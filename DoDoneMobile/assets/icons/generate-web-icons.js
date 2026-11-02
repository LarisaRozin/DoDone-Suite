const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Web app icon sizes (PWA and standard web usage)
const webIcons = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'android-chrome-192x192.png' }, // PWA
  { size: 512, name: 'android-chrome-512x512.png' }, // PWA
  { size: 180, name: 'apple-touch-icon.png' }, // iOS Safari
  { size: 70, name: 'mstile-70x70.png' }, // Windows
  { size: 144, name: 'mstile-144x144.png' }, // Windows
  { size: 150, name: 'mstile-150x150.png' }, // Windows
  { size: 310, name: 'mstile-310x150.png', width: 310, height: 150 }, // Windows wide
  { size: 310, name: 'mstile-310x310.png' }, // Windows large
];

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function generateWebIcons() {
  console.log('Generating Web App icons...');
  
  const webPath = path.resolve(__dirname, '../web-icons');
  await ensureDirectoryExists(webPath);
  
  const svgBuffer = await fs.readFile('./app-icon-master.svg');
  
  for (const icon of webIcons) {
    const width = icon.width || icon.size;
    const height = icon.height || icon.size;
    
    await sharp(svgBuffer)
      .resize(width, height)
      .png({ quality: 100 })
      .toFile(path.join(webPath, icon.name));
    
    console.log(`✓ Generated ${icon.name} (${width}x${height})`);
  }
  
  // Generate ICO file for favicon
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(webPath, 'favicon.ico'));
    console.log('✓ Generated favicon.ico (32x32)');
  } catch (error) {
    console.log('⚠ Could not generate .ico file (PNG fallback available)');
  }
  
  // Generate manifest.json for PWA
  const manifest = {
    "name": "DoDone - Task Management & Allowances",
    "short_name": "DoDone",
    "description": "Task management with allowance and bonus tracking",
    "icons": [
      {
        "src": "/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "theme_color": "#F57C00",
    "background_color": "#F57C00",
    "display": "standalone",
    "orientation": "portrait",
    "start_url": "/"
  };
  
  await fs.writeFile(
    path.join(webPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('✓ Generated manifest.json for PWA');
  
  // Generate browserconfig.xml for Windows
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/mstile-70x70.png"/>
            <square150x150logo src="/mstile-150x150.png"/>
            <square310x310logo src="/mstile-310x310.png"/>
            <wide310x150logo src="/mstile-310x150.png"/>
            <TileColor>#F57C00</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
  
  await fs.writeFile(
    path.join(webPath, 'browserconfig.xml'),
    browserConfig
  );
  
  console.log('✓ Generated browserconfig.xml for Windows');
  
  console.log('\n✅ Web icons generated successfully!');
  console.log('\nGenerated files in assets/web-icons/:');
  console.log('- Favicon files (16x16, 32x32, favicon.ico)');
  console.log('- PWA icons (192x192, 512x512)');
  console.log('- Apple touch icon (180x180)');
  console.log('- Windows tiles (various sizes)');
  console.log('- manifest.json for PWA');
  console.log('- browserconfig.xml for Windows');
}

async function main() {
  try {
    console.log('🌐 DoDone Web Icon Generator');
    console.log('=============================\n');
    
    await generateWebIcons();
    
  } catch (error) {
    console.error('❌ Error generating web icons:', error);
    process.exit(1);
  }
}

main();
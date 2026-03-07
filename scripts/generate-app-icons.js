import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const svgBuffer = readFileSync(join(rootDir, 'public', 'favicon.svg'));

// iOS icon sizes (for AppIcon.appiconset)
const iosIcons = [
  { size: 20, scale: 1 },
  { size: 20, scale: 2 },
  { size: 20, scale: 3 },
  { size: 29, scale: 1 },
  { size: 29, scale: 2 },
  { size: 29, scale: 3 },
  { size: 40, scale: 1 },
  { size: 40, scale: 2 },
  { size: 40, scale: 3 },
  { size: 60, scale: 2 },
  { size: 60, scale: 3 },
  { size: 76, scale: 1 },
  { size: 76, scale: 2 },
  { size: 83.5, scale: 2 },
  { size: 1024, scale: 1 },
];

// Android icon sizes
const androidIcons = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

async function generateIosIcons() {
  const iosDir = join(rootDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

  if (!existsSync(iosDir)) {
    console.log('iOS directory not found, skipping iOS icons');
    return;
  }

  const contentsJson = {
    images: [],
    info: { author: 'xcode', version: 1 }
  };

  for (const icon of iosIcons) {
    const pixelSize = Math.round(icon.size * icon.scale);
    const filename = `AppIcon-${icon.size}x${icon.size}@${icon.scale}x.png`;

    await sharp(svgBuffer)
      .resize(pixelSize, pixelSize)
      .png()
      .toFile(join(iosDir, filename));

    contentsJson.images.push({
      filename,
      idiom: icon.size === 1024 ? 'ios-marketing' : 'universal',
      platform: 'ios',
      size: `${icon.size}x${icon.size}`,
      scale: `${icon.scale}x`,
    });

    console.log(`Generated iOS: ${filename} (${pixelSize}x${pixelSize})`);
  }

  // Write Contents.json
  const { writeFileSync } = await import('fs');
  writeFileSync(join(iosDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
  console.log('Generated iOS: Contents.json');
}

async function generateAndroidIcons() {
  const androidResDir = join(rootDir, 'android', 'app', 'src', 'main', 'res');

  if (!existsSync(androidResDir)) {
    console.log('Android directory not found, skipping Android icons');
    return;
  }

  for (const icon of androidIcons) {
    const iconDir = join(androidResDir, icon.name);
    if (!existsSync(iconDir)) {
      mkdirSync(iconDir, { recursive: true });
    }

    // Regular icon
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(iconDir, 'ic_launcher.png'));

    // Round icon
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(iconDir, 'ic_launcher_round.png'));

    // Foreground for adaptive icon
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(iconDir, 'ic_launcher_foreground.png'));

    console.log(`Generated Android: ${icon.name} (${icon.size}x${icon.size})`);
  }
}

async function main() {
  console.log('Generating app icons...\n');

  await generateIosIcons();
  console.log('');
  await generateAndroidIcons();

  console.log('\nDone! Run "npx cap sync" to update native projects.');
}

main().catch(console.error);

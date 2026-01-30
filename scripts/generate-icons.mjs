import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const sourceImage = join(projectRoot, '日記。シンプルな白黒で柔らかい感じ。背景は白で。 (1).png');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

async function generateIcons() {
  console.log('Generating PWA icons from:', sourceImage);

  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Generate favicon.ico (using 32x32 as base)
  // Note: sharp doesn't support ico, so we'll use the png files
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);

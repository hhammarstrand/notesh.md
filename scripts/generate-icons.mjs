import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#1a1a2e"/>
  <text x="256" y="320" font-family="system-ui" font-size="280" font-weight="bold" fill="#0a84ff" text-anchor="middle">N</text>
</svg>`;

async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(`public/pwa-${size}x${size}.png`);
    console.log(`Created pwa-${size}x${size}.png`);
  }
  
  // Also create apple touch icon
  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');
}

generateIcons();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const iconsSrcDir = path.join(rootDir, 'public', 'icons');
const iconSvgPath = path.join(iconsSrcDir, 'icon.svg');

const sizes = [16, 48, 128];

async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(iconSvgPath);
    
    console.log('Generating icon PNGs from SVG...');
    
    for (const size of sizes) {
      const outputPath = path.join(iconsSrcDir, `icon${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${size}x${size} icon: ${outputPath}`);
    }
    
    console.log('Icon generation complete!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons(); 

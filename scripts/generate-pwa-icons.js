const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/images/newstokoslogo.png');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    // Create a green background canvas with the logo centered
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 22, g: 163, b: 74, alpha: 1 } // #16A34A
      }
    })
    .composite([
      {
        input: await sharp(inputPath)
          .resize(Math.round(size * 0.75), Math.round(size * 0.75), {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log(`Generated: icon-${size}x${size}.png`);
  }
  console.log('All icons generated!');
}

generateIcons().catch(console.error);

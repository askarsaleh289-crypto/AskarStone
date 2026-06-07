// Usage: from frontend folder run:
// npm install sharp png-to-ico
// node scripts/generate-favicons.js

const sharp = require('sharp');
let pngToIco = require('png-to-ico');
if (pngToIco && typeof pngToIco !== 'function' && pngToIco.default && typeof pngToIco.default === 'function') {
  pngToIco = pngToIco.default;
}
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    const imagesDir = path.join(publicDir, 'images');

    // Use the exact WhatsApp image filename requested by the user
    const exactName = 'WhatsApp Image 2026-06-07 at 3.45.29 AM.jpeg';
    const src = path.join(imagesDir, exactName);
    console.log('Using exact source filename:', exactName);

    if (!fs.existsSync(src)) {
      console.error('Source logo not found:', src);
      process.exit(1);
    }

    const sizes = [16, 32, 64, 180];
    const buffers = {};

    for (const size of sizes) {
      // create square resized image and apply circular mask via SVG
      const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#fff"/></svg>`;

      const buf = await sharp(src)
        .resize(size, size, { fit: 'cover' })
        .composite([{
          input: Buffer.from(svg),
          blend: 'dest-in'
        }])
        .png({ quality: 90 })
        .toBuffer();

      buffers[size] = buf;
      const outPath = path.join(publicDir, `favicon-${size}.png`);
      fs.writeFileSync(outPath, buf);
      console.log('Wrote', outPath);

      if (size === 180) {
        const applePath = path.join(publicDir, 'apple-touch-icon.png');
        fs.writeFileSync(applePath, buf);
        console.log('Wrote', applePath);
      }
    }

    // create favicon.ico from 16,32,64
    const icoBuffer = await pngToIco([buffers[16], buffers[32], buffers[64]]);
    const icoPath = path.join(publicDir, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('Wrote', icoPath);

    console.log('Favicons generated successfully. Add them to source control or deploy public folder.');
  } catch (err) {
    console.error('Error generating favicons:', err);
    process.exit(1);
  }
})();

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const files = [
  'favicon-16.png',
  'favicon-32.png',
  'favicon-64.png',
  'apple-touch-icon.png',
  'favicon.ico'
];

let removed = [];
for (const f of files) {
  const p = path.join(publicDir, f);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      removed.push(f);
    }
  } catch (err) {
    console.error('Error removing', p, err.message);
  }
}

if (removed.length) {
  console.log('Removed files:', removed.join(', '));
} else {
  console.log('No generated favicon files found.');
}

// Exit 0
process.exit(0);

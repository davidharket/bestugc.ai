const fs = require('fs');
const path = require('path');

// Simple function to read image dimensions from PNG/JPG headers
function getImageDimensions(filepath) {
  try {
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filepath).toLowerCase();
    
    if (ext === '.png') {
      // PNG dimensions are at bytes 16-23
      if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // Simple JPEG dimension extraction
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          if (marker >= 0xC0 && marker <= 0xC3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          offset += 2 + buffer.readUInt16BE(offset + 2);
        } else {
          offset++;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function assignAspectRatio(width, height) {
  const ratio = width / height;
  
  // Available ratios: 21:9 (2.33), 16:9 (1.78), 4:3 (1.33), 1:1 (1.0), 3:4 (0.75), 9:16 (0.56)
  if (ratio >= 2.1) return '21:9';
  if (ratio >= 1.5) return '16:9';
  if (ratio >= 1.15) return '4:3';
  if (ratio >= 0.85) return '1:1';
  if (ratio >= 0.65) return '3:4';
  return '9:16';
}

const imageDir = path.join(__dirname, '..', 'public', 'image-inspo');
const files = fs.readdirSync(imageDir).filter(file => 
  ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
);

const results = [];

files.forEach(file => {
  const filepath = path.join(imageDir, file);
  const dimensions = getImageDimensions(filepath);
  
  if (dimensions) {
    const { width, height } = dimensions;
    const aspectRatio = assignAspectRatio(width, height);
    results.push({
      filename: file,
      width,
      height,
      ratio: (width / height).toFixed(2),
      assignedRatio: aspectRatio
    });
  }
});

console.log(JSON.stringify(results, null, 2));
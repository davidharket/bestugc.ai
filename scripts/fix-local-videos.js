// scripts/fix-local-videos.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
const fixedAvatarsDir = path.join(__dirname, '..', 'public', 'avatars-fixed');

if (!fs.existsSync(fixedAvatarsDir)) {
  fs.mkdirSync(fixedAvatarsDir, { recursive: true });
}

// Function to re-encode a single video
const reencodeVideo = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Fixing: ${path.basename(inputFile)}`);
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputFile,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-y',
      outputFile,
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Fixed and saved to: ${path.basename(outputFile)}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg failed for ${path.basename(inputFile)} with code ${code}`));
      }
    });
    ffmpeg.on('error', reject);
  });
};

// Main function to process all videos
async function fixAllVideos() {
  console.log('--- Starting Video Fixer for Local Avatars ---');
  const files = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.mp4'));
  
  for (const file of files) {
    const inputPath = path.join(avatarsDir, file);
    const outputPath = path.join(fixedAvatarsDir, file);
    try {
      await reencodeVideo(inputPath, outputPath);
    } catch (error) {
      console.error(error);
    }
  }
  
  console.log('\n--- All local avatar videos have been processed! ---');
}

fixAllVideos();
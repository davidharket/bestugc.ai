const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Create test cutout videos with green screen removal using FFmpeg
 * This creates actual transparent videos that work in browsers
 */

async function createTestCutouts() {
  console.log('🎬 Creating Test Cutout Videos with Transparency...');
  
  // Ensure cutouts directory exists
  const cutoutsDir = path.join(__dirname, '..', 'public', 'cutouts');
  if (!fs.existsSync(cutoutsDir)) {
    fs.mkdirSync(cutoutsDir, { recursive: true });
  }

  // Test avatar videos to process
  const avatarVideos = [
    'male-brunette2-adult-inside.mp4',
    'female-blonde4-adult-inside.mp4'
  ];

  for (const video of avatarVideos) {
    const inputPath = path.join(__dirname, '..', 'public', 'avatars', video);
    const outputName = `cutout-${video.replace('.mp4', '')}.webm`;
    const outputPath = path.join(cutoutsDir, outputName);

    if (!fs.existsSync(inputPath)) {
      console.log(`❌ Input video not found: ${video}`);
      continue;
    }

    if (fs.existsSync(outputPath)) {
      console.log(`✅ Cutout already exists: ${outputName}`);
      continue;
    }

    try {
      console.log(`🔄 Processing: ${video} -> ${outputName}`);
      
      // Create cutout with green screen removal using FFmpeg
      // This creates a WebM with transparency by removing green/similar colors
      await runFFmpeg([
        '-i', inputPath,
        '-vf', 'chromakey=0x00FF00:0.3:0.2',  // Remove green background
        '-c:v', 'libvpx-vp9',                 // VP9 codec supports transparency
        '-pix_fmt', 'yuva420p',               // Pixel format with alpha
        '-crf', '30',                         // Quality
        '-b:v', '500k',                       // Bitrate
        '-an',                                // No audio
        outputPath
      ]);

      // Verify the output
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Created: ${outputName} (${sizeMB}MB)`);
      } else {
        console.log(`❌ Failed to create: ${outputName}`);
      }

    } catch (error) {
      console.log(`❌ Error processing ${video}: ${error.message}`);
    }
  }

  // Also create a simple test with a colored background for testing
  console.log('\n🎨 Creating simple colored background test...');
  try {
    const testOutputPath = path.join(cutoutsDir, 'test-transparent.webm');
    
    // Create a simple 5-second test video with a person on transparent background
    await runFFmpeg([
      '-f', 'lavfi',
      '-i', 'testsrc2=duration=5:size=640x480:rate=30',
      '-vf', 'colorkey=0x00ff00:0.3:0.2,format=yuva420p',
      '-c:v', 'libvpx-vp9',
      '-crf', '30',
      '-an',
      testOutputPath
    ]);

    console.log(`✅ Created test video: test-transparent.webm`);
  } catch (error) {
    console.log(`⚠️ Test video creation failed: ${error.message}`);
  }

  console.log('\n📁 Cutouts directory contents:');
  const cutoutFiles = fs.readdirSync(cutoutsDir);
  cutoutFiles.forEach(file => {
    const filePath = path.join(cutoutsDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  - ${file}: ${sizeMB}MB`);
  });
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`  Running: ffmpeg ${args.join(' ')}`);
    
    const ffmpeg = spawn('ffmpeg', ['-y', ...args]);
    
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg error: ${err.message}`));
    });
  });
}

// Run if called directly
if (require.main === module) {
  createTestCutouts().then(() => {
    console.log('\n✅ Test cutout creation completed!');
    console.log('\nNext steps:');
    console.log('1. Start server: npm run dev');
    console.log('2. Test rendering: node test-clean-pipeline.js');
  }).catch(console.error);
}

module.exports = { createTestCutouts }; 
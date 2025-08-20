// test-remotion-only.js (FINAL, PATH-CORRECTED VERSION)
require('dotenv').config({ path: './.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const API_BASE_URL = '***REMOVED***'; // Use localhost directly

// Helper to find the latest file in a directory
const findLatestFile = (dir, extension) => {
    // ✅ THE FIX: Look for the 'public' directory INSIDE the current project directory.
    const publicDir = path.join(__dirname, 'public'); 

    const targetDir = path.join(publicDir, dir);

    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Directory not found: ${targetDir}`);
        console.error(`Please ensure the folder 'public/${dir}' exists in your project.`);
        return null;
    }

    const files = fs.readdirSync(targetDir)
        .filter(file => file.endsWith(extension))
        .map(file => ({ file, mtime: fs.statSync(path.join(targetDir, file)).mtime }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length === 0) {
        console.error(`❌ No '${extension}' files found in 'public/${dir}'.`);
        return null;
    }
    
    // Return the URL path relative to /public
    return `/${dir}/${files[0].file}`;
};


async function runRenderTest() {
  console.log('🧪 Starting direct Remotion render test...');

  // --- AUTOMATICALLY FIND REAL ASSETS ---
  const latestCutout = findLatestFile('cutouts', '.webm');
  const latestAudio = findLatestFile('generated_audio', '.mp3');

  if (!latestCutout || !latestAudio) {
      console.error("\n❌ Critical assets missing. Cannot run test.");
      console.log("Please ensure you have successfully run the background removal and TTS steps at least once to generate these files.");
      return;
  }

  console.log(`✅ Using latest cutout: ${latestCutout}`);
  console.log(`✅ Using latest audio: ${latestAudio}`);
  // --- END ASSET FINDING ---

  // This function doesn't need to change.
  function generateUserRequestedTimeline(assets) {
    console.log(`🎨 Generating user-requested 13-part timeline...`);
    const fps = 30; // Fixed: Use consistent 30fps to match avatar videos
    const timeline = [
      { layout: 'avatar-with-corner-image', duration: 5 * fps, assetIndices: [0] },
      { layout: 'fullscreen-avatar',        duration: 5 * fps, assetIndices: [] },
      { layout: 'fullscreen-asset',         duration: 3 * fps, assetIndices: [1] },
      { layout: 'fullscreen-asset',         duration: 2 * fps, assetIndices: [2] },
      { layout: 'cutout-left-over-asset',   duration: 5 * fps, assetIndices: [3] },
      { layout: 'fullscreen-avatar',        duration: 3 * fps, assetIndices: [] },
      { layout: 'cutout-right-over-asset',  duration: 1 * fps, assetIndices: [4] },
      { layout: 'buildup-collage',          duration: 1 * fps, assetIndices: [5, 6] },
      { layout: 'buildup-collage',          duration: 1 * fps, assetIndices: [7, 8, 9] },
      { layout: 'buildup-collage',          duration: 0.5 * fps, assetIndices: [10, 11, 12] },
      { layout: 'avatar-with-corner-image', duration: 0.5 * fps, assetIndices: [13] },
      { layout: 'fullscreen-avatar',        duration: 0.5 * fps, assetIndices: [] },
      { layout: 'cutout-center-over-asset', duration: 3 * fps, assetIndices: [14] },
    ];
    return timeline;
  }

  const mockAssets = [
    "uploads/scraped/2ebccc5c81598a87/0e8851bafdd8.mp4",
    "uploads/scraped/2ebccc5c81598a87/1be8fed6bca1.mp4",
    "uploads/scraped/2ebccc5c81598a87/539921d10bc5.mp4",
    "uploads/scraped/2ebccc5c81598a87/a0c5f2cd5be2.mp4",
    "uploads/scraped/2ebccc5c81598a87/a75732491b06.mp4",
    "uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp",
    "uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp",
  ];

  const timeline = generateUserRequestedTimeline(mockAssets);

  const inputProps = {
    adData: {
      selectedImages: mockAssets.filter(a => a.endsWith('.webp')),
      selectedVideos: mockAssets.filter(a => a.endsWith('.mp4')),
    },
    timeline: timeline,
    audioUrl: latestAudio, 
    processedAvatarUrl: '/avatars-fixed/female-blonde-adult-inside.mp4',
    greenscreenAvatarUrl: latestCutout, 
  };
  
  try {
    console.log('🚀 Sending render request to /api/render/remotion...');
    const response = await axios.post(`${API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main',
        inputProps: inputProps,
    }, {
        timeout: 1800000, // 30 min timeout
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
    });

    console.log('\n🎉🎉🎉 SUCCESS! Render Complete! 🎉🎉🎉');
    console.log(`🎬 Video available at: ${API_BASE_URL}${response.data.videoUrl}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
        console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Error:', error.message);
    }
  }
}

runRenderTest();
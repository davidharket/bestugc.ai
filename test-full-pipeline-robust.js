// test-full-pipeline-robust.js
require('dotenv').config({ path: './.env.local' });
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

// --- CONFIGURATION ---
const SYNC_LABS_JOB_ID = '01ac3a7d-940f-4f05-b474-f5a586412272';
const API_BASE_URL = '***REMOVED***'; // ALWAYS use localhost for local test scripts
const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;
// --- END CONFIGURATION ---

if (!SYNC_LABS_API_KEY || !TEST_SECRET_KEY) {
  console.error('❌ ERROR: SYNC_LABS_API_KEY and/or TEST_SECRET_KEY are not set in your .env.local file.');
  process.exit(1);
}

// Axios instance for the final, fast API call
const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json', 'x-test-secret': TEST_SECRET_KEY },
  timeout: 1800000, // 30 min timeout is fine for the final render
});

async function runFullRenderTest() {
  console.log(`🧪 Starting ROBUST pipeline test from SyncLabs Job ID: ${SYNC_LABS_JOB_ID}`);
  let downloadedVideoPath = '';
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    // === STEP 1: DOWNLOAD VIDEO (Unchanged) ===
    console.log('\n[Step 1/4] Fetching and downloading original video...');
    const syncResponse = await axios.get(`https://api.sync.so/v2/generate/${SYNC_LABS_JOB_ID}`, {
        headers: { 'x-api-key': SYNC_LABS_API_KEY },
    });
    if (syncResponse.data.status !== 'COMPLETED' || !syncResponse.data.outputUrl) {
        throw new Error(`SyncLabs job is not complete.`);
    }
    const processedAvatarUrl = syncResponse.data.outputUrl;
    downloadedVideoPath = path.join(tempDir, `synclabs-video-${SYNC_LABS_JOB_ID}.mp4`);
    const writer = fs.createWriteStream(downloadedVideoPath);
    const videoDownloadResponse = await axios({ url: processedAvatarUrl, responseType: 'stream' });
    videoDownloadResponse.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
    console.log(`✅ Video downloaded locally to: ${downloadedVideoPath}`);

    // === STEP 2: REMOVE BACKGROUND (Unchanged, but we'll use a better Python script) ===
    console.log('\n[Step 2/4] Removing background with transparent output...');
    // We use the 'robust' script which outputs a .webm with a real alpha channel
    const pythonScriptPath = path.join(__dirname, 'scripts', 'remove_background_robust.py');
    const publicCutoutsDir = path.join(__dirname, 'public', 'cutouts');
    if (!fs.existsSync(publicCutoutsDir)) fs.mkdirSync(publicCutoutsDir, { recursive: true });
    
    const sourceHash = crypto.createHash('sha256').update(downloadedVideoPath).digest('hex').slice(0, 12);
    // The robust script outputs a .webm file!
    const cutoutFilename = `cutout-${sourceHash}.webm`; 
    const cutoutPath = path.join(publicCutoutsDir, cutoutFilename);

    await new Promise((resolve, reject) => {
      // Pass the LOCAL path to the python script
      const pythonProcess = spawn('python', [pythonScriptPath, downloadedVideoPath, cutoutPath]);
      pythonProcess.stdout.on('data', (data) => console.log(`[Python]: ${data.toString().trim()}`));
      pythonProcess.stderr.on('data', (data) => console.error(`[Python ERROR]: ${data.toString().trim()}`));
      pythonProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Python script exited with code ${code}.`)));
      pythonProcess.on('error', (err) => reject(err));
    });
    
    const transparentAvatarUrl = `/cutouts/${cutoutFilename}`;
    console.log(`✅ Transparent video created successfully! URL: ${transparentAvatarUrl}`);

    // === STEP 3: EXTRACT AUDIO LOCALLY (This is the key fix!) ===
    console.log('\n[Step 3/4] Extracting audio LOCALLY...');
    const audioFilename = `audio-${sourceHash}.mp3`;
    const audioPath = path.join(__dirname, 'public', 'generated_audio', audioFilename);
    const audioDir = path.dirname(audioPath);
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-i', downloadedVideoPath, '-q:a', '0', '-map', 'a', audioPath, '-y']);
      ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg (audio) exited with code ${code}.`)));
      ffmpeg.on('error', reject);
    });
    const audioUrl = `/generated_audio/${audioFilename}`;
    console.log(`✅ Audio extracted successfully: ${audioUrl}`);

    // === STEP 4: RENDER FINAL VIDEO (Now with all assets ready) ===
    console.log('\n[Step 4/4] Preparing data and starting final Remotion render...');
    const mockAssets = [
        "uploads/scraped/2ebccc5c81598a87/0e8851bafdd8.mp4",
        "uploads/scraped/2ebccc5c81598a87/1be8fed6bca1.mp4",
        "uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp",
        "uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp"
    ];

    const timeline = [
        { layout: 'fullscreen-avatar', duration: 5 * 30, assetIndices: [] },
        { layout: 'cutout-left-over-asset', duration: 5 * 30, assetIndices: [2] }, // Cutout over image
        { layout: 'fullscreen-asset', duration: 3 * 30, assetIndices: [0] }, // Fullscreen video asset
        { layout: 'cutout-right-over-asset', duration: 5 * 30, assetIndices: [3] }, // Cutout over another image
    ];

    const inputProps = {
        adData: {
          selectedImages: mockAssets.filter(a => a.endsWith('.webp')),
          selectedVideos: mockAssets.filter(a => a.endsWith('.mp4')),
        },
        timeline: timeline,
        audioUrl: audioUrl,
        processedAvatarUrl: processedAvatarUrl, // The original URL for the fullscreen scene
        greenscreenAvatarUrl: transparentAvatarUrl, // The new TRANSPARENT video for cutout scenes
    };
    
    const remotionRenderResponse = await axiosInstance.post(`${API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main', inputProps: inputProps,
    });

    const finalVideoUrl = remotionRenderResponse.data.videoUrl;
    console.log(`\n🎉🎉🎉 SUCCESS! Render Complete! 🎉🎉🎉`);
    console.log(`🎬 View your final video at: ${API_BASE_URL}${finalVideoUrl}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) { console.error('API Response Error:', JSON.stringify(error.response.data, null, 2)); }
  } finally {
    if (downloadedVideoPath && fs.existsSync(downloadedVideoPath)) {
      fs.unlinkSync(downloadedVideoPath);
      console.log(`🧹 Cleaned up temporary file: ${downloadedVideoPath}`);
    }
  }
}

runFullRenderTest();
// test-pipeline-from-synclabs.js
require('dotenv').config({ path: './.env.local' });
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// --- CONFIGURATION ---
const SYNC_LABS_JOB_ID = '01ac3a7d-940f-4f05-b474-f5a586412272';
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';
const SYNC_LABS_API_KEY = process.env.SYNC_LABS_API_KEY;
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;
// --- END CONFIGURATION ---

if (!SYNC_LABS_API_KEY || !TEST_SECRET_KEY) {
  console.error('❌ ERROR: SYNC_LABS_API_KEY and/or TEST_SECRET_KEY are not set in your .env.local file.');
  process.exit(1);
}

const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json', 'x-test-secret': TEST_SECRET_KEY },
  timeout: 1800000,
});

const { generateUserRequestedTimeline } = require(path.join(__dirname, 'dist/lib/dynamic-template-generator.js'));

async function runFullRenderTest() {
  console.log(`🧪 Starting full pipeline test from SyncLabs Job ID: ${SYNC_LABS_JOB_ID}`);
  let localVideoPath = '';

  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    console.log('\n[Step 1/4] Fetching and downloading video...');
    const syncResponse = await axios.get(`https://api.sync.so/v2/generate/${SYNC_LABS_JOB_ID}`, {
        headers: { 'x-api-key': SYNC_LABS_API_KEY },
    });
    if (syncResponse.data.status !== 'COMPLETED' || !syncResponse.data.outputUrl) {
        throw new Error(`SyncLabs job is not complete.`);
    }
    const processedAvatarUrl = syncResponse.data.outputUrl;
    localVideoPath = path.join(tempDir, `synclabs-video-${SYNC_LABS_JOB_ID}.mp4`);
    const writer = fs.createWriteStream(localVideoPath);
    const videoDownloadResponse = await axios({ url: processedAvatarUrl, responseType: 'stream' });
    videoDownloadResponse.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve); writer.on('error', reject);
    });
    console.log(`✅ Video downloaded locally to: ${localVideoPath}`);

    console.log('\n[Step 2/4] Running GREEN SCREEN background removal directly...');
    const pythonScriptPath = path.join(__dirname, 'scripts', 'remove_background_greenscreen.py');
    const publicCutoutsDir = path.join(__dirname, 'public', 'cutouts');
    if (!fs.existsSync(publicCutoutsDir)) fs.mkdirSync(publicCutoutsDir, { recursive: true });
    
    const sourceHash = require('crypto').createHash('sha256').update(localVideoPath).digest('hex').slice(0, 12);
    const cutoutFilename = `greenscreen-${sourceHash}.mp4`;
    const cutoutPath = path.join(publicCutoutsDir, cutoutFilename);

    await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonScriptPath, localVideoPath, cutoutPath]);
      pythonProcess.stdout.on('data', (data) => console.log(`[Python]: ${data.toString().trim()}`));
      pythonProcess.stderr.on('data', (data) => console.error(`[Python ERROR]: ${data.toString().trim()}`));
      pythonProcess.on('close', (code) => {
        if (code === 0) resolve(); else reject(new Error(`Python script exited with code ${code}.`));
      });
      pythonProcess.on('error', (err) => reject(err));
    });
    
    const greenscreenAvatarUrl = `/cutouts/${cutoutFilename}`;
    console.log(`✅ Green screen video created successfully! URL: ${greenscreenAvatarUrl}`);

    console.log('\n[Step 3/4] Extracting audio for Remotion...');
    const audioResponse = await axiosInstance.post(`${API_BASE_URL}/api/video/extract-audio`, { localVideoPath: localVideoPath });
    const audioUrl = audioResponse.data.audioUrl;
    console.log(`✅ Audio extracted successfully: ${audioUrl}`);

    console.log('\n[Step 4/4] Preparing data and starting final Remotion render...');
    const mockAssets = [
        "uploads/scraped/2ebccc5c81598a87/0e8851bafdd8.mp4",
        "uploads/scraped/2ebccc5c81598a87/1be8fed6bca1.mp4",
        "uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp",
        "uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp"
    ];
    const timeline = [
        { layout: 'fullscreen-avatar', duration: 5 * 30 },
        { layout: 'fullscreen-asset', duration: 3 * 30, assetIndices: [0] },
        { layout: 'avatar-with-corner-image', duration: 5 * 30, assetIndices: [1] },
        { layout: 'fullscreen-asset', duration: 2 * 30, assetIndices: [2] },
    ];
    const inputProps = {
        adData: {
          selectedImages: mockAssets.filter(a => a.endsWith('.webp')),
          selectedVideos: mockAssets.filter(a => a.endsWith('.mp4')),
        },
        timeline: timeline,
        audioUrl: audioUrl,
        processedAvatarUrl: processedAvatarUrl,
        greenscreenAvatarUrl: greenscreenAvatarUrl,
    };
    
    const remotionRenderResponse = await axiosInstance.post(`${API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main', inputProps: inputProps,
    });

    const finalVideoUrl = remotionRenderResponse.data.videoUrl;
    console.log(`\n🎉🎉🎉 SUCCESS! Render Complete! 🎉🎉🎉`);
    console.log(`🎬 View your final video at: ${API_BASE_URL}${finalVideoUrl}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED: An error occurred during the test.');
    if (error.response) { console.error('API Response Error:', JSON.stringify(error.response.data, null, 2)); }
    else { console.error('Error:', error.message); }
  } finally {
    if (localVideoPath && fs.existsSync(localVideoPath)) {
      fs.unlinkSync(localVideoPath);
      console.log(`🧹 Cleaned up temporary file: ${localVideoPath}`);
    }
  }
}

runFullRenderTest();
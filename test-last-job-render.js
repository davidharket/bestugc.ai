// --- FIX: LOAD ENVIRONMENT VARIABLES ---
// This line reads your .env.local file and makes the variables available
require('dotenv').config({ path: './.env.local' });
// ------------------------------------

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE_URL = '***REMOVED***'; // Your local dev server

// Secret key for authenticating test scripts with your API
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;
if (!TEST_SECRET_KEY) {
  // This check will now pass
  console.error('❌ ERROR: TEST_SECRET_KEY is not set in your .env.local file.');
  process.exit(1);
}

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'x-test-secret': TEST_SECRET_KEY,
  },
  timeout: 1800000, // Set a generous 30-minute timeout for long operations
});

async function runTest() {
  console.log('🧪 Starting test to re-render the last ad...');

  try {
    // 1. Find the last ad from the database
    console.log('\n[Step 1/5] Fetching the last ad from the database...');
    const lastAd = await prisma.ad.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!lastAd) {
      console.error('❌ No ads found in the database.');
      return;
    }
    console.log(`✅ Found last ad: ID = ${lastAd.id}, Status = ${lastAd.status}`);

    if (!lastAd.syncLabsJobId) {
      console.error('❌ This ad does not have a SyncLabs job ID. Please test with an ad that completed the lip-sync step.');
      return;
    }

    // 2. Poll SyncLabs for the completed video URL
    console.log('\n[Step 2/5] Getting the lip-synced video URL from SyncLabs...');
    const syncLabsResponse = await axios.get(`https://api.sync.so/v2/generate/${lastAd.syncLabsJobId}`, {
        headers: { 'x-api-key': process.env.SYNC_LABS_API_KEY },
    });
    
    if (syncLabsResponse.data.status !== 'COMPLETED' || !syncLabsResponse.data.outputUrl) {
        console.error(`❌ SyncLabs job is not complete. Status: ${syncLabsResponse.data.status}`);
        return;
    }
    const processedAvatarUrl = syncLabsResponse.data.outputUrl;
    console.log(`✅ Got lip-synced video URL: ${processedAvatarUrl}`);

    // 3. Re-run the background removal (THIS TESTS THE FIX)
    console.log('\n[Step 3/5] Re-running background removal...');
    const bgRemovalResponse = await axiosInstance.post(`${API_BASE_URL}/api/video/remove-background`, {
      videoUrl: processedAvatarUrl,
    });
    
    const cutoutAvatarUrl = bgRemovalResponse.data.cutoutVideoUrl;
    if (!cutoutAvatarUrl || !cutoutAvatarUrl.endsWith('.webm')) {
      throw new Error(`Background removal did not return a valid .webm file. Got: ${cutoutAvatarUrl}`);
    }
    console.log(`✅ Background removal successful! Cutout URL (WebM): ${cutoutAvatarUrl}`);

    // 4. Reconstruct ad data and generate timeline for Remotion
    console.log('\n[Step 4/5] Preparing data for the final render...');
    const adData = {
      ...lastAd,
      selectedImages: JSON.parse(lastAd.selectedImages || '[]'),
      selectedVideos: JSON.parse(lastAd.selectedVideos || '[]'),
    };
    
    const assets = [...adData.selectedImages, ...adData.selectedVideos];
    
    // Using your 'EveCurlsTimeline' for testing as seen in `inngest/render-video.ts`
    const { generateEveCurlsTimeline } = require('./dist/lib/dynamic-template-generator.js');
    const timeline = generateEveCurlsTimeline(assets);
    console.log(`✅ Dynamic timeline generated with ${timeline.length} scenes.`);
    
    const compositionProps = {
        adId: lastAd.id,
        adData: adData,
        processedAvatarUrl: processedAvatarUrl,
        cutoutAvatarUrl: `${API_BASE_URL}${cutoutAvatarUrl}`, // Remotion needs an absolute URL
        timeline: timeline,
    };

    // 5. Trigger the final Remotion render
    console.log('\n[Step 5/5] Starting final Remotion render...');
    const remotionRenderResponse = await axiosInstance.post(`${API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main', // Your main composition ID
        inputProps: compositionProps,
    });

    const finalVideoUrl = remotionRenderResponse.data.videoUrl;
    console.log(`\n🎉🎉🎉 SUCCESS! Render complete! 🎉🎉🎉`);
    console.log(`🎬 View your final video at: ${API_BASE_URL}${finalVideoUrl}`);

    // Update the database with the new video URL
    await prisma.ad.update({
        where: { id: lastAd.id },
        data: { finalVideoUrl: finalVideoUrl, status: 'COMPLETED' }
    });
    console.log('💾 Database updated with the new video URL.');

  } catch (error) {
    console.error('\n❌ TEST FAILED: An error occurred during the test.');
    if (error.response) {
      console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
// test-cutout-scene.js
require('dotenv').config({ path: './.env.local' });
const axios = require('axios');

// --- CONFIGURATION ---
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY;
// --- END CONFIGURATION ---

if (!TEST_SECRET_KEY) {
  console.error('❌ ERROR: TEST_SECRET_KEY is not set in your .env.local file.');
  process.exit(1);
}

const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json', 'x-test-secret': TEST_SECRET_KEY },
  timeout: 1800000,
});

async function runIsolatedTest() {
  console.log('🧪 Starting isolated test of the CutoutAvatarScene...');

  // --- HARDCODED PROPS FOR THE SCENE ---
  // ✅ THE FIX: Pass simple, relative URL paths. Remotion will handle these with staticFile().
  const inputProps = {
    backgroundSrc: '/uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp',
    greenscreenSrc: '/cutouts/greenscreen-69d70954b6a1.mp4',
    position: 'center',
    avatarStartFrom: 0,
  };
  // ---

  try {
    console.log('🚀 Sending render request for TestCutoutScene...');
    const response = await axiosInstance.post(`${API_BASE_URL}/api/render/remotion`, {
      compositionId: 'TestCutoutScene',
      inputProps: inputProps,
    });

    const finalVideoUrl = response.data.videoUrl;
    console.log(`\n🎉🎉🎉 ISOLATED TEST SUCCESS! 🎉🎉🎉`);
    console.log(`🎬 View your 5-second test video at: ${API_BASE_URL}${finalVideoUrl}`);
    console.log(`✅ If the avatar appears with a transparent background, the bug is fixed!`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('API Response Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

runIsolatedTest();
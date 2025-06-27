require('dotenv').config({ path: './.env.local' });
const axios = require('axios');

const API_BASE_URL = '***REMOVED***';

async function testSyncFix() {
  console.log('🧪 Testing video sync fix...');

  // Use simple assets that exist
  const inputProps = {
    adData: {
      selectedImages: ['uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp'],
      selectedVideos: [],
    },
    timeline: [
      { layout: 'fullscreen-avatar', duration: 120, assetIndices: [] },
      { layout: 'cutout-center-over-asset', duration: 120, assetIndices: [0] },
    ],
    audioUrl: '/generated_audio/tts_c315a855db3aa97f.mp3',
    processedAvatarUrl: '/synclabs/synclabs-c91f7609-1098-42d6-b1db-f8dda00018fc.mp4',
    greenscreenAvatarUrl: '/cutouts/cutout-373daac9dbd5.webm',
  };
  
  try {
    console.log('🚀 Sending render request...');
    const response = await axios.post(`${API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main',
        inputProps: inputProps,
    }, {
        timeout: 300000, // 5 min timeout
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
    });

    console.log('\n🎉 SUCCESS! Sync test complete!');
    console.log(`🎬 Video: ${API_BASE_URL}${response.data.videoUrl}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
        console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Error:', error.message);
    }
  }
}

testSyncFix(); 
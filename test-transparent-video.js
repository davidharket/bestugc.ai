// test-transparent-video.js
const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function testWithTransparentVideo() {
  console.log('🧪 Testing with pre-processed transparent video...');
  
  try {
    // Use a WebM file with actual transparency instead of green screen
    const mockAssets = [
      "uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp",
      "uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp"
    ];
    
    // Simple timeline without chromakey scenes
    const timeline = [
      { layout: 'fullscreen-avatar', duration: 150 },
      { layout: 'fullscreen-asset', duration: 150, assetIndices: [0] },
      { layout: 'avatar-with-corner-image', duration: 150, assetIndices: [1] }
    ];
    
    const inputProps = {
      adData: {
        selectedImages: mockAssets,
        selectedVideos: [],
      },
      timeline: timeline,
      audioUrl: '/generated_audio/audio-7a6e3eea.mp3',
      processedAvatarUrl: '/avatars-fixed/female-blonde-adult-inside.mp4',
      greenscreenAvatarUrl: '/avatars-fixed/female-blonde-adult-inside.mp4', // Use regular video for now
    };
    
    const response = await axios.post('***REMOVED***/api/render/remotion', {
      compositionId: 'Main',
      inputProps: inputProps,
    }, {
      headers: { 'x-test-secret': process.env.TEST_SECRET_KEY },
      timeout: 300000
    });
    
    console.log('✅ Success!', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWithTransparentVideo();
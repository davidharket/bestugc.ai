const axios = require('axios');

async function quickBackgroundTest() {
  try {
    console.log('🎭 Quick Background Removal Test');
    console.log('Testing with locally downloaded video...\n');
    
    // Use the locally downloaded video from our previous test
    const localVideoUrl = '***REMOVED***/temp/avatar-temp.mp4';
    
    console.log('📹 Input video:', localVideoUrl);
    console.log('⏱️ Starting background removal (timeout: 3 minutes)...');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      '***REMOVED***/api/video/remove-background',
      { videoUrl: localVideoUrl },
      { 
        timeout: 180000, // 3 minute timeout
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`✅ Background removal completed in ${processingTime} seconds!`);
    console.log('🎯 Result:', response.data);
    
    if (response.data.cutoutVideoUrl) {
      console.log(`📺 Cutout video: ***REMOVED***${response.data.cutoutVideoUrl}`);
      console.log('🎉 SUCCESS! Background removal is working!');
      
      if (response.data.cached) {
        console.log('💡 Result was cached - very fast!');
      } else {
        console.log(`⚡ Processing time: ${response.data.processingTimeMs}ms`);
        console.log(`📁 File size: ${response.data.fileSizeMB}MB`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

quickBackgroundTest(); 
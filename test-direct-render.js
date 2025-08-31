// /var/www/ageco.ai/test-direct-render.js

const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const path = require('path');
const { getProductionGPUConfig, getGPUWebpackConfig } = require('./dist/lib/gpu-config');

// --- ⚙️ CONFIGURATION ---
// IMPORTANT: Change this to a real, existing video file in your public/b-roll directory!
const videoUrl = '***REMOVED***/b-roll/focused_work_woman.mp4';
const compositionId = 'Main'; // The composition ID to render
const outputLocation = `public/test-render-${Date.now()}.mp4`;
// --- END CONFIGURATION ---

const runTest = async () => {
  console.log('🚀 Starting direct Remotion render test...');
  console.log(`📹 Using video URL: ${videoUrl}`);

  try {
    // Step 1: Bundle the Remotion project
    // We use the exact same Webpack config as your production worker.
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/index.ts'),
      webpackOverride: getGPUWebpackConfig(true),
    });
    console.log(`✅ Bundle created at: ${bundleLocation}`);

    // Step 2: Get the compositions from the bundle
    console.log('🔍 Fetching compositions from bundle...');
    const comps = await getCompositions({
      serveUrl: bundleLocation,
    });
    const composition = comps.find((c) => c.id === compositionId);

    if (!composition) {
      throw new Error(`Composition "${compositionId}" not found in the bundle.`);
    }
    console.log(`✅ Found composition: "${composition.id}"`);

    // Step 3: Render the media
    // We use the exact same GPU and Chromium config as your production worker.
    const gpuConfig = getProductionGPUConfig();
    
    // We create a minimal set of inputProps needed for a simple test.
    const inputProps = {
      adData: {
        orderedBRoll: [{ url: videoUrl, order: 0 }],
        // Add any other minimal required props here if the component errors without them
      },
      timeline: [{ layout: 'fullscreen-asset', duration: 150, assetIndices: [0] }],
      // Mock other required props
      audioUrl: '',
      processedAvatarUrl: '',
      greenscreenAvatarUrl: '',
    };
    
    console.log('🎬 Starting media render...');
    console.log('   Using Chromium args:', gpuConfig.chromiumOptions.args);
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
      chromiumOptions: gpuConfig.chromiumOptions,
      timeoutInMilliseconds: 60000, // 1 minute timeout for the test
    });

    console.log('🎉 SUCCESS! Render completed successfully!');
    console.log(`✨ Your test video is saved at: ${outputLocation}`);

  } catch (err) {
    console.error('❌ TEST FAILED: An error occurred during the render process.');
    console.error(err);
    process.exit(1);
  }
};

runTest();

// pages/api/render/remotion.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- Test Script Authentication ---
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-test-secret'] !== process.env.TEST_SECRET_KEY
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid test secret' });
  }
  // --- End Authentication ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { compositionId, inputProps } = req.body;

    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/index.ts'),
    });
    console.log('✅ Bundle created.');

    console.log('🔍 Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
      timeoutInMilliseconds: 120000,
    });
    console.log('✅ Composition selected.');

    // --- ✅ THE FAILSAFE FIX ---
    // If a timeline is provided (like in the main pipeline), calculate the duration dynamically.
    // Otherwise (like in our isolated test), use the composition's default duration.
    if (inputProps.timeline && Array.isArray(inputProps.timeline)) {
        const totalDurationInFrames = inputProps.timeline.reduce(
            (acc: number, scene: { duration: number }) => acc + scene.duration,
            0
        );
        composition.durationInFrames = totalDurationInFrames;
        console.log(`⏱️  Dynamic duration calculated from timeline: ${totalDurationInFrames} frames`);
    } else {
        console.log(`⏱️  Using default composition duration: ${composition.durationInFrames} frames`);
    }
    // --- END FIX ---

    const outputFilename = `${compositionId}-${Date.now()}.mp4`;
    const outputPath = path.resolve(`./public/renders/${outputFilename}`);
    
    console.log(`🎞️  Starting render to: ${outputPath}`);
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      timeoutInMilliseconds: 1800000,
    });

    const relativePath = `/renders/${outputFilename}`;
    console.log('✅ Render finished. Final video URL:', relativePath);
    
    res.status(200).json({
      success: true,
      videoUrl: relativePath,
    });

  } catch (error) {
    console.error('❌ Remotion render API error:', error);
    res.status(500).json({
      error: 'Render failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
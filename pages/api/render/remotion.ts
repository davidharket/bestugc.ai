import { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { adId, adData, processedAvatarUrl, cutoutAvatarUrl, timeline } = req.body;

    // 1. Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/Video.tsx'),
      webpackOverride: (config) => config,
    });

    // 2. Prepare props for the composition
    const inputProps = {
      adData,
      timeline,
      processedAvatarUrl,
      cutoutAvatarUrl,
    };

    // 3. Get the composition to render
    const comps = await getCompositions(bundleLocation, { inputProps });
    const composition = comps.find((c) => c.id === 'Main');
    if (!composition) {
      throw new Error('Could not find Remotion composition "Main"');
    }

    // 4. Render the video
    const outputLocation = `public/renders/${adId}.mp4`;
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
    });
    
    const finalVideoUrl = `/renders/${adId}.mp4`;

    res.status(200).json({ videoUrl: finalVideoUrl });

  } catch (error: any) {
    console.error('Remotion rendering failed:', error);
    res.status(500).json({ error: 'Failed to render video', details: error.message });
  }
} 
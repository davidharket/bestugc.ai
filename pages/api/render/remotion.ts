// pages/api/render/remotion.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add the same internal secret check for security
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
  }
    
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { compositionId, inputProps } = req.body;
    
    if (!compositionId || !inputProps) {
        return res.status(400).json({ error: 'Missing compositionId or inputProps' });
    }

    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/index.ts'),
    });
    
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    const outputFilename = `remotion-render-${new Date().getTime()}.mp4`;
    const outputPath = path.resolve(`./public/renders/${outputFilename}`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    const finalVideoUrl = `/renders/${outputFilename}`;
    res.status(200).json({ videoUrl: finalVideoUrl });

  } catch (error: any) {
    console.error('Remotion render API error:', error);
    res.status(500).json({ error: 'Failed to render video', details: error.message });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { adId, adData, processedAvatarUrl, cutoutAvatarUrl, timeline } = req.body;

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // 1. Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // 2. Prepare props for the composition
    const inputProps = {
      adData: {
        ...adData,
        selectedImages: adData.selectedImages.map((p: string) => (p.startsWith('http') ? p : `${baseUrl}${p}`)),
      },
      timeline,
      processedAvatarUrl,
      cutoutAvatarUrl: cutoutAvatarUrl.startsWith('http') ? cutoutAvatarUrl : `${baseUrl}${cutoutAvatarUrl}`,
    };

    // 3. Get the composition to render
    const comps = await getCompositions(bundleLocation, { inputProps });
    const composition = comps.find((c) => c.id === 'Main');
    if (!composition) {
      throw new Error('Could not find Remotion composition "Main"');
    }

    // 4. Render the video
    const outputDir = path.join(process.cwd(), 'public', 'renders');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputLocation = path.join(outputDir, `${adId}.mp4`);

    console.log('Starting Remotion render...');
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
      onProgress: (p) => {
        console.log(`Rendering... ${Math.round(p.progress * 100)}%`);
      },
    });
    console.log('Remotion render finished.');
    
    const finalVideoUrl = `/renders/${adId}.mp4`;

    console.log('Final video URL:', finalVideoUrl);

    res.status(200).json({ videoUrl: finalVideoUrl });

  } catch (error: any) {
    console.error('Remotion rendering failed:', error);
    res.status(500).json({ error: 'Failed to render video', details: error.message });
  }
} 
// pages/api/render/preview.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Increase API timeout for preview rendering
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // Set timeout to 5 minutes for preview rendering
  maxDuration: 300,
};
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { AdCreationData } from '../../../components/AdCreationContext';
import { getTemplateById } from '../../../lib/templates';
import { generateConcreteTimeline } from '../../../lib/timeline-generator';
import { avatars } from '../../../lib/avatars';
import { COMPOSITION_FPS } from '../../../remotion/constants';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Helper function to get audio duration
async function getAudioDuration(audioUrl: string): Promise<number> {
  try {
    const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
    
    // Use the same approach as render worker - pass relative URL, not absolute path
    // audioUrl is already in the correct format: "/generated_audio/tts_xxx.mp3"
    
    console.log('[Preview] Calling get-duration API with filePath:', audioUrl);
    
    const response = await axios.post('/api/video/get-duration', 
      { filePath: audioUrl },
      { 
        headers: { 
          'x-internal-secret': INTERNAL_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        baseURL: process.env.NEXT_PUBLIC_APP_URL
      }
    );
    
    console.log('[Preview] Duration API response:', response.data);
    
    if (!response.data.durationInSeconds || isNaN(response.data.durationInSeconds)) {
      throw new Error(`Invalid duration received: ${response.data.durationInSeconds}`);
    }
    
    return response.data.durationInSeconds;
  } catch (error) {
    console.error('[Preview] Error getting audio duration:', error);
    // Return a fallback duration instead of failing
    console.log('[Preview] Using fallback duration of 10 seconds');
    return 10; 
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { adData, previewDuration = 10 } = req.body;

  if (!adData || !adData.templateId) {
    return res.status(400).json({ message: 'Missing ad data or template ID' });
  }

  try {
    console.log('[Preview] Starting preview render...');

    // Get template and generate timeline
    const template = getTemplateById(adData.templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Calculate duration based on actual audio length (like main render)
    let totalDurationInFrames: number;
    if (adData.audioUrl) {
      console.log('[Preview] Getting audio duration from:', adData.audioUrl);
      const audioDurationInSeconds = await getAudioDuration(adData.audioUrl);
      totalDurationInFrames = Math.round(audioDurationInSeconds * COMPOSITION_FPS);
      console.log('[Preview] Audio duration:', audioDurationInSeconds, 'seconds,', totalDurationInFrames, 'frames');
    } else {
      // Fallback to fixed preview duration if no audio
      console.log('[Preview] No audio URL, using fallback duration:', previewDuration, 'seconds');
      totalDurationInFrames = Math.round(previewDuration * COMPOSITION_FPS);
    }
    
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);

    // Get avatar
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Convert relative URLs to absolute URLs
    const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
    const toAbsoluteUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${EXTERNAL_API_BASE_URL}${url}`;
    };

    const remotionAdData = {
      ...adData,
      selectedImages: (adData.selectedImages || []).map(toAbsoluteUrl),
      selectedVideos: (adData.selectedVideos || []).map(toAbsoluteUrl),
    };

    // Create input props for Remotion - minimal preview mode
    // For preview, use the original avatar video (not lipsync processed)
    const avatarVideoUrl = toAbsoluteUrl(avatar.src);
    
    const inputProps = {
      adData: {
        ...remotionAdData,
        previewMode: true, // Enable preview mode for minimal rendering
      },
      timeline: concreteTimeline,
      audioUrl: toAbsoluteUrl(adData.audioUrl || ''),
      processedAvatarUrl: avatarVideoUrl, // Use original avatar video for preview
      greenscreenAvatarUrl: avatarVideoUrl, // Same for greenscreen scenes
    };

    console.log('[Preview] Bundling Remotion composition...');
    
    // Bundle the Remotion project
    const bundleLocation = await bundle({ 
      entryPoint: path.resolve('./remotion/index.ts'), 
      webpackOverride: (config) => config 
    });

    // Select composition
    const composition = await selectComposition({ 
      serveUrl: bundleLocation, 
      id: 'Main', 
      inputProps 
    });
    
    // Override duration for preview
    composition.durationInFrames = totalDurationInFrames;

    // Create output path
    const outputFilename = `preview-${session.user.id}-${Date.now()}.mp4`;
    const outputPath = path.resolve(`./public/previews/${outputFilename}`);
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    console.log('[Preview] Rendering preview video...');
    
    // Render the media
    await renderMedia({ 
      composition, 
      serveUrl: bundleLocation, 
      codec: 'h264', 
      outputLocation: outputPath, 
      inputProps 
    });

    const previewVideoUrl = `/previews/${outputFilename}`;

    console.log('[Preview] Preview render completed:', previewVideoUrl);

    const actualDurationInSeconds = totalDurationInFrames / COMPOSITION_FPS;
    
    return res.status(200).json({ 
      previewVideoUrl,
      durationInSeconds: actualDurationInSeconds
    });

  } catch (error) {
    console.error('[Preview] Error rendering preview:', error);
    return res.status(500).json({ 
      message: 'Failed to render preview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
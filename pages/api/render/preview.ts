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
  // Set timeout to 10 minutes for preview rendering
  maxDuration: 600,
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
import { getPreviewGPUConfig, getGPUWebpackConfig, createPerformanceMonitor } from '../../../lib/gpu-config';

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

    // Calculate duration - use shorter preview for faster generation
    let totalDurationInFrames: number;
    if (adData.audioUrl) {
      console.log('[Preview] Getting audio duration from:', adData.audioUrl);
      const audioDurationInSeconds = await getAudioDuration(adData.audioUrl);
      // Create a mini preview of up to 20 seconds for faster generation
      const previewDurationInSeconds = Math.min(audioDurationInSeconds, 20);
      totalDurationInFrames = Math.round(previewDurationInSeconds * COMPOSITION_FPS);
      console.log('[Preview] Audio duration:', audioDurationInSeconds, 'seconds, preview duration:', previewDurationInSeconds, 'seconds,', totalDurationInFrames, 'frames');
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
      // Skip blob URLs - they can't be accessed server-side
      if (url.startsWith('blob:')) {
        console.warn(`[Preview] Skipping blob URL: ${url}`);
        return '';
      }
      if (url.startsWith('http')) return url;
      // Handle B-roll assets with proper API endpoint
      if (url.startsWith('b-roll/')) {
        return `${EXTERNAL_API_BASE_URL}/api/serve-broll/${url.replace('b-roll/', '')}`;
      }
      return `${EXTERNAL_API_BASE_URL}${url}`;
    };

    const filteredImages = (adData.selectedImages || []).map(toAbsoluteUrl).filter((url: string) => url !== '');
    const filteredVideos = (adData.selectedVideos || []).map(toAbsoluteUrl).filter((url: string) => url !== '');
    const filteredBRoll = (adData.selectedBRoll || []).map(toAbsoluteUrl).filter((url: string) => url !== '');
    
    console.log('[Preview] Asset counts:', {
      images: filteredImages.length,
      videos: filteredVideos.length,
      broll: filteredBRoll.length,
      selectedBRollRaw: (adData.selectedBRoll || []).length
    });
    
    const remotionAdData = {
      ...adData,
      selectedImages: filteredImages,
      selectedVideos: filteredVideos,
      selectedBRoll: filteredBRoll,
    };

    // If no valid assets available, modify timeline to use avatar-only scenes
    let finalTimeline = concreteTimeline;
    if (filteredImages.length === 0 && filteredVideos.length === 0 && filteredBRoll.length === 0) {
      console.log('[Preview] No valid assets available, falling back to avatar-only timeline');
      finalTimeline = [
        { layout: 'fullscreen-avatar', duration: totalDurationInFrames }
      ];
    }

    // Create input props for Remotion - minimal preview mode
    // For preview, use the original avatar video (not lipsync processed)
    const avatarVideoUrl = toAbsoluteUrl(avatar.src);
    
    const inputProps = {
      adData: {
        ...remotionAdData,
        previewMode: true, // Enable preview mode for minimal rendering
      },
      timeline: finalTimeline,
      audioUrl: toAbsoluteUrl(adData.audioUrl || ''),
      processedAvatarUrl: avatarVideoUrl, // Use original avatar video for preview
      greenscreenAvatarUrl: avatarVideoUrl, // Same for greenscreen scenes
    };

    // Initialize performance monitoring
    const perfMonitor = createPerformanceMonitor();
    
    console.log('[Preview] Bundling Remotion composition with GPU optimizations...');
    perfMonitor.logPerformance('Preview Bundle Start');
    
    let bundleLocation: string | null = null;
    try {
      // GPU-optimized bundling for preview
      bundleLocation = await bundle({ 
        entryPoint: path.resolve('./remotion/index.ts'), 
        webpackOverride: getGPUWebpackConfig(false) // Preview mode
      });

      perfMonitor.logPerformance('Preview Bundle Complete');

      // Get preview GPU configuration
      const previewGpuConfig = getPreviewGPUConfig();

      console.log('[Preview] Selecting composition with GPU acceleration...');
      perfMonitor.logPerformance('Preview Composition Selection Start');
      
      // Select composition with GPU acceleration
      const composition = await selectComposition({ 
        serveUrl: bundleLocation, 
        id: 'Main', 
        inputProps,
        chromiumOptions: previewGpuConfig.chromiumOptions,
        timeoutInMilliseconds: 240000 // 4 minutes timeout for previews
      });
      
      perfMonitor.logPerformance('Preview Composition Selection Complete');
      
      // Override duration for preview
      composition.durationInFrames = totalDurationInFrames;

      // Create output path
      const outputFilename = `gpu-preview-${session.user.id}-${Date.now()}.mp4`;
      const outputPath = path.resolve(`./public/previews/${outputFilename}`);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      console.log('[Preview] Starting GPU-accelerated preview render...');
      perfMonitor.logPerformance('Preview Render Start');
      
      // Render the media with GPU acceleration
      await renderMedia({ 
        composition, 
        serveUrl: bundleLocation, 
        codec: 'h264', 
        outputLocation: outputPath, 
        inputProps,
        chromiumOptions: previewGpuConfig.chromiumOptions,
        timeoutInMilliseconds: 600000, // 10 minutes for previews
        // Optimize for preview speed
        scale: 0.5, // Render at 50% scale for faster processing
      });

      perfMonitor.logPerformance('Preview Render Complete');
      
      // Get final file stats
      const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
      const fileSizeMB = stats ? (stats.size / 1024 / 1024).toFixed(2) : 'Unknown';
      
      console.log(`[Preview] GPU-accelerated preview completed in ${perfMonitor.getElapsedTime()}s, size: ${fileSizeMB}MB`);

      const previewVideoUrl = `/previews/${outputFilename}`;

      console.log('[Preview] Preview render completed:', previewVideoUrl);

      const actualDurationInSeconds = totalDurationInFrames / COMPOSITION_FPS;
      
      return res.status(200).json({ 
        previewVideoUrl,
        durationInSeconds: actualDurationInSeconds,
        renderTimeSeconds: perfMonitor.getElapsedTime(),
        fileSizeMB: fileSizeMB,
        gpuAccelerated: true
      });
    } finally {
      if (bundleLocation) {
        console.log(`[Preview] Cleaning up bundle location: ${bundleLocation}`);
        try {
          fs.rmSync(bundleLocation, { recursive: true, force: true });
          console.log(`[Preview] ✅ Successfully cleaned up bundle.`);
        } catch (err) {
          console.error(`[Preview] ⚠️ Failed to clean up bundle:`, err);
        }
      }
    }

  } catch (error) {
    console.error('[Preview] Error rendering preview:', error);
    return res.status(500).json({ 
      message: 'Failed to render preview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
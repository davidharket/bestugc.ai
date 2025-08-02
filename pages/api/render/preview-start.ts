// pages/api/render/preview-start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for preview jobs (in production, use Redis or database)
const previewJobs = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: number;
}>();

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

  // Create job ID and store initial status
  const jobId = uuidv4();
  previewJobs.set(jobId, {
    status: 'pending',
    startTime: Date.now()
  });

  console.log(`[Preview] Started job ${jobId} for user ${session.user.id}`);

  // Start the preview generation asynchronously
  processPreviewAsync(jobId, adData, previewDuration, session.user.id)
    .catch(error => {
      console.error(`[Preview] Job ${jobId} failed:`, error);
      const job = previewJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

  // Return job ID immediately
  return res.status(200).json({ 
    jobId,
    status: 'pending',
    message: 'Preview generation started'
  });
}

async function processPreviewAsync(jobId: string, adData: any, previewDuration: number, userId: string) {
  const job = previewJobs.get(jobId);
  if (!job) return;

  try {
    // Update status to processing
    job.status = 'processing';
    console.log(`[Preview] Processing job ${jobId}`);

    // Import the heavy modules only when needed
    const { getTemplateById } = await import('../../../lib/templates');
    const { generateConcreteTimeline } = await import('../../../lib/timeline-generator');
    const { avatars } = await import('../../../lib/avatars');
    const { COMPOSITION_FPS } = await import('../../../remotion/constants');
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const path = await import('path');
    const fs = await import('fs');
    const axios = await import('axios');
    const { getPreviewGPUConfig, getGPUWebpackConfig, createPerformanceMonitor } = await import('../../../lib/gpu-config');

    // Get template and generate timeline
    const template = getTemplateById(adData.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Calculate duration - use full audio duration for accurate preview
    let totalDurationInFrames: number;
    if (adData.audioUrl) {
      console.log('[Preview] Getting audio duration from:', adData.audioUrl);
      const audioDurationInSeconds = await getAudioDuration(adData.audioUrl);
      // Use full audio duration for accurate preview
      const previewDurationInSeconds = audioDurationInSeconds;
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
      throw new Error('Avatar not found');
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
      return `${EXTERNAL_API_BASE_URL}${url}`;
    };

    // Helper function to get assets in proper order
    const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
      if (orderedAssets && orderedAssets.length > 0) {
        // Sort by order and extract URLs
        return orderedAssets
          .sort((a, b) => a.order - b.order)
          .map(asset => asset.url)
          .map(toAbsoluteUrl)
          .filter((url: string) => url !== '');
      }
      // Fallback to unordered assets if no ordered assets
      return (fallbackAssets || []).map(toAbsoluteUrl).filter((url: string) => url !== '');
    };

    const remotionAdData = {
      ...adData,
      selectedImages: getOrderedAssets(adData.orderedImages || [], adData.selectedImages || []),
      selectedVideos: getOrderedAssets(adData.orderedVideos || [], adData.selectedVideos || []),
    };

    const avatarVideoUrl = toAbsoluteUrl(avatar.src);
    
    const inputProps = {
      adData: {
        ...remotionAdData,
        previewMode: true,
      },
      timeline: concreteTimeline,
      audioUrl: toAbsoluteUrl(adData.audioUrl || ''),
      processedAvatarUrl: avatarVideoUrl,
      greenscreenAvatarUrl: avatarVideoUrl,
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
        webpackOverride: getGPUWebpackConfig(false)
      });

      perfMonitor.logPerformance('Preview Bundle Complete');

      // Get preview GPU configuration
      const previewGpuConfig = getPreviewGPUConfig();

      console.log('[Preview] Selecting composition with GPU acceleration...');
      perfMonitor.logPerformance('Preview Composition Selection Start');
      
      // Determine which composition to use based on current preview format
      const compositionId = adData.currentPreviewFormat === '4:5' ? 'Main4x5' : 'Main';
      console.log(`[Preview] Using composition: ${compositionId} for format: ${adData.currentPreviewFormat || '9:16'}`);
      
      // Select composition with GPU acceleration
      const composition = await selectComposition({ 
        serveUrl: bundleLocation, 
        id: compositionId, 
        inputProps,
        chromiumOptions: previewGpuConfig.chromiumOptions,
        timeoutInMilliseconds: 600000
      });
      
      perfMonitor.logPerformance('Preview Composition Selection Complete');
      
      // Override duration for preview
      composition.durationInFrames = totalDurationInFrames;

      // Create output path
      const outputFilename = `gpu-preview-${userId}-${Date.now()}.mp4`;
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
        timeoutInMilliseconds: 600000,
      });

      perfMonitor.logPerformance('Preview Render Complete');
      
      // Get final file stats
      const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
      const fileSizeMB = stats ? (stats.size / 1024 / 1024).toFixed(2) : 'Unknown';
      
      console.log(`[Preview] GPU-accelerated preview completed in ${perfMonitor.getElapsedTime()}s, size: ${fileSizeMB}MB`);

      const previewVideoUrl = `/previews/${outputFilename}`;
      const actualDurationInSeconds = totalDurationInFrames / COMPOSITION_FPS;
      
      // Update job with success result
      job.status = 'completed';
      job.result = {
        previewVideoUrl,
        durationInSeconds: actualDurationInSeconds,
        renderTimeSeconds: perfMonitor.getElapsedTime(),
        fileSizeMB: fileSizeMB,
        gpuAccelerated: true
      };

      console.log(`[Preview] Job ${jobId} completed successfully`);

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
    console.error(`[Preview] Job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
  }
}

// Helper function to get audio duration
async function getAudioDuration(audioUrl: string): Promise<number> {
  try {
    const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
    const axios = await import('axios');
    
    console.log('[Preview] Calling get-duration API with filePath:', audioUrl);
    
    const response = await axios.default.post('/api/video/get-duration', 
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
    console.log('[Preview] Using fallback duration of 10 seconds');
    return 10; 
  }
}

// Export the jobs map for the status endpoint
export { previewJobs };
// pages/api/render/preview-start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const jobsDir = path.resolve(process.cwd(), '.tmp', 'preview-jobs');

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

  const jobId = uuidv4();
  const job = {
    status: 'pending' as 'pending' | 'processing' | 'completed' | 'failed',
    startTime: Date.now(),
    result: undefined as any,
    error: undefined as string | undefined,
  };

  try {
    fs.mkdirSync(jobsDir, { recursive: true });
    const jobFilePath = path.join(jobsDir, `${jobId}.json`);
    fs.writeFileSync(jobFilePath, JSON.stringify(job, null, 2));

  } catch (error) {
    console.error(`[Preview Start] Failed to write initial job file for ${jobId}:`, error);
    return res.status(500).json({ message: 'Failed to initialize preview job.' });
  }

  console.log(`[Preview Start] Created job ${jobId}, stored in file system.`);
  console.log(`[Preview] Started job ${jobId} for user ${session.user.id}`);

  processPreviewAsync(jobId, adData, previewDuration, session.user.id);

  return res.status(200).json({
    jobId,
    status: 'pending',
    message: 'Preview generation started'
  });
}

async function updateJobState(jobId: string, updates: Partial<any>) {
  const jobFilePath = path.join(jobsDir, `${jobId}.json`);
  try {
    if (!fs.existsSync(jobFilePath)) {
      console.warn(`[Job State] Job file for ${jobId} not found. Cannot update.`);
      return;
    }
    const currentJobData = JSON.parse(fs.readFileSync(jobFilePath, 'utf-8'));
    const updatedJob = { ...currentJobData, ...updates };
    fs.writeFileSync(jobFilePath, JSON.stringify(updatedJob, null, 2));
  } catch (error) {
    console.error(`[Job State] Failed to update job ${jobId}:`, error);
  }
}

async function processPreviewAsync(jobId: string, adData: any, previewDuration: number, userId: string) {
  try {
    await updateJobState(jobId, { status: 'processing' });
    console.log(`[Preview] Processing job ${jobId}`);

    // Import the heavy modules only when needed
    const { getTemplateById, scaleTemplateForDuration } = await import('../../../lib/templates');
    const { generateConcreteTimeline } = await import('../../../lib/timeline-generator');
    const { avatars } = await import('../../../lib/avatars');
    const { COMPOSITION_FPS } = await import('../../../remotion/constants');
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const path = await import('path');
    const fs = await import('fs');
    const { getPreviewGPUConfig, getGPUWebpackConfig, createPerformanceMonitor } = await import('../../../lib/gpu-config');

    // Get base template and scale it based on the selected duration
    const baseTemplate = getTemplateById(adData.templateId);
    if (!baseTemplate) {
      throw new Error('Template not found');
    }
    const template = scaleTemplateForDuration(baseTemplate, adData.duration || 30);
    console.log(`[Preview] Scaled template for ${adData.duration}s duration: ${template.timeline.length} scenes`);


    // Calculate duration - use full audio duration for accurate preview
    let totalDurationInFrames: number;
    if (adData.audioUrl) {
      console.log('[Preview] Getting audio duration from:', adData.audioUrl);
      const audioDurationInSeconds = await getAudioDuration(adData.audioUrl);
      const previewDurationInSeconds = audioDurationInSeconds;
      totalDurationInFrames = Math.round(previewDurationInSeconds * COMPOSITION_FPS);
      console.log('[Preview] Audio duration:', audioDurationInSeconds, 'seconds, preview duration:', previewDurationInSeconds, 'seconds,', totalDurationInFrames, 'frames');
    } else {
      console.log('[Preview] No audio URL, using fallback duration:', previewDuration, 'seconds');
      totalDurationInFrames = Math.round(previewDuration * COMPOSITION_FPS);
    }

    // Use the scaled template's timeline
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) {
      throw new Error('Avatar not found');
    }
    const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
    const toAbsoluteUrl = (url: string) => {
      if (!url || url.startsWith('blob:')) return '';
      if (url.startsWith('http')) return url;
      return `${EXTERNAL_API_BASE_URL}${url}`;
    };
    const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
      if (orderedAssets && orderedAssets.length > 0) {
        return orderedAssets.sort((a, b) => a.order - b.order).map(asset => asset.url).map(toAbsoluteUrl).filter(Boolean);
      }
      return (fallbackAssets || []).map(toAbsoluteUrl).filter(Boolean);
    };
    const remotionAdData = { ...adData, selectedImages: getOrderedAssets(adData.orderedImages || [], adData.selectedImages || []), selectedVideos: getOrderedAssets(adData.orderedVideos || [], adData.selectedVideos || []) };
    
    // For preview renders, always use standard avatar for processedAvatarUrl and greenscreenAvatarUrl
    // The product video will be handled scene-specifically in the composition
    let avatarVideoUrl = toAbsoluteUrl(avatar.src); // Always use standard avatar for default scenes
    console.log(`[Preview] Using standard avatar for default scenes: ${avatarVideoUrl}`);
    
    if (adData.productVideoUrl && adData.productVideoUrl.trim() !== '') {
      console.log(`[Preview] Product video available for first scene: ${adData.productVideoUrl}`);
    } else {
      console.log(`[Preview] No product video specified`);
    }
    
    // Helper function to convert product video URLs to internal render URLs for preview
    const toRenderVideoUrl = (url: string) => {
        if (!url || url.startsWith('blob:')) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/api/serve-video/')) {
            // Convert to internal render endpoint for authentication bypass
            const secret = process.env.INTERNAL_SECRET_KEY || '';
            return `${process.env.NEXT_PUBLIC_APP_URL}/api/render/serve-video?videoPath=${encodeURIComponent(url)}&internal_secret=${secret}`;
        }
        return `${process.env.NEXT_PUBLIC_APP_URL}${url}`;
    };

    const inputProps = { 
      adData: { ...remotionAdData, previewMode: true }, 
      timeline: concreteTimeline, 
      audioUrl: toAbsoluteUrl(adData.audioUrl || ''), 
      processedAvatarUrl: avatarVideoUrl, 
      greenscreenAvatarUrl: avatarVideoUrl, 
      originalProductVideoUrl: '', // Not used
      concatenatedProductVideoUrl: toRenderVideoUrl(adData.productVideoUrl || ''), // For first scene in preview
      oneWordAtATime: adData.oneWordAtATime, 
      fontSize: adData.fontSize 
    };
    const perfMonitor = createPerformanceMonitor();
    console.log('[Preview] Bundling Remotion composition with GPU optimizations...');
    perfMonitor.logPerformance('Preview Bundle Start');
    let bundleLocation: string | null = null;
    try {
      bundleLocation = await bundle({ entryPoint: path.resolve('./remotion/index.ts'), webpackOverride: getGPUWebpackConfig(false), publicDir: path.resolve("./public-minimal"), enableCaching: false });
      perfMonitor.logPerformance('Preview Bundle Complete');
      const previewGpuConfig = getPreviewGPUConfig();
      console.log('[Preview] Selecting composition with GPU acceleration...');
      perfMonitor.logPerformance('Preview Composition Selection Start');
      const compositionId = adData.currentPreviewFormat === '4:5' ? 'Main4x5' : 'Main';
      console.log(`[Preview] Using composition: ${compositionId} for format: ${adData.currentPreviewFormat || '9:16'}`);
      const composition = await selectComposition({ serveUrl: bundleLocation, id: compositionId, inputProps, chromiumOptions: previewGpuConfig.chromiumOptions, timeoutInMilliseconds: 600000 });
      perfMonitor.logPerformance('Preview Composition Selection Complete');
      composition.durationInFrames = totalDurationInFrames;
      const outputFilename = `gpu-preview-${userId}-${Date.now()}.mp4`;
      const outputPath = path.resolve(`./public/previews/${outputFilename}`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      console.log('[Preview] Starting GPU-accelerated preview render...');
      perfMonitor.logPerformance('Preview Render Start');
      // ✅ FIXED: Changed codec from 'h24' to the correct 'h264'
      await renderMedia({ composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: outputPath, inputProps, chromiumOptions: previewGpuConfig.chromiumOptions, timeoutInMilliseconds: 600000 });
      perfMonitor.logPerformance('Preview Render Complete');
      const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
      const fileSizeMB = stats ? (stats.size / 1024 / 1024).toFixed(2) : 'Unknown';
      console.log(`[Preview] GPU-accelerated preview completed in ${perfMonitor.getElapsedTime()}s, size: ${fileSizeMB}MB`);
      const previewVideoUrl = `/previews/${outputFilename}`;

      await updateJobState(jobId, {
        status: 'completed',
        result: {
          previewVideoUrl,
          durationInSeconds: totalDurationInFrames / COMPOSITION_FPS,
          renderTimeSeconds: perfMonitor.getElapsedTime(),
          fileSizeMB: fileSizeMB,
          gpuAccelerated: true
        }
      });
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
    await updateJobState(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getAudioDuration(audioUrl: string): Promise<number> {
    try {
        const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
        const axios = await import('axios');
        console.log('[Preview] Calling get-duration API with filePath:', audioUrl);
        const response = await axios.default.post('/api/video/get-duration', { filePath: audioUrl }, { headers: { 'x-internal-secret': INTERNAL_SECRET_KEY, 'Content-Type': 'application/json' }, baseURL: process.env.NEXT_PUBLIC_APP_URL });
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

// workers/render-worker.ts
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { getTemplateById } from '../lib/templates';
import { generateConcreteTimeline } from '../lib/timeline-generator';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { avatars } from '../lib/avatars';
import { COMPOSITION_FPS } from '../remotion/constants';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const prisma = new PrismaClient();

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || '***REMOVED***';
const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
const api = axios.create({
  baseURL: INTERNAL_API_URL,
  headers: { 'x-internal-secret': INTERNAL_SECRET_KEY }
});

async function generateTts(text: string, language: string, gender: string = 'female', avatarId?: number): Promise<string> {
  console.log(`[RenderWorker-TTS] Generating TTS with gender: ${gender}, language: ${language}, avatarId: ${avatarId}`);
  const response = await api.post('/api/tts/elevenlabs', { text, language, gender, avatarId });
  return response.data.audioUrl as string;
}

async function runLipSync(videoUrl: string, audioUrl: string): Promise<{ jobId: string, finalUrl: string }> {
  const syncLabsResponse = await api.post('/api/lipsync/synclabs', { videoUrl, audioUrl });
  const jobId = syncLabsResponse.data.jobId as string;

  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    const statusRes = await api.get(`/api/lipsync/synclabs?jobId=${jobId}`);
    if (statusRes.data.status === 'COMPLETED') {
      return { jobId, finalUrl: statusRes.data.lipSyncedVideoUrl };
    }
    if (statusRes.data.status === 'FAILED') {
      throw new Error(`Lip-sync job ${jobId} failed.`);
    }
  }
  throw new Error(`Lip-sync job ${jobId} timed out.`);
}

async function removeBackground(localVideoPath: string): Promise<string> {
  const response = await api.post('/api/video/remove-background', { localVideoPath });
  return response.data.cutoutVideoUrl;
}

async function getDuration(filePath: string): Promise<number> {
  const response = await api.post('/api/video/get-duration', { filePath });
  return response.data.durationInSeconds;
}

async function processRenderJob(adId: string, templateId: string): Promise<void> {
    const log = (message: string, ...args: any[]) => console.log(`[Job ${adId}] ${message}`, ...args);
    const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
    if (!EXTERNAL_API_BASE_URL) {
        throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set!");
    }

    log('🚀 Starting render job...');

    log('1/9: Fetching ad data...');
    const adRecord = await prisma.ad.findUnique({ where: { id: adId } });
    if (!adRecord) throw new Error(`Ad with ID ${adId} not found.`);
    await prisma.ad.update({ where: { id: adId }, data: { status: 'RENDERING' } });

    const adData: AdCreationData = {
        productUrl: adRecord.productUrl ?? undefined,
        summary: adRecord.summary ?? undefined,
        brandName: adRecord.brandName ?? undefined,
        selectedImages: JSON.parse(adRecord.selectedImages || '[]'),
        selectedVideos: JSON.parse(adRecord.selectedVideos || '[]'),
        selectedBRoll: JSON.parse(adRecord.selectedBRoll || '[]'),
        orderedImages: adRecord.orderedImages ? JSON.parse(adRecord.orderedImages) : [],
        orderedVideos: adRecord.orderedVideos ? JSON.parse(adRecord.orderedVideos) : [],
        orderedBRoll: adRecord.orderedBRoll ? JSON.parse(adRecord.orderedBRoll) : [],
        script: adRecord.script ?? undefined,
        language: adRecord.language ?? undefined,
        avatarId: adRecord.avatarId ? parseInt(adRecord.avatarId, 10) : undefined,
        templateId: adRecord.templateId ?? undefined,
        backgroundMusicUrl: adRecord.backgroundMusicUrl ?? undefined,
        backgroundMusicVolume: adRecord.backgroundMusicVolume ?? undefined,
        enableDualFormat: adRecord.enableDualFormat ?? false,
    };

    log('2/9: Checking for existing audio or generating new TTS...');
    let audioUrl: string;
    if (adData.audioUrl) {
      log('Using existing audio from preview');
      audioUrl = adData.audioUrl;
    } else {
      log('Generating new TTS audio...');
      const gender = adData.avatarId ?
        (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') :
        'female';
      console.log(`[RenderWorker-Main] AvatarId: ${adData.avatarId}, Gender: ${gender}, Type: ${typeof adData.avatarId}`);
      audioUrl = await generateTts(adData.script!, adData.language!, gender, adData.avatarId);
    }

    const absoluteAudioUrl = `${EXTERNAL_API_BASE_URL}${audioUrl}`;

    log('--- Pausing for 3 seconds to ensure audio file is accessible via public URL ---');
    await new Promise(resolve => setTimeout(resolve, 3000));

    log('3/9: Starting lip-sync job...');
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) throw new Error(`Avatar with ID ${adData.avatarId} not found.`);
    const absoluteVideoUrl = `${EXTERNAL_API_BASE_URL}${avatar.src}`;

    const { jobId: syncJobId, finalUrl: lipSyncedVideoUrl } = await runLipSync(absoluteVideoUrl, absoluteAudioUrl);
    await prisma.ad.update({ where: { id: adId }, data: { syncLabsJobId: syncJobId } });

    log('5/9: Downloading processed video...');
    const videoId = lipSyncedVideoUrl.match(/generations\/([^\/]+)/)?.[1] || adId;
    const filename = `synclabs-${videoId}.mp4`;
    const localPath = path.join(process.cwd(), 'public', 'synclabs', filename);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    const downloadResponse = await axios.get(lipSyncedVideoUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, downloadResponse.data);
    const localLipSyncedVideoUrl = `/synclabs/${filename}`;

    log('6/9: Removing video background...');
    const transparentAvatarUrl = await removeBackground(localLipSyncedVideoUrl);

    log('7/9: Getting video duration...');
    const durationInSeconds = await getDuration(localLipSyncedVideoUrl);
    const totalDurationInFrames = Math.round(durationInSeconds * COMPOSITION_FPS);
    log(`Video duration: ${durationInSeconds}s, total frames: ${totalDurationInFrames}`);

    log('8/9: Preparing for final render with Remotion...');
    const template = getTemplateById(templateId);
    if (!template) throw new Error(`Template with ID ${templateId} not found.`);
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);

    const toAbsoluteUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('blob:')) {
            console.warn(`[RenderWorker] Skipping blob URL: ${url}`);
            return '';
        }
        if (url.startsWith('http')) return url;
        if (url.startsWith('b-roll/')) {
            return `${EXTERNAL_API_BASE_URL}/api/serve-broll/${url.replace('b-roll/', '')}`;
        }
        return `${EXTERNAL_API_BASE_URL}${url}`;
    };

    const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
        if (orderedAssets && orderedAssets.length > 0) {
            return orderedAssets
                .sort((a, b) => a.order - b.order)
                .map(asset => asset.url)
                .map(toAbsoluteUrl)
                .filter((url: string) => url !== '');
        }
        return (fallbackAssets || []).map(toAbsoluteUrl).filter((url: string) => url !== '');
    };

    const remotionAdData = {
        ...adData,
        selectedImages: getOrderedAssets(adData.orderedImages || [], adData.selectedImages || []),
        selectedVideos: getOrderedAssets(adData.orderedVideos || [], adData.selectedVideos || []),
        selectedBRoll: getOrderedAssets(adData.orderedBRoll || [], adData.selectedBRoll || []),
        backgroundMusicUrl: adData.backgroundMusicUrl || '',
        backgroundMusicVolume: 100,
    };

    const inputProps = {
        adData: remotionAdData,
        timeline: concreteTimeline,
        audioUrl: toAbsoluteUrl(audioUrl),
        processedAvatarUrl: toAbsoluteUrl(localLipSyncedVideoUrl),
        greenscreenAvatarUrl: toAbsoluteUrl(transparentAvatarUrl),
    };

    log(`Passing these props to Remotion: ${JSON.stringify(Object.keys(inputProps), null, 2)}`);

    const bundleLocation = await bundle({ entryPoint: path.resolve('./remotion/index.ts'), webpackOverride: (config) => config });

    // --- SEQUENTIAL RENDERING LOGIC ---

    // Step 1: Always render the primary 9:16 video first.
    try {
        log('Step 8/9: Rendering primary format video (9:16)...');
        const composition916 = await selectComposition({ serveUrl: bundleLocation, id: 'Main', inputProps });
        composition916.durationInFrames = totalDurationInFrames;

        const outputFilename916 = `final-ad-${adId}-9x16.mp4`;
        const outputPath916 = path.resolve(`./public/renders/${outputFilename916}`);
        
        await renderMedia({ composition: composition916, serveUrl: bundleLocation, codec: 'h264', outputLocation: outputPath916, inputProps });
        
        const finalVideoUrl916 = `/renders/${outputFilename916}`;

        // Immediately update the database with the first video.
        // If this is a single-format job, mark it as COMPLETED now.
        // Otherwise, it remains RENDERING until the second video is done.
        await prisma.ad.update({
            where: { id: adId },
            data: { 
                finalVideoUrl: finalVideoUrl916,
                status: adData.enableDualFormat ? 'RENDERING' : 'COMPLETED',
            },
        });
        log('✅ Successfully rendered 9:16 format.');

    } catch (err: any) {
        log(`❌ Error rendering 9:16 video. Job failed.`, err.message);
        // If the primary video fails, the entire job fails.
        await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
        return; // Stop execution
    }

    // Step 2: If dual format is enabled, render the secondary 4:5 video.
    if (adData.enableDualFormat) {
        try {
            log('Step 8.5/9: Rendering secondary format video (4:5)...');
            const composition45 = await selectComposition({ serveUrl: bundleLocation, id: 'Main4x5', inputProps });
            composition45.durationInFrames = totalDurationInFrames;

            const outputFilename45 = `final-ad-${adId}-4x5.mp4`;
            const outputPath45 = path.resolve(`./public/renders/${outputFilename45}`);

            await renderMedia({ composition: composition45, serveUrl: bundleLocation, codec: 'h264', outputLocation: outputPath45, inputProps });

            const finalVideoUrl4x5 = `/renders/${outputFilename45}`;
            
            // Final update: add the 4:5 video URL and mark the job as fully COMPLETED.
            await prisma.ad.update({
                where: { id: adId },
                data: {
                    finalVideoUrl4x5: finalVideoUrl4x5,
                    status: 'COMPLETED'
                },
            });
            log('✅ Successfully rendered 4:5 format.');

        } catch (err: any) {
            log(`❌ Error rendering 4:5 video. Job will be marked as FAILED, but 9:16 version is saved.`, err.message);
            // The 9:16 was successful, but 4:5 failed.
            await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
            return;
        }
    }

    log('✅ Render job finished successfully!');
}


const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const worker = new Worker('render-video', async job => {
  if (!job) {
    console.error('[RenderWorker] Received an undefined job.');
    return;
  }
  const { adId, templateId } = job.data;
  console.log(`[RenderWorker] Picked up job: ${job.id} for ad: ${adId}`);

  try {
    await processRenderJob(adId, templateId);
  } catch (error: any) {
    console.error(`[RenderWorker] Job ${job.id} for ad ${adId} FAILED in top-level catch:`, error.message, error.stack);
    // Ensure status is updated even if an unexpected error occurs
    await prisma.ad.update({
      where: { id: adId },
      data: { status: 'FAILED' },
    }).catch(updateError => {
        console.error(`[RenderWorker] CRITICAL: Failed to update status to FAILED for ad ${adId}`, updateError);
    });
    throw error;
  }
}, { connection: redisConnection, concurrency: 1 });

console.log('[RenderWorker] Worker is listening for jobs on the "render-video" queue.');

worker.on('failed', (job, err) => {
  if(job) {
    console.error(`[RenderWorker] Job ${job.id} (${job.data.adId}) has failed with error: ${err.message}`);
  } else {
    console.error(`[RenderWorker] An unknown job has failed with error: ${err.message}`);
  }
});

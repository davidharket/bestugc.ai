// workers/render-worker.ts
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { getTemplateById } from '../lib/templates';
import { generateConcreteTimeline } from '../lib/timeline-generator';
import axios from 'axios';
import * as fs from 'fs';
import path from 'path';
import { avatars } from '../lib/avatars';
import { COMPOSITION_FPS } from '../remotion/constants';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getGPUWebpackConfig } from '../lib/gpu-config';

const prisma = new PrismaClient();

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || '***REMOVED***';
const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
const api = axios.create({
  baseURL: INTERNAL_API_URL,
  headers: { 'x-internal-secret': INTERNAL_SECRET_KEY }
});

async function generateTts(text: string, language: string, gender: string = 'female', avatarId?: number): Promise<{ audioUrl: string; wordTimings: any[] }> {
  console.log(`[RenderWorker-TTS] Generating TTS with gender: ${gender}, language: ${language}, avatarId: ${avatarId}`);
  const response = await api.post('/api/tts/elevenlabs', { text, language, gender, avatarId, withTimestamps: true });
  return {
    audioUrl: response.data.audioUrl as string,
    wordTimings: response.data.wordTimings || []
  };
}

async function runLipSync(videoUrl: string, audioUrl: string): Promise<{ jobId: string, finalUrl: string }> {
  const syncLabsResponse = await api.post('/api/lipsync/synclabs', { videoUrl, audioUrl });
  const jobId = syncLabsResponse.data.jobId as string;
  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    const statusRes = await api.get(`/api/lipsync/synclabs?jobId=${jobId}`);
    if (statusRes.data.status === 'COMPLETED') return { jobId, finalUrl: statusRes.data.lipSyncedVideoUrl };
    if (statusRes.data.status === 'FAILED') throw new Error(`Lip-sync job ${jobId} failed.`);
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
    if (!EXTERNAL_API_BASE_URL) throw new Error("NEXT_PUBLIC_APP_URL is not set!");

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
        duration: adRecord.duration ?? undefined,
        backgroundMusicUrl: adRecord.backgroundMusicUrl ?? undefined,
        backgroundMusicVolume: adRecord.backgroundMusicVolume ?? undefined,
        enableDualFormat: adRecord.enableDualFormat ?? false,
        oneWordAtATime: adRecord.oneWordAtATime ?? false,
        fontSize: adRecord.fontSize ?? 50,
        subtitlePosition: adRecord.subtitlePosition as any,
        textColor: adRecord.textColor ?? undefined,
        fontWeight: adRecord.fontWeight ?? undefined,
        outlineWidth: adRecord.outlineWidth ?? undefined,
        outlineColor: adRecord.outlineColor ?? undefined,
        shadowOffsetX: adRecord.shadowOffsetX ?? undefined,
        shadowOffsetY: adRecord.shadowOffsetY ?? undefined,
        shadowBlur: adRecord.shadowBlur ?? undefined,
        shadowColor: adRecord.shadowColor ?? undefined,
        letterSpacing: adRecord.letterSpacing ?? undefined,
        textTransform: adRecord.textTransform as any,
        audioUrl: adRecord.audioUrl ?? undefined,
        wordTimings: adRecord.wordTimings ? JSON.parse(adRecord.wordTimings) : undefined,
    };

    log('2/9: Checking for existing audio or generating new TTS...');
    let audioUrl: string;
    let wordTimings: any[] = [];

    if (adData.audioUrl && adData.wordTimings) {
      log('Using existing audio and word timings from preview');
      audioUrl = adData.audioUrl;
      wordTimings = adData.wordTimings;
    } else {
      log('Generating new TTS audio with word timings...');
      const gender = adData.avatarId ? (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') : 'female';
      const ttsResult = await generateTts(adData.script!, adData.language!, gender, adData.avatarId);
      audioUrl = ttsResult.audioUrl;
      wordTimings = ttsResult.wordTimings;
    }

    const absoluteAudioUrl = `${EXTERNAL_API_BASE_URL}${audioUrl}`;
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

    log('8/9: Preparing for final render with Remotion...');
    const template = getTemplateById(templateId);
    if (!template) throw new Error(`Template with ID ${templateId} not found.`);
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);

    const toAbsoluteUrl = (url: string) => {
        if (!url || url.startsWith('blob:')) return '';
        if (url.startsWith('http')) return url;
        if (url.startsWith('b-roll/')) return `${EXTERNAL_API_BASE_URL}/api/serve-broll/${url.replace('b-roll/', '')}`;
        return `${EXTERNAL_API_BASE_URL}${url}`;
    };

    const getOrderedAssets = (ordered: any[] | undefined, fallback: string[] | undefined) => {
        if (ordered && ordered.length > 0) {
            return ordered.sort((a, b) => a.order - b.order).map(asset => asset.url).map(toAbsoluteUrl).filter(Boolean);
        }
        return (fallback || []).map(toAbsoluteUrl).filter(Boolean);
    };

    const remotionAdData = { ...adData,
        selectedImages: getOrderedAssets(adData.orderedImages, adData.selectedImages),
        selectedVideos: getOrderedAssets(adData.orderedVideos, adData.selectedVideos),
        selectedBRoll: getOrderedAssets(adData.orderedBRoll, adData.selectedBRoll),
        wordTimings: wordTimings,
    };

    const inputProps = {
        adData: remotionAdData,
        timeline: concreteTimeline,
        audioUrl: toAbsoluteUrl(audioUrl),
        processedAvatarUrl: toAbsoluteUrl(localLipSyncedVideoUrl),
        greenscreenAvatarUrl: toAbsoluteUrl(transparentAvatarUrl),
        oneWordAtATime: adData.oneWordAtATime,
        fontSize: adData.fontSize,
        subtitlePosition: adData.subtitlePosition,
        textColor: adData.textColor,
        fontWeight: adData.fontWeight,
        outlineWidth: adData.outlineWidth,
        outlineColor: adData.outlineColor,
        shadowOffsetX: adData.shadowOffsetX,
        shadowOffsetY: adData.shadowOffsetY,
        shadowBlur: adData.shadowBlur,
        shadowColor: adData.shadowColor,
        letterSpacing: adData.letterSpacing,
        textTransform: adData.textTransform,
    };
    
    const bundleLocation = await bundle({ entryPoint: path.resolve('./remotion/index.ts'), webpackOverride: getGPUWebpackConfig(true), publicDir: path.resolve('./public-minimal') });

    try {
        log('Step 8/9: Rendering primary format video (9:16)...');
        const comp916 = await selectComposition({ serveUrl: bundleLocation, id: 'Main', inputProps });
        comp916.durationInFrames = totalDurationInFrames;
        const out916 = `final-ad-${adId}-9x16.mp4`;
        const path916 = path.resolve(`./public/renders/${out916}`);
        await renderMedia({ composition: comp916, serveUrl: bundleLocation, codec: 'h264', outputLocation: path916, inputProps });
        const finalUrl916 = `/renders/${out916}`;

        await prisma.ad.update({ where: { id: adId }, data: {
                finalVideoUrl: finalUrl916,
                status: adData.enableDualFormat ? 'RENDERING' : 'COMPLETED',
        }});
        log('✅ Successfully rendered 9:16 format.');
    } catch (err: any) {
        log(`❌ Error rendering 9:16 video. Job failed.`, err.message);
        await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
        return;
    }

    if (adData.enableDualFormat) {
        try {
            log('Step 8.5/9: Rendering secondary format video (4:5)...');
            const comp45 = await selectComposition({ serveUrl: bundleLocation, id: 'Main4x5', inputProps });
            comp45.durationInFrames = totalDurationInFrames;
            const out45 = `final-ad-${adId}-4x5.mp4`;
            const path45 = path.resolve(`./public/renders/${out45}`);
            await renderMedia({ composition: comp45, serveUrl: bundleLocation, codec: 'h264', outputLocation: path45, inputProps });
            const finalUrl45 = `/renders/${out45}`;
            
            await prisma.ad.update({ where: { id: adId }, data: {
                    finalVideoUrl4x5: finalUrl45,
                    status: 'COMPLETED'
            }});
            log('✅ Successfully rendered 4:5 format.');
        } catch (err: any) {
            log(`❌ Error rendering 4:5 video. Job will be marked as FAILED.`, err.message);
            await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
        }
    }
    log('✅ Render job finished successfully!');
}

const redisConnection = { host: process.env.REDIS_HOST || '127.0.0.1', port: parseInt(process.env.REDIS_PORT || '6379', 10) };
const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-staging';
const worker = new Worker(queueName, async job => {
  if (!job) return;
  const { adId, templateId } = job.data;
  console.log(`[RenderWorker] Picked up job: ${job.id} for ad: ${adId}`);
  try {
    await processRenderJob(adId, templateId);
  } catch (error: any) {
    console.error(`[RenderWorker] Job ${job.id} for ad ${adId} FAILED in top-level catch:`, error.message, error.stack);
    await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } }).catch(e => console.error(`CRITICAL: Failed to update status for ad ${adId}`, e));
    throw error;
  }
}, { connection: redisConnection, concurrency: 1 });

console.log(`[RenderWorker] Worker is listening for jobs on the "${queueName}" queue.`);
worker.on('failed', (job, err) => {
  if (job) console.error(`[RenderWorker] Job ${job.id} (${job.data.adId}) has failed: ${err.message}`);
  else console.error(`[RenderWorker] An unknown job has failed: ${err.message}`);
});

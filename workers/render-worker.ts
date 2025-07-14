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

async function generateTts(text: string, language: string): Promise<string> {
  const response = await api.post('/api/tts/elevenlabs', { text, language });
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
    const log = (message: string) => console.log(`[Job ${adId}] ${message}`);
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
        script: adRecord.script ?? undefined,
        language: adRecord.language ?? undefined,
        avatarId: adRecord.avatarId ? parseInt(adRecord.avatarId, 10) : undefined,
        templateId: adRecord.templateId ?? undefined,
    };

    log('2/9: Checking for existing audio or generating new TTS...');
    let audioUrl: string;
    if (adData.audioUrl) {
      log('Using existing audio from preview');
      audioUrl = adData.audioUrl;
    } else {
      log('Generating new TTS audio...');
      audioUrl = await generateTts(adData.script!, adData.language!);
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

    log('8/9: Rendering final video with Remotion...');
    const template = getTemplateById(templateId);
    if (!template) throw new Error(`Template with ID ${templateId} not found.`);
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);

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
    
    const inputProps = {
        adData: remotionAdData,
        timeline: concreteTimeline,
        audioUrl: toAbsoluteUrl(localLipSyncedVideoUrl),
        processedAvatarUrl: toAbsoluteUrl(localLipSyncedVideoUrl),
        greenscreenAvatarUrl: toAbsoluteUrl(transparentAvatarUrl),
    };

    // ✅ THIS IS THE CORRECTED LINE
    log(`Passing these props to Remotion: ${JSON.stringify(inputProps, null, 2)}`);
    
    const bundleLocation = await bundle({ entryPoint: path.resolve('./remotion/index.ts'), webpackOverride: (config) => config });
    const composition = await selectComposition({ serveUrl: bundleLocation, id: 'Main', inputProps });
    composition.durationInFrames = totalDurationInFrames;

    const outputFilename = `final-ad-${adId}.mp4`;
    const outputPath = path.resolve(`./public/renders/${outputFilename}`);
    
    await renderMedia({ composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: outputPath, inputProps });
    const finalVideoUrl = `/renders/${outputFilename}`;

    log('9/9: Finalizing and updating database...');
    await prisma.ad.update({
        where: { id: adId },
        data: { finalVideoUrl: finalVideoUrl, status: 'COMPLETED' },
    });

    log('✅ Render job finished successfully!');
}

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const worker = new Worker('render-video', async job => {
  const { adId, templateId } = job.data;
  console.log(`[RenderWorker] Picked up job: ${job.id} for ad: ${adId}`);
  
  try {
    await processRenderJob(adId, templateId);
  } catch (error: any) {
    console.error(`[RenderWorker] Job ${job.id} for ad ${adId} FAILED:`, error.message, error.stack);
    await prisma.ad.update({
      where: { id: adId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}, { connection: redisConnection, concurrency: 1 });

console.log('[RenderWorker] Worker is listening for jobs on the "render-video" queue.');

worker.on('failed', (job, err) => {
  console.error(`[RenderWorker] Job ${job?.id} has failed with error: ${err.message}`);
});

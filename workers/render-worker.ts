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

// --- Configuration ---
const prisma = new PrismaClient();
const INTERNAL_API_BASE_URL = '***REMOVED***';
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// The entire render pipeline, now as a self-contained function
async function processRenderJob(adId: string, templateId: string): Promise<void> {
    const log = (message: string) => console.log(`[Job ${adId}] ${message}`);

    log('🚀 Starting render job...');
    
    // STEP 1: Get Ad Data & Update Status
    log('1/9: Fetching ad data from database...');
    const adRecord = await prisma.ad.findUnique({ where: { id: adId } });
    if (!adRecord) throw new Error(`Ad with ID ${adId} not found.`);
    await prisma.ad.update({ where: { id: adId }, data: { status: 'RENDERING' } });

    const adData: AdCreationData = {
        // ... (This part is identical to your inngest function)
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

    // STEP 2: Generate TTS Audio
    log('2/9: Generating TTS audio...');
    const ttsResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/tts/elevenlabs`, { text: adData.script, language: adData.language });
    const audioUrl = ttsResponse.data.audioUrl as string;

    // STEP 3: Start Lip-Sync Job
    log('3/9: Starting lip-sync job...');
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) throw new Error(`Avatar with ID ${adData.avatarId} not found.`);
    const syncLabsResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs`, {
        videoUrl: `${EXTERNAL_API_BASE_URL}${avatar.src}`,
        audioUrl: `${EXTERNAL_API_BASE_URL}${audioUrl}`,
    });
    const syncLabsJobId = syncLabsResponse.data.jobId as string;
    await prisma.ad.update({ where: { id: adId }, data: { syncLabsJobId } });
    
    // STEP 4: Poll for Lip-Sync Completion
    log('4/9: Waiting for lip-sync to complete...');
    let lipSyncedVideoUrl = '';
    for (let i = 0; i < 15; i++) { // Poll for up to 7.5 minutes
        await new Promise(resolve => setTimeout(resolve, 30000)); // wait 30s
        const statusRes = await axios.get(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs?jobId=${syncLabsJobId}`);
        log(`   - Lip-sync status: ${statusRes.data.status}`);
        if (statusRes.data.status === 'COMPLETED') {
            lipSyncedVideoUrl = statusRes.data.lipSyncedVideoUrl;
            break;
        }
        if (statusRes.data.status === 'FAILED') {
            throw new Error('Lip-sync job failed.');
        }
    }
    if (!lipSyncedVideoUrl) throw new Error('Lip-sync job timed out.');
    
    // STEP 5: Download SyncLabs video locally
    log('5/9: Downloading processed video...');
    const videoId = lipSyncedVideoUrl.match(/generations\/([^\/]+)/)?.[1] || 'unknown';
    const filename = `synclabs-${videoId}.mp4`;
    const localPath = path.join(process.cwd(), 'public', 'synclabs', filename);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const downloadResponse = await axios.get(lipSyncedVideoUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(localPath, downloadResponse.data);
    const localLipSyncedVideoUrl = `/synclabs/${filename}`;

    // STEP 6: Remove Background
    log('6/9: Removing video background...');
    const bgRemovalResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/remove-background`, { localVideoPath: localLipSyncedVideoUrl });
    const transparentAvatarUrl = bgRemovalResponse.data.cutoutVideoUrl;

    // STEP 7: Get Video Duration
    log('7/9: Getting video duration...');
    const durationResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/get-duration`, { filePath: localLipSyncedVideoUrl });
    const durationInSeconds = durationResponse.data.durationInSeconds as number;
    const totalDurationInFrames = Math.round(durationInSeconds * COMPOSITION_FPS);

    // STEP 8: Generate Timeline & Render
    log('8/9: Rendering final video with Remotion...');
    const template = getTemplateById(templateId);
    if (!template) throw new Error(`Template with ID ${templateId} not found.`);
    const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);
    const inputProps = {
        adData: adData,
        timeline: concreteTimeline,
        audioUrl: localLipSyncedVideoUrl,
        processedAvatarUrl: localLipSyncedVideoUrl,
        greenscreenAvatarUrl: transparentAvatarUrl,
    };
    const remotionResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/render/remotion`, {
        compositionId: 'Main',
        inputProps,
    });
    const finalVideoUrl = remotionResponse.data.videoUrl as string;

    // STEP 9: Update Database
    log('9/9: Finalizing and updating database...');
    await prisma.ad.update({
        where: { id: adId },
        data: { finalVideoUrl: finalVideoUrl, status: 'COMPLETED' },
    });

    log('✅ Render job finished successfully!');
}


// --- The BullMQ Worker Definition ---
const worker = new Worker('render-video', async job => {
  const { adId, templateId } = job.data;
  console.log(`[RenderWorker] Picked up job: ${job.id} for ad: ${adId}`);
  
  try {
    await processRenderJob(adId, templateId);
  } catch (error: any) {
    console.error(`[RenderWorker] Job ${job.id} for ad ${adId} FAILED:`, error.message);
    // Update the ad status to FAILED in the database
    await prisma.ad.update({
      where: { id: adId },
      data: { status: 'FAILED' },
    });
    // Rethrow the error so BullMQ knows the job failed and can retry if configured
    throw error;
  }
}, { connection: redisConnection, concurrency: 2 }); // Process up to 2 jobs at a time

console.log('[RenderWorker] Worker is listening for jobs on the "render-video" queue.');

worker.on('failed', (job, err) => {
  console.error(`[RenderWorker] Job ${job?.id} has failed with error: ${err.message}`);
});

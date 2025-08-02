
// lib/render-video-core.ts
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { getTemplateById } from './templates';
import { generateConcreteTimeline } from './timeline-generator';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { avatars } from './avatars';
import { COMPOSITION_FPS } from '../remotion/constants';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getProductionGPUConfig, getGPUWebpackConfig, createPerformanceMonitor } from './gpu-config';

const prisma = new PrismaClient();
const INTERNAL_API_BASE_URL = '***REMOVED***';
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';

// This is the refactored core logic from the Inngest function
export async function performRender(jobData: { adId: string; templateId: string; userId: string }) {
  const { adId, templateId } = jobData;
  console.log(`[worker] Starting render for adId: ${adId}`);

  // STEP 1: Get Ad Data
  console.log('[worker] STEP 1: Get Ad Data');
  const adRecord = await prisma.ad.findUnique({ where: { id: adId } });
  if (!adRecord) throw new Error(`Ad with ID ${adId} not found.`);
  await prisma.ad.update({ where: { id: adId }, data: { status: 'RENDERING' } });

  const adData: AdCreationData = {
    productUrl: adRecord.productUrl ?? undefined,
    summary: adRecord.summary ?? undefined,
    brandName: adRecord.brandName ?? undefined,
    logoUrl: adRecord.logoUrl ?? undefined,
    description: adRecord.description ?? undefined,
    selectedImages: JSON.parse(adRecord.selectedImages || '[]'),
    selectedVideos: JSON.parse(adRecord.selectedVideos || '[]'),
    orderedImages: JSON.parse(adRecord.orderedImages || '[]'),
    orderedVideos: JSON.parse(adRecord.orderedVideos || '[]'),
    showPromo: adRecord.showPromo ?? undefined,
    originalPrice: adRecord.originalPrice ?? undefined,
    promoPrice: adRecord.promoPrice ?? undefined,
    promoDetails: adRecord.promoDetails ?? undefined,
    format: adRecord.format ?? undefined,
    duration: adRecord.duration ?? undefined,
    language: adRecord.language ?? undefined,
    audience: adRecord.audience ?? undefined,
    script: adRecord.script ?? undefined,
    avatarId: adRecord.avatarId ? parseInt(adRecord.avatarId, 10) : undefined,
    templateId: adRecord.templateId ?? undefined,
    backgroundMusicUrl: adRecord.backgroundMusicUrl ?? undefined,
    backgroundMusicVolume: adRecord.backgroundMusicVolume ?? undefined,
  };

  // STEP 2: Generate TTS Audio with timestamps
  console.log('[worker] STEP 2: Generate TTS Audio with timestamps');
  
  const selectedGender = adData.avatarId ? 
    (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') : 
    'female';
  
  console.log(`[RenderWorker] AvatarId: ${adData.avatarId}, Gender: ${selectedGender}, Type: ${typeof adData.avatarId}`);
  
  const ttsResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/tts/elevenlabs`, {
    text: adData.script,
    language: adData.language,
    gender: selectedGender,
    avatarId: adData.avatarId,
    withTimestamps: true,
  }, {
    timeout: 60000,
    headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
  });
  const audioUrl = ttsResponse.data.audioUrl as string;
  const wordTimings = ttsResponse.data.wordTimings || [];

  // STEP 3: Start the Lip-Sync Job
  console.log('[worker] STEP 3: Start Lip-Sync Job');
  let syncLabsJobId = adRecord.syncLabsJobId;
  if (syncLabsJobId) {
    console.log(`[worker] Found existing SyncLabs job: ${syncLabsJobId}, checking status...`);
    try {
      const existingJobResponse = await axios.get(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs?jobId=${syncLabsJobId}`, {
        timeout: 15000,
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
      });
      if (existingJobResponse.data.status === 'COMPLETED') {
        console.log(`[worker] Reusing existing completed SyncLabs job: ${syncLabsJobId}`);
      } else {
        syncLabsJobId = null; // Reset to create a new one
      }
    } catch (error) {
      console.log(`[worker] Could not check existing job status, creating new job...`);
      syncLabsJobId = null;
    }
  }

  if (!syncLabsJobId) {
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) throw new Error(`Avatar with ID ${adData.avatarId} not found.`);
    console.log(`[worker] Creating new SyncLabs job...`);
    const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs`, {
      videoUrl: `${EXTERNAL_API_BASE_URL}${avatar.src}`,
      audioUrl: `${EXTERNAL_API_BASE_URL}${audioUrl}`,
    }, {
      timeout: 30000,
      headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
    });
    syncLabsJobId = response.data.jobId as string;
    await prisma.ad.update({ where: { id: adId }, data: { syncLabsJobId } });
  }

  // STEP 4: Wait for Lip-Sync to Complete
  console.log('[worker] STEP 4: Poll for Lip-Sync completion');
  let lipSyncedVideoUrl;
  let attempts = 0;
  const maxAttempts = 8;
  while (attempts < maxAttempts) {
    try {
      const waitTime = attempts === 0 ? 15 : (attempts <= 2 ? 30 : (attempts <= 4 ? 60 : 90));
      console.log(`[worker] ⏱️ Waiting ${waitTime}s before attempt ${attempts + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

      const response = await axios.get(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs?jobId=${syncLabsJobId}`, {
        timeout: 15000,
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
      });
      const status = response.data.status;
      console.log(`[worker] 🔍 Attempt ${attempts + 1}/${maxAttempts}: Lip-sync job ${syncLabsJobId} status: ${status}`);

      if (status === 'COMPLETED') {
        lipSyncedVideoUrl = response.data.lipSyncedVideoUrl;
        break;
      }
      if (status === 'FAILED') throw new Error(`Lip-sync job ${syncLabsJobId} failed. Error: ${response.data.error}`);
      attempts++;
    } catch (error: any) {
      if (error.message.includes('failed')) throw error;
      console.warn(`[worker] ⚠️ Polling attempt ${attempts + 1} failed: ${error.message}, retrying...`);
      attempts++;
    }
  }
  if (!lipSyncedVideoUrl) {
      console.warn(`[worker] ⏰ Timeout: Lip-sync job did not complete. Falling back to original video.`);
      const avatar = avatars.find((a) => a.id === adData.avatarId);
      lipSyncedVideoUrl = avatar ? avatar.src : "/avatars/female-blonde2-adult-inside.mp4";
  }

  // STEP 5: Download SyncLabs video locally
  console.log('[worker] STEP 5: Download SyncLabs video');
  let localLipSyncedVideoUrl = lipSyncedVideoUrl;
  if (lipSyncedVideoUrl.includes('api.sync.so')) {
      const response = await axios.get(lipSyncedVideoUrl, { responseType: 'arraybuffer', timeout: 60000 });
      const videoId = lipSyncedVideoUrl.match(/generations\/([^\/]+)/)?.[1] || 'unknown';
      const filename = `synclabs-${videoId}.mp4`;
      const localPath = path.join(process.cwd(), 'public', 'synclabs', filename);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, response.data);
      localLipSyncedVideoUrl = `/synclabs/${filename}`;
      console.log(`[worker] ✅ SyncLabs video downloaded to: ${localLipSyncedVideoUrl}`);
  }

  // STEP 6: Remove Background
  console.log('[worker] STEP 6: Remove video background');
  let transparentAvatarUrl = localLipSyncedVideoUrl;
  try {
      const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/remove-background`, 
        { localVideoPath: localLipSyncedVideoUrl }, 
        { headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }, timeout: 3600000 }
      );
      transparentAvatarUrl = response.data.cutoutVideoUrl;
      console.log(`[worker] ✅ Background removal completed: ${transparentAvatarUrl}`);
  } catch (error: any) {
      console.warn(`[worker] ⚠️ Background removal failed, using non-transparent video as fallback: ${error.message}`);
  }

  // STEP 7: Get Video Duration
  console.log('[worker] STEP 7: Get video duration');
  const durationResponse = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/get-duration`, 
    { filePath: localLipSyncedVideoUrl }, 
    { timeout: 30000, headers: { 'x-test-secret': process.env.TEST_SECRET_KEY } }
  );
  const durationInSeconds = durationResponse.data.durationInSeconds as number;
  const totalDurationInFrames = Math.round(durationInSeconds * COMPOSITION_FPS);
  console.log(`[worker] 🎞️ Video duration: ${durationInSeconds}s`);

  // STEP 8: Generate Concrete Timeline
  console.log('[worker] STEP 8: Generate concrete timeline');
  const template = getTemplateById(templateId);
  if (!template) throw new Error(`Template with ID ${templateId} not found.`);
  const concreteTimeline = generateConcreteTimeline(template.timeline, totalDurationInFrames);

  // STEP 9: Render the Final Video
  console.log('[worker] STEP 9: Render final video with Remotion');
  const convertToLocalUrl = (url: string) => url.startsWith('http') ? new URL(url).pathname : url;
  const inputProps = {
    adData: {
      ...adData,
      wordTimings: wordTimings
    },
    timeline: concreteTimeline,
    audioUrl: convertToLocalUrl(localLipSyncedVideoUrl),
    processedAvatarUrl: convertToLocalUrl(localLipSyncedVideoUrl),
    greenscreenAvatarUrl: convertToLocalUrl(transparentAvatarUrl),
  };

  // Initialize performance monitoring
  const perfMonitor = createPerformanceMonitor();
  
  console.log('📦 Bundling Remotion project with GPU optimizations...');
  perfMonitor.logPerformance('Bundle Start');
  
  let bundleLocation: string | null = null;
  try {
    bundleLocation = await bundle({
      entryPoint: path.resolve('./remotion/index.ts'),
      webpackOverride: getGPUWebpackConfig(true) // Production mode
    });
    
    perfMonitor.logPerformance('Bundle Complete');
    console.log('✅ GPU-optimized bundle created.');

    // Get production GPU configuration
    const gpuConfig = getProductionGPUConfig();

    console.log('🔍 Selecting composition with GPU acceleration...');
    perfMonitor.logPerformance('Composition Selection Start');
    
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'Main',
      inputProps,
      timeoutInMilliseconds: 180000,
      chromiumOptions: gpuConfig.chromiumOptions,
    });
    
    perfMonitor.logPerformance('Composition Selection Complete');
    console.log('✅ GPU-accelerated composition selected.');

    composition.durationInFrames = totalDurationInFrames;
    console.log(`⏱️  Dynamic duration calculated from timeline: ${totalDurationInFrames} frames`);

    const outputFilename = `final-ad-${adId}.mp4`;
    const outputPath = path.resolve(`./public/renders/${outputFilename}`);
    
    console.log(`🎞️  Starting GPU-accelerated render to: ${outputPath}`);
    perfMonitor.logPerformance('Render Start');
    
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      timeoutInMilliseconds: 1800000,
      chromiumOptions: gpuConfig.chromiumOptions,
    });

    perfMonitor.logPerformance('Render Complete');
    
    // Get final file stats
    const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    const fileSizeMB = stats ? (stats.size / 1024 / 1024).toFixed(2) : 'Unknown';
    
    console.log(`✅ GPU-accelerated render completed in ${perfMonitor.getElapsedTime()}s, size: ${fileSizeMB}MB`);

    const finalVideoUrl = `/renders/${outputFilename}`;
    console.log('✅ Render finished. Final video URL:', finalVideoUrl);

    // STEP 10: Update Database
    console.log('[worker] STEP 10: Update database');
    await prisma.ad.update({
      where: { id: adId },
      data: { finalVideoUrl, status: 'COMPLETED' },
    });

    console.log(`[worker] ✅ Successfully rendered video for ad ${adId}: ${finalVideoUrl}`);
    return { finalVideoUrl, adId };
  } finally {
    if (bundleLocation) {
      console.log(`[worker] Cleaning up bundle location: ${bundleLocation}`);
      try {
        fs.rmSync(bundleLocation, { recursive: true, force: true });
        console.log(`[worker] ✅ Successfully cleaned up bundle.`);
      } catch (err) {
        console.error(`[worker] ⚠️ Failed to clean up bundle:`, err);
      }
    }
  }
}

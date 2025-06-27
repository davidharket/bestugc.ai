// inngest/render-video.ts
import { inngest } from './client';
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { getTemplateById } from '../lib/templates';
import { generateConcreteTimeline } from '../lib/timeline-generator';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { avatars } from '../lib/avatars';
import { COMPOSITION_FPS } from '../remotion/constants'; // <-- Import the constant

const prisma = new PrismaClient();
const INTERNAL_API_BASE_URL = '***REMOVED***';
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';
// const FPS = 24; // This line is removed and replaced by the import above.

export const renderVideoJob = inngest.createFunction(
  {
    id: 'render-video-dynamically-v7-final-arch', // Final architecture version
    concurrency: { limit: 2, key: 'event.data.adId' },
    retries: 2,
  },
  { event: 'ad/render.requested' },
  async ({ event, step }) => {
    const { adId, templateId } = event.data;

    // STEP 1: Get Ad Data
    const adRecord = await step.run('get-ad-data-from-db', async () => {
      const record = await prisma.ad.findUnique({ where: { id: adId } });
      if (!record) throw new Error(`Ad with ID ${adId} not found.`);
      await prisma.ad.update({ where: { id: adId }, data: { status: 'RENDERING' } });
      return record;
    });

    const adData: AdCreationData = {
      productUrl: adRecord.productUrl ?? undefined,
      summary: adRecord.summary ?? undefined,
      brandName: adRecord.brandName ?? undefined,
      logoUrl: adRecord.logoUrl ?? undefined,
      description: adRecord.description ?? undefined,
      selectedImages: JSON.parse(adRecord.selectedImages || '[]'),
      selectedVideos: JSON.parse(adRecord.selectedVideos || '[]'),
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
    };

    // STEP 2: Generate TTS Audio
    const { audioUrl } = await step.run('generate-tts-audio', async () => {
      const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/tts/elevenlabs`, {
        text: adData.script,
        language: adData.language,
      }, {
        timeout: 60000, // 1 minute timeout for TTS
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
      });
      return { audioUrl: response.data.audioUrl as string };
    });

    // STEP 3: Start the Lip-Sync Job (or reuse existing)
    const { syncLabsJobId } = await step.run('start-lipsync-job', async () => {
      // 💰 COST OPTIMIZATION: Check if we already have a completed SyncLabs job
      if (adRecord.syncLabsJobId) {
        console.log(`💰 Found existing SyncLabs job: ${adRecord.syncLabsJobId}, checking status...`);
        
        try {
          const existingJobResponse = await axios.get(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs?jobId=${adRecord.syncLabsJobId}`, {
            timeout: 15000,
            headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
          });
          
          if (existingJobResponse.data.status === 'COMPLETED') {
            console.log(`✅ Reusing existing completed SyncLabs job: ${adRecord.syncLabsJobId}`);
            return { syncLabsJobId: adRecord.syncLabsJobId };
          } else {
            console.log(`⚠️ Existing job status: ${existingJobResponse.data.status}, creating new job...`);
          }
        } catch (error) {
          console.log(`⚠️ Could not check existing job status, creating new job...`);
        }
      }

      // Create new SyncLabs job
      const avatar = avatars.find((a) => a.id === adData.avatarId);
      if (!avatar) throw new Error(`Avatar with ID ${adData.avatarId} not found.`);
      
      console.log(`💰 Creating new SyncLabs job (this costs money!)...`);
      const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs`, {
        videoUrl: `${EXTERNAL_API_BASE_URL}${avatar.src}`,
        audioUrl: `${EXTERNAL_API_BASE_URL}${audioUrl}`,
      }, {
        timeout: 30000, // 30 second timeout for starting lip-sync
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
      });
      
      await prisma.ad.update({ where: { id: adId }, data: { syncLabsJobId: response.data.jobId } });
      return { syncLabsJobId: response.data.jobId as string };
    });

    // STEP 4: Wait for Lip-Sync to Complete with proper retry logic
    const lipSyncedVideoUrl = await step.run('poll-lipsync-with-retries', async () => {
      let attempts = 0;
      const maxAttempts = 8;
      
      while (attempts < maxAttempts) {
        try {
          let waitTime = 15;
          if (attempts > 0) {
            waitTime = attempts <= 2 ? 30 : attempts <= 4 ? 60 : 90;
            console.log(`⏱️ Waiting ${waitTime}s before attempt ${attempts + 1}/${maxAttempts}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          }
          
          const response = await axios.get(`${INTERNAL_API_BASE_URL}/api/lipsync/synclabs?jobId=${syncLabsJobId}`, {
            timeout: 15000,
            headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
          });
          const status = response.data.status;
          
          console.log(`🔍 Attempt ${attempts + 1}/${maxAttempts}: Lip-sync job ${syncLabsJobId} status: ${status}`);

          if (status === 'COMPLETED') {
            console.log(`✅ Lip-sync completed! Video URL: ${response.data.lipSyncedVideoUrl}`);
            return response.data.lipSyncedVideoUrl;
          }
          
          if (status === 'FAILED') {
            throw new Error(`Lip-sync job ${syncLabsJobId} failed. Error: ${response.data.error}`);
          }
          
          console.log(`⏳ Still ${status}, will retry...`);
          attempts++;
          
        } catch (error: any) {
          if (error.message.includes('failed')) {
            throw error;
          }
          if (error.code === 'ECONNREFUSED' || 
              error.code === 'ERR_BAD_REQUEST' || 
              error.response?.status === 404 || 
              error.response?.status === 503 ||
              error.message.includes('ENOTFOUND') ||
              error.message.includes('timeout')) {
            console.warn(`🌐 Network error on attempt ${attempts + 1}: ${error.message}, retrying...`);
          } else {
            console.warn(`⚠️ Polling attempt ${attempts + 1} failed: ${error.message}, retrying...`);
          }
          attempts++;
        }
      }
      
      console.warn(`⏰ Timeout: Lip-sync job ${syncLabsJobId} still processing after ${maxAttempts} attempts, using original video as fallback`);
      const avatar = avatars.find((a) => a.id === adData.avatarId);
      return avatar ? avatar.src : "/avatars/female-blonde2-adult-inside.mp4";
    });
    
    // STEP 5: Download SyncLabs video locally (before background removal)
    const { localLipSyncedVideoUrl } = await step.run('download-synclabs-video', async () => {
      if (!lipSyncedVideoUrl.includes('api.sync.so')) {
        console.log(`✅ Video already local: ${lipSyncedVideoUrl}`);
        return { localLipSyncedVideoUrl: lipSyncedVideoUrl };
      }

      console.log(`📥 Downloading SyncLabs video locally: ${lipSyncedVideoUrl}`);
      try {
        const response = await axios.get(lipSyncedVideoUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        const videoId = lipSyncedVideoUrl.match(/generations\/([^\/]+)/)?.[1] || 'unknown';
        const filename = `synclabs-${videoId}.mp4`;
        const localPath = path.join(process.cwd(), 'public', 'synclabs', filename);
        
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(localPath, response.data);
        
        const relativePath = `/synclabs/${filename}`;
        console.log(`✅ SyncLabs video downloaded locally: ${relativePath}`);
        return { localLipSyncedVideoUrl: relativePath };
        
      } catch (error: any) {
        console.warn(`⚠️ Failed to download SyncLabs video: ${error.message}`);
        console.log(`🔄 Falling back to original avatar video`);
        const avatar = avatars.find((a) => a.id === adData.avatarId);
        return { localLipSyncedVideoUrl: avatar ? avatar.src : "/avatars/female-blonde2-adult-inside.mp4" };
      }
    });

    // STEP 6: Remove Background (using local file for consistency)
    const { transparentAvatarUrl } = await step.run('remove-video-background', async () => {
      console.log(`🎭 Starting background removal (CPU mode - up to 60min)`);
      try {
        const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/remove-background`, { 
          localVideoPath: localLipSyncedVideoUrl 
        }, {
          headers: { 'x-test-secret': process.env.TEST_SECRET_KEY },
          timeout: 3600000
        });
        console.log(`✅ Background removal completed: ${response.data.cutoutVideoUrl}`);
        return { transparentAvatarUrl: response.data.cutoutVideoUrl };
      } catch (error: any) {
        console.warn(`⚠️ Background removal failed, using local lipsynced video as fallback: ${error.message}`);
        console.log(`🔄 Fallback: Using local lipsynced video ${localLipSyncedVideoUrl} instead of background-removed version`);
        return { transparentAvatarUrl: localLipSyncedVideoUrl };
      }
    });
    
    // STEP 7: Get Video Duration (use lip-sync video duration as master timeline!)
    const { durationInSeconds } = await step.run('get-video-duration', async () => {
      const response = await axios.post(`${INTERNAL_API_BASE_URL}/api/video/get-duration`, {
        filePath: localLipSyncedVideoUrl,  // Use the lip-sync video duration as master
      }, {
        timeout: 30000,
        headers: { 'x-test-secret': process.env.TEST_SECRET_KEY }
      });
      console.log(`🎞️ Using LIP-SYNC VIDEO duration for timeline: ${response.data.durationInSeconds}s`);
      return { durationInSeconds: response.data.durationInSeconds as number };
    });
    const totalDurationInFrames = Math.round(durationInSeconds * COMPOSITION_FPS);

    // STEP 8: Generate Concrete Timeline
    const concreteTimeline = await step.run('generate-concrete-timeline', async () => {
      if (!templateId) throw new Error("A `templateId` must be provided to the render job.");
      const template = getTemplateById(templateId);
      if (!template) throw new Error(`Template with ID ${templateId} not found.`);
      return generateConcreteTimeline(template.timeline, totalDurationInFrames);
    });

    // STEP 9: Render the Final Video
    const { finalVideoUrl } = await step.run('render-final-video', async () => {
      const convertToLocalUrl = (url: string): string => {
        if (!url) {
          console.warn(`⚠️ Empty URL provided to convertToLocalUrl`);
          return '';
        }
        if (url.startsWith('http')) {
          const urlObj = new URL(url);
          console.log(`🔄 Converting external URL for internal processing: ${url} -> ${urlObj.pathname}`);
          return urlObj.pathname;
        }
        console.log(`✅ URL already relative: ${url}`);
        return url;
      };

      const inputProps = {
        adData: adData,
        timeline: concreteTimeline,
        audioUrl: convertToLocalUrl(localLipSyncedVideoUrl), // Use lip-sync video audio as master
        processedAvatarUrl: convertToLocalUrl(localLipSyncedVideoUrl),
        greenscreenAvatarUrl: convertToLocalUrl(transparentAvatarUrl),
      };

      console.log(`🎬 Render input props:`, {
        audioUrl: inputProps.audioUrl,
        processedAvatarUrl: inputProps.processedAvatarUrl,
        greenscreenAvatarUrl: inputProps.greenscreenAvatarUrl,
        masterDuration: `${durationInSeconds}s`,
      });

      const checkForExternalUrls = (props: any) => {
        const externalUrls: string[] = [];
        Object.entries(props).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('http')) {
            externalUrls.push(`${key}: ${value}`);
          }
        });
        if (externalUrls.length > 0) {
          console.error(`❌ CRITICAL: External URLs detected in Remotion props:`, externalUrls);
          throw new Error(`External URLs not allowed in Remotion props: ${externalUrls.join(', ')}`);
        }
      };
      checkForExternalUrls(inputProps);

      const response = await axios.post(
        `${INTERNAL_API_BASE_URL}/api/render/remotion`,
        {
          compositionId: 'Main',
          inputProps: inputProps,
          durationInFrames: totalDurationInFrames,
        },
        {
          headers: { 'x-test-secret': process.env.TEST_SECRET_KEY },
          timeout: 2400000,
        }
      );
      return { finalVideoUrl: response.data.videoUrl as string };
    });

    // STEP 10: Update Database
    await step.run('update-database-with-final-url', async () => {
      try {
        await prisma.ad.update({
          where: { id: adId },
          data: { finalVideoUrl: finalVideoUrl, status: 'COMPLETED' },
        });
        console.log(`✅ Database updated: Ad ${adId} marked as COMPLETED with video ${finalVideoUrl}`);
      } catch (dbError: any) {
        console.error(`❌ Database update failed: ${dbError.message}`);
        console.log(`⚠️ Render completed successfully but database update failed. Manual fix required.`);
        console.log(`📹 Video file: ${finalVideoUrl}`);
        console.log(`🆔 Ad ID: ${adId}`);
      }
    });

    console.log(`✅ [Production Pipeline] Successfully rendered video for ad ${adId}`);
    return { finalVideoUrl, adId };
  }
);

export default [renderVideoJob];
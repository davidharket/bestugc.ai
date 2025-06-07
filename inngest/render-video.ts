// inngest/render-video.ts
import { inngest } from './client';
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { generateDynamicTimeline } from '../lib/dynamic-template-generator';
import axios from 'axios';
import { avatars } from '../pages/ad/avatar';

const prisma = new PrismaClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***';

// A helper to get audio duration. This is tricky on the server.
// A more robust solution might use a library like `music-metadata`.
// For now, we will estimate or pass it from the TTS API if possible.
const estimateAudioDuration = (text: string): number => {
    const wordsPerSecond = 2.5;
    const words = text.split(/\s+/).length;
    return words / wordsPerSecond;
};

export const renderVideoJob = inngest.createFunction(
  { id: 'render-dynamic-video-job', name: 'Render Dynamic Video Job' },
  { event: 'ad/render.requested' },
  async ({ event, step }) => {
    const { adId, adData } = event.data as { adId: string, adData: AdCreationData };

    await step.run('update-status-to-rendering', async () => {
      await prisma.ad.update({
        where: { id: adId },
        data: { status: 'RENDERING' },
      });
    });

    // --- 1. Generate Full Audio & Lip-Sync ---
    const lipSyncedVideoUrl = await step.run('generate-and-lipsync-avatar', async () => {
      if (!adData.script) throw new Error('Full script is missing from adData.');

      const ttsResponse = await axios.post(`${APP_URL}/api/tts/elevenlabs`, { text: adData.script });
      const ttsAudioUrl = ttsResponse.data.audioUrl;
      
      const avatarInfo = avatars.find((a: any) => a.id === adData.avatarId);
      if (!avatarInfo) throw new Error(`Avatar with id ${adData.avatarId} not found.`);
      const originalAvatarVideoUrl = `${APP_URL}${avatarInfo.src}`;
      
      const lipSyncResponse = await axios.post(`${APP_URL}/api/lipsync/synclabs`, {
        audioUrl: ttsAudioUrl,
        videoUrl: originalAvatarVideoUrl,
      });
      
      return lipSyncResponse.data.lipSyncedVideoUrl;
    });

    // --- 2. Remove Background from Lip-Synced Video ---
    const cutoutAvatarUrl = await step.run('remove-video-background', async () => {
      const response = await axios.post(`${APP_URL}/api/video/remove-background`, {
        videoUrl: lipSyncedVideoUrl,
      });
      return response.data.cutoutVideoUrl;
    });

    // --- 3. Generate the Dynamic Timeline ---
    const dynamicTimeline = await step.run('generate-dynamic-timeline', async () => {
      const scriptDuration = estimateAudioDuration(adData.script || '');
      const assets = [...(adData.selectedImages || []), ...(adData.selectedVideos || [])];
      return generateDynamicTimeline(scriptDuration, assets);
    });

    // --- 4. Render Final Video with Dynamic Data ---
    const finalVideoUrl = await step.run('render-final-video', async () => {
      const renderResponse = await axios.post(`${APP_URL}/api/render/remotion`, {
        adId,
        adData,
        // Pass all the URLs and the dynamic timeline
        processedAvatarUrl: lipSyncedVideoUrl, // The one with background
        cutoutAvatarUrl, // The one without
        timeline: dynamicTimeline,
      });
      return renderResponse.data.videoUrl;
    });

    // --- 5. Update Status to Completed ---
    await step.run('update-status-to-completed', async () => {
        await prisma.ad.update({
            where: { id: adId },
            data: { status: 'COMPLETED', finalVideoUrl },
        });
    });

    return { success: true, finalVideoUrl };
  }
);

export default [renderVideoJob];
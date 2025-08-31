// workers/render-worker.ts
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { AdCreationData } from '../components/AdCreationContext';
import { getTemplateById, scaleTemplateForDuration, WeightedScene } from '../lib/templates';
import { generateConcreteTimeline, validateModifiedTimeline } from '../lib/timeline-generator';
import axios from 'axios';
import * as fs from 'fs';
import path from 'path';
import { avatars, getAvatarFps } from '../lib/avatars';
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

async function removeBackground(localVideoPath: string, fps: number = 30): Promise<string> {
    const response = await api.post('/api/video/remove-background', { localVideoPath, fps });
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

    const INTERNAL_RENDER_BASE_URL = INTERNAL_API_URL;

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
        productVideoUrl: adRecord.productVideoUrl ?? undefined,
        productVideoData: adRecord.productVideoData ? JSON.parse(adRecord.productVideoData) : undefined,
        modifiedTimeline: adRecord.modifiedTimeline ? JSON.parse(adRecord.modifiedTimeline) : undefined,
        customFontFamily: adRecord.customFontFamily ?? undefined,
        customFontUrl: adRecord.customFontUrl ?? undefined,
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

    await new Promise(resolve => setTimeout(resolve, 3000));
    log('3/9: Starting lip-sync job...');
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) throw new Error(`Avatar with ID ${adData.avatarId} not found.`);

    let avatarVideoSrc = avatar.src;

    if (adData.productVideoUrl && adData.productVideoUrl.trim() !== '') {
        avatarVideoSrc = adData.productVideoUrl;
        if (avatarVideoSrc.startsWith('/api/serve-video/generated_videos/')) {
            avatarVideoSrc = avatarVideoSrc.replace('/api/serve-video/generated_videos/', '/avatars/');
        }
        log(`Final render: Using concatenated product video for SyncLabs: ${avatarVideoSrc}`);
    } else {
        log(`Final render: Using standard avatar video for SyncLabs: ${avatar.src}`);
    }

    // FINAL SOLUTION: Use local paths that the bundle server can access directly
    const toAbsoluteUrl = (url: string, forSyncLabs = false) => {
        if (!url || url.startsWith('http')) return url;

        // For external services, use the full public URL.
        // For Remotion's internal rendering, use the direct localhost URL.
        const baseUrl = forSyncLabs ? EXTERNAL_API_BASE_URL : INTERNAL_RENDER_BASE_URL; // Should be ***REMOVED*** for Remotion

        if (url.includes('b-roll')) {
            // Extract the last part of the path (the clean filename)
            const filename = path.basename(url);
            // For Remotion bundle server, use path without public/ prefix (staticFile requirement)
            if (!forSyncLabs) {
                const finalUrl = `b-roll/${filename}`;
                console.log(`[URL Cleanup] Normalized b-roll URL from "${url}" to "${finalUrl}" (for bundle server)`);
                return finalUrl;
            } else {
                // For external services, use the full public URL
                const finalUrl = `${baseUrl}/b-roll/${filename}`;
                console.log(`[URL Cleanup] Normalized b-roll URL from "${url}" to "${finalUrl}" (for external service)`);
                return finalUrl;
            }
        }

        let cleanUrl = url;
        // Clean up any residual API paths.
        if (cleanUrl.includes('/api/serve-broll/')) {
            cleanUrl = cleanUrl.replace(/.*\/api\/serve-broll\//, 'b-roll/');
        }
         if (cleanUrl.includes('public/api/serve-broll/')) {
            cleanUrl = cleanUrl.replace(/.*public\/api\/serve-broll\//, 'b-roll/');
        }

        const finalRelativePath = cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl;

        const finalUrl = `${baseUrl}/${finalRelativePath}`;

        return finalUrl;
    };
    // Check if we already have a synclabs output to skip API call
    let localLipSyncedVideoUrl: string;
    let syncJobId: string;

    if (adRecord.lipsyncedAvatarUrl && adRecord.lipsyncedAvatarUrl.trim() !== '') {
        log('4/9: Using existing SyncLabs output, skipping API call...');
        localLipSyncedVideoUrl = adRecord.lipsyncedAvatarUrl;
        syncJobId = adRecord.syncLabsJobId || 'existing';
        log(`Found existing lip-synced video: ${localLipSyncedVideoUrl}`);
    } else {
        log('4/9: Running new SyncLabs job...');
        const absoluteAudioUrl = toAbsoluteUrl(audioUrl, true);
        const absoluteVideoUrl = toAbsoluteUrl(avatarVideoSrc, true);

        const { jobId, finalUrl: lipSyncedVideoUrl } = await runLipSync(absoluteVideoUrl, absoluteAudioUrl);
        syncJobId = jobId;
        await prisma.ad.update({ where: { id: adId }, data: { syncLabsJobId: syncJobId } });

        log('5/9: Downloading processed video...');
        const videoId = lipSyncedVideoUrl.match(/generations\/([^\/]+)/)?.[1] || adId;
        const filename = `synclabs-${videoId}.mp4`;
        const localPath = path.join(process.cwd(), 'public', 'synclabs', filename);
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        const downloadResponse = await axios.get(lipSyncedVideoUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localPath, downloadResponse.data);
        localLipSyncedVideoUrl = `/synclabs/${filename}`;
        log(`Downloaded and saved lip-synced video: ${localLipSyncedVideoUrl}`);
    }

    log('6/9: Detecting actual video framerate...');
    const actualVideoFps = await api.post('/api/video/get-framerate', { filePath: localLipSyncedVideoUrl });
    const videoFps = actualVideoFps.data.framerate || getAvatarFps(adData.avatarId!);
    log(`Detected framerate: ${videoFps} FPS`);

    log('7/9: Removing video background...');
    const transparentAvatarUrl = await removeBackground(localLipSyncedVideoUrl, videoFps);

    log('8/9: Getting video duration...');
    const durationInSeconds = await getDuration(localLipSyncedVideoUrl);
    const totalDurationInFrames = Math.round(durationInSeconds * videoFps);
    log(`Duration: ${durationInSeconds}s = ${totalDurationInFrames} frames`);

    log('9/9: Preparing for final render with Remotion...');
    let timelineToRender: WeightedScene[];
    if (adData.modifiedTimeline && adData.modifiedTimeline.length > 0) {
        log(`Using valid user-modified timeline with ${adData.modifiedTimeline.length} scenes`);
        timelineToRender = adData.modifiedTimeline;
    } else {
        log(`Using default template timeline for templateId: ${templateId}`);
        const baseTemplate = getTemplateById(templateId);
        if (!baseTemplate) throw new Error(`Template with ID ${templateId} not found.`);
        const scaledTemplate = scaleTemplateForDuration(baseTemplate, adData.duration || 30);
        timelineToRender = scaledTemplate.timeline;
    }

    log(`Final timeline has ${timelineToRender.length} scenes`);
    const concreteTimeline = generateConcreteTimeline(timelineToRender, totalDurationInFrames);

    const getOrderedAssetsForRemotion = (ordered?: any[], fallback?: string[]) => {
        const urls = (ordered && ordered.length > 0) ? ordered.map(asset => asset.url) : (fallback || []);
        return urls.map(url => toAbsoluteUrl(url, false)).filter(Boolean);
    };

    // --- START: THE DEFINITIVE FIX - Same as preview-start.ts ---
    // The Remotion component expects `orderedBRoll` (an array of objects with url/order),
    // but the frontend sends `selectedBRoll` (a simple array of URL strings).
    // This code block bridges that gap by creating the `orderedBRoll` structure if it's missing.
    let finalOrderedBRoll = adData.orderedBRoll || [];
    if (!finalOrderedBRoll.length && adData.selectedBRoll?.length) {
        console.log('[Render Worker] `orderedBRoll` is missing. Creating it from `selectedBRoll`.');
        finalOrderedBRoll = adData.selectedBRoll.map((url: string, index: number) => ({
            url: url, // The relative URL string from the original array
            order: index
        }));
    }
    // --- END: THE DEFINITIVE FIX ---

    const remotionAdData = { ...adData,
        selectedImages: getOrderedAssetsForRemotion(adData.orderedImages || [], adData.selectedImages || []),
        selectedVideos: getOrderedAssetsForRemotion(adData.orderedVideos || [], adData.selectedVideos || []),
        selectedBRoll: getOrderedAssetsForRemotion(finalOrderedBRoll, []),
        // CRITICAL: Process the `finalOrderedBRoll` we just created.
        orderedBRoll: finalOrderedBRoll.map((asset: any) => ({
            ...asset,
            url: toAbsoluteUrl(asset.url || '', false)
        })),
        wordTimings: wordTimings,
    };

    const finalProcessedUrl = adData.productVideoUrl && adData.productVideoUrl.trim() !== '' ? localLipSyncedVideoUrl : transparentAvatarUrl;

    const inputProps = {
        adData: remotionAdData,
        timeline: concreteTimeline,
        // Ensure ALL URLs passed to Remotion are absolute URLs to main app
        audioUrl: toAbsoluteUrl(audioUrl, false),
        processedAvatarUrl: toAbsoluteUrl(finalProcessedUrl, false),
        greenscreenAvatarUrl: toAbsoluteUrl(transparentAvatarUrl, false),
        // All new styling props are preserved here
        oneWordAtATime: adData.oneWordAtATime,
        fontSize: adData.fontSize,
        avatarFps: videoFps,
        avatarDuration: durationInSeconds,
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

    log('Using simplified approach: All assets will use absolute URLs to main app');

    // Use standard GPU config without complex port manipulation
    // Since all assets now use absolute URLs pointing to main app, no proxying needed

    delete process.env.REMOTION_RENDERER_PORT;
    delete process.env.REMOTION_WEBPACK_PORT;
    delete process.env.REMOTION_DEV_SERVER_PORT;
    delete process.env.WEBPACK_DEV_SERVER_PORT;
    delete process.env.REMOTION_BUNDLE_SERVER_PORT;

    process.env.REMOTION_RENDERER_PORT = '3000';
    process.env.REMOTION_WEBPACK_PORT = '3000';
    process.env.REMOTION_DEV_SERVER_PORT = '3000';
    process.env.WEBPACK_DEV_SERVER_PORT = '3000';
    process.env.REMOTION_BUNDLE_SERVER_PORT = '3000';
    process.env.PORT = '3000';
    process.env.WEBPACK_DEV_SERVER = 'false';

    let bundleLocation = await bundle({
        entryPoint: path.resolve('./remotion/index.ts'),
        webpackOverride: getGPUWebpackConfig(true), // Use standard GPU config
        publicDir: path.resolve("./public-minimal"),
        enableCaching: false
    });

    // We will also add the bundle location override from the preview file for extra safety.
    if (bundleLocation) {
        const originalBundle = bundleLocation;
        bundleLocation = bundleLocation.replace(/(localhost|127\.0\.0\.1):\d+/g, '127.0.0.1:3000');
        if (originalBundle !== bundleLocation) {
            log('[Worker Bundle] Overriding bundle location from:', originalBundle);
            log('[Worker Bundle] To use port 3000:', bundleLocation);
        }
    }
    log(`Bundle location: ${bundleLocation} (assets use absolute URLs to main app)`);

    try {
        log('Step 9/9: Rendering primary format video (9:16)...');
        const comp916 = await selectComposition({ serveUrl: bundleLocation, id: 'Main', inputProps });
        comp916.durationInFrames = totalDurationInFrames;
        comp916.fps = videoFps;
        const out916 = `final-ad-${adId}-9x16.mp4`;
        const path916 = path.resolve(`./public/renders/${out916}`);
        await renderMedia({ composition: comp916, serveUrl: bundleLocation, codec: 'h264', outputLocation: path916, inputProps });
        const finalUrl916 = `/renders/${out916}`;

        await prisma.ad.update({ where: { id: adId }, data: {
                finalVideoUrl: finalUrl916,
                lipsyncedAvatarUrl: localLipSyncedVideoUrl,
                lipsyncedAvatarNoBgUrl: transparentAvatarUrl,
                status: adData.enableDualFormat ? 'RENDERING' : 'COMPLETED',
        }});
        log('✅ Successfully rendered 9:16 format.');
    } catch (err: any) {
        log(`❌ Error rendering 9:16 video. Job failed.`, err.message, err.stack);
        await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
        return;
    }

    if (adData.enableDualFormat) {
        try {
            log('Step 9.5/9: Rendering secondary format video (4:5)...');
            const comp45 = await selectComposition({ serveUrl: bundleLocation, id: 'Main4x5', inputProps });
            comp45.durationInFrames = totalDurationInFrames;
            comp45.fps = videoFps;
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
            log(`❌ Error rendering 4:5 video. Job will be marked as FAILED.`, err.message, err.stack);
            await prisma.ad.update({ where: { id: adId }, data: { status: 'FAILED' } });
        }
    }
    log('✅ Render job finished successfully!');
}

const redisConnection = { host: process.env.REDIS_HOST || '127.0.0.1', port: parseInt(process.env.REDIS_PORT || '6379', 10) };
const queueName = process.env.RENDER_QUEUE_NAME || 'render-video-production';
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

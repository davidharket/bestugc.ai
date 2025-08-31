// pages/api/render/preview-start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// ... (handler setup remains the same) ...
const jobsDir = path.resolve(process.cwd(), '.tmp', 'preview-jobs');
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { return res.status(405).end('Method Not Allowed'); }
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) { return res.status(401).json({ message: 'Unauthorized' }); }
  const { adData, previewDuration = 10 } = req.body;
  if (!adData || !adData.templateId) { return res.status(400).json({ message: 'Missing ad data or template ID' }); }
  const jobId = uuidv4();
  const job = { status: 'pending', startTime: Date.now() };
  try {
    fs.mkdirSync(jobsDir, { recursive: true });
    fs.writeFileSync(path.join(jobsDir, `${jobId}.json`), JSON.stringify(job, null, 2));
  } catch (error) {
    console.error(`[Preview Start] Failed to write initial job file for ${jobId}:`, error);
    return res.status(500).json({ message: 'Failed to initialize preview job.' });
  }
  console.log(`[Preview Start] Created job ${jobId} for user ${session.user.id}`);
  processPreviewAsync(jobId, adData, previewDuration, session.user.id);
  return res.status(200).json({ jobId, status: 'pending' });
}
async function updateJobState(jobId: string, updates: Partial<any>) {
  const jobFilePath = path.join(jobsDir, `${jobId}.json`);
  try {
    if (fs.existsSync(jobFilePath)) {
      const currentJobData = JSON.parse(fs.readFileSync(jobFilePath, 'utf-8'));
      fs.writeFileSync(jobFilePath, JSON.stringify({ ...currentJobData, ...updates }, null, 2));
    }
  } catch (error) { console.error(`[Job State] Failed to update job ${jobId}:`, error); }
}

async function processPreviewAsync(jobId: string, adData: any, previewDuration: number, userId: string) {
  try {
    await updateJobState(jobId, { status: 'processing' });
    console.log(`[Preview] Processing job ${jobId}`);

    const { getTemplateById, scaleTemplateForDuration } = await import('../../../lib/templates');
    const { generateConcreteTimeline } = await import('../../../lib/timeline-generator');
    const { avatars } = await import('../../../lib/avatars');
    const { COMPOSITION_FPS } = await import('../../../remotion/constants');
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const path = await import('path');
    const fs = await import('fs');
    const { getPreviewGPUConfig, getGPUWebpackConfig } = await import('../../../lib/gpu-config');

    // ... (template and duration logic is the same) ...
    const baseTemplate = getTemplateById(adData.templateId);
    if (!baseTemplate) throw new Error('Template not found');
    const template = scaleTemplateForDuration(baseTemplate, adData.duration || 30);
    const audioDurationInSeconds = adData.audioUrl ? await getAudioDuration(adData.audioUrl) : previewDuration;
    const totalDurationInFrames = Math.round(audioDurationInSeconds * COMPOSITION_FPS);
    const timelineToUse = adData.modifiedTimeline && adData.modifiedTimeline.length > 0 ? adData.modifiedTimeline : template.timeline;
    const concreteTimeline = generateConcreteTimeline(timelineToUse, totalDurationInFrames);
    const avatar = avatars.find((a) => a.id === adData.avatarId);
    if (!avatar) throw new Error('Avatar not found');
    
    // ... (get avatar FPS logic is the same) ...
    let avatarFps = 30;
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/video/get-framerate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: avatar.src }) });
      if (response.ok) { const data = await response.json() as any; avatarFps = data.framerate; }
    } catch (error) { console.warn(`[Preview] Failed to get avatar framerate, using default.`); }

    const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
    
    const toAbsoluteUrl = (url: string) => {
      if (!url || url.startsWith('http')) {
        return url;
      }
  
      const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

      // For any URL that is not absolute, make it absolute.
      // This robustly handles /b-roll/..., /api/serve-broll/..., and any other relative paths.
      const absoluteUrl = url.startsWith('/') 
        ? `${EXTERNAL_API_BASE_URL}${url}` 
        : `${EXTERNAL_API_BASE_URL}/${url}`;

      console.log(`[Preview] Converted asset URL to absolute: ${url} -> ${absoluteUrl}`);
      return absoluteUrl;
    };
    
    console.log(`[Preview DEBUG] Original adData orderedBRoll:`, adData.orderedBRoll);
    console.log(`[Preview DEBUG] Original adData selectedBRoll:`, adData.selectedBRoll);
    

    // --- START: THE DEFINITIVE FIX ---
    // The Remotion component expects `orderedBRoll` (an array of objects), 
    // but the frontend often sends `selectedBRoll` (an array of strings).
    // This code block bridges that gap by creating the structure Remotion needs.
    let finalOrderedBRoll = adData.orderedBRoll || [];
    if (!finalOrderedBRoll.length && adData.selectedBRoll?.length) {
        console.log('[Preview] `orderedBRoll` is missing. Creating it from `selectedBRoll`.');
        finalOrderedBRoll = adData.selectedBRoll.map((url: string, index: number) => ({
            url: url, // Keep the original relative URL for now
            order: index
        }));
    }
    // --- END: THE DEFINITIVE FIX ---

    const getOrderedAssets = (ordered: any[], fallback: string[]) => (ordered?.length > 0 ? ordered.sort((a,b)=>a.order-b.order).map(a=>a.url) : fallback || []).map(toAbsoluteUrl);

    const remotionAdData = { ...adData,
        selectedImages: getOrderedAssets(adData.orderedImages || [], adData.selectedImages || []),
        selectedVideos: getOrderedAssets(adData.orderedVideos || [], adData.selectedVideos || []),
        
        // This property is not used by the component, but we process it for consistency.
        selectedBRoll: getOrderedAssets(finalOrderedBRoll, []),

        // CRITICAL: Process the `finalOrderedBRoll` we just created or received.
        // This ensures the URLs are absolute and in the correct property for the component.
        orderedBRoll: finalOrderedBRoll.map((asset: any) => {
            const originalUrl = asset.url || '';
            const convertedUrl = toAbsoluteUrl(originalUrl);
            console.log(`[Preview DEBUG] Processing orderedBRoll asset: ${originalUrl} -> ${convertedUrl}`);
            return {
                ...asset,
                url: convertedUrl // Use the absolute URL
            };
        }),
    };
    
    const avatarVideoUrl = toAbsoluteUrl(avatar.src);
    const toRenderVideoUrl = (url: string) => url.startsWith('/api/serve-video/') ? `${process.env.NEXT_PUBLIC_APP_URL}/api/render/serve-video?videoPath=${encodeURIComponent(url)}&internal_secret=${process.env.INTERNAL_SECRET_KEY}` : toAbsoluteUrl(url);

    // *** FIX: Get custom font data directly from adData (NO FETCH CALL) ***
    let customFontData = null;
    if (adData.customFontFamily && adData.customFontUrl) {
        console.log(`[Preview] Found custom font data for preview: ${adData.customFontFamily}`);
        customFontData = {
            fontFamily: adData.customFontFamily,
            url: toAbsoluteUrl(adData.customFontUrl),
        };
    }

    const inputProps = {
        adData: { ...remotionAdData, previewMode: true },
        timeline: concreteTimeline,
        audioUrl: toAbsoluteUrl(adData.audioUrl || ''),
        processedAvatarUrl: avatarVideoUrl,
        greenscreenAvatarUrl: avatarVideoUrl,
        concatenatedProductVideoUrl: toRenderVideoUrl(adData.productVideoUrl || ''),
        avatarFps: avatarFps,
        previewScale: 0.5,
        customFontData, // Pass simplified font data
    };
    
    console.log(`[Preview DEBUG] Final inputProps.adData.orderedBRoll:`, inputProps.adData.orderedBRoll);
    console.log(`[Preview DEBUG] Final inputProps.adData.selectedBRoll:`, inputProps.adData.selectedBRoll);

    let bundleLocation: string | null = null;
    try {
        // Force port 3000 for all Remotion operations - more aggressive approach
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
        process.env.WEBPACK_DEV_SERVER = 'false'; // Disable to avoid conflicts
        
        console.log('[Preview Bundle] Clearing and forcing all Remotion ports to 3000');
        console.log('[Preview Bundle] REMOTION_RENDERER_PORT:', process.env.REMOTION_RENDERER_PORT);
        console.log('[Preview Bundle] REMOTION_WEBPACK_PORT:', process.env.REMOTION_WEBPACK_PORT);
        
        bundleLocation = await bundle({ 
            entryPoint: path.resolve('./remotion/index.ts'), 
            webpackOverride: getGPUWebpackConfig(false), 
            publicDir: path.resolve("./public-minimal"), 
            enableCaching: false
        });
        
        // Force the bundle location to use port 3000 instead of whatever port was assigned
        if (bundleLocation) {
            // Replace any port with 3000
            const originalBundle = bundleLocation;
            bundleLocation = bundleLocation.replace(/(localhost|127\.0\.0\.1):\d+/g, '127.0.0.1:3000');
            if (originalBundle !== bundleLocation) {
                console.log('[Preview Bundle] Overriding bundle location from:', originalBundle);
                console.log('[Preview Bundle] To use port 3000:', bundleLocation);
            }
        }
        const previewGpuConfig = getPreviewGPUConfig();
        const compositionId = adData.currentPreviewFormat === '4:5' ? 'Main4x5' : 'Main';
        const composition = await selectComposition({ serveUrl: bundleLocation, id: compositionId, inputProps, chromiumOptions: previewGpuConfig.chromiumOptions });
        composition.durationInFrames = totalDurationInFrames;
        const outputFilename = `gpu-preview-${userId}-${Date.now()}.mp4`;
        const outputPath = path.resolve(`./public/previews/${outputFilename}`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        await renderMedia({ composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: outputPath, inputProps, chromiumOptions: previewGpuConfig.chromiumOptions });
        const previewVideoUrl = `/previews/${outputFilename}`;
        await updateJobState(jobId, { status: 'completed', result: { previewVideoUrl } });
        console.log(`[Preview] Job ${jobId} completed successfully`);
    } finally {
        if (bundleLocation) {
            try { fs.rmSync(bundleLocation, { recursive: true, force: true }); } catch (err) {}
        }
    }
  } catch (error) {
    console.error(`[Preview] Job ${jobId} failed:`, error);
    await updateJobState(jobId, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function getAudioDuration(audioUrl: string): Promise<number> {
    try {
        const { default: axios } = await import('axios');
        const response = await axios.post('/api/video/get-duration', { filePath: audioUrl }, { headers: { 'x-internal-secret': process.env.INTERNAL_SECRET_KEY }, baseURL: process.env.NEXT_PUBLIC_APP_URL });
        return response.data.durationInSeconds;
    } catch (error) {
        console.error('[Preview] Error getting audio duration:', error);
        return 10;
    }
}

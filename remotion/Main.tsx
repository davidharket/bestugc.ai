// remotion/Main.tsx
import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  Composition,
  staticFile,
} from 'remotion';
import { z } from 'zod';
import { AdCreationData } from '../components/AdCreationContext';
import { ConcreteScene } from '../lib/timeline-generator';
import { LayoutType } from '../lib/templates';
import { COMPOSITION_FPS } from './constants'; // Import for timeline calculations
import { GoogleFontLoader } from './components/GoogleFontLoader';
import { UnifiedFontLoader } from './components/UnifiedFontLoader';

// Import all scene components
import { AvatarWithCornerAsset } from './scenes/AvatarWithCornerAsset';
import { CutoutAvatarScene } from './scenes/CutoutAvatarScene';
import { FullScreenAsset } from './scenes/FullScreenAsset';
import { FullScreenAvatar } from './scenes/FullScreenAvatar';
import { BuildupCollageScene } from './scenes/BuildupCollageScene';
import { SplitScreenScene } from './scenes/SplitScreenScene';
import { SmallCutoutBottomLeftScene } from './scenes/SmallCutoutBottomLeftScene';
import { SmallCutoutBottomRightScene } from './scenes/SmallCutoutBottomRightScene';
import { SmallCutoutCenterScene } from './scenes/SmallCutoutCenterScene';
import { SmallCutoutBottomRightNoPadding } from './scenes/SmallCutoutBottomRightNoPadding';
import { SmallCutoutCenterTiltedLeft } from './scenes/SmallCutoutCenterTiltedLeft';
import { SmallCutoutCenterTiltedRight } from './scenes/SmallCutoutCenterTiltedRight';
import { SmallCutoutTopLeft } from './scenes/SmallCutoutTopLeft';
import { SmallCutoutTopRight } from './scenes/SmallCutoutTopRight';
import { Subtitles, SUBTITLE_STYLES, parseTranscriptWithTimings } from './components/Subtitles';

// Import 4:5 components
import { Main4x5Composition, Main4x5CompositionProps } from './Main4x5';

// --- Zod Schemas for Type Safety ---
export const MainCompositionProps = z.object({
  adData: z.any(),
  timeline: z.array(z.any()),
  audioUrl: z.string(),
  processedAvatarUrl: z.string(),
  greenscreenAvatarUrl: z.string(),
  originalProductVideoUrl: z.string().optional(),
  concatenatedProductVideoUrl: z.string().optional(),
  oneWordAtATime: z.boolean().optional(),
  fontSize: z.number().optional(),
  subtitlePosition: z.enum(['bottom', 'top', 'center']).optional(),
  textColor: z.string().optional(),
  fontWeight: z.number().optional(),
  outlineWidth: z.number().optional(),
  outlineColor: z.string().optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  shadowBlur: z.number().optional(),
  shadowColor: z.string().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  previewScale: z.number().optional(),
});

const TestCutoutSceneProps = z.object({
  backgroundSrc: z.string(),
  greenscreenSrc: z.string(),
  position: z.enum(['center', 'left', 'right']),
  avatarStartFrom: z.number().optional(),
});

// --- Mock Data for Studio Showcase ---
const MOCK_AD_DATA: AdCreationData = {
  selectedImages: [
    'uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp',
    'uploads/scraped/2ebccc5c81598a87/fee4376401fe.webp',
  ],
  selectedVideos: [
    'uploads/scraped/2ebccc5c81598a87/0e8851bafdd8.mp4',
    'uploads/scraped/2ebccc5c81598a87/1be8fed6bca1.mp4',
  ],
};

const ALL_SCENES_TIMELINE: ConcreteScene[] = [
  { layout: 'fullscreen-avatar', duration: 90, assetIndices: [] },
  { layout: 'fullscreen-asset', duration: 90, assetIndices: [0] },
  { layout: 'cutout-left-over-asset', duration: 120, assetIndices: [1] },
  { layout: 'cutout-right-over-asset', duration: 120, assetIndices: [2] },
  { layout: 'cutout-center-over-asset', duration: 120, assetIndices: [3] },
  { layout: 'avatar-with-corner-asset', duration: 120, assetIndices: [0] },
  { layout: 'split-screen-top-asset', duration: 120, assetIndices: [1] },
  { layout: 'buildup-collage', duration: 150, assetIndices: [0, 1, 3] },
];

// --- Main Remotion Root Component ---
export const RemotionRoot: React.FC = () => {
  const totalDuration = ALL_SCENES_TIMELINE.reduce(
    (acc, scene) => acc + scene.duration,
    0
  );

  return (
    <>
      <Composition
        id="Main"
        component={MainComposition}
        durationInFrames={totalDuration}
        fps={COMPOSITION_FPS}
        width={1080}
        height={1920}
        schema={MainCompositionProps}
        defaultProps={{
          adData: MOCK_AD_DATA,
          timeline: ALL_SCENES_TIMELINE,
          audioUrl: 'generated_audio/audio-69d70954b6a1.mp3',
          processedAvatarUrl: 'avatars-fixed/female-blonde-adult-inside.mp4',
          greenscreenAvatarUrl: 'cutouts/cutout-69d70954b6a1.webm',

        }}
      />
      <Composition
        id="Main4x5"
        component={Main4x5Composition}
        durationInFrames={totalDuration}
        fps={COMPOSITION_FPS}
        width={1080}
        height={1350}
        schema={Main4x5CompositionProps}
        defaultProps={{
          adData: MOCK_AD_DATA,
          timeline: ALL_SCENES_TIMELINE,
          audioUrl: 'generated_audio/audio-69d70954b6a1.mp3',
          processedAvatarUrl: 'avatars-fixed/female-blonde-adult-inside.mp4',
          greenscreenAvatarUrl: 'cutouts/cutout-69d70954b6a1.webm',
        }}
      />
      <Composition
        id="TestCutoutScene"
        component={CutoutAvatarScene}
        durationInFrames={150}
        fps={COMPOSITION_FPS}
        width={1080}
        height={1920}
        schema={TestCutoutSceneProps}
        defaultProps={{
          backgroundSrc: 'uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp',
          greenscreenSrc: 'cutouts/cutout-69d70954b6a1.webm',
          position: 'center',
          avatarStartFrom: 0,
        }}
      />
    </>
  );
};

// --- THIS IS THE CORRECTED, INTELLIGENT ASSET RESOLVER ---
const resolveAsset = (assetPath: string): string => {
  if (!assetPath) {
    return '';
  }
  
  // If it's already an absolute URL, return it unchanged
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  
  // For preview mode, try to construct absolute URL using staging environment
  // This is a fallback for when staticFile doesn't work properly with staging URLs
  if (typeof window === 'undefined' && assetPath.startsWith('/')) {
    // We're in server-side render context (Remotion render)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl) {
      const absoluteUrl = baseUrl + assetPath;
      return absoluteUrl;
    }
  }
  
  // Default to staticFile for local assets
  const resolved = staticFile(assetPath);
  return resolved;
};

// --- Main Rendering Composition ---
export const MainComposition: React.FC<z.infer<typeof MainCompositionProps>> = ({
  adData,
  timeline,
  audioUrl,
  processedAvatarUrl,
  greenscreenAvatarUrl,
  originalProductVideoUrl,
  concatenatedProductVideoUrl,
  oneWordAtATime,
  fontSize,
  subtitlePosition,
  textColor,
  fontWeight,
  outlineWidth,
  outlineColor,
  shadowOffsetX,
  shadowOffsetY,
  shadowBlur,
  shadowColor,
  letterSpacing,
  textTransform,
  previewScale,
}) => {
  // Helper function to get assets in proper order
  const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
    if (orderedAssets && orderedAssets.length > 0) {
      // Sort by order and extract URLs
      return orderedAssets
        .sort((a, b) => a.order - b.order)
        .map(asset => asset.url)
        .filter((url: string) => url !== '');
    }
    // Fallback to unordered assets if no ordered assets
    return (fallbackAssets || []).filter((url: string) => url !== '');
  };

  // Get properly ordered assets respecting user-defined order
  const orderedImages = getOrderedAssets(adData.orderedImages || [], adData.selectedImages || []);
  const orderedVideos = getOrderedAssets(adData.orderedVideos || [], adData.selectedVideos || []);
  const orderedBRoll = getOrderedAssets(adData.orderedBRoll || [], adData.selectedBRoll || []);
  
  // Combine all assets and sort by their original order numbers
  const allOrderedAssets = [
    ...(adData.orderedImages || []).map((asset: any) => ({ ...asset, type: 'image' })),
    ...(adData.orderedVideos || []).map((asset: any) => ({ ...asset, type: 'video' })),
    ...(adData.orderedBRoll || []).map((asset: any) => ({ ...asset, type: 'broll' }))
  ].sort((a, b) => a.order - b.order);
  
  const assets = allOrderedAssets.map(asset => asset.url);
  let fromFrame = 0;
  
  // Calculate total duration for subtitle timing
  const totalDuration = timeline.reduce((acc, scene) => acc + scene.duration, 0);
  const totalDurationInSeconds = totalDuration / COMPOSITION_FPS;
  
  // Get subtitle configuration
  const enableSubtitles = adData.enableSubtitles !== false;
  const subtitleStyle = SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0];
  const subtitleAnimation = adData.subtitleAnimation || 'none';
  const finalSubtitlePosition = subtitlePosition ?? adData.subtitlePosition ?? 'bottom';
  const scriptText = adData.selectedScript || adData.script || '';
  
  // Build style overrides from user customizations (prefer direct props over adData)
  const styleOverrides = {
    fontSize: fontSize ?? adData.fontSize ?? subtitleStyle.fontSize,
    fontWeight: fontWeight ?? adData.fontWeight,
    outlineWidth: outlineWidth ?? adData.outlineWidth,
    outlineColor: outlineColor ?? adData.outlineColor,
    shadowOffsetX: shadowOffsetX ?? adData.shadowOffsetX,
    shadowOffsetY: shadowOffsetY ?? adData.shadowOffsetY,
    shadowBlur: shadowBlur ?? adData.shadowBlur,
    shadowColor: shadowColor ?? adData.shadowColor,
    letterSpacing: letterSpacing ?? adData.letterSpacing,
    textTransform: textTransform ?? adData.textTransform,
    textColor: textColor ?? adData.textColor,
  };
  
  // Filter out undefined values
  const cleanedStyleOverrides = Object.fromEntries(
    Object.entries(styleOverrides).filter(([_, value]) => value !== undefined)
  );

  const dynamicSubtitleStyle = {
    ...subtitleStyle,
    ...cleanedStyleOverrides,
  };

  // Use ElevenLabs word timings if available, otherwise generate fallback timings
  const subtitleTimings = adData.wordTimings && adData.wordTimings.length > 0 
    ? adData.wordTimings 
    : (scriptText ? parseTranscriptWithTimings(scriptText, totalDurationInSeconds) : []);

  // Professional dB-based volume calculation for background music
  const calculateBackgroundMusicVolume = (): number => {
    // Professional audio mixing standards:
    // - TTS audio (voice) is at 1.0 volume (0dB reference)
    // - Background music should be -18dB below voice for optimal intelligibility
    // - This ensures music enhances without competing with speech
    
    const ttsVolumeDb = 0; // TTS at reference level (1.0 = 0dB)
    const musicOffsetDb = -18; // 18dB below TTS audio (professional standard)
    
    // Convert dB to linear volume using: volume = 10^(dB/20)
    // -18dB = 0.126 linear volume (approximately 12.6% of TTS volume)
    const linearVolume = Math.pow(10, (ttsVolumeDb + musicOffsetDb) / 20);
    
    // Safety limits: min 5%, max 25% to prevent audio issues
    return Math.max(0.05, Math.min(0.25, linearVolume));
  };

  return (
    <AbsoluteFill className="bg-white">
      <GoogleFontLoader />
      <UnifiedFontLoader />
      <Audio src={resolveAsset(audioUrl)} volume={1.0} />
      
      {/* Background Music with dB-based volume calculation */}
      {adData.backgroundMusicUrl && (
        <Audio 
          src={resolveAsset(adData.backgroundMusicUrl)} 
          volume={calculateBackgroundMusicVolume()} 
        />
      )}
      
      {timeline.map((scene: ConcreteScene, index: number) => {
        const duration = scene.duration;
        const currentFromFrame = fromFrame;
        fromFrame += duration;
        
        // Determine which avatar videos to use based on scene index and render mode
        let sceneProcessedAvatarUrl = processedAvatarUrl;
        let sceneGreenscreenAvatarUrl = greenscreenAvatarUrl;
        
        if (adData.previewMode) {
          // PREVIEW MODE: First scene uses concatenated product video, subsequent scenes use standard avatar
          if (index === 0 && concatenatedProductVideoUrl) {
            sceneProcessedAvatarUrl = concatenatedProductVideoUrl;
            sceneGreenscreenAvatarUrl = concatenatedProductVideoUrl; // Same video for both
          } else {
          }
        } else {
          // FINAL RENDER MODE: Always use processedAvatarUrl (lip-synced for product videos, standard for others)
        }
        
        return (
          <Sequence key={`${scene.layout}-${index}`} from={currentFromFrame} durationInFrames={duration}>
            {renderScene(
              scene,
              assets,
              sceneProcessedAvatarUrl,
              sceneGreenscreenAvatarUrl,
              currentFromFrame,
              index
            )}
          </Sequence>
        );
      })}
      
      {/* Subtitle Layer */}
      {enableSubtitles && scriptText && (
        <Subtitles
          transcript={scriptText}
          wordTimings={subtitleTimings}
          style={subtitleStyle}
          styleOverrides={cleanedStyleOverrides}
          animationType={subtitleAnimation}
          position={finalSubtitlePosition}
          maxWordsPerLine={(oneWordAtATime ?? adData.oneWordAtATime) ? 1 : undefined} // Let component calculate dynamically when not one-word-at-a-time
          useCapsLock={adData.useCapsLock || false}
          previewScale={previewScale ?? 1.0} // Use provided previewScale or default to 1.0
        />
      )}
    </AbsoluteFill>
  );
};

// --- Scene Rendering Logic (Using the intelligent resolver) ---
function renderScene(
  scene: ConcreteScene,
  assets: string[],
  videoUrl: string,
  greenscreenUrl: string,
  startFrame: number,
  sceneIndex?: number
) {
  const getAsset = (index?: number) =>
    index !== undefined && assets[index] ? assets[index] : '';

  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  // Calculate the start time in seconds based on the frame position in the timeline
  const avatarVideoStartFrom = startFrame / COMPOSITION_FPS;

  if (scene.layout === 'buildup-collage') {
    const collageAssets = scene.assetIndices?.map(i => resolveAsset(getAsset(i))) || [];
    return <BuildupCollageScene assetUrls={collageAssets} />;
  }

  const resolvedAssetUrl = resolveAsset(getAsset(scene.assetIndices?.[0]));

  switch (scene.layout as LayoutType) {
    case 'fullscreen-avatar':
      return <FullScreenAvatar src={resolvedVideoUrl} startFrom={avatarVideoStartFrom} />;
    case 'fullscreen-asset':
      return <FullScreenAsset src={resolvedAssetUrl} />;
    case 'cutout-left-over-asset':
    case 'cutout-right-over-asset':
    case 'cutout-center-over-asset':
      return (
        <CutoutAvatarScene
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          position={scene.layout.split('-')[1] as 'left' | 'right' | 'center'}
          avatarStartFrom={avatarVideoStartFrom} // Use timeline position for proper sync
        />
      );
    case 'small-cutout-bottom-left':
      return (
        <SmallCutoutBottomLeftScene
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-bottom-right':
      return (
        <SmallCutoutBottomRightScene
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center':
      return (
        <SmallCutoutCenterScene
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-bottom-right-no-padding':
      return (
        <SmallCutoutBottomRightNoPadding
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center-tilted-left':
      return (
        <SmallCutoutCenterTiltedLeft
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center-tilted-right':
      return (
        <SmallCutoutCenterTiltedRight
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-top-left':
      return (
        <SmallCutoutTopLeft
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-top-right':
      return (
        <SmallCutoutTopRight
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'avatar-with-corner-asset':
      return (
        <AvatarWithCornerAsset
          videoSrc={resolvedVideoUrl}
          assetSrc={resolvedAssetUrl}
          startFrom={avatarVideoStartFrom}
          assetVideoDurationInFrames={300}
        />
      );
    case 'split-screen-top-asset':
      return (
        <SplitScreenScene
          videoSrc={resolvedVideoUrl}
          assetSrc={resolvedAssetUrl}
          startFrom={avatarVideoStartFrom}
        />
      );
    default:
      return <AbsoluteFill style={{ backgroundColor: 'darkslateblue' }} />;
  }
}
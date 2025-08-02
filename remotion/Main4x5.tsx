// remotion/Main4x5.tsx
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
import { COMPOSITION_FPS } from './constants';

// Import all 4:5 scene components
import { FullScreenAvatar4x5 } from './scenes-4x5/FullScreenAvatar4x5';
import { SmallCutoutBottomLeftScene4x5 } from './scenes-4x5/SmallCutoutBottomLeftScene4x5';
import { SmallCutoutBottomRightScene4x5 } from './scenes-4x5/SmallCutoutBottomRightScene4x5';
import { SmallCutoutCenterScene4x5 } from './scenes-4x5/SmallCutoutCenterScene4x5';
import { SmallCutoutBottomLeftNoPadding4x5 } from './scenes-4x5/SmallCutoutBottomLeftNoPadding4x5';
import { SmallCutoutBottomRightNoPadding4x5 } from './scenes-4x5/SmallCutoutBottomRightNoPadding4x5';
import { SmallCutoutCenterTiltedLeft4x5 } from './scenes-4x5/SmallCutoutCenterTiltedLeft4x5';
import { SmallCutoutCenterTiltedRight4x5 } from './scenes-4x5/SmallCutoutCenterTiltedRight4x5';
import { SmallCutoutTopLeft4x5 } from './scenes-4x5/SmallCutoutTopLeft4x5';
import { SmallCutoutTopRight4x5 } from './scenes-4x5/SmallCutoutTopRight4x5';
import { Subtitles, SUBTITLE_STYLES, parseTranscriptWithTimings } from './components/Subtitles';

// Import standard scenes for scenes that don't need special 4:5 versions
import { FullScreenAsset } from './scenes/FullScreenAsset';
import { CutoutAvatarScene } from './scenes/CutoutAvatarScene';
import { AvatarWithCornerAsset } from './scenes/AvatarWithCornerAsset';
import { SplitScreenScene } from './scenes/SplitScreenScene';
import { BuildupCollageScene } from './scenes/BuildupCollageScene';

// --- Zod Schemas for Type Safety ---
export const Main4x5CompositionProps = z.object({
  adData: z.any(),
  timeline: z.array(z.any()),
  audioUrl: z.string(),
  processedAvatarUrl: z.string(),
  greenscreenAvatarUrl: z.string(),
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

// --- Main Remotion Root Component for 4:5 ---
export const RemotionRoot4x5: React.FC = () => {
  const totalDuration = ALL_SCENES_TIMELINE.reduce(
    (acc, scene) => acc + scene.duration,
    0
  );

  return (
    <>
      <Composition
        id="Main4x5"
        component={Main4x5Composition}
        durationInFrames={totalDuration}
        fps={COMPOSITION_FPS}
        width={1080}
        height={1350} // 4:5 aspect ratio
        schema={Main4x5CompositionProps}
        defaultProps={{
          adData: MOCK_AD_DATA,
          timeline: ALL_SCENES_TIMELINE,
          audioUrl: 'generated_audio/audio-69d70954b6a1.mp3',
          processedAvatarUrl: 'avatars-fixed/female-blonde-adult-inside.mp4',
          greenscreenAvatarUrl: 'cutouts/cutout-69d70954b6a1.webm',
        }}
      />
    </>
  );
};

// --- THIS IS THE CORRECTED, INTELLIGENT ASSET RESOLVER ---
const resolveAsset = (assetPath: string): string => {
  if (!assetPath) {
    console.warn('[resolveAsset4x5] Empty asset path provided');
    return '';
  }
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    console.log('[resolveAsset4x5] Using remote asset:', assetPath);
    return assetPath;
  }
  const resolved = staticFile(assetPath);
  console.log('[resolveAsset4x5] Resolved local asset:', assetPath, '->', resolved);
  return resolved;
};

// --- Main Rendering Composition for 4:5 ---
export const Main4x5Composition: React.FC<z.infer<typeof Main4x5CompositionProps>> = ({
  adData,
  timeline,
  audioUrl,
  processedAvatarUrl,
  greenscreenAvatarUrl,
}) => {
  // Helper function to get assets in proper order
  const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
    if (orderedAssets && orderedAssets.length > 0) {
      return orderedAssets
        .sort((a, b) => a.order - b.order)
        .map(asset => asset.url)
        .filter((url: string) => url !== '');
    }
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
  const subtitleAnimation = adData.subtitleAnimation || 'fade';
  const subtitlePosition = adData.subtitlePosition || 'bottom';
  const scriptText = adData.selectedScript || adData.script || '';
  
  // Use ElevenLabs word timings if available, otherwise generate fallback timings
  const subtitleTimings = adData.wordTimings && adData.wordTimings.length > 0 
    ? adData.wordTimings 
    : (scriptText ? parseTranscriptWithTimings(scriptText, totalDurationInSeconds) : []);

  // Professional dB-based volume calculation for background music
  const calculateBackgroundMusicVolume = (): number => {
    const ttsVolumeDb = 0;
    const musicOffsetDb = -18;
    const linearVolume = Math.pow(10, (ttsVolumeDb + musicOffsetDb) / 20);
    return Math.max(0.05, Math.min(0.25, linearVolume));
  };

  return (
    <AbsoluteFill className="bg-white">
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
        
        return (
          <Sequence key={`${scene.layout}-${index}`} from={currentFromFrame} durationInFrames={duration}>
            {renderScene4x5(
              scene,
              assets,
              processedAvatarUrl,
              greenscreenAvatarUrl,
              currentFromFrame
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
          animationType={subtitleAnimation}
          position={subtitlePosition}
          maxWordsPerLine={4}
          useCapsLock={adData.useCapsLock || false}
        />
      )}
    </AbsoluteFill>
  );
};

// --- Scene Rendering Logic for 4:5 (Using the intelligent resolver) ---
function renderScene4x5(
  scene: ConcreteScene,
  assets: string[],
  videoUrl: string,
  greenscreenUrl: string,
  startFrame: number
) {
  const getAsset = (index?: number) =>
    index !== undefined && assets[index] ? assets[index] : '';

  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  // Calculate the start time in seconds based on the frame position in the timeline
  const avatarVideoStartFrom = startFrame / COMPOSITION_FPS;

  console.log(`[renderScene4x5] Rendering scene: ${scene.layout}`, {
    assetIndices: scene.assetIndices,
    resolvedVideoUrl,
    resolvedGreenscreenUrl,
    avatarVideoStartFrom,
    assetsLength: assets.length
  });

  if (scene.layout === 'buildup-collage') {
    const collageAssets = scene.assetIndices?.map(i => resolveAsset(getAsset(i))) || [];
    return <BuildupCollageScene assetUrls={collageAssets} />;
  }

  const resolvedAssetUrl = resolveAsset(getAsset(scene.assetIndices?.[0]));
  
  console.log(`[renderScene4x5] Asset resolution for ${scene.layout}:`, {
    assetIndex: scene.assetIndices?.[0],
    rawAsset: getAsset(scene.assetIndices?.[0]),
    resolvedAssetUrl
  });

  switch (scene.layout as LayoutType) {
    case 'fullscreen-avatar':
      return <FullScreenAvatar4x5 src={resolvedVideoUrl} startFrom={avatarVideoStartFrom} />;
    case 'fullscreen-asset':
      return <FullScreenAsset src={resolvedAssetUrl} videoDurationInFrames={300} />;
    case 'cutout-left-over-asset':
    case 'cutout-right-over-asset':
    case 'cutout-center-over-asset':
      return (
        <CutoutAvatarScene
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          position={scene.layout.split('-')[1] as 'left' | 'right' | 'center'}
          avatarStartFrom={avatarVideoStartFrom}
          backgroundVideoDurationInFrames={300}
        />
      );
    case 'small-cutout-bottom-left':
      return (
        <SmallCutoutBottomLeftScene4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
          backgroundVideoDurationInFrames={300}
        />
      );
    case 'small-cutout-bottom-right':
      return (
        <SmallCutoutBottomRightScene4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center':
      return (
        <SmallCutoutCenterScene4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-bottom-left-no-padding':
      return (
        <SmallCutoutBottomLeftNoPadding4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-bottom-right-no-padding':
      return (
        <SmallCutoutBottomRightNoPadding4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center-tilted-left':
      return (
        <SmallCutoutCenterTiltedLeft4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-center-tilted-right':
      return (
        <SmallCutoutCenterTiltedRight4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-top-left':
      return (
        <SmallCutoutTopLeft4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
        />
      );
    case 'small-cutout-top-right':
      return (
        <SmallCutoutTopRight4x5
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
          assetVideoDurationInFrames={300}
        />
      );
    default:
      return <AbsoluteFill style={{ backgroundColor: 'darkslateblue' }} />;
  }
}
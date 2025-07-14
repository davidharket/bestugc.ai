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

// Import all scene components
import { AvatarWithCornerAsset } from './scenes/AvatarWithCornerAsset';
import { CutoutAvatarScene } from './scenes/CutoutAvatarScene';
import { FullScreenAsset } from './scenes/FullScreenAsset';
import { FullScreenAvatar } from './scenes/FullScreenAvatar';
import { BuildupCollageScene } from './scenes/BuildupCollageScene';
import { SplitScreenScene } from './scenes/SplitScreenScene';
import { Subtitles, SUBTITLE_STYLES, parseTranscriptWithTimings } from './components/Subtitles';

// --- Zod Schemas for Type Safety ---
export const MainCompositionProps = z.object({
  adData: z.any(),
  timeline: z.array(z.any()),
  audioUrl: z.string(),
  processedAvatarUrl: z.string(),
  greenscreenAvatarUrl: z.string(),
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
    console.warn('[resolveAsset] Empty asset path provided');
    return '';
  }
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    console.log('[resolveAsset] Using remote asset:', assetPath);
    return assetPath;
  }
  const resolved = staticFile(assetPath);
  console.log('[resolveAsset] Resolved local asset:', assetPath, '->', resolved);
  return resolved;
};

// --- Main Rendering Composition ---
export const MainComposition: React.FC<z.infer<typeof MainCompositionProps>> = ({
  adData,
  timeline,
  audioUrl,
  processedAvatarUrl,
  greenscreenAvatarUrl,
}) => {
  const assets = [...(adData.selectedImages || []), ...(adData.selectedVideos || [])];
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
  
  // Generate subtitle timings
  const subtitleTimings = scriptText ? parseTranscriptWithTimings(scriptText, totalDurationInSeconds) : [];

  return (
    <AbsoluteFill className="bg-white">
      <Audio src={resolveAsset(audioUrl)} />
      {timeline.map((scene: ConcreteScene, index: number) => {
        const duration = scene.duration;
        const currentFromFrame = fromFrame;
        fromFrame += duration;
        
        return (
          <Sequence key={`${scene.layout}-${index}`} from={currentFromFrame} durationInFrames={duration}>
            {renderScene(
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
  startFrame: number
) {
  const getAsset = (index?: number) =>
    index !== undefined && assets[index] ? assets[index] : '';

  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  // Calculate the start time in seconds based on the frame position in the timeline
  const avatarVideoStartFrom = startFrame / COMPOSITION_FPS;

  console.log(`[renderScene] Rendering scene: ${scene.layout}`, {
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
  
  console.log(`[renderScene] Asset resolution for ${scene.layout}:`, {
    assetIndex: scene.assetIndices?.[0],
    rawAsset: getAsset(scene.assetIndices?.[0]),
    resolvedAssetUrl
  });

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
    case 'avatar-with-corner-asset':
      return (
        <AvatarWithCornerAsset
          videoSrc={resolvedVideoUrl}
          assetSrc={resolvedAssetUrl}
          startFrom={avatarVideoStartFrom}
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
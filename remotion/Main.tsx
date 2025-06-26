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

// Import all scene components
import { AvatarWithCornerAsset } from './scenes/AvatarWithCornerAsset';
import { CutoutAvatarScene } from './scenes/CutoutAvatarScene';
import { FullScreenAsset } from './scenes/FullScreenAsset';
import { FullScreenAvatar } from './scenes/FullScreenAvatar';
import { BuildupCollageScene } from './scenes/BuildupCollageScene';
import { SplitScreenScene } from './scenes/SplitScreenScene';

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
        fps={30}
        width={1080}
        height={1920}
        schema={MainCompositionProps}
        defaultProps={{
          adData: MOCK_AD_DATA,
          timeline: ALL_SCENES_TIMELINE,
          audioUrl: 'generated_audio/audio-69d70954b6a1.mp3',
          processedAvatarUrl: 'avatars-fixed/female-blonde-adult-inside.mp4', // This will be a local file for the mock
          greenscreenAvatarUrl: 'cutouts/cutout-69d70954b6a1.webm', // Dev/test fallback - production uses dynamic URLs
        }}
      />
      <Composition
        id="TestCutoutScene"
        component={CutoutAvatarScene}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        schema={TestCutoutSceneProps}
        defaultProps={{
          backgroundSrc: 'uploads/scraped/2ebccc5c81598a87/c9b66cad787b.webp',
          greenscreenSrc: 'cutouts/cutout-69d70954b6a1.webm', // Dev/test fallback - production uses dynamic URLs
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
    // Return an empty string for undefined paths to prevent errors
    return '';
  }
  // If it's a full web URL (from SyncLabs), return it directly.
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  // Otherwise, treat it as a local static file relative to /public.
  // The `staticFile` function handles this correctly.
  return staticFile(assetPath);
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

  return (
    <AbsoluteFill className="bg-white">
      <Audio src={resolveAsset(audioUrl)} />
      {timeline.map((scene: ConcreteScene, index: number) => {
        const duration = scene.duration;
        const currentFromFrame = fromFrame;
        fromFrame += duration; // Move this before the return
        
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

  // Use our smart resolver on EVERY asset path.
  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  // Handle collage scenes separately as they have multiple assets
  if (scene.layout === 'buildup-collage') {
    const collageAssets = scene.assetIndices?.map(i => resolveAsset(getAsset(i))) || [];
    return <BuildupCollageScene assetUrls={collageAssets} />;
  }

  // Handle single-asset scenes
  const resolvedAssetUrl = resolveAsset(getAsset(scene.assetIndices?.[0]));

  switch (scene.layout as LayoutType) {
    case 'fullscreen-avatar':
      return <FullScreenAvatar src={resolvedVideoUrl} startFrom={startFrame} />;
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
          avatarStartFrom={startFrame}
        />
      );
    case 'avatar-with-corner-asset':
      return (
        <AvatarWithCornerAsset
          videoSrc={resolvedVideoUrl}
          assetSrc={resolvedAssetUrl}
          startFrom={startFrame}
        />
      );
    case 'split-screen-top-asset':
      return (
        <SplitScreenScene
          videoSrc={resolvedVideoUrl}
          assetSrc={resolvedAssetUrl}
          startFrom={startFrame}
        />
      );
    default:
      return <AbsoluteFill style={{ backgroundColor: 'darkslateblue' }} />;
  }
}
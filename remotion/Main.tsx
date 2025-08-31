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
import { COMPOSITION_FPS } from './constants';
import { GoogleFontLoader } from './components/GoogleFontLoader';
import { UnifiedFontLoader } from './components/UnifiedFontLoader';
import { safeGetInputProps } from './utils/safeInputProps';

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
import { Subtitles, parseTranscriptWithTimings } from './components/Subtitles';
import { VideoPreloader, collectVideoUrls } from './components/VideoPreloader';
import { getAllAvailableFonts } from '../lib/google-fonts';

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
  avatarFps: z.number().optional(),
  avatarDuration: z.number().optional(),
});

const TestCutoutSceneProps = z.object({
  backgroundSrc: z.string(),
  greenscreenSrc: z.string(),
  position: z.enum(['center', 'left', 'right']),
  avatarStartFrom: z.number().optional(),
});

// --- Main Remotion Root Component ---
export const RemotionRoot: React.FC = () => {
  // Mock data for Studio, not used in actual renders
  const MOCK_AD_DATA: AdCreationData = {
    selectedImages: ['/images/placeholder.png'],
    selectedVideos: [],
  };
  const MOCK_TIMELINE: ConcreteScene[] = [
    { layout: 'fullscreen-avatar', duration: 300, assetIndices: [] },
  ];
  const totalDuration = MOCK_TIMELINE.reduce((acc, scene) => acc + scene.duration, 0);

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
          timeline: MOCK_TIMELINE,
          audioUrl: '',
          processedAvatarUrl: '',
          greenscreenAvatarUrl: '',
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
          timeline: MOCK_TIMELINE,
          audioUrl: '',
          processedAvatarUrl: '',
          greenscreenAvatarUrl: '',
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
          backgroundSrc: '/images/placeholder.png',
          greenscreenSrc: '',
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

  // If the path is an absolute URL, use it directly.
  // This is the path your worker will now provide.
  if (assetPath.startsWith('http')) {
    return assetPath;
  }

  // Otherwise, assume it's a local file for Remotion Studio and use staticFile().
  return staticFile(assetPath);
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
  avatarFps,
  avatarDuration,
}) => {
  const getOrderedAssets = (orderedAssets: any[], fallbackAssets: string[]) => {
    if (orderedAssets && orderedAssets.length > 0) {
      return orderedAssets
        .sort((a, b) => a.order - b.order)
        .map(asset => asset.url)
        .filter((url: string) => url !== '');
    }
    return (fallbackAssets || []).filter((url: string) => url !== '');
  };

  const allOrderedAssets = [
    ...(adData.orderedImages || []).map((asset: any) => ({ ...asset, type: 'image' })),
    ...(adData.orderedVideos || []).map((asset: any) => ({ ...asset, type: 'video' })),
    ...(adData.orderedBRoll || []).map((asset: any) => ({ ...asset, type: 'broll' }))
  ].sort((a, b) => a.order - b.order);

  const assets = allOrderedAssets.map(asset => asset.url);
  let fromFrame = 0;

  const totalDuration = timeline.reduce((acc, scene) => acc + scene.duration, 0);
  const totalDurationInSeconds = totalDuration / (avatarFps || COMPOSITION_FPS);

  const enableSubtitles = adData.enableSubtitles !== false;
  const SUBTITLE_STYLES = getAllAvailableFonts().map(font => ({
    id: font.id,
    name: font.name,
    font: font.fontFamily,
    fontSize: 50,
    fontWeight: 600,
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 8,
    textShadow: '1px 1px 2px #000',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 950,
    border: 'none',
    supportsCaps: true,
  }));
  const subtitleStyle = SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0];
  const subtitleAnimation = adData.subtitleAnimation || 'none';
  const finalSubtitlePosition = subtitlePosition ?? adData.subtitlePosition ?? 'bottom';
  const scriptText = adData.selectedScript || adData.script || '';

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

  const cleanedStyleOverrides = Object.fromEntries(
    Object.entries(styleOverrides).filter(([_, value]) => value !== undefined)
  );

  const subtitleTimings = adData.wordTimings && adData.wordTimings.length > 0
    ? adData.wordTimings
    : (scriptText ? parseTranscriptWithTimings(scriptText, totalDurationInSeconds) : []);

  const calculateBackgroundMusicVolume = (): number => {
    const ttsVolumeDb = 0;
    const musicOffsetDb = -18;
    const linearVolume = Math.pow(10, (ttsVolumeDb + musicOffsetDb) / 20);
    return Math.max(0.05, Math.min(0.25, linearVolume));
  };

  const allVideoUrls = collectVideoUrls(
    adData,
    processedAvatarUrl,
    greenscreenAvatarUrl,
    originalProductVideoUrl,
    concatenatedProductVideoUrl
  );

  return (
    <VideoPreloader videos={allVideoUrls}>
      <AbsoluteFill className="bg-white">
        <GoogleFontLoader />
        <UnifiedFontLoader />
        {audioUrl && <Audio src={resolveAsset(audioUrl)} volume={1.0} />}

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
            {renderScene(
              scene,
              assets,
              processedAvatarUrl,
              greenscreenAvatarUrl,
              currentFromFrame,
              index,
              timeline,
              avatarDuration,
              avatarFps
            )}
          </Sequence>
        );
      })}

      {enableSubtitles && scriptText && (
        <Subtitles
          transcript={scriptText}
          wordTimings={subtitleTimings}
          style={subtitleStyle}
          styleOverrides={cleanedStyleOverrides}
          animationType={subtitleAnimation}
          position={finalSubtitlePosition}
          maxWordsPerLine={(oneWordAtATime ?? adData.oneWordAtATime) ? 1 : undefined}
          useCapsLock={adData.useCapsLock || false}
          previewScale={previewScale ?? 1.0}
        />
      )}
      </AbsoluteFill>
    </VideoPreloader>
  );
};

// --- Scene Rendering Logic (Using the intelligent resolver) ---
function renderScene(
  scene: ConcreteScene,
  assets: string[],
  videoUrl: string,
  greenscreenUrl: string,
  startFrame: number,
  sceneIndex?: number,
  timeline?: ConcreteScene[],
  avatarDuration?: number,
  avatarFps?: number,
) {
  const getAsset = (index?: number) =>
    index !== undefined && assets[index] ? assets[index] : '';

  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  // *** THE FIX IS HERE ***
  // Use the dynamic avatarFps passed from the worker, or fall back to the composition's default FPS.
  const actualFps = avatarFps || COMPOSITION_FPS;
  const baseAvatarVideoStartFrom = startFrame / actualFps;

  const actualAvatarDuration = avatarDuration || 10;
  const avatarVideoStartFrom = baseAvatarVideoStartFrom < actualAvatarDuration
    ? baseAvatarVideoStartFrom
    : baseAvatarVideoStartFrom % actualAvatarDuration;

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
          avatarStartFrom={avatarVideoStartFrom}
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
     case 'buildup-collage':
        const collageAssets = scene.assetIndices?.map(i => resolveAsset(getAsset(i))) || [];
        return <BuildupCollageScene assetUrls={collageAssets} />;
    default:
      return <AbsoluteFill style={{ backgroundColor: 'darkslateblue' }} />;
  }
}

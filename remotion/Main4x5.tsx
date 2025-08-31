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
import { GoogleFontLoader } from './components/GoogleFontLoader';
import { UnifiedFontLoader } from './components/UnifiedFontLoader';

// Import all 4:5 scene components
import { FullScreenAvatar4x5 } from './scenes-4x5/FullScreenAvatar4x5';
import { SmallCutoutBottomLeftScene4x5 } from './scenes-4x5/SmallCutoutBottomLeftScene4x5';
import { SmallCutoutBottomRightScene4x5 } from './scenes-4x5/SmallCutoutBottomRightScene4x5';
import { SmallCutoutCenterScene4x5 } from './scenes-4x5/SmallCutoutCenterScene4x5';
import { SmallCutoutBottomRightNoPadding4x5 } from './scenes-4x5/SmallCutoutBottomRightNoPadding4x5';
import { SmallCutoutCenterTiltedLeft4x5 } from './scenes-4x5/SmallCutoutCenterTiltedLeft4x5';
import { SmallCutoutCenterTiltedRight4x5 } from './scenes-4x5/SmallCutoutCenterTiltedRight4x5';
import { SmallCutoutTopLeft4x5 } from './scenes-4x5/SmallCutoutTopLeft4x5';
import { SmallCutoutTopRight4x5 } from './scenes-4x5/SmallCutoutTopRight4x5';
import { Subtitles, parseTranscriptWithTimings } from './components/Subtitles';
import { VideoPreloader, collectVideoUrls } from './components/VideoPreloader';
import { getAllAvailableFonts } from '../lib/google-fonts';

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

// --- THIS IS THE CORRECTED, INTELLIGENT ASSET RESOLVER ---
const resolveAsset = (assetPath: string): string => {
  if (!assetPath) {
    return '';
  }
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  if (typeof window === 'undefined') {
    if (assetPath.startsWith('cutouts/') || !assetPath.startsWith('/')) {
      return `***REMOVED***/${assetPath}`;
    }
    if (assetPath.startsWith('/')) {
      return `***REMOVED***${assetPath}`;
    }
  }
  return staticFile(assetPath);
};

// --- Main Rendering Composition for 4:5 ---
export const Main4x5Composition: React.FC<z.infer<typeof Main4x5CompositionProps>> = ({
  adData,
  timeline,
  audioUrl,
  processedAvatarUrl,
  greenscreenAvatarUrl,
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
    greenscreenAvatarUrl
  );

  return (
    <VideoPreloader videos={allVideoUrls}>
      <AbsoluteFill className="bg-white">
        <GoogleFontLoader />
        <UnifiedFontLoader />
        <Audio src={resolveAsset(audioUrl)} volume={1.0} />

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
              currentFromFrame,
              timeline,
              avatarDuration,
              avatarFps,
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

// --- Scene Rendering Logic for 4:5 (Using the intelligent resolver) ---
function renderScene4x5(
  scene: ConcreteScene,
  assets: string[],
  videoUrl: string,
  greenscreenUrl: string,
  startFrame: number,
  timeline?: ConcreteScene[],
  avatarDuration?: number,
  avatarFps?: number,
) {
  const getAsset = (index?: number) =>
    index !== undefined && assets[index] ? assets[index] : '';

  const resolvedVideoUrl = resolveAsset(videoUrl);
  const resolvedGreenscreenUrl = resolveAsset(greenscreenUrl);

  const actualFps = avatarFps || COMPOSITION_FPS;
  const baseAvatarVideoStartFrom = startFrame / actualFps;

  const actualAvatarDuration = avatarDuration || 10;
  const avatarVideoStartFrom = baseAvatarVideoStartFrom < actualAvatarDuration
    ? baseAvatarVideoStartFrom
    : baseAvatarVideoStartFrom % actualAvatarDuration;

  const resolvedAssetUrl = resolveAsset(getAsset(scene.assetIndices?.[0]));

  switch (scene.layout as LayoutType) {
    case 'fullscreen-avatar':
      return <FullScreenAvatar4x5 src={resolvedVideoUrl} startFrom={avatarVideoStartFrom} />;
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
        <SmallCutoutBottomLeftScene4x5
          backgroundSrc={resolvedAssetUrl}
          greenscreenSrc={resolvedGreenscreenUrl}
          avatarStartFrom={avatarVideoStartFrom}
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
        />
      );
    case 'buildup-collage':
        const collageAssets = scene.assetIndices?.map(i => resolveAsset(getAsset(i))) || [];
        return <BuildupCollageScene assetUrls={collageAssets} />;
    default:
      return <AbsoluteFill style={{ backgroundColor: 'darkslateblue' }} />;
  }
}

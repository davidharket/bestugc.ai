// remotion/scenes/SmallCutoutBottomLeftScene.tsx
import { AbsoluteFill, Img, OffthreadVideo, Video, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import { LoopingVideo } from '../components/LoopingVideo';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const SmallCutoutBottomLeftScene: React.FC<{
  backgroundSrc: string;
  greenscreenSrc: string;
  avatarStartFrom?: number;
  backgroundVideoDurationInFrames?: number;
}> = ({ backgroundSrc, greenscreenSrc, avatarStartFrom = 0, backgroundVideoDurationInFrames = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inputProps = getInputProps();
  
  // Check if we're in preview mode
  const isPreviewMode = (inputProps as any)?.adData?.previewMode === true;
  
  let videoStartFrame: number;
  
  if (isPreviewMode) {
    // PREVIEW MODE: Use simpler logic without custom looping
    // Just start from the beginning of the scene for preview
    videoStartFrame = 0;
  } else {
    // FINAL RENDER: Use original timing logic for proper lip-sync
    // Use the timeline position passed from Main.tsx for proper sync with processed avatar
    videoStartFrame = Math.round(avatarStartFrom * COMPOSITION_FPS);
  }

  if (!backgroundSrc) {
    console.warn('[SmallCutoutBottomLeftScene] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutBottomLeftScene] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '35%', // 50% of the original 70% height
      width: 'auto',
      bottom: '40px', // Padding from bottom
      left: '40px', // Padding from left side
      display: 'flex',
      alignItems: 'flex-end',
    };
  };

  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <AbsoluteFill className="bg-black">
      {/* Background layer */}
      {isVideo(backgroundSrc) ? (
        <LoopingVideo 
          src={backgroundSrc} 
          style={coverStyle} 
          videoDurationInFrames={backgroundVideoDurationInFrames}
          muted 
        />
      ) : (
        <Img src={backgroundSrc} style={coverStyle} />
      )}

      {/* Transparent overlay */}
      <div style={getPositionStyle()}>
        <OffthreadVideo
          src={greenscreenSrc}
          transparent={true}
          startFrom={videoStartFrame}
          muted={true}
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'bottom',
          }}
          onError={(error) => {
            console.error('[SmallCutoutBottomLeftScene] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
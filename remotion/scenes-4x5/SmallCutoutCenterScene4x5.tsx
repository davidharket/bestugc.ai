// remotion/scenes-4x5/SmallCutoutCenterScene4x5.tsx
import { AbsoluteFill, Img, OffthreadVideo, Video, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const SmallCutoutCenterScene4x5: React.FC<{
  backgroundSrc: string;
  greenscreenSrc: string;
  avatarStartFrom?: number;
}> = ({ backgroundSrc, greenscreenSrc, avatarStartFrom = 0 }) => {
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
    console.warn('[SmallCutoutCenterScene4x5] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutCenterScene4x5] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  // Adjusted for 4:5 aspect ratio (1080x1350)
  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '40%', // Slightly larger for 4:5 format
      width: 'auto',
      bottom: '30px', // Adjusted padding for 4:5
      left: '50%',
      transform: 'translateX(-50%)',
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
        <Video src={backgroundSrc} style={coverStyle} muted />
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
            console.error('[SmallCutoutCenterScene4x5] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
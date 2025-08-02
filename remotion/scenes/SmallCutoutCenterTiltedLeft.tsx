// remotion/scenes/SmallCutoutCenterTiltedLeft.tsx
import { AbsoluteFill, Img, OffthreadVideo, Video, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const SmallCutoutCenterTiltedLeft: React.FC<{
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
    videoStartFrame = 0;
  } else {
    videoStartFrame = Math.round(avatarStartFrom * COMPOSITION_FPS);
  }

  if (!backgroundSrc) {
    console.warn('[SmallCutoutCenterTiltedLeft] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutCenterTiltedLeft] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '40%', // Slightly larger for tilted view
      width: 'auto',
      top: '50%',
      left: '45%', // Slightly left of center
      transform: 'translate(-50%, -50%) rotate(-20deg)', // 20 degree tilt to the left
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
            objectPosition: 'center',
          }}
          onError={(error) => {
            console.error('[SmallCutoutCenterTiltedLeft] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
// remotion/scenes-4x5/SmallCutoutCenterTiltedRight4x5.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';
import { DualLayerBackground } from '../components/DualLayerBackground';


export const SmallCutoutCenterTiltedRight4x5: React.FC<{
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
    console.warn('[SmallCutoutCenterTiltedRight4x5] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutCenterTiltedRight4x5] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  // Adjusted for 4:5 aspect ratio (1080x1350)
  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '45%', // Increased from 40% to 45% for tilted view in 4:5 format
      width: 'auto',
      top: '50%',
      left: '55%', // Slightly right of center
      transform: 'translate(-50%, -50%) rotate(20deg)', // 20 degree tilt to the right
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };


  return (
    <AbsoluteFill className="bg-black">
      {/* Background layer with dual-layer system */}
      <DualLayerBackground 
        src={backgroundSrc}
        
      />

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
            console.error('[SmallCutoutCenterTiltedRight4x5] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
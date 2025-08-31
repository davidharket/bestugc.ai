// remotion/scenes-4x5/SmallCutoutTopRight4x5.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';
import { DualLayerBackground } from '../components/DualLayerBackground';


export const SmallCutoutTopRight4x5: React.FC<{
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
    // Use detected avatar FPS if available
    const avatarFps = (inputProps as any)?.avatarFps;
    const effectiveFps = avatarFps || COMPOSITION_FPS;
    videoStartFrame = Math.round(avatarStartFrom * effectiveFps);
  }

  if (!backgroundSrc) {
    console.warn('[SmallCutoutTopRight4x5] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutTopRight4x5] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  // Adjusted for 4:5 aspect ratio (1080x1350)
  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '40%', // Increased from 35% to 40% for 4:5 format
      width: 'auto',
      top: '30px', // Reduced padding from 40px to 30px
      right: '30px', // Reduced padding from 40px to 30px
      display: 'flex',
      alignItems: 'flex-start',
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
            objectPosition: 'top',
          }}
          onError={(error) => {
            console.error('[SmallCutoutTopRight4x5] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
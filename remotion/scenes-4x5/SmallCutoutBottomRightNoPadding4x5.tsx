// remotion/scenes-4x5/SmallCutoutBottomRightNoPadding4x5.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';
import { DualLayerBackground } from '../components/DualLayerBackground';


export const SmallCutoutBottomRightNoPadding4x5: React.FC<{
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
    console.warn('[SmallCutoutBottomRightNoPadding4x5] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutBottomRightNoPadding4x5] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  // Adjusted for 4:5 aspect ratio (1080x1350) - no padding version
  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '40%', // Increased from 35% to 40% for 4:5 format
      width: 'auto',
      bottom: '0px', // No padding
      right: '0px', // No padding
      display: 'flex',
      alignItems: 'flex-end',
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
            objectPosition: 'bottom',
          }}
          onError={(error) => {
            console.error('[SmallCutoutBottomRightNoPadding4x5] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
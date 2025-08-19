// remotion/scenes/SmallCutoutBottomLeftNoPadding.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import React from 'react';
import { DualLayerBackground } from '../components/DualLayerBackground';
import { COMPOSITION_FPS } from '../constants';


export const SmallCutoutBottomLeftNoPadding: React.FC<{
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
    console.warn('[SmallCutoutBottomLeftNoPadding] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutBottomLeftNoPadding] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '35%', // 50% of the original 70% height
      width: 'auto',
      bottom: '0px', // No padding
      left: '0px', // No padding
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
            console.error('[SmallCutoutBottomLeftNoPadding] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
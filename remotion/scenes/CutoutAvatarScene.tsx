// remotion/scenes/CutoutAvatarScene.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import { DualLayerBackground } from '../components/DualLayerBackground';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';


export const CutoutAvatarScene: React.FC<{
  backgroundSrc: string;
  greenscreenSrc: string;
  position: 'center' | 'left' | 'right';
  avatarStartFrom?: number;
}> = ({ backgroundSrc, greenscreenSrc, position, avatarStartFrom = 0 }) => {
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
    console.warn('[CutoutAvatarScene] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[CutoutAvatarScene] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      height: '70%',
      width: 'auto',
      bottom: '0px',
      display: 'flex',
      alignItems: 'flex-end',
    };

    switch (position) {
      case 'left':
        return { ...baseStyle, left: '0px' };
      
      case 'right':
        return { ...baseStyle, right: '-20px' };
      
      case 'center':
      default:
        return {
          ...baseStyle,
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
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
            console.error('[CutoutAvatarScene] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
// remotion/scenes/SmallCutoutBottomRightScene.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { DualLayerBackground } from '../components/DualLayerBackground';
import { COMPOSITION_FPS } from '../constants';
import { safeGetInputProps } from '../utils/safeInputProps';


export const SmallCutoutBottomRightScene: React.FC<{
  backgroundSrc: string;
  greenscreenSrc: string;
  avatarStartFrom?: number;
}> = ({ backgroundSrc, greenscreenSrc, avatarStartFrom = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inputProps = safeGetInputProps();
  
  // Simple avatar timing logic
  const avatarFps = (inputProps as any)?.avatarFps || fps;
  const videoStartFrame = Math.round(avatarStartFrom * avatarFps);
  
  console.log('[SmallCutoutBottomRightScene] StartFrom:', avatarStartFrom, 'AvatarFPS:', avatarFps, 'VideoStartFrame:', videoStartFrame);

  if (!backgroundSrc) {
    console.warn('[SmallCutoutBottomRightScene] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutBottomRightScene] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '35%', // 50% of the original 70% height
      width: 'auto',
      bottom: '40px', // Padding from bottom
      right: '40px', // Padding from right side
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
            transform: 'none'
          }}
          onError={(error) => {
            console.error('[SmallCutoutBottomRightScene] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
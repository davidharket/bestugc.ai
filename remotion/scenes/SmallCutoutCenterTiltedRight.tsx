// remotion/scenes/SmallCutoutCenterTiltedRight.tsx
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { DualLayerBackground } from '../components/DualLayerBackground';
import { COMPOSITION_FPS } from '../constants';
import { safeGetInputProps } from '../utils/safeInputProps';


export const SmallCutoutCenterTiltedRight: React.FC<{
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
  
  console.log('[SmallCutoutCenterTiltedRight] StartFrom:', avatarStartFrom, 'AvatarFPS:', avatarFps, 'VideoStartFrame:', videoStartFrame);

  if (!backgroundSrc) {
    console.warn('[SmallCutoutCenterTiltedRight] No backgroundSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!greenscreenSrc) {
    console.warn('[SmallCutoutCenterTiltedRight] No greenscreenSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: '40%', // Slightly larger for tilted view
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
            transform: 'none'
          }}
          onError={(error) => {
            console.error('[SmallCutoutCenterTiltedRight] OffthreadVideo error:', error);
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
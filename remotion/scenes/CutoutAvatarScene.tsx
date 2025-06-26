// remotion/scenes/CutoutAvatarScene.tsx
import { AbsoluteFill, Img, OffthreadVideo, Video } from 'remotion';
import React from 'react';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const CutoutAvatarScene: React.FC<{
  backgroundSrc: string;
  greenscreenSrc: string;
  position: 'center' | 'left' | 'right';
  avatarStartFrom?: number;
}> = ({ backgroundSrc, greenscreenSrc, position, avatarStartFrom = 0 }) => {

  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      height: '70%',
      width: 'auto',
      bottom: '0px', // Correct: Container touches bottom
      display: 'flex',
      alignItems: 'flex-end', // Correct: Align video content to bottom of its container
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

  // Define a style that forces the background to cover the screen
  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <AbsoluteFill className="bg-black">
      {/* Background layer with corrected cover style */}
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
          startFrom={avatarStartFrom}
          muted={true}
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'bottom', // Correct: Align video content to bottom
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
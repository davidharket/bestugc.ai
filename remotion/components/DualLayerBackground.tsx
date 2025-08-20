import React from 'react';
import { AbsoluteFill, Img, Video } from 'remotion';
import { LoopableOffthreadVideo } from './LoopableOffthreadVideo';

interface DualLayerBackgroundProps {
  src: string;
  blurAmount?: number;
}

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const DualLayerBackground: React.FC<DualLayerBackgroundProps> = ({
  src,
  blurAmount = 8
}) => {
  if (!src) {
    return <AbsoluteFill style={{ backgroundColor: '#000000' }} />;
  }

  const blurredBackgroundStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: `blur(${blurAmount}px)`,
    transform: 'scale(1.1)',
  };

  const mainImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))',
  };

  return (
    <AbsoluteFill>
      {/* Blurred background layer - covers entire area */}
      <AbsoluteFill>
        {isVideo(src) ? (
          <LoopableOffthreadVideo 
            src={src} 
            style={blurredBackgroundStyle}
            muted 
            loop={true}
          />
        ) : (
          <Img src={src} style={blurredBackgroundStyle} />
        )}
      </AbsoluteFill>

      {/* Main content layer - fits to contain */}
      <AbsoluteFill>
        {isVideo(src) ? (
          <LoopableOffthreadVideo 
            src={src} 
            style={mainImageStyle}
            muted 
            loop={true}
          />
        ) : (
          <Img src={src} style={mainImageStyle} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
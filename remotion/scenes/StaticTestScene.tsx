import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface StaticTestSceneProps {
  text?: string;
}

export const StaticTestScene: React.FC<StaticTestSceneProps> = ({
  text = "Test Video"
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Animate opacity
  const opacity = interpolate(frame, [0, 30, 420, 450], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontSize: '60px',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          opacity,
          textAlign: 'center'
        }}
      >
        {text}
        <br />
        <div style={{ fontSize: '30px', marginTop: '20px' }}>
          Frame: {frame}
        </div>
      </div>
    </AbsoluteFill>
  );
}; 
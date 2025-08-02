// remotion/scenes/BuildupCollageScene.tsx
import {
  AbsoluteFill,
  Img,
  Video,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import React from 'react';

const isVideo = (url: string) => url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');

export const BuildupCollageScene: React.FC<{
  assetUrls: string[];
}> = ({ assetUrls }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Define grid positions for up to 3 assets
  const positions: React.CSSProperties[] = [
    { top: '10%', left: '10%', width: '40%', height: '40%' },
    { top: '50%', left: '50%', width: '40%', height: '40%' },
    { top: '30%', left: '30%', width: '40%', height: '40%' },
  ];

  return (
    <AbsoluteFill className="bg-gray-800">
      {assetUrls.map((src, index) => {
        if (!src) return null;

        // Animate each asset appearing with a spring and fade effect
        const animation = spring({
          frame: frame - index * 10, // Stagger the animation start
          fps,
          config: {
            damping: 20,
            stiffness: 150,
          },
        });

        const pos = positions[index % positions.length];

        return (
          <AbsoluteFill
            key={src}
            style={{
              transform: `scale(${animation})`,
              opacity: animation,
              ...pos,
            }}
            className="flex items-center justify-center"
          >
            <div className="rounded-lg overflow-hidden border-4 border-white shadow-2xl w-full h-full">
              {isVideo(src) ? (
                <Video src={src} className="w-full h-full object-cover" muted />
              ) : (
                <Img src={src} className="w-full h-full object-cover" />
              )}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
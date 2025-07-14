// remotion/scenes/AvatarWithCornerAsset.tsx
import { AbsoluteFill, Img, Video } from 'remotion';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const AvatarWithCornerAsset: React.FC<{
  videoSrc: string;
  assetSrc: string;
  startFrom?: number; // In seconds
}> = ({ videoSrc, assetSrc, startFrom = 0 }) => {
  // Convert seconds to frames for Video startFrom parameter
  const startFromFrames = Math.round(startFrom * COMPOSITION_FPS);

  if (!videoSrc) {
    console.warn('[AvatarWithCornerAsset] No videoSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!assetSrc) {
    console.warn('[AvatarWithCornerAsset] No assetSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  return (
    <AbsoluteFill className="bg-black">
      {/* Main Avatar Video (Correct) */}
      <Video
        src={videoSrc}
        className="w-full h-full object-cover"
        startFrom={startFromFrames} // Use frames instead of seconds
        muted={true}
      />

      {/* --- FIX #3: Restyle the corner asset to be a padded square --- */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px', // Padding from the bottom
          left: '50px',   // Padding from the left
          width: '50%',   // Set the width
          aspectRatio: '1 / 1', // Make it a square
          borderRadius: '16px', // A nice rounded corner for a square
          overflow: 'hidden',   // Crucial to crop the content inside
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          border: '3px solid rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* The content inside will be cropped by the square container */}
        {isVideo(assetSrc) ? (
          <Video
            src={assetSrc}
            // Style the video to cover the square area
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            loop
          />
        ) : (
          <Img
            src={assetSrc}
            // Style the image to cover the square area
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
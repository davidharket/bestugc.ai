// remotion/scenes/SplitScreenScene.tsx
import { AbsoluteFill, Img, Video } from 'remotion';
import React from 'react';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const SplitScreenScene: React.FC<{
  videoSrc: string; // Avatar video
  assetSrc: string; // Product image or video
  startFrom?: number;
}> = ({ videoSrc, assetSrc, startFrom = 0 }) => {

  // Style for the TOP asset. This is correct and remains unchanged.
  const assetFillStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    order: '0',
    objectFit: 'cover',
  };

  // --- THE FINAL FIX: A new style to manually position the avatar ---
  const avatarVideoStyle: React.CSSProperties = {
    // We want the video's width to match the container's width.
    width: '100%',
    // We set height to 'auto' to maintain the video's aspect ratio.
    height: 'auto',
    // Now, we use a transform to manually slide the video upwards.
    // A negative Y value moves the element up.
    // -25% is a strong initial value to ensure the face is visible.
    // You can adjust this value (e.g., to -20% or -30%) for perfect framing.
    transform: 'translateY(-25%)',
  };
  // --- END OF FIX ---

  return (
    <AbsoluteFill className="bg-black flex flex-col">
      {/* Top Half: Asset - Strictly cropped to 50% height */}
      <div 
        className="w-full overflow-hidden bg-black"
        style={{ 
          position: 'relative',
          zIndex: 10, // Higher than avatar
          height: '50%', // Explicit 50% height
          maxHeight: '50vh', // Maximum 50% of viewport height
          minHeight: '50%', // Minimum 50% height
          flexShrink: 0, // Prevent shrinking
          flexGrow: 0 // Prevent growing
        }}
      >
        {isVideo(assetSrc) ? (
          <Video 
            src={assetSrc} 
            style={{
              ...assetFillStyle,
              // Ensure it fills exactly the container bounds
              minHeight: '100%',
              maxHeight: '100%'
            }} 
            muted 
            loop 
          />
        ) : (
          <Img 
            src={assetSrc} 
            style={{
              ...assetFillStyle,
              // Ensure it fills exactly the container bounds
              minHeight: '100%',
              maxHeight: '100%'
            }}
          />
        )}
      </div>

      {/* Bottom Half: Avatar's container - Strictly cropped to 50% height */}
      <div 
        className="w-full overflow-hidden bg-black"
        style={{ 
          position: 'relative',
          zIndex: 1, // Lower than asset
          height: '50%', // Explicit 50% height
          maxHeight: '50vh', // Maximum 50% of viewport height
          minHeight: '50%', // Minimum 50% height
          flexShrink: 0, // Prevent shrinking
          flexGrow: 0 // Prevent growing
        }}
      >
        {/* The video element with the new transform style */}
        <Video
          src={videoSrc}
          style={{
            ...avatarVideoStyle,
            // Ensure the avatar stays within bounds even with transform
            minHeight: '100%',
            maxHeight: 'none', // Allow overflow for transform positioning
            maxWidth: '100%'
          }}
          startFrom={startFrom}
          muted={true}
        />
      </div>
    </AbsoluteFill>
  );
};
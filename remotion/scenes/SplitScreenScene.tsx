// remotion/scenes/SplitScreenScene.tsx
import { AbsoluteFill, Img, Video, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import { LoopingVideo } from '../components/LoopingVideo';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const SplitScreenScene: React.FC<{
  videoSrc: string; // Avatar video
  assetSrc: string; // Product image or video
  startFrom?: number; // In seconds
  assetVideoDurationInFrames?: number;
}> = ({ videoSrc, assetSrc, startFrom = 0, assetVideoDurationInFrames = 300 }) => {
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
    videoStartFrame = Math.round(startFrom * COMPOSITION_FPS);
  }

  if (!videoSrc) {
    console.warn('[SplitScreenScene] No videoSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!assetSrc) {
    console.warn('[SplitScreenScene] No assetSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

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
          <LoopingVideo 
            src={assetSrc} 
            style={{
              ...assetFillStyle,
              // Ensure it fills exactly the container bounds
              minHeight: '100%',
              maxHeight: '100%'
            }}
            videoDurationInFrames={assetVideoDurationInFrames}
            muted 
            playsInline={true}
            preload="metadata"
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
          startFrom={videoStartFrame}
          muted={true}
          playsInline={true}
          preload="metadata"
        />
      </div>
    </AbsoluteFill>
  );
};
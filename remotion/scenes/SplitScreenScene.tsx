// remotion/scenes/SplitScreenScene.tsx
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig } from 'remotion';
import { DualLayerBackground } from '../components/DualLayerBackground';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';
import { safeGetInputProps } from '../utils/safeInputProps';


export const SplitScreenScene: React.FC<{
  videoSrc: string; // Avatar video
  assetSrc: string; // Product image or video
  startFrom?: number; // In seconds
}> = ({ videoSrc, assetSrc, startFrom = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inputProps = safeGetInputProps();
  
  // Simple avatar timing logic
  const avatarFps = (inputProps as any)?.avatarFps || fps;
  const videoStartFrame = Math.round(startFrom * avatarFps);
  
  console.log('[SplitScreenScene] Timeline sync - StartFrom:', startFrom, 'AvatarFPS:', avatarFps, 'VideoStartFrame:', videoStartFrame);

  if (!videoSrc) {
    console.warn('[SplitScreenScene] No videoSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }
  
  if (!assetSrc) {
    console.warn('[SplitScreenScene] No assetSrc provided');
    return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
  }

  // No need for asset fill style as DualLayerBackground handles it

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
    // Simple translateY positioning
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
        <DualLayerBackground
          src={assetSrc}
          blurAmount={6}
        />
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
        {/* The avatar video with looping and transform style */}
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
// remotion/scenes/AvatarWithCornerAsset.tsx
import { AbsoluteFill, Img, Video, useCurrentFrame, useVideoConfig } from 'remotion';
import { LoopingVideo } from '../components/LoopingVideo';
import React from 'react';
import { COMPOSITION_FPS } from '../constants';
import { safeGetInputProps } from '../utils/safeInputProps';

const isVideo = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
};

export const AvatarWithCornerAsset: React.FC<{
  videoSrc: string;
  assetSrc: string;
  startFrom?: number; // In seconds
  assetVideoDurationInFrames?: number;
}> = ({ videoSrc, assetSrc, startFrom = 0, assetVideoDurationInFrames = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inputProps = safeGetInputProps();
  
  // Simple avatar timing logic
  const avatarFps = (inputProps as any)?.avatarFps || fps;
  const videoStartFrame = Math.round(startFrom * avatarFps);
  
  console.log('[AvatarWithCornerAsset] Timeline sync - StartFrom:', startFrom, 'AvatarFPS:', avatarFps, 'VideoStartFrame:', videoStartFrame);

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
        startFrom={videoStartFrame}
        muted={true}
        playsInline={true}
        preload="metadata"
        style={{
          transform: 'none'
        }}
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
          <LoopingVideo
            src={assetSrc}
            // Style the video to cover the square area
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            videoDurationInFrames={assetVideoDurationInFrames}
            muted
            playsInline={true}
            preload="metadata"
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
// remotion/components/LoopingVideo.tsx
import React from 'react';
import { Video, useCurrentFrame, useVideoConfig } from 'remotion';

interface LoopingVideoProps {
  src: string;
  startFrom?: number;
  videoDurationInFrames?: number; // Duration of the source video in frames
  style?: React.CSSProperties;
  className?: string;
  muted?: boolean;
  playsInline?: boolean;
  preload?: string;
  onError?: (error: any) => void;
}

/**
 * A video component that loops with reverse playback when the video is shorter than the scene duration.
 * When the video reaches its end, it starts playing in reverse until it reaches the beginning, then loops forward again.
 * 
 * This creates a "ping-pong" or "bounce" effect that ensures continuous motion without jarring cuts.
 * 
 * Example timeline for a 5-second video in a 12-second scene:
 * Frame 0-150: Forward playback (0 → 5 seconds)
 * Frame 150-300: Reverse playback (5 → 0 seconds) 
 * Frame 300-450: Forward playback (0 → 5 seconds)
 * Frame 450-600: Reverse playback (5 → 0 seconds)
 * etc.
 */
export const LoopingVideo: React.FC<LoopingVideoProps> = ({
  src,
  startFrom = 0,
  videoDurationInFrames = 300, // Default to 10 seconds at 30fps - you may want to detect this
  style,
  className,
  muted = true,
  playsInline = true,
  preload = "metadata",
  onError
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  if (!src) {
    return null;
  }

  // Calculate the effective playback position with ping-pong looping
  const calculateVideoFrame = (): number => {
    // Total cycle length is twice the video duration (forward + reverse)
    const cycleLength = videoDurationInFrames * 2;
    
    // Current position in the cycle
    const cyclePosition = frame % cycleLength;
    
    let videoFrame: number;
    
    if (cyclePosition < videoDurationInFrames) {
      // Forward playback: frame 0 to videoDurationInFrames-1
      videoFrame = cyclePosition;
    } else {
      // Reverse playback: videoDurationInFrames-1 back to 0
      videoFrame = videoDurationInFrames - 1 - (cyclePosition - videoDurationInFrames);
    }
    
    // Add the startFrom offset
    return Math.max(0, videoFrame + Math.round(startFrom * fps));
  };

  const effectiveStartFrame = calculateVideoFrame();

  return (
    <Video
      src={src}
      startFrom={effectiveStartFrame}
      style={style}
      className={className}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      onError={onError}
    />
  );
};

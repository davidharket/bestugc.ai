// Utility for dynamic avatar timing with ping-pong looping
export const calculateAvatarTiming = (
  frame: number,
  fps: number,
  startFrom: number,
  avatarDuration: number,
  isPreviewMode: boolean,
  avatarFps?: number
) => {
  let videoStartFrame: number;
  let shouldReverse = false;
  
  // Use detected avatar FPS if available, otherwise fall back to composition FPS
  const effectiveAvatarFps = avatarFps || fps;
  
  if (isPreviewMode) {
    // PREVIEW MODE: Continuous avatar video flowing through entire composition
    // The avatar video should play continuously, using the global composition time
    const globalTimeInSeconds = (frame / fps) + startFrom;
    
    // Ensure we have a valid avatar duration, fallback to prevent issues
    const safeDuration = avatarDuration > 0 ? avatarDuration : 10;
    
    if (globalTimeInSeconds <= safeDuration) {
      // Avatar video is still within its original duration - play normally
      // Use detected avatar FPS for proper playback speed
      videoStartFrame = Math.round(globalTimeInSeconds * effectiveAvatarFps);
      shouldReverse = false;
    } else {
      // Avatar video has ended, start ping-pong looping
      const overTime = globalTimeInSeconds - safeDuration;
      const cycleTime = overTime % (safeDuration * 2);
      
      if (cycleTime <= safeDuration) {
        // First ping-pong: play reverse (from end to start)
        const reverseTime = safeDuration - cycleTime;
        videoStartFrame = Math.round(reverseTime * effectiveAvatarFps);
        shouldReverse = true;
      } else {
        // Second ping-pong: play forward again (from start to end)
        const forwardTime = cycleTime - safeDuration;
        videoStartFrame = Math.round(forwardTime * effectiveAvatarFps);
        shouldReverse = false;
      }
    }
  } else {
    // FINAL RENDER: Use original timing logic for proper lip-sync
    // Use detected avatar FPS for proper synchronization
    videoStartFrame = Math.round(startFrom * effectiveAvatarFps);
  }
  
  // Ensure videoStartFrame is never negative
  videoStartFrame = Math.max(0, videoStartFrame);
  
  return { videoStartFrame, shouldReverse };
};
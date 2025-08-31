import React, { useEffect, useRef } from 'react';

interface VideoPreloaderProps {
  avatarSrc: string;
  assets: (string | null)[];
}

/**
 * Preloads all videos to avoid black loading states
 * This component renders invisible videos with preload="metadata" 
 * to ensure they're ready when needed
 */
export const VideoPreloader: React.FC<VideoPreloaderProps> = ({ avatarSrc, assets }) => {
  const preloadRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    // Helper function to check if a URL is a video
    const isVideo = (url: string): boolean => {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    // Preload avatar video
    if (avatarSrc && !preloadRefs.current[avatarSrc]) {
      const video = document.createElement('video');
      video.src = avatarSrc;
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      preloadRefs.current[avatarSrc] = video;
    }

    // Preload asset videos
    assets.forEach(asset => {
      if (asset && isVideo(asset) && !preloadRefs.current[asset]) {
        const video = document.createElement('video');
        video.src = asset.startsWith('b-roll/') ? `/${asset}` : asset;
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        preloadRefs.current[asset] = video;
      }
    });

    // Cleanup function
    return () => {
      Object.values(preloadRefs.current).forEach(video => {
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
      });
      preloadRefs.current = {};
    };
  }, [avatarSrc, assets]);

  return null; // This component doesn't render anything visible
};

export default VideoPreloader;
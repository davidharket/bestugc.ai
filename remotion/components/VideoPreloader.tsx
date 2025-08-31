import React, { useState, useEffect } from 'react';
import { preloadVideo } from '@remotion/preload';
import { delayRender, continueRender } from 'remotion';

export interface VideoPreloaderProps {
  videos: string[];
  children: React.ReactNode;
}

export const VideoPreloader: React.FC<VideoPreloaderProps> = ({
  videos,
  children,
}) => {
  const [handle] = useState(() => delayRender('Video Preloader'));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Filter out empty or invalid video URLs
    const validVideos = videos.filter(url => url && url.trim() !== '');
    
    if (validVideos.length === 0) {
      // No videos to preload, continue immediately
      continueRender(handle);
      setIsLoaded(true);
      return;
    }

    console.log('[VideoPreloader] Preloading videos:', validVideos.length);
    
    // Preload all videos using @remotion/preload
    const unpreloaders: (() => void)[] = [];
    
    try {
      validVideos.forEach(video => {
        try {
          const unpreload = preloadVideo(video);
          unpreloaders.push(unpreload);
        } catch (error) {
          console.warn('[VideoPreloader] Failed to preload video:', video, error);
        }
      });
      
      console.log('[VideoPreloader] All videos preloading started');
      continueRender(handle);
      setIsLoaded(true);
      
      // Cleanup function to unpreload videos when component unmounts
      return () => {
        unpreloaders.forEach(unpreload => {
          try {
            unpreload();
          } catch (error) {
            console.warn('[VideoPreloader] Error during cleanup:', error);
          }
        });
      };
    } catch (error) {
      console.error('[VideoPreloader] Error setting up preloading:', error);
      // Continue rendering even if preloading fails
      continueRender(handle);
      setIsLoaded(true);
    }
  }, [handle, videos]);

  // Show loading state or render children
  if (!isLoaded) {
    return null; // Remotion will show loading state
  }

  return <>{children}</>;
};

// Utility function to collect all video URLs from a composition's data
export const collectVideoUrls = (
  adData: any,
  processedAvatarUrl?: string,
  greenscreenAvatarUrl?: string,
  originalProductVideoUrl?: string,
  concatenatedProductVideoUrl?: string
): string[] => {
  const urls: string[] = [];
  
  // Add avatar videos
  if (processedAvatarUrl) urls.push(processedAvatarUrl);
  if (greenscreenAvatarUrl) urls.push(greenscreenAvatarUrl);
  
  // Add product videos
  if (originalProductVideoUrl) urls.push(originalProductVideoUrl);
  if (concatenatedProductVideoUrl) urls.push(concatenatedProductVideoUrl);
  
  // Add videos from selected images/assets
  if (adData?.selectedImages && Array.isArray(adData.selectedImages)) {
    adData.selectedImages.forEach((asset: any) => {
      if (asset?.url && typeof asset.url === 'string') {
        // Check if asset is a video by extension
        const isVideo = asset.url.toLowerCase().match(/\.(mp4|webm|mov|avi)$/i);
        if (isVideo) {
          urls.push(asset.url);
        }
      }
    });
  }
  
  // Remove duplicates and filter out empty URLs
  const uniqueUrls = Array.from(new Set(urls));
  return uniqueUrls.filter(url => url && url.trim() !== '');
};
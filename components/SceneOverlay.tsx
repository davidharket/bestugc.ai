import React, { useRef, useEffect } from 'react';

interface SceneOverlayProps {
  sceneLayout: string;
  asset: string | null;
  currentPreviewFormat: '4:5' | '9:16';
  currentTime?: number;
  isPlaying?: boolean;
}

export const SceneOverlay: React.FC<SceneOverlayProps> = ({ 
  sceneLayout, 
  asset,
  currentPreviewFormat,
  currentTime = 0,
  isPlaying = false
}) => {
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const foregroundVideoRef = useRef<HTMLVideoElement>(null);
  const avatarCornerVideoRef = useRef<HTMLVideoElement>(null);
  const splitScreenVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  
  // Sync all video elements with timeline
  useEffect(() => {
    const syncVideo = (videoRef: React.RefObject<HTMLVideoElement>) => {
      if (videoRef.current) {
        const video = videoRef.current;
        const timeDiff = Math.abs(video.currentTime - currentTime);
        
        // Only seek if time difference is significant (>0.1s) to avoid constant seeking
        if (timeDiff > 0.1) {
          video.currentTime = currentTime;
        }
        
        // Sync play/pause state
        if (isPlaying && video.paused) {
          video.play().catch(() => {}); // Ignore play errors
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    };

    syncVideo(backgroundVideoRef);
    syncVideo(foregroundVideoRef);
    syncVideo(avatarCornerVideoRef);
    syncVideo(splitScreenVideoRef);
    syncVideo(fullscreenVideoRef);
  }, [currentTime, isPlaying]);

  if (!sceneLayout || sceneLayout === 'fullscreen-avatar') {
    // No overlay needed for fullscreen avatar
    return null;
  }

  const isVideo = (url: string): boolean => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(mp4|webm|mov|avi)$/i) !== null;
  };

  // Render blurred background asset - matches Remotion DualLayerBackground implementation
  const renderBlurredBackground = () => {
    if (!asset) return null;
    
    return (
      <div className="absolute inset-0">
        {isVideo(asset) ? (
          <video
            ref={backgroundVideoRef}
            src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
            className="w-full h-full object-cover"
            preload="auto"
            style={{
              filter: 'blur(8px)', // Match Remotion's blur(8px)
              transform: 'scale(1.1)', // Match Remotion's scale to avoid blur edge artifacts
            }}
            muted
            loop
            playsInline
            onLoadedData={() => {
              if (backgroundVideoRef.current) {
                backgroundVideoRef.current.currentTime = currentTime;
              }
            }}
          />
        ) : (
          <img
            src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
            alt="Background"
            className="w-full h-full object-cover"
            style={{
              filter: 'blur(8px)', // Match Remotion's blur(8px)
              transform: 'scale(1.1)', // Match Remotion's scale to avoid blur edge artifacts
            }}
          />
        )}
      </div>
    );
  };

  // Render sharp foreground content (avatar or asset)
  const renderSharpForeground = (content: 'avatar' | 'asset', position: keyof typeof positionClasses, size: keyof typeof sizeClasses) => {
    if (content === 'asset' && !asset) return null;
    
    const baseClasses = "absolute flex items-center justify-center";
    const positionClasses = {
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4', 
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      'top-half': 'top-0 left-0 right-0 h-1/2',
      'bottom-half': 'bottom-0 left-0 right-0 h-1/2',
      'corner-large': 'bottom-12 left-12'
    } as const;
    
    const sizeClasses = {
      'small': 'w-1/3 aspect-square',
      'medium': 'w-1/2 aspect-square', 
      'large': 'w-2/3 aspect-video',
      'half': 'w-full h-full',
      'corner': 'w-1/2 aspect-square'
    } as const;

    if (content === 'avatar') {
      // Avatar will be handled by the parent video element with CSS positioning
      return (
        <div className={`${baseClasses} ${positionClasses[position]} ${sizeClasses[size]} pointer-events-none`}>
          {/* Avatar video will show through here - we just provide positioning */}
        </div>
      );
    } else {
      // Render asset
      return (
        <div className={`${baseClasses} ${positionClasses[position]} ${sizeClasses[size]}`}>
          {asset && isVideo(asset) ? (
            <video
              src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
              className="max-w-full max-h-full object-contain"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
            />
          ) : asset ? (
            <img
              src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
              alt="Scene asset"
              className="max-w-full max-h-full object-contain"
            />
          ) : null}
        </div>
      );
    }
  };

  // Common styles for different scene types
  const getSceneOverlay = () => {
    switch (sceneLayout) {
      case 'small-cutout-bottom-left':
      case 'small-cutout-bottom-right':
      case 'small-cutout-center':
      case 'small-cutout-top-left':
      case 'small-cutout-top-right':
      case 'small-cutout-bottom-right-no-padding':
      case 'small-cutout-center-tilted-left':
      case 'small-cutout-center-tilted-right':
        return (
          <div className="absolute inset-0">
            {/* Blurred background - asset covers the full screen */}
            {renderBlurredBackground()}
            
            {/* Sharp foreground asset centered and contained */}
            <div className="absolute inset-0 flex items-center justify-center">
              {asset && (
                isVideo(asset) ? (
                  <video
                    ref={foregroundVideoRef}
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                    }}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => {
                      if (foregroundVideoRef.current) {
                        foregroundVideoRef.current.currentTime = currentTime;
                      }
                    }}
                  />
                ) : (
                  <img
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    alt="Scene asset"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                    }}
                  />
                )
              )}
            </div>
            
            {/* Avatar will be positioned in corner via parent video styling */}
          </div>
        );

      case 'avatar-with-corner-asset':
        return (
          <div className="absolute inset-0">
            {/* Blurred background - asset covers the full screen */}
            {renderBlurredBackground()}
            
            {/* Sharp foreground asset centered and contained */}
            <div className="absolute inset-0 flex items-center justify-center">
              {asset && (
                isVideo(asset) ? (
                  <video
                    ref={avatarCornerVideoRef}
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                    }}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => {
                      if (avatarCornerVideoRef.current) {
                        avatarCornerVideoRef.current.currentTime = currentTime;
                      }
                    }}
                  />
                ) : (
                  <img
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    alt="Scene asset"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                    }}
                  />
                )
              )}
            </div>
            
            {/* Avatar will be positioned in corner via parent video styling - not blurred */}
          </div>
        );

      case 'split-screen-top-asset':
        return (
          <div className="absolute inset-0">
            {/* Top half - Asset */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-black/20 border-b-2 border-white/30 overflow-hidden z-10">
              {asset && (
                <div className="relative w-full h-full">
                  {/* Blurred background */}
                  {isVideo(asset) ? (
                    <video
                      src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'blur(8px)', // Match Remotion's blur(8px)
                        transform: 'scale(1.1)', // Match Remotion's scale to avoid blur edge artifacts
                      }}
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                  ) : (
                    <img
                      src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                      alt="Background"
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'blur(8px)', // Match Remotion's blur(8px)
                        transform: 'scale(1.1)', // Match Remotion's scale to avoid blur edge artifacts
                      }}
                    />
                  )}
                  
                  {/* Sharp foreground */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideo(asset) ? (
                      <video
                        ref={splitScreenVideoRef}
                        src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                        }}
                        muted
                        loop
                        playsInline
                        preload="auto"
                        onLoadedData={() => {
                          if (splitScreenVideoRef.current) {
                            splitScreenVideoRef.current.currentTime = currentTime;
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                        alt="Scene asset"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))', // Match Remotion's drop shadow
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom half remains for avatar video (handled by parent) */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 border-t border-white/10">
              {/* Avatar video will show through here */}
            </div>
            
            {/* Split line indicator */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/40 transform -translate-y-0.5"></div>
          </div>
        );

      case 'fullscreen-asset':
        return (
          <div className="absolute inset-0">
            {renderBlurredBackground()}
            
            {/* Sharp foreground asset displayed fullscreen */}
            <div className="absolute inset-0 flex items-center justify-center">
              {asset && (
                isVideo(asset) ? (
                  <video
                    ref={fullscreenVideoRef}
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    className="max-w-full max-h-full object-contain"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => {
                      if (fullscreenVideoRef.current) {
                        fullscreenVideoRef.current.currentTime = currentTime;
                      }
                    }}
                  />
                ) : (
                  <img
                    src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                    alt="Scene asset"
                    className="max-w-full max-h-full object-contain"
                  />
                )
              )}
            </div>
          </div>
        );

      default:
        // Show a generic indicator for unknown scene types
        return (
          <div className="absolute top-4 right-4 bg-orange-500/80 text-white text-xs px-2 py-1 rounded">
            {sceneLayout}
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {getSceneOverlay()}
    </div>
  );
};
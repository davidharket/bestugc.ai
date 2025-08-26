// components/AdCard.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Ad } from '../types/Ad';
import BarLoader from './BarLoader';

const AdCard = React.memo(function AdCard({ ad, onDelete, onCancel, onRetry, userPlan }: { 
  ad: Ad; 
  onDelete: (adId: string) => void; 
  onCancel: (adId: string) => void;
  onRetry?: (adId: string) => void;
  userPlan?: string;
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<'16:9' | '4:5'>('16:9');
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVideoLoad = useCallback(() => {
    setHasVideoLoaded(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const getVideoUrl = (finalVideoUrl: string | undefined) => {
    if (!finalVideoUrl) return '';
    
    if (finalVideoUrl.startsWith('http')) return finalVideoUrl;
    
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      
      if (finalVideoUrl.startsWith('/renders/')) {
        const filename = finalVideoUrl.replace('/renders/', '');
        return `${baseUrl}/api/serve-video/${filename}`;
      }
      
      if (finalVideoUrl.startsWith('/synclabs/')) {
        const filename = finalVideoUrl.replace('/synclabs/', '');
        return `${baseUrl}/api/serve-video/synclabs/${filename}`;
      }
      
      return `${baseUrl}${finalVideoUrl}`;
    }
    
    return finalVideoUrl;
  };

  const getCurrentVideoUrl = () => {
    if (ad.enableDualFormat && currentFormat === '4:5' && ad.finalVideoUrl4x5) {
      return getVideoUrl(ad.finalVideoUrl4x5);
    }
    return getVideoUrl(ad.finalVideoUrl);
  };

  const toggleFormat = () => {
    if (ad.enableDualFormat && ad.finalVideoUrl4x5) {
      setCurrentFormat(currentFormat === '16:9' ? '4:5' : '16:9');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getFormatDisplay = () => {
    if (ad.enableDualFormat && ad.finalVideoUrl4x5) {
      return currentFormat === '16:9' ? '9:16' : '4:5';
    }
    return ad.format || '9:16';
  };

  const renderVideoContent = () => {
    const currentVideoUrl = getCurrentVideoUrl();
    
    if (ad.status === 'COMPLETED' && currentVideoUrl) {
      return (
        <div className={`relative rounded-t-[20px] overflow-hidden ${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} bg-gray-800`}>
          <div 
            className="w-full h-full"
            onMouseEnter={() => userPlan === 'FREE' && setShowUpgradeOverlay(true)}
            onMouseLeave={() => setShowUpgradeOverlay(false)}
          >
            <video
              ref={videoRef}
              src={currentVideoUrl}
              className="w-full h-full object-cover"
              playsInline
              autoPlay={userPlan === 'FREE'} // Autoplay for free users, just show first frame for paid users
              loop={userPlan === 'FREE'}
              muted={isMuted}
              controls={userPlan !== 'FREE'}
              controlsList={userPlan === 'FREE' ? 'nodownload nofullscreen noremoteplayback' : undefined}
              preload="metadata" // Load metadata and first frame
              crossOrigin="anonymous"
              onContextMenu={userPlan === 'FREE' ? (e) => e.preventDefault() : undefined}
              onLoadedData={handleVideoLoad}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Play button overlay for free users - only show if video is paused */}
            {userPlan === 'FREE' && !isPlaying && hasVideoLoaded && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors z-20"
              >
                <div className="bg-black/70 rounded-full p-4 hover:bg-black/90 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {/* Upgrade overlay for free users - matches free2.png */}
            {userPlan === 'FREE' && showUpgradeOverlay && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div 
                  className="bg-[#1f2937] rounded-[20px] p-6 text-center max-w-xs border-2 border-orange-500 cursor-pointer transform transition-all duration-300 hover:scale-105 animate-in zoom-in duration-300"
                  onClick={() => window.open('/subscription', '_blank')}
                >
                  <img src="/lock.svg" alt="Lock" className="w-8 h-8 mx-auto mb-4 text-white" />
                  <h3 className="text-white text-lg font-semibold mb-2">Upgrade for full control</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Download full video, AI actor<br />and get video controls
                  </p>
                  <p className="text-gray-500 text-xs">Click to see pricing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Unmute button - positioned outside hover area */}
          {userPlan === 'FREE' && (
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-normal flex items-center gap-2 transition-all duration-200 z-10"
            >
              <img src={isMuted ? "/mute.svg" : "/mute.svg"} alt="Mute" className="w-4 h-4" />
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          )}
        </div>
      );
    }

    // Processing/Queued state - matches processing1.png
    if (ad.status === 'PENDING' || ad.status === 'RENDERING' || ad.status === 'QUEUED') {
      return (
        <div className={`relative rounded-t-[20px] overflow-hidden ${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} bg-black flex items-center justify-center`}>
          <BarLoader size="xl" />
        </div>
      );
    }

    // Failed state
    if (ad.status === 'FAILED') {
      return (
        <div className={`relative rounded-t-[20px] overflow-hidden ${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} bg-red-900/20 border border-red-800 flex items-center justify-center`}>
          <img src="/fail.svg" alt="Failed" className="w-16 h-16" />
        </div>
      );
    }

    // Default state
    return (
      <div className={`relative rounded-t-[20px] overflow-hidden ${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} bg-gray-800 flex items-center justify-center`}>
        <span className="text-gray-400">No preview available</span>
      </div>
    );
  };

  const renderStatusBadge = () => {
    if (ad.status === 'COMPLETED') {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <img src="/success.svg" alt="Success" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(96%) saturate(407%) hue-rotate(88deg) brightness(103%) contrast(93%)' }} />
          <span className="text-sm">Ready</span>
        </div>
      );
    }

    if (ad.status === 'PENDING') {
      return (
        <div className="flex items-center gap-2 text-orange-400">
          <img src="/pending.svg" alt="Pending" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(33%) saturate(1582%) hue-rotate(358deg) brightness(97%) contrast(92%)' }} />
          <span className="text-sm">Pending</span>
        </div>
      );
    }

    if (ad.status === 'RENDERING') {
      return (
        <div className="flex items-center gap-2 text-orange-400">
          <img src="/pending.svg" alt="Processing" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(33%) saturate(1582%) hue-rotate(358deg) brightness(97%) contrast(92%)' }} />
          <span className="text-sm">Processing</span>
        </div>
      );
    }

    if (ad.status === 'QUEUED') {
      return (
        <div className="flex items-center gap-2 text-orange-400">
          <img src="/pending.svg" alt="Queued" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(33%) saturate(1582%) hue-rotate(358deg) brightness(97%) contrast(92%)' }} />
          <span className="text-sm">Queued</span>
        </div>
      );
    }

    if (ad.status === 'FAILED') {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <img src="/fail.svg" alt="Failed" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(94%) saturate(1455%) hue-rotate(339deg) brightness(97%) contrast(97%)' }} />
          <span className="text-sm">Failed</span>
        </div>
      );
    }

    return null;
  };

  const renderActionButtons = () => {
    const buttons = [];

    // For completed videos
    if (ad.status === 'COMPLETED' && ad.finalVideoUrl) {
      if (userPlan === 'FREE') {
        // Free user - locked Full video button (matches free1.png)
        buttons.push(
          <button
            key="full-video"
            onClick={() => window.open('/subscription', '_blank')}
            className="btn-secondary px-4 py-2.5 text-sm font-normal flex items-center gap-2 opacity-75"
            style={{ borderRadius: '15px' }}
          >
            <img src="/lock.svg" alt="Lock" className="w-4 h-4" />
            Full video
          </button>
        );
      } else {
        // Paid user buttons (matches paid1.png)
        buttons.push(
          <button
            key="full-video"
            onClick={() => {
              const link = document.createElement('a');
              link.href = getVideoUrl(ad.finalVideoUrl);
              link.download = `${ad.brandName || 'video'}.mp4`;
              link.click();
            }}
            className="btn-secondary px-4 py-2.5 text-sm font-normal flex items-center gap-2"
            style={{ borderRadius: '15px' }}
          >
            <img src="/download.svg" alt="Download" className="w-4 h-4" />
            Full video
          </button>
        );

        buttons.push(
          <button
            key="avatar"
            onClick={() => {
              if (ad.lipsyncedAvatarUrl) {
                const link = document.createElement('a');
                link.href = getVideoUrl(ad.lipsyncedAvatarUrl);
                link.download = `${ad.brandName || 'avatar'}-avatar.mp4`;
                link.click();
              } else {
                // Fallback: try to construct the SyncLabs URL based on the job ID
                if (ad.syncLabsJobId) {
                  const syncLabsUrl = `/synclabs/synclabs-${ad.syncLabsJobId}.mp4`;
                  const link = document.createElement('a');
                  link.href = getVideoUrl(syncLabsUrl);
                  link.download = `${ad.brandName || 'avatar'}-avatar.mp4`;
                  link.click();
                } else {
                  console.error('No SyncLabs video available for download');
                  // You could show a toast error message here if you have access to toast
                }
              }
            }}
            disabled={!ad.lipsyncedAvatarUrl && !ad.syncLabsJobId}
            className={`px-4 py-2.5 text-sm font-normal flex items-center gap-2 ${
              ad.lipsyncedAvatarUrl || ad.syncLabsJobId 
                ? 'btn-secondary' 
                : 'btn-secondary opacity-50 cursor-not-allowed'
            }`}
            style={{ borderRadius: '15px' }}
          >
            <img src="/avatar.svg" alt="Avatar" className="w-4 h-4" />
            Avatar
          </button>
        );
      }
    }

    // For failed videos - add retry button
    if (ad.status === 'FAILED' && onRetry) {
      buttons.push(
        <button
          key="retry"
          onClick={() => onRetry(ad.id)}
          className="btn-primary px-4 py-2.5 text-sm font-normal flex items-center gap-2"
          style={{ borderRadius: '15px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      );
    }

    // Always show delete button on the right with 1px border
    buttons.push(
      <button
        key="delete"
        onClick={() => onDelete(ad.id)}
        className="px-4 py-2.5 text-sm font-normal border border-white text-white hover:border-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center gap-2"
        style={{ borderRadius: '15px' }}
      >
        <img src="/trash.svg" alt="Delete" className="w-4 h-4" />
        Delete
      </button>
    );

    return buttons;
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card container */}
      <div className="bg-[#1f2937] rounded-[20px] border border-gray-700 flex flex-col">
        {/* Video/content area - fixed aspect ratio */}
        <div className="flex-shrink-0">
          {renderVideoContent()}
        </div>

        {/* Content area - takes remaining space */}
        <div className="flex-1 p-6 flex flex-col overflow-visible">
          {/* Title */}
          <h3 className="text-white text-lg font-normal mb-2 truncate">
            {ad.brandName || `Video #${ad.id.slice(0, 6)}`}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span>{formatDate(ad.createdAt)}</span>
            <span 
              className={ad.enableDualFormat && ad.finalVideoUrl4x5 ? 'cursor-pointer hover:text-white transition-colors' : ''}
              onClick={ad.enableDualFormat && ad.finalVideoUrl4x5 ? toggleFormat : undefined}
            >
              {getFormatDisplay()}
              {ad.enableDualFormat && ad.finalVideoUrl4x5 && (
                <span className="ml-1 text-xs text-orange-400">↔</span>
              )}
            </span>
            <span>{ad.duration || 30}s</span>
            <span>{ad.language?.toUpperCase() || 'NO'}</span>
          </div>

          {/* Status badge */}
          <div className="mb-6">
            {renderStatusBadge()}
          </div>

          {/* Action buttons - pushed to bottom */}
          <div className="mt-auto flex flex-col gap-3">
            {(() => {
              const allButtons = renderActionButtons();
              const avatarButton = allButtons.find(btn => btn.key === 'avatar');
              const fullVideoButton = allButtons.find(btn => btn.key === 'full-video');
              const retryButton = allButtons.find(btn => btn.key === 'retry');
              const deleteButton = allButtons.find(btn => btn.key === 'delete');
              
              return (
                <>
                  {/* Avatar button on its own line if it exists, same width as full video */}
                  {avatarButton && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        {React.cloneElement(avatarButton, { 
                          className: "w-full btn-secondary px-4 py-2.5 text-sm font-normal flex items-center justify-center gap-2",
                          style: { borderRadius: '15px' }
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Main action button (Full video or Retry) and Delete buttons on same line */}
                  <div className="flex gap-3 items-center">
                    {(fullVideoButton || retryButton) && (
                      <div className="flex-1">{fullVideoButton || retryButton}</div>
                    )}
                    {deleteButton && <div>{deleteButton}</div>}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdCard;
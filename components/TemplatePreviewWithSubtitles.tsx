import React, { useState, useEffect, useRef } from 'react';
import { VideoTemplate, LayoutType } from '../lib/templates';
import { avatars } from '../lib/avatars';
import { SUBTITLE_STYLES, SubtitleStyle } from '../remotion/components/Subtitles';

interface TemplatePreviewWithSubtitlesProps {
  template: VideoTemplate;
  assets: string[];
  avatarId: number;
  script: string;
  subtitleStyle: SubtitleStyle;
  subtitleAnimation: 'fade' | 'slide' | 'typewriter' | 'bounce';
  subtitlePosition: 'bottom' | 'top' | 'center';
  enableSubtitles: boolean;
  className?: string;
  audioUrl?: string;
  audioDuration?: number;
  wordTimings?: Array<{ word: string; startTime: number; endTime: number; }>;
  useCapsLock?: boolean;
  currentPreviewFormat?: '9:16' | '4:5';
}

// Function to break script into chunks for preview
const breakScriptIntoChunks = (script: string, maxWordsPerChunk: number = 4): string[] => {
  const words = script.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWordsPerChunk) {
    chunks.push(words.slice(i, i + maxWordsPerChunk).join(' '));
  }
  
  return chunks;
};

// Internal ScenePreview component
const ScenePreview: React.FC<{
  layout: LayoutType;
  asset?: string;
  avatarSrc: string;
  isActive: boolean;
}> = ({ layout, asset, avatarSrc, isActive }) => {
  const isVideo = (src: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
  };

  const getLayoutStyles = () => {
    const baseContainer = "relative w-full h-full overflow-hidden rounded-lg bg-gray-900";
    const avatarStyle = "absolute bottom-0 w-auto object-cover object-bottom";
    
    // Layout debug removed for production
    
    switch (layout) {
      case 'fullscreen-avatar':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "",
          assetContainer: ""
        };
      
      case 'fullscreen-asset':
        return {
          container: baseContainer,
          avatar: "",
          asset: "w-full h-full object-cover",
          assetContainer: "w-full h-full"
        };
      
      case 'cutout-left-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-0`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-right-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 right-0`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-center-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-1/2 transform -translate-x-1/2`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0"
        };
      
      case 'avatar-with-corner-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full object-cover rounded-lg border-2 border-white/20",
          assetContainer: "absolute top-2 right-2 w-1/3 h-1/3 z-10"
        };
      
      case 'split-screen-top-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute top-0 left-0 w-full h-1/2"
        };
      
      case 'buildup-collage':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-2/3 right-0`,
          asset: "w-full h-full object-cover rounded-lg",
          assetContainer: "absolute top-2 left-2 w-1/2 h-1/2"
        };
      
      case 'small-cutout-bottom-left':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 left-2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-bottom-right':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 right-2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 left-1/2 transform -translate-x-1/2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-bottom-left-no-padding':
        return {
          container: baseContainer,
          avatar: `absolute bottom-0 left-0 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-bottom-right-no-padding':
        return {
          container: baseContainer,
          avatar: `absolute bottom-0 right-0 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center-tilted-left':
        return {
          container: baseContainer,
          avatar: `absolute bottom-1/4 left-1/2 transform -translate-x-1/2 rotate-12 w-auto object-cover object-center h-2/5 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center-tilted-right':
        return {
          container: baseContainer,
          avatar: `absolute bottom-1/4 left-1/2 transform -translate-x-1/2 -rotate-12 w-auto object-cover object-center h-2/5 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-top-left':
        return {
          container: baseContainer,
          avatar: `absolute top-2 left-2 w-auto object-cover object-top h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-top-right':
        return {
          container: baseContainer,
          avatar: `absolute top-2 right-2 w-auto object-cover object-top h-1/3 z-10`,
          asset: "w-full h-full object-cover",
          assetContainer: "absolute inset-0 z-0"
        };
      
      default:
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "",
          assetContainer: ""
        };
    }
  };

  const styles = getLayoutStyles();

  return (
    <div className={`${styles.container} ${isActive ? 'ring-2 ring-orange-500' : ''}`}>
      {/* Avatar Layer */}
      {styles.avatar && (
        <video
          src={avatarSrc}
          className={styles.avatar}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Asset Layer */}
      {asset && styles.assetContainer && (
        <div className={styles.assetContainer}>
          {isVideo(asset) ? (
            <video
              src={asset}
              className={styles.asset}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              style={{ pointerEvents: 'none' }}
            />
          ) : (
            <img
              src={asset}
              className={styles.asset}
              alt="Asset"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </div>
      )}
      
      {/* Scene Type Label */}
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
        {layout.replace(/-/g, ' ')}
      </div>
    </div>
  );
};

export const TemplatePreviewWithSubtitles: React.FC<TemplatePreviewWithSubtitlesProps> = ({
  template,
  assets,
  avatarId,
  script,
  subtitleStyle,
  subtitleAnimation,
  subtitlePosition,
  enableSubtitles,
  className = "",
  audioUrl,
  audioDuration,
  wordTimings,
  useCapsLock = false,
  currentPreviewFormat = '9:16'
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Handle loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Give time for assets to load
    
    return () => clearTimeout(timer);
  }, [template, assets]);
  
  // Get avatar source
  const avatar = avatars.find(a => a.id === avatarId);
  const avatarSrc = avatar ? avatar.src : avatars[0].src;
  
  // Break script into chunks for subtitle preview
  const scriptChunks = script ? breakScriptIntoChunks(script, 4) : [];
  
  // Auto-advance through scenes synchronized with audio
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    
    const totalWeight = template.timeline.reduce((sum, scene) => sum + scene.durationWeight, 0);
    const currentScene = template.timeline[currentSceneIndex];
    
    let sceneDuration: number;
    
    if (wordTimings && wordTimings.length > 0 && audioDuration) {
      // Synchronize scene changes with audio timing for better representation
      const totalPreviewDuration = audioDuration * 1000;
      sceneDuration = (currentScene.durationWeight / totalWeight) * totalPreviewDuration;
      
      // Ensure minimum scene duration of 1 second for better UX
      sceneDuration = Math.max(sceneDuration, 1000);
    } else {
      // Fallback to proportional timing based on scene weights
      const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
      sceneDuration = (currentScene.durationWeight / totalWeight) * totalPreviewDuration;
      
      // Ensure minimum scene duration of 2 seconds for fallback
      sceneDuration = Math.max(sceneDuration, 2000);
    }
    
    const timer = setTimeout(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % template.timeline.length);
    }, sceneDuration);
    
    return () => clearTimeout(timer);
  }, [currentSceneIndex, isPlaying, isHovered, template.timeline, audioDuration, wordTimings]);
  
  // Auto-advance through subtitle chunks using word timings
  useEffect(() => {
    if (!isPlaying || isHovered || !enableSubtitles || scriptChunks.length === 0) return;
    
    let chunkDuration: number;
    
    if (wordTimings && wordTimings.length > 0) {
      // Use actual word timings for precise subtitle synchronization
      const wordsPerChunk = Math.ceil(wordTimings.length / scriptChunks.length);
      const currentChunkStartIndex = currentChunkIndex * wordsPerChunk;
      const nextChunkStartIndex = Math.min((currentChunkIndex + 1) * wordsPerChunk, wordTimings.length);
      
      if (currentChunkStartIndex < wordTimings.length && nextChunkStartIndex <= wordTimings.length) {
        const currentChunkStartTime = wordTimings[currentChunkStartIndex].startTime;
        const nextChunkStartTime = nextChunkStartIndex < wordTimings.length 
          ? wordTimings[nextChunkStartIndex].startTime 
          : wordTimings[wordTimings.length - 1].endTime;
        
        chunkDuration = (nextChunkStartTime - currentChunkStartTime) * 1000;
      } else {
        // Fallback to equal duration if timing data is incomplete
        const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
        chunkDuration = totalPreviewDuration / scriptChunks.length;
      }
    } else {
      // Fallback to equal duration distribution
      const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
      chunkDuration = totalPreviewDuration / scriptChunks.length;
    }
    
    const timer = setTimeout(() => {
      setCurrentChunkIndex((prev) => (prev + 1) % scriptChunks.length);
    }, chunkDuration);
    
    return () => clearTimeout(timer);
  }, [currentChunkIndex, isPlaying, isHovered, enableSubtitles, scriptChunks.length, audioDuration, wordTimings]);

  const currentScene = template.timeline[currentSceneIndex];
  const sceneAsset = currentScene.assetIndices && currentScene.assetIndices[0] !== undefined 
    ? assets[currentScene.assetIndices[0]] 
    : undefined;

  const getSubtitlePositionStyle = () => {
    switch (subtitlePosition) {
      case 'top':
        return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom':
      default:
        return { bottom: '15%', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const getSubtitleAnimation = () => {
    switch (subtitleAnimation) {
      case 'slide':
        return 'animate-slide-up';
      case 'bounce':
        return 'animate-bounce-in';
      case 'typewriter':
        return 'animate-typewriter';
      case 'fade':
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
          >
            {isPlaying ? (
              <>
                <span className="text-lg">⏸️</span>
                Pause
              </>
            ) : (
              <>
                <span className="text-lg">▶️</span>
                Play Preview
              </>
            )}
          </button>
          <span className="text-sm text-gray-400">
            {currentSceneIndex + 1}/{template.timeline.length}
          </span>
        </div>
      </div>

      {/* Main Preview with Subtitles */}
      <div 
        ref={previewRef}
        className={`${currentPreviewFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} w-full max-w-xs mx-auto relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-30">
            <div className="text-white text-sm">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>
              Loading preview...
            </div>
          </div>
        )}
        
        {/* Template Preview */}
        <ScenePreview
          layout={currentScene.layout}
          asset={sceneAsset}
          avatarSrc={avatarSrc}
          isActive={isPlaying && !isHovered}
        />
        
        {/* Subtitle Overlay */}
        {enableSubtitles && script && scriptChunks.length > 0 && (
          <div
            className="absolute z-10 pointer-events-none"
            style={getSubtitlePositionStyle()}
          >
            <div
              className={`px-4 py-2 rounded-lg text-center max-w-xs ${getSubtitleAnimation()}`}
              style={{
                background: subtitleStyle.backgroundColor,
                color: subtitleStyle.textColor,
                fontFamily: subtitleStyle.font,
                fontSize: '14px',
                fontWeight: subtitleStyle.fontWeight,
                borderRadius: `${subtitleStyle.borderRadius}px`,
                textShadow: subtitleStyle.textShadow,
                border: subtitleStyle.border,
                lineHeight: subtitleStyle.lineHeight,
              }}
            >
              {useCapsLock ? scriptChunks[currentChunkIndex]?.toUpperCase() : scriptChunks[currentChunkIndex]}
            </div>
          </div>
        )}
        
        {/* Subtitle indicator */}
        {enableSubtitles && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-20">
            Subtitles: ON
          </div>
        )}
        
        {/* Audio player (hidden but functional) */}
        {audioUrl && (
          <audio
            ref={(audio) => {
              if (audio) {
                if (isPlaying && audio.paused) {
                  audio.play().catch(() => {});
                } else if (!isPlaying && !audio.paused) {
                  audio.pause();
                }
              }
            }}
            src={audioUrl}
            loop={false}
            muted={false}
            style={{ display: 'none' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* Scene Timeline */}
      <div className="flex gap-1">
        {template.timeline.map((scene, index) => (
          <div
            key={index}
            className={`h-2 rounded-full cursor-pointer transition-all duration-200 ${
              index === currentSceneIndex 
                ? 'bg-orange-500' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            style={{ 
              flex: scene.durationWeight,
              minWidth: '8px'
            }}
            onClick={() => setCurrentSceneIndex(index)}
          />
        ))}
      </div>

      {/* Subtitle Timeline */}
      {enableSubtitles && scriptChunks.length > 0 && (
        <div className="flex gap-1">
          {scriptChunks.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-200 ${
                index === currentChunkIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-600'
              }`}
              style={{ 
                flex: 1,
                minWidth: '4px'
              }}
            />
          ))}
        </div>
      )}

      {/* Scene Description */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          {currentScene.layout.replace(/-/g, ' ')}
        </p>
        {sceneAsset && (
          <p className="text-xs text-gray-500 mt-1">
            Asset {currentScene.assetIndices?.[0]! + 1}
          </p>
        )}
        {enableSubtitles && scriptChunks.length > 0 && (
          <p className="text-xs text-blue-400 mt-1">
            Subtitle {currentChunkIndex + 1}/{scriptChunks.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default TemplatePreviewWithSubtitles;
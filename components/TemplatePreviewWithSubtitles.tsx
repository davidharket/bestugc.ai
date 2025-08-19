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
  subtitleAnimation: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
  subtitlePosition: 'bottom' | 'top' | 'center';
  enableSubtitles: boolean;
  className?: string;
  audioUrl?: string;
  audioDuration?: number;
  wordTimings?: Array<{ word: string; startTime: number; endTime: number; }>;
  useCapsLock?: boolean;
  oneWordAtATime?: boolean;
  fontSize?: number;
  currentPreviewFormat?: '9:16' | '4:5';
  // Advanced font customization
  fontWeight?: number;
  outlineWidth?: number;
  outlineColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textColor?: string;
}

// Function to break script into chunks for preview with dynamic width calculation
const generateScriptChunks = (
  script: string, 
  oneWordAtATime: boolean,
  fontSize: number,
  screenWidth: number,
  letterSpacing: number = 0,
  maxWordsPerChunk: number = 4
): string[] => {
  const words = script.split(' ').filter(w => w.length > 0);
  if (oneWordAtATime) {
    return words;
  }
  
  // Calculate optimal words per line based on font size and screen width
  const optimalWordsPerLine = Math.max(1, Math.floor(screenWidth / (fontSize * 0.6)));
  
  // Use the smaller of optimal calculation or provided max
  const wordsPerChunk = Math.min(optimalWordsPerLine, maxWordsPerChunk);
  
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
};

// Enhanced dual layer background component for CSS preview with dual layout support
const DualLayerBackgroundDiv: React.FC<{ 
  src: string; 
  className: string; 
  enableDualLayout?: boolean;
  secondarySrc?: string;
}> = ({ src, className, enableDualLayout = false, secondarySrc }) => {
  const isVideo = (src: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
  };

  if (!src) return <div className={`${className} bg-black`} />;

  // Dual layout mode: blurred background with contained overlay (like remotion DualLayerBackground)
  if (enableDualLayout && secondarySrc) {
    return (
      <div className={`relative ${className}`}>
        {/* Blurred background layer using secondary source - covers entire area */}
        <div className="absolute inset-0">
          {isVideo(secondarySrc) ? (
            <video
              src={secondarySrc}
              className="w-full h-full object-cover blur-md scale-110"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              style={{ pointerEvents: 'none' }}
            />
          ) : (
            <img
              src={secondarySrc}
              className="w-full h-full object-cover blur-md scale-110"
              alt="Blurred background"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </div>
        
        {/* Main content layer - contained and centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideo(src) ? (
            <video
              src={src}
              className="max-w-full max-h-full object-contain"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              style={{ 
                pointerEvents: 'none',
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))'
              }}
            />
          ) : (
            <img
              src={src}
              className="max-w-full max-h-full object-contain"
              alt="Main content"
              style={{ 
                pointerEvents: 'none',
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))'
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Standard single layout
  return (
    <div className={`relative ${className}`}>
      {/* Blurred background layer */}
      <div className="absolute inset-0">
        {isVideo(src) ? (
          <video
            src={src}
            className="w-full h-full object-cover blur-sm scale-110"
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <img
            src={src}
            className="w-full h-full object-cover blur-sm scale-110"
            alt="Blurred background"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </div>
      {/* Main content layer */}
      <div className="relative w-full h-full">
        {isVideo(src) ? (
          <video
            src={src}
            className="w-full h-full object-cover drop-shadow-lg"
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <img
            src={src}
            className="w-full h-full object-cover drop-shadow-lg"
            alt="Main content"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

// Internal ScenePreview component
const ScenePreview: React.FC<{
  layout: LayoutType;
  asset?: string;
  avatarSrc: string;
  isActive: boolean;
  enableDualLayout?: boolean;
  secondaryAsset?: string;
}> = ({ layout, asset, avatarSrc, isActive, enableDualLayout = false, secondaryAsset }) => {
  const isVideo = (src: string) => {
    if (!src) return false;
    return src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
  };

  const getLayoutStyles = () => {
    const baseContainer = "relative w-full h-full overflow-hidden rounded-lg bg-gray-900";
    const avatarStyle = "absolute bottom-0 w-auto object-contain object-bottom";
    
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
          asset: "w-full h-full",
          assetContainer: "w-full h-full"
        };
      
      case 'cutout-left-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-0`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-right-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 right-0`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0"
        };
      
      case 'cutout-center-over-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-3/4 left-1/2 transform -translate-x-1/2`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0"
        };
      
      case 'avatar-with-corner-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full rounded-lg border-2 border-white/20",
          assetContainer: "absolute top-2 right-2 w-1/3 h-1/3 z-10"
        };
      
      case 'split-screen-top-asset':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-full w-full`,
          asset: "w-full h-full",
          assetContainer: "absolute top-0 left-0 w-full h-1/2"
        };
      
      case 'buildup-collage':
        return {
          container: baseContainer,
          avatar: `${avatarStyle} h-2/3 right-0`,
          asset: "w-full h-full rounded-lg",
          assetContainer: "absolute top-2 left-2 w-1/2 h-1/2"
        };
      
      case 'small-cutout-bottom-left':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 left-2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-bottom-right':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 right-2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center':
        return {
          container: baseContainer,
          avatar: `absolute bottom-2 left-1/2 transform -translate-x-1/2 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-bottom-right-no-padding':
        return {
          container: baseContainer,
          avatar: `absolute bottom-0 right-0 w-auto object-cover object-bottom h-1/3 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center-tilted-left':
        return {
          container: baseContainer,
          avatar: `absolute bottom-1/4 left-1/2 transform -translate-x-1/2 rotate-12 w-auto object-cover object-center h-2/5 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-center-tilted-right':
        return {
          container: baseContainer,
          avatar: `absolute bottom-1/4 left-1/2 transform -translate-x-1/2 -rotate-12 w-auto object-cover object-center h-2/5 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-top-left':
        return {
          container: baseContainer,
          avatar: `absolute top-2 left-2 w-auto object-cover object-top h-1/3 z-10`,
          asset: "w-full h-full",
          assetContainer: "absolute inset-0 z-0"
        };
      
      case 'small-cutout-top-right':
        return {
          container: baseContainer,
          avatar: `absolute top-2 right-2 w-auto object-cover object-top h-1/3 z-10`,
          asset: "w-full h-full",
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
          <DualLayerBackgroundDiv 
            src={asset} 
            className={styles.asset}
            enableDualLayout={enableDualLayout}
            secondarySrc={secondaryAsset}
          />
        </div>
      )}
      
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
  oneWordAtATime = false,
  fontSize,
  currentPreviewFormat = '9:16',
  // Advanced font customization
  fontWeight,
  outlineWidth,
  outlineColor,
  shadowOffsetX,
  shadowOffsetY,
  shadowBlur,
  shadowColor,
  letterSpacing,
  textTransform,
  textColor,
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Ref to measure the preview container
  const previewRef = useRef<HTMLDivElement>(null);
  // NEW: State to store the measured width. Initialize with a fallback.
  const [actualPreviewWidth, setActualPreviewWidth] = useState(320);

  // NEW: Effect to measure the preview container width
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        setActualPreviewWidth(width);
      }
    });

    if (previewRef.current) {
      observer.observe(previewRef.current);
    }

    return () => {
      if (previewRef.current) {
        observer.unobserve(previewRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

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
  
  // Create dynamic subtitle style that matches Remotion component with overrides
  const styleOverrides = {
    fontSize: fontSize || subtitleStyle.fontSize,
    fontWeight: fontWeight,
    outlineWidth: outlineWidth,
    outlineColor: outlineColor,
    shadowOffsetX: shadowOffsetX,
    shadowOffsetY: shadowOffsetY,
    shadowBlur: shadowBlur,
    shadowColor: shadowColor,
    letterSpacing: letterSpacing,
    textTransform: textTransform,
    textColor: textColor,
  };
  
  // Filter out undefined values
  const cleanedOverrides = Object.fromEntries(
    Object.entries(styleOverrides).filter(([_, value]) => value !== undefined)
  );
  
  const dynamicSubtitleStyle = {
    ...subtitleStyle,
    ...cleanedOverrides,
  };
  
  // CHANGED: Calculate scale dynamically based on measured width
  const renderWidth = 1080; // The target render width in Remotion
  const previewScale = actualPreviewWidth / renderWidth;
  
  const scaledFontSize = dynamicSubtitleStyle.fontSize * previewScale;
  
  const scriptChunks = script ? generateScriptChunks(
    script, 
    oneWordAtATime, 
    scaledFontSize,
    actualPreviewWidth, // Use the actual measured width
    letterSpacing || 0,
    4
  ) : [];
  
  // Generate custom text shadow for outline effect if needed (scaled for preview)
  let customTextShadow = dynamicSubtitleStyle.textShadow;
  if (outlineWidth && outlineWidth > 0) {
    const width = outlineWidth * previewScale;
    const color = outlineColor || '#000000';
    const outlineShadows = [];
    
    for (let x = -width; x <= width; x++) {
      for (let y = -width; y <= width; y++) {
        if (x !== 0 || y !== 0) {
          outlineShadows.push(`${x}px ${y}px 0 ${color}`);
        }
      }
    }
    
    if (shadowOffsetX !== undefined || shadowOffsetY !== undefined) {
      const offsetX = (shadowOffsetX || 0) * previewScale;
      const offsetY = (shadowOffsetY || 0) * previewScale;
      const blur = (shadowBlur || 0) * previewScale;
      const sColor = shadowColor || '#000000';
      outlineShadows.push(`${offsetX}px ${offsetY}px ${blur}px ${sColor}`);
    } else if (customTextShadow && customTextShadow !== 'none') {
      outlineShadows.push(customTextShadow);
    }
    
    customTextShadow = outlineShadows.join(', ');
  } else if (shadowOffsetX !== undefined || shadowOffsetY !== undefined) {
    const offsetX = (shadowOffsetX || 0) * previewScale;
    const offsetY = (shadowOffsetY || 0) * previewScale;
    const blur = (shadowBlur || 0) * previewScale;
    const sColor = shadowColor || '#000000';
    customTextShadow = `${offsetX}px ${offsetY}px ${blur}px ${sColor}`;
  }
  
  // Auto-advance through scenes synchronized with audio
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    
    const totalWeight = template.timeline.reduce((sum, scene) => sum + scene.durationWeight, 0);
    const currentScene = template.timeline[currentSceneIndex];
    
    let sceneDuration: number;
    
    if (wordTimings && wordTimings.length > 0 && audioDuration) {
      const totalPreviewDuration = audioDuration * 1000;
      sceneDuration = (currentScene.durationWeight / totalWeight) * totalPreviewDuration;
      sceneDuration = Math.max(sceneDuration, 1000);
    } else {
      const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
      sceneDuration = (currentScene.durationWeight / totalWeight) * totalPreviewDuration;
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
      if (oneWordAtATime) {
        if (currentChunkIndex < wordTimings.length) {
          const currentWord = wordTimings[currentChunkIndex];
          chunkDuration = (currentWord.endTime - currentWord.startTime) * 1000;
        } else {
          chunkDuration = 500;
        }
      } else {
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
          const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
          chunkDuration = totalPreviewDuration / scriptChunks.length;
        }
      }
    } else {
      const totalPreviewDuration = audioDuration ? audioDuration * 1000 : 30000;
      chunkDuration = totalPreviewDuration / scriptChunks.length;
    }
    
    const timer = setTimeout(() => {
      setCurrentChunkIndex((prev) => (prev + 1) % scriptChunks.length);
    }, chunkDuration);
    
    return () => clearTimeout(timer);
  }, [currentChunkIndex, isPlaying, isHovered, enableSubtitles, scriptChunks.length, audioDuration, wordTimings, oneWordAtATime]);

  const currentScene = template.timeline[currentSceneIndex];
  const sceneAsset = currentScene.assetIndices && currentScene.assetIndices[0] !== undefined 
    ? assets[currentScene.assetIndices[0]] 
    : undefined;
  
  // Determine if dual layout should be enabled based on multiple formats and available assets
  const enableDualLayout = assets.length >= 2;
  const secondaryAsset = enableDualLayout && currentScene.assetIndices && currentScene.assetIndices[1] !== undefined
    ? assets[currentScene.assetIndices[1]]
    : (enableDualLayout && assets.length >= 2 ? assets[1] : undefined);

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
      case 'none':
        return '';
      case 'slide':
        return 'animate-slide-up';
      case 'bounce':
        return 'animate-bounce-in';
      case 'fade':
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Preview with Subtitles */}
      {/* CHANGED: Removed fixed width `w-80` and inline style, added `w-full` and the ref */}
      <div 
        ref={previewRef}
        className={`${currentPreviewFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} w-full relative bg-gray-900 rounded-lg overflow-hidden mx-auto`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-40">
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
          enableDualLayout={enableDualLayout}
          secondaryAsset={secondaryAsset}
        />
        
        {/* Pause/Play Button */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
            title={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Subtitle Overlay */}
        {enableSubtitles && script && scriptChunks.length > 0 && (
          <div
            className="absolute z-10 pointer-events-none"
            style={getSubtitlePositionStyle()}
          >
            <div
              className={`px-4 py-2 rounded-lg text-center ${getSubtitleAnimation()}`}
              style={{
                background: dynamicSubtitleStyle.backgroundColor,
                color: dynamicSubtitleStyle.textColor,
                fontFamily: dynamicSubtitleStyle.font,
                fontSize: `${scaledFontSize}px`,
                fontWeight: dynamicSubtitleStyle.fontWeight,
                borderRadius: `${dynamicSubtitleStyle.borderRadius * previewScale}px`,
                textShadow: customTextShadow,
                border: dynamicSubtitleStyle.border,
                lineHeight: dynamicSubtitleStyle.lineHeight,
                letterSpacing: letterSpacing ? `${letterSpacing * previewScale}px` : undefined,
                textTransform: textTransform || 'none',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {(useCapsLock || textTransform === 'uppercase') ? 
                scriptChunks[currentChunkIndex]?.toUpperCase() : 
                (textTransform === 'lowercase' ? 
                  scriptChunks[currentChunkIndex]?.toLowerCase() : 
                  (textTransform === 'capitalize' ? 
                    scriptChunks[currentChunkIndex]?.replace(/\b\w/g, l => l.toUpperCase()) :
                    scriptChunks[currentChunkIndex]
                  )
                )
              }
            </div>
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
    </div>
  );
};

export default TemplatePreviewWithSubtitles;
// components/TemplatePreviewWithSubtitles.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VideoTemplate, LayoutType, WeightedScene } from '../lib/templates';
import { avatars } from '../lib/avatars';
import { SubtitleStyle, calculateOptimalWordsPerLine, parseTranscriptWithTimings } from '../remotion/components/Subtitles';
import { fitText } from '@remotion/layout-utils';
import BarLoader from './BarLoader';
import DraggableTimeline from './DraggableTimeline';
import { useAdCreation } from './AdCreationContext';
import { SceneOverlay } from './SceneOverlay';
import VideoPreloader from './VideoPreloader';

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
  productVideoUrl?: string;
  backgroundMusicUrl?: string;
}

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
  productVideoUrl,
  backgroundMusicUrl,
}) => {
  const { adData, setAdData } = useAdCreation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineScenes, setTimelineScenes] = useState<WeightedScene[]>(adData.modifiedTimeline || template.timeline);

  useEffect(() => {
    // Always use the new template's timeline when template changes, 
    // or use modifiedTimeline if it exists for this template
    if (adData.modifiedTimeline && adData.templateId === template.id) {
      setTimelineScenes(adData.modifiedTimeline);
    } else {
      setTimelineScenes(template.timeline);
    }
  }, [template.timeline, template.id, adData.modifiedTimeline, adData.templateId]);

  const handleSceneUpdate = useCallback((scenes: WeightedScene[]) => {
    setTimelineScenes(scenes);
    setAdData({ modifiedTimeline: scenes });
  }, [setAdData]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
    if (audioRef.current) audioRef.current.currentTime = time;
    if (musicRef.current) musicRef.current.currentTime = time;
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    // Check if video has ended, restart from beginning
    if (videoRef.current.ended) {
      videoRef.current.currentTime = 0;
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (musicRef.current) musicRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    
    if (isPlaying) {
      videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (musicRef.current) musicRef.current.pause();
    } else {
      videoRef.current.play();
      if (audioRef.current) audioRef.current.play();
      if (musicRef.current) musicRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [template, assets]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'FontFace' in window) {
      const fontFace = new FontFace('The Bold Font', 'url(/fonts/THEBOLDFONT-FREEVERSION.woff)');
      fontFace.load().then(() => {
        document.fonts.add(fontFace);
      }).catch((err) => console.error("Custom font failed to load:", err));
    }
  }, []);

  const avatarSrc = useMemo(() => {
    const avatar = avatars.find(a => a.id === avatarId);
    let url = productVideoUrl || avatar?.src || avatars[0].src;
    return url.replace('/api/serve-video/generated_videos/', '/avatars/');
  }, [productVideoUrl, avatarId]);

  const totalDurationInSeconds = audioDuration || 30;

  const handleVideoEnded = useCallback(() => {
    // Pause all media when video ends
    if (videoRef.current) videoRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
    if (musicRef.current) musicRef.current.pause();
    
    // Update play state
    setIsPlaying(false);
    
    // Reset current time to end for proper timeline display
    setCurrentTime(totalDurationInSeconds);
  }, [totalDurationInSeconds]);

  const { currentSubtitleText, subtitleFontSize } = useMemo(() => {
    if (!wordTimings || wordTimings.length === 0 || !containerRef.current) {
      return { currentSubtitleText: '', subtitleFontSize: 0 };
    }

    const mergedStyle = { ...subtitleStyle, fontSize, fontWeight, letterSpacing, textTransform, textColor };
    const userFontSize = fontSize; // Get the user's selected font size
    const baseFontSize = userFontSize || mergedStyle.fontSize || 50;
    const containerWidth = containerRef.current.offsetWidth * 2; // Preview is ~0.5x scale, so we simulate the 1080px render canvas

    const wordsPerLine = oneWordAtATime ? 1 : calculateOptimalWordsPerLine(
        baseFontSize,
        containerWidth,
        96, 
        mergedStyle.letterSpacing || 0
    );

    // Helper functions to match Remotion's logic
    const isLongWord = (word: string) => word.replace(/[.,!?;:]/g, '').length > 15;
    
    const lines: Array<{ text: string; startTime: number; endTime: number }> = [];
    let currentLineWords: typeof wordTimings = [];
    let i = 0;

    while (i < wordTimings.length) {
        const word = wordTimings[i];
        
        // If current word is long and we already have words, finalize the current line
        if (isLongWord(word.word) && currentLineWords.length > 0) {
            lines.push({ 
                text: currentLineWords.map(w => w.word).join(' '), 
                startTime: currentLineWords[0].startTime, 
                endTime: currentLineWords[currentLineWords.length - 1].endTime 
            });
            currentLineWords = [];
        }
        
        // If this is a long word, put it on its own line
        if (isLongWord(word.word)) {
            lines.push({ text: word.word, startTime: word.startTime, endTime: word.endTime });
            i++;
            continue;
        }
        
        // Add word to current line - be more lenient with word limits (like Remotion)
        if (currentLineWords.length < wordsPerLine + 2) { // Allow 2 extra words beyond optimal
            currentLineWords.push(word);
            i++;
            
            // Only break on sentence endings if we're at a reasonable length
            if (word.word.match(/[.!?]$/) && i < wordTimings.length && currentLineWords.length >= wordsPerLine) {
                const remaining = wordTimings.length - i;
                // Be more lenient with remaining words - allow more to stay together
                if (remaining <= 4 && currentLineWords.length + remaining <= wordsPerLine + 4) {
                    while (i < wordTimings.length && !isLongWord(wordTimings[i].word)) {
                        currentLineWords.push(wordTimings[i]);
                        i++;
                    }
                }
                // Only finalize if we have a good break point
                if (currentLineWords.length >= wordsPerLine && currentLineWords.length > 0) {
                    lines.push({ 
                        text: currentLineWords.map(w => w.word).join(' '), 
                        startTime: currentLineWords[0].startTime, 
                        endTime: currentLineWords[currentLineWords.length - 1].endTime 
                    });
                    currentLineWords = [];
                }
            }
        } else {
            // We've reached the extended word limit, finalize current line
            lines.push({ 
                text: currentLineWords.map(w => w.word).join(' '), 
                startTime: currentLineWords[0].startTime, 
                endTime: currentLineWords[currentLineWords.length - 1].endTime 
            });
            currentLineWords = [word];
            i++;
        }
    }
    
    // Add any remaining words as the final line
    if (currentLineWords.length > 0) {
        lines.push({ 
            text: currentLineWords.map(w => w.word).join(' '), 
            startTime: currentLineWords[0].startTime, 
            endTime: currentLineWords[currentLineWords.length - 1].endTime 
        });
    }
    
    let textToShow = '';
    if (oneWordAtATime) {
      const currentWord = wordTimings.find(t => currentTime >= t.startTime && currentTime < t.endTime);
      textToShow = currentWord ? currentWord.word : '';
    } else {
      const currentLine = lines.find(l => currentTime >= l.startTime && currentTime <= l.endTime);
      textToShow = currentLine ? currentLine.text : '';
    }

    if (!textToShow) return { currentSubtitleText: '', subtitleFontSize: 0 };

    // Use user's font size with proper scaling for live preview, otherwise use smart sizing
    let finalFontSize;
    if (userFontSize) {
      // Scale font size to match the visual proportion of live preview vs final render
      // Live preview container is ~35% the effective size of final render for better visual match
      finalFontSize = userFontSize * 0.35;
    } else {
      // Fall back to smart font sizing when no user size is set
      const { fontSize: remotionFontSize } = fitText({
        text: textToShow,
        withinWidth: containerWidth * 0.9,
        fontFamily: mergedStyle.font,
        fontWeight: `${mergedStyle.fontWeight || 'normal'}`,
        letterSpacing: `${mergedStyle.letterSpacing || 0}px`,
      });
      finalFontSize = remotionFontSize;
    }

    return {
      currentSubtitleText: textToShow,
      subtitleFontSize: finalFontSize,
    };
  }, [currentTime, wordTimings, oneWordAtATime, subtitleStyle, fontSize, fontWeight, letterSpacing, textTransform, textColor, adData]);

  const currentScene = useMemo(() => {
    if (!timelineScenes || timelineScenes.length === 0) return null;
    const totalWeight = timelineScenes.reduce((sum, scene) => sum + scene.durationWeight, 0);
    let accumulatedTime = 0;
    for (const scene of timelineScenes) {
      const sceneDuration = (scene.durationWeight / totalWeight) * totalDurationInSeconds;
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + sceneDuration) {
        return { ...scene, asset: (scene.assetIndices?.[0] !== undefined) ? assets[scene.assetIndices[0]] : null };
      }
      accumulatedTime += sceneDuration;
    }
    const lastScene = timelineScenes[timelineScenes.length - 1];
    return { ...lastScene, asset: (lastScene.assetIndices?.[0] !== undefined) ? assets[lastScene.assetIndices[0]] : null };
  }, [currentTime, timelineScenes, totalDurationInSeconds, assets]);

  const getVideoPositioning = (layout: string) => { switch (layout) { case 'small-cutout-bottom-left': return 'absolute bottom-4 left-4 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-bottom-right': return 'absolute bottom-4 right-4 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-center': return 'absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-top-left': return 'absolute top-4 left-4 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-top-right': return 'absolute top-4 right-4 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-bottom-right-no-padding': return 'absolute bottom-0 right-0 w-1/3 aspect-[9/16] object-cover'; case 'small-cutout-center-tilted-left': return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 w-1/2 aspect-[9/16] object-cover'; case 'small-cutout-center-tilted-right': return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 w-1/2 aspect-[9/16] object-cover'; case 'avatar-with-corner-asset': return 'absolute bottom-12 left-12 w-1/2 aspect-[9/16] object-cover'; case 'split-screen-top-asset': return 'absolute bottom-0 left-0 w-full h-full object-cover'; case 'fullscreen-asset': return 'w-full h-full object-cover blur-md opacity-60'; case 'fullscreen-avatar': default: return 'w-full h-full object-cover'; } };
  const getVideoStyleOverrides = (layout: string): React.CSSProperties => { const baseStyles: React.CSSProperties = {}; if (layout.includes('small-cutout') && !layout.includes('avatar-with-corner-asset')) { baseStyles.position = 'absolute'; baseStyles.zIndex = 10; } else if (layout === 'split-screen-top-asset') { baseStyles.zIndex = 5; baseStyles.objectPosition = 'center top'; baseStyles.bottom = '-220px'; } return baseStyles; };
  const getAnimationClass = () => { 
    switch (subtitleAnimation) { 
      case 'slide': return 'animate-slideInUp'; 
      case 'bounce': return 'animate-bounceIn'; 
      case 'typewriter': return 'animate-fadeIn'; // Typewriter uses fade for now
      case 'fade': return 'animate-fadeIn';
      case 'none': return ''; // No animation
      default: return 'animate-fadeIn'; 
    } 
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preload all videos to avoid black loading states */}
      <VideoPreloader avatarSrc={avatarSrc} assets={assets} />
      
      <div ref={containerRef} className={`${currentPreviewFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} w-full relative bg-gray-900 rounded-lg overflow-hidden mx-auto`}>
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40"><BarLoader /></div>}
        <div className="relative w-full h-full bg-black">
          <video ref={videoRef} className={getVideoPositioning(currentScene?.layout || 'fullscreen-avatar')} style={getVideoStyleOverrides(currentScene?.layout || 'fullscreen-avatar')} muted playsInline preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleVideoEnded} onLoadedData={() => { if (videoRef.current) videoRef.current.currentTime = currentTime; }} src={avatarSrc} />
          {audioUrl && <audio ref={audioRef} preload="auto" src={audioUrl} />}
          {backgroundMusicUrl && <audio ref={musicRef} preload="auto" src={backgroundMusicUrl} loop onLoadedData={() => { if (musicRef.current) musicRef.current.volume = 0.12; }} />}
          {currentScene && <SceneOverlay sceneLayout={currentScene.layout} asset={currentScene.asset} currentPreviewFormat={currentPreviewFormat} currentTime={currentTime} isPlaying={isPlaying} />}
          {enableSubtitles && currentSubtitleText && (
            <div key={currentSubtitleText} className={`absolute z-20 ${getAnimationClass()}`} style={{
              bottom: subtitlePosition === 'bottom' ? '25%' : 'auto', 
              top: subtitlePosition === 'top' ? '8%' : (subtitlePosition === 'center' ? '50%' : 'auto'),
              left: '50%', 
              transform: subtitlePosition === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)', 
              width: '90%',
            }}>
              <div
                className="font-bold"
                style={{
                  fontFamily: subtitleStyle.font,
                  fontSize: `${subtitleFontSize}px`,
                  color: textColor || subtitleStyle.textColor,
                  fontWeight: fontWeight || subtitleStyle.fontWeight,
                  textShadow: shadowOffsetX !== undefined && shadowOffsetY !== undefined && shadowBlur !== undefined && shadowColor ? `${shadowOffsetX * 0.35}px ${shadowOffsetY * 0.35}px ${shadowBlur * 0.35}px ${shadowColor}` : subtitleStyle.textShadow,
                  WebkitTextStroke: outlineWidth !== undefined ? `${outlineWidth * 0.35}px ${outlineColor}` : undefined,
                  letterSpacing: letterSpacing ? `${letterSpacing * 0.35}px` : undefined,
                  textTransform: textTransform || 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textAlign: 'center',
                }}
              >
                {useCapsLock ? currentSubtitleText.toUpperCase() : currentSubtitleText}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-4 z-30">
          <button onClick={handlePlayPause} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-3 shadow-lg">
            {isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
          </button>
        </div>
      </div>
      <DraggableTimeline scenes={timelineScenes} duration={totalDurationInSeconds} currentTime={currentTime} onSceneUpdate={handleSceneUpdate} onSeek={handleSeek} />
    </div>
  );
};

export default TemplatePreviewWithSubtitles;

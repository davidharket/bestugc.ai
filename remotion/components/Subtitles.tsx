import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { spring } from 'remotion';

// Note: Font loading via loadFont API temporarily disabled due to API changes in Remotion v4
// Fonts should be loaded via CSS @font-face rules in the browser environment
// TODO: Investigate proper font loading approach for current Remotion version

/*
// Load fonts for Remotion - ensure fonts are available in Remotion's browser environment
const fontLoadingPromises = [
  loadFont({
    family: 'The Bold Font',
    url: 'https://bestugc.ai/fonts/THEBOLDFONT-FREEVERSION.woff',
    display: 'swap',
  }),
  loadFont({
    family: 'Inter',
    url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
    display: 'swap',
  }),
  loadFont({
    family: 'Montserrat',
    url: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-Y3tcoqK5.woff2',
    display: 'swap',
  }),
  loadFont({
    family: 'Roboto',
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
    display: 'swap',
  }),
  loadFont({
    family: 'Open Sans',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff2',
    display: 'swap',
  }),
  loadFont({
    family: 'Lato',
    url: 'https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wXiWtFCc.woff2',
    display: 'swap',
  }),
];
*/

// Subtitle styles configuration
export type SubtitleStyle = {
  id: string;
  name: string;
  font: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  padding: number;
  fontSize: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  maxWidth: number;
  lineHeight: number;
  textShadow?: string;
  border?: string;
  supportsCaps?: boolean; // Whether this font supports caps lock toggle
};

// Predefined subtitle styles with popular social media fonts
export const SUBTITLE_STYLES: SubtitleStyle[] = [
  {
    id: 'bold-white',
    name: 'Bold (Default)',
    font: 'The Bold Font, Arial Black, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 40,
    fontWeight: 900,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000',
    supportsCaps: false,
  },
  {
    id: 'steady',
    name: 'Steady',
    font: 'Steady, Helvetica, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 38,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.3,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'system',
    name: 'System',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 36,
    fontWeight: 700,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'gotham',
    name: 'Gotham',
    font: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 38,
    fontWeight: 700,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'story',
    name: 'Story',
    font: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 40,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.3,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    font: '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 36,
    fontWeight: 500,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'genial',
    name: 'Genial',
    font: 'Lato, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 38,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.3,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    font: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 36,
    fontWeight: 700,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'inter',
    name: 'Inter',
    font: 'Inter, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 36,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
  {
    id: 'roboto',
    name: 'Roboto',
    font: 'Roboto, sans-serif',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: 0,
    padding: 8,
    fontSize: 36,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 95,
    lineHeight: 1.2,
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    supportsCaps: true,
  },
];

// Word timing interface
export interface WordTiming {
  word: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

// Subtitle props
interface SubtitleProps {
  transcript: string;
  wordTimings?: WordTiming[];
  style: SubtitleStyle;
  animationType?: 'fade' | 'slide' | 'typewriter' | 'bounce';
  position?: 'bottom' | 'top' | 'center';
  maxWordsPerLine?: number;
  highlightCurrentWord?: boolean;
  useCapsLock?: boolean;
}

// Animation variants
const getWordAnimation = (
  frame: number,
  startFrame: number,
  endFrame: number,
  animationType: string,
  fps: number
) => {
  const progress = interpolate(frame, [startFrame, startFrame + fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const exitProgress = interpolate(frame, [endFrame - fps * 0.2, endFrame], [0, 1], {
    extrapolateRight: 'clamp',
  });

  switch (animationType) {
    case 'slide':
      return {
        opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress),
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
      };
    case 'bounce':
      const bounceProgress = spring({
        frame: frame - startFrame,
        fps,
        config: {
          damping: 12,
          stiffness: 100,
          mass: 0.5,
        },
      });
      return {
        opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress),
        transform: `scale(${bounceProgress})`,
      };
    case 'typewriter':
      return {
        opacity: progress > 0.5 ? 1 - exitProgress : 0,
        transform: 'none',
      };
    case 'fade':
    default:
      return {
        opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress),
        transform: 'none',
      };
  }
};

// Transform and format text for subtitles
const transformSubtitleText = (text: string): string => {
  return text
    .toUpperCase() // Convert to caps lock
    .replace(/\.+$/g, '') // Remove periods at the end of sentences
    .replace(/\.\s+/g, ' '); // Remove periods followed by spaces
};

// Check if a word is too long and should be displayed alone
const isLongWord = (word: string, threshold: number = 15): boolean => {
  const cleanWord = word.replace(/[.,!?;:]/g, '');
  return cleanWord.length > threshold;
};

// Break text into chunks for engaging display with word-level timing
// Improved to prevent single words after periods and handle long words
const breakIntoChunks = (text: string, wordTimings: WordTiming[], maxWordsPerLine: number = 8): { text: string; words: WordTiming[] }[] => {
  const words = text.split(' ');
  const chunks: { text: string; words: WordTiming[] }[] = [];
  
  let i = 0;
  while (i < words.length) {
    const chunkWords: string[] = [];
    const chunkTimings: WordTiming[] = [];
    
    // Check if current word is very long - display it alone
    if (isLongWord(words[i])) {
      chunks.push({
        text: transformSubtitleText(words[i]),
        words: [{
          ...wordTimings[i],
          word: transformSubtitleText(words[i])
        }]
      });
      i++;
      continue;
    }
    
    // Build chunk with smart sentence boundary handling
    while (chunkWords.length < maxWordsPerLine && i < words.length) {
      // Check if next word is too long - stop before it
      if (isLongWord(words[i]) && chunkWords.length > 0) {
        break;
      }
      
      chunkWords.push(words[i]);
      chunkTimings.push(wordTimings[i]);
      i++;
      
      // If we hit a sentence ending and have room for more words, continue to avoid orphaned words
      if (words[i - 1]?.match(/[.!?]$/) && i < words.length) {
        const remainingWords = words.length - i;
        // If only 1-2 words remain, include them in this chunk to avoid orphans
        if (remainingWords <= 2 && chunkWords.length + remainingWords <= maxWordsPerLine + 2) {
          while (i < words.length && chunkWords.length < maxWordsPerLine + 2 && !isLongWord(words[i])) {
            chunkWords.push(words[i]);
            chunkTimings.push(wordTimings[i]);
            i++;
          }
        }
        break;
      }
    }
    
    if (chunkWords.length > 0) {
      chunks.push({
        text: transformSubtitleText(chunkWords.join(' ')),
        words: chunkTimings.map(timing => ({
          ...timing,
          word: transformSubtitleText(timing.word)
        }))
      });
    }
  }
  
  return chunks;
};

// Generate timing for chunks when no word timings are provided
const generateChunkTimings = (chunks: string[], totalDuration: number): WordTiming[] => {
  const timingsPerChunk = totalDuration / chunks.length;
  
  return chunks.map((chunk, index) => ({
    word: chunk,
    startTime: index * timingsPerChunk,
    endTime: (index + 1) * timingsPerChunk,
  }));
};

export const Subtitles: React.FC<SubtitleProps> = ({
  transcript,
  wordTimings,
  style,
  animationType = 'fade',
  position = 'bottom',
  maxWordsPerLine = 6,
  highlightCurrentWord = false, // Disabled highlighting for clean text
  useCapsLock = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Wait for fonts to load - this ensures all fonts are available before rendering
  // Font loading temporarily disabled - fonts will be loaded via CSS
  const [fontsLoaded, setFontsLoaded] = React.useState(true);
  
  /*
  React.useEffect(() => {
    Promise.all(fontLoadingPromises)
      .then(() => {
        console.log('[Subtitles] All fonts loaded successfully');
        setFontsLoaded(true);
      })
      .catch((error) => {
        console.error('[Subtitles] Error loading fonts:', error);
        // Continue rendering even if fonts fail to load
        setFontsLoaded(true);
      });
  }, []);
  */
  
  // Use provided word timings (from ElevenLabs) or generate fallback timings
  const generatedWordTimings = wordTimings && wordTimings.length > 0 
    ? wordTimings 
    : parseTranscriptWithTimings(transcript, durationInFrames / fps);
  
  // Break transcript into chunks with word-level timing
  const chunks = breakIntoChunks(transcript, generatedWordTimings, maxWordsPerLine);
  
  // Get current time in seconds
  const currentTime = frame / fps;
  
  // Find currently active chunks - show chunk from first word start to last word end
  const activeChunks = chunks.filter(chunk => {
    if (chunk.words.length === 0) return false;
    const chunkStartTime = chunk.words[0].startTime;
    const chunkEndTime = chunk.words[chunk.words.length - 1].endTime;
    return currentTime >= chunkStartTime && currentTime <= chunkEndTime;
  });

  // Position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return {
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'center':
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      case 'bottom':
      default:
        return {
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  // Don't render subtitles until fonts are loaded
  if (!fontsLoaded) {
    return <AbsoluteFill />;
  }
  
  // Debug logging for font selection
  console.log('[Subtitles] Rendering with font:', {
    fontFamily: style.font,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    styleName: style.name,
    frameTime: frame / fps
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          ...getPositionStyle(),
          zIndex: 1000,
        }}
      >
        {activeChunks.map((chunk, chunkIndex) => {
          const chunkStartFrame = Math.min(...chunk.words.map(w => w.startTime)) * fps;
          const chunkEndFrame = Math.max(...chunk.words.map(w => w.endTime)) * fps;
          
          const animation = getWordAnimation(
            frame,
            chunkStartFrame,
            chunkEndFrame,
            animationType,
            fps
          );

          return (
            <div
              key={`chunk-${chunkIndex}`}
              style={{
                background: style.backgroundColor,
                color: style.textColor,
                fontFamily: style.font,
                fontSize: `${style.fontSize}px`,
                fontWeight: style.fontWeight,
                borderRadius: `${style.borderRadius}px`,
                padding: `${style.padding}px`,
                margin: '4px 0',
                maxWidth: '95%', // Allow more width for longer sentences
                lineHeight: style.lineHeight,
                textShadow: style.textShadow,
                border: style.border,
                whiteSpace: 'normal', // Allow normal text wrapping
                wordBreak: 'normal', // Use normal word breaking
                overflowWrap: 'anywhere', // Break anywhere if needed
                hyphens: 'auto', // Use automatic hyphenation if supported
                display: 'block', // Use block display for proper text centering
                textAlign: 'center', // Ensure text is centered
                ...animation,
              }}
            >
              {chunk.words.map((wordTiming, wordIndex) => (
                <span
                  key={`word-${chunkIndex}-${wordIndex}`}
                  style={{
                    color: style.textColor,
                  }}
                >
                  {useCapsLock ? wordTiming.word.toUpperCase() : wordTiming.word}
                  {wordIndex < chunk.words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Utility function to parse transcript and create word timings
export const parseTranscriptWithTimings = (
  transcript: string,
  audioDuration: number,
  wordsPerSecond: number = 2.2
): WordTiming[] => {
  const words = transcript.split(' ');
  const timings: WordTiming[] = [];
  
  let currentTime = 0;
  const baseTimePerWord = 1 / wordsPerSecond;
  
  words.forEach((word, index) => {
    // More accurate word duration calculation
    let wordDuration = baseTimePerWord;
    
    // Adjust for word length (syllables matter more than character count)
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (cleanWord.length > 10) {
      wordDuration *= 1.6;
    } else if (cleanWord.length > 7) {
      wordDuration *= 1.3;
    } else if (cleanWord.length > 5) {
      wordDuration *= 1.1;
    } else if (cleanWord.length <= 2) {
      wordDuration *= 0.6;
    }
    
    // Add pauses for punctuation - more realistic timing
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      wordDuration *= 1.3; // Sentence endings
    } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
      wordDuration *= 1.1; // Shorter pause for commas
    }
    
    // Natural speech patterns - slight pause at the beginning
    if (index === 0) {
      currentTime += 0.1; // Reduced initial pause
    }
    
    // Transform the word for display (caps, no periods)
    const transformedWord = transformSubtitleText(word);
    
    timings.push({
      word: transformedWord,
      startTime: currentTime,
      endTime: currentTime + wordDuration,
    });
    
    currentTime += wordDuration;
  });
  
  // Scale timings to fit audio duration more accurately
  const totalEstimatedTime = currentTime;
  const scaleFactor = (audioDuration * 0.95) / totalEstimatedTime; // Use 95% of duration for better sync
  
  return timings.map(timing => ({
    ...timing,
    startTime: timing.startTime * scaleFactor,
    endTime: timing.endTime * scaleFactor,
  }));
};

export default Subtitles;
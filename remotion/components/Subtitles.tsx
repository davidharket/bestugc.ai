import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender } from 'remotion';
import { spring } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { getAllAvailableFonts, FONT_FALLBACKS, FontConfig } from '../../lib/google-fonts';

// Google Fonts are now loaded via GoogleFontLoader component


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
  // New customization options
  outlineWidth?: number;
  outlineColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

// Generate subtitle styles from all available fonts
function generateSubtitleStyles(): SubtitleStyle[] {
  const styles: SubtitleStyle[] = [];
  
  // Get all available fonts (Google + local + custom)
  const allFonts = getAllAvailableFonts();

  // Define video-friendly fonts with optimized settings
  const videoFriendlyFonts = [
    // Local fonts first
    { id: 'bold-font', weight: 900, size: 42 },
    { id: 'system-font', weight: 700, size: 36 },
    
    // Popular Google Fonts
    { id: 'inter', weight: 700, size: 38 },
    { id: 'roboto', weight: 700, size: 36 },
    { id: 'open-sans', weight: 600, size: 36 },
    { id: 'montserrat', weight: 700, size: 38 },
    { id: 'lato', weight: 700, size: 38 },
    { id: 'poppins', weight: 600, size: 38 },
    { id: 'nunito', weight: 700, size: 38 },
    { id: 'work-sans', weight: 600, size: 36 },
    { id: 'quicksand', weight: 600, size: 38 },
    { id: 'cabin', weight: 600, size: 36 },
    { id: 'dosis', weight: 600, size: 38 },
    { id: 'fira-sans', weight: 600, size: 36 },
    { id: 'pt-sans', weight: 700, size: 36 },
    { id: 'mulish', weight: 600, size: 36 },
    { id: 'karla', weight: 600, size: 36 },
    { id: 'barlow', weight: 600, size: 36 },
    { id: 'dm-sans', weight: 700, size: 36 },
    { id: 'rubik', weight: 600, size: 38 },
    { id: 'heebo', weight: 700, size: 38 },
    { id: 'manrope', weight: 600, size: 36 },
    
    // Display fonts for impact
    { id: 'oswald', weight: 600, size: 40 },
    { id: 'bebas-neue', weight: 400, size: 44 },
    { id: 'anton', weight: 400, size: 42 },
    { id: 'bangers', weight: 400, size: 40 },
    { id: 'archivo-black', weight: 400, size: 40 },
    { id: 'russo-one', weight: 400, size: 38 },
    { id: 'comfortaa', weight: 600, size: 38 },
    { id: 'righteous', weight: 400, size: 38 },
    { id: 'pacifico', weight: 400, size: 40 },
    { id: 'lobster', weight: 400, size: 40 },
    { id: 'alfa-slab-one', weight: 400, size: 42 },
    { id: 'bungee', weight: 400, size: 40 },
    { id: 'black-ops-one', weight: 400, size: 38 },
    { id: 'permanent-marker', weight: 400, size: 38 },
    { id: 'orbitron', weight: 700, size: 38 },
    { id: 'press-start-2p', weight: 400, size: 32 },
    { id: 'kalam', weight: 400, size: 38 },
    
    // Elegant serif fonts
    { id: 'playfair-display', weight: 700, size: 36 },
    { id: 'merriweather', weight: 700, size: 34 },
    { id: 'lora', weight: 600, size: 36 },
    { id: 'eb-garamond', weight: 600, size: 36 },
    { id: 'libre-baskerville', weight: 700, size: 36 },
    { id: 'cormorant-garamond', weight: 600, size: 36 },
    { id: 'crimson-text', weight: 600, size: 36 },
    { id: 'vollkorn', weight: 600, size: 36 },
    { id: 'bitter', weight: 600, size: 36 },
    { id: 'zilla-slab', weight: 600, size: 36 }
  ];

  videoFriendlyFonts.forEach(({ id, weight, size }) => {
    const font = allFonts.find(f => f.id === id);
    if (font) {
      // Handle different font types
      let fontFamily: string;
      if (font.type === 'local' && font.localPath) {
        // Local font with fallback
        fontFamily = font.fontFamily;
      } else if (font.type === 'custom' && font.uploadedFile) {
        // Custom uploaded font
        fontFamily = `"${font.fontFamily}", ${FONT_FALLBACKS[font.category] || FONT_FALLBACKS['sans-serif']}`;
      } else {
        // Google font
        fontFamily = `"${font.fontFamily}"${FONT_FALLBACKS[font.category] || FONT_FALLBACKS['sans-serif']}`;
      }
      
      styles.push({
        id: font.id,
        name: font.name,
        font: fontFamily,
        backgroundColor: 'transparent',
        textColor: '#ffffff',
        borderRadius: 0,
        padding: 8,
        fontSize: size,
        fontWeight: weight,
        textAlign: 'center',
        maxWidth: 95,
        lineHeight: font.category === 'display' ? 1.1 : 1.2,
        textShadow: font.category === 'display' || font.category === 'local' ? 
          '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000' :
          '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        supportsCaps: font.category !== 'handwriting',
      });
    }
  });

  return styles;
}

// Predefined subtitle styles using Google Fonts
export const SUBTITLE_STYLES: SubtitleStyle[] = generateSubtitleStyles();

// Helper function to calculate optimal words per line based on font size and screen width
export function calculateOptimalWordsPerLine(
  fontSize: number,
  screenWidth: number = 1080, // Default video width
  padding: number = 48, // More conservative padding (increased from 24)
  letterSpacing: number = 0,
  avgCharacterWidth: number = 0.65 // Slightly wider character estimate for safety
): number {
  // Calculate effective width (screen width minus padding)
  const effectiveWidth = screenWidth - padding;
  
  // Estimate character width based on font size and letter spacing
  const charWidth = fontSize * avgCharacterWidth + letterSpacing;
  
  // Average word length in English is about 4.7 characters + 1 space
  const avgWordWidth = charWidth * 6.2; // More conservative estimate (increased from 5.7)
  
  // Calculate how many words can fit with 85% safety margin
  const wordsPerLine = Math.floor((effectiveWidth * 0.85) / avgWordWidth);
  
  // Ensure minimum of 1 word and reasonable maximum (reduced from 8)
  return Math.max(1, Math.min(wordsPerLine, 6));
}

// Helper function to generate CSS style object from SubtitleStyle with overrides
export function generateCSSFromSubtitleStyle(
  style: SubtitleStyle, 
  overrides?: Partial<SubtitleStyle>,
  screenWidth: number = 1080,
  previewScale: number = 1.0
): React.CSSProperties {
  // Merge style with overrides
  const finalStyle = { ...style, ...overrides };
  
  let textShadow = finalStyle.textShadow;
  
  // Override with custom shadow if specified
  if (finalStyle.shadowOffsetX !== undefined || finalStyle.shadowOffsetY !== undefined) {
    const offsetX = finalStyle.shadowOffsetX || 0;
    const offsetY = finalStyle.shadowOffsetY || 0;
    const blur = finalStyle.shadowBlur || 0;
    const color = finalStyle.shadowColor || '#000000';
    textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }
  
  // Generate outline effect using text-shadow if specified
  if (finalStyle.outlineWidth && finalStyle.outlineWidth > 0) {
    const width = finalStyle.outlineWidth;
    const color = finalStyle.outlineColor || '#000000';
    const outlineShadows = [];
    
    // Create multiple text-shadows to simulate outline
    for (let x = -width; x <= width; x++) {
      for (let y = -width; y <= width; y++) {
        if (x !== 0 || y !== 0) {
          outlineShadows.push(`${x}px ${y}px 0 ${color}`);
        }
      }
    }
    
    // Combine outline shadows with existing text shadow
    if (textShadow && textShadow !== 'none') {
      textShadow = `${outlineShadows.join(', ')}, ${textShadow}`;
    } else {
      textShadow = outlineShadows.join(', ');
    }
  }

  return {
    background: finalStyle.backgroundColor,
    color: finalStyle.textColor,
    fontFamily: finalStyle.font,
    fontSize: `${finalStyle.fontSize / previewScale}px`, // Adjust font size for scale
    fontWeight: finalStyle.fontWeight,
    borderRadius: `${finalStyle.borderRadius / previewScale}px`, // Adjust border radius for scale
    padding: `${finalStyle.padding / previewScale}px`, // Adjust padding for scale  
    lineHeight: finalStyle.lineHeight,
    textShadow,
    border: finalStyle.border,
    letterSpacing: finalStyle.letterSpacing ? `${finalStyle.letterSpacing / previewScale}px` : undefined, // Adjust letter spacing for scale
    textTransform: finalStyle.textTransform || 'none',
    textAlign: finalStyle.textAlign,
    maxWidth: `${(screenWidth - (finalStyle.padding * 2)) / previewScale}px`, // Adjust max width for scale
    whiteSpace: 'nowrap' as const,
    overflow: 'visible' as const,
    display: 'block' as const,
    margin: '4px 0',
  };
}

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
  animationType?: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
  position?: 'bottom' | 'top' | 'center';
  maxWordsPerLine?: number;
  highlightCurrentWord?: boolean;
  useCapsLock?: boolean;
  // Style overrides for advanced customization
  styleOverrides?: Partial<SubtitleStyle>;
  // Scale factor to handle preview vs final render differences
  previewScale?: number;
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
    case 'none':
      return {
        opacity: 1,
        transform: 'none',
      };
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

// Break text into chunks for single-line display with word-level timing
// Optimized for single-line subtitles with dynamic font sizing
const breakIntoChunks = (text: string, wordTimings: WordTiming[], maxWordsPerLine: number = 6): { text: string; words: WordTiming[] }[] => {
  const words = text.split(' ');
  const chunks: { text: string; words: WordTiming[] }[] = [];
  
  let i = 0;
  while (i < words.length) {
    const chunkWords: string[] = [];
    const chunkTimings: WordTiming[] = [];
    
    // Check if current word is very long - display it alone
    if (isLongWord(words[i])) {
      const timing = wordTimings[i] || { word: words[i], startTime: 0, endTime: 1 };
      chunks.push({
        text: transformSubtitleText(words[i]),
        words: [{
          ...timing,
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
      const timing = wordTimings[i] || { word: words[i], startTime: i * 0.5, endTime: (i + 1) * 0.5 };
      chunkTimings.push(timing);
      i++;
      
      // If we hit a sentence ending and have room for more words, continue to avoid orphaned words
      if (words[i - 1]?.match(/[.!?]$/) && i < words.length) {
        const remainingWords = words.length - i;
        // If only 1-2 words remain, include them in this chunk to avoid orphans
        if (remainingWords <= 2 && chunkWords.length + remainingWords <= maxWordsPerLine + 2) {
          while (i < words.length && chunkWords.length < maxWordsPerLine + 2 && !isLongWord(words[i])) {
            chunkWords.push(words[i]);
            const timing = wordTimings[i] || { word: words[i], startTime: i * 0.5, endTime: (i + 1) * 0.5 };
            chunkTimings.push(timing);
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
  maxWordsPerLine, // Optional - when undefined, will use dynamic calculation
  highlightCurrentWord = false, // Disabled highlighting for clean text
  useCapsLock = false,
  styleOverrides,
  previewScale = 1.0, // Default to full scale for final render
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  
  // Calculate dynamic words per line based on font size and screen width
  const mergedStyle = { ...style, ...styleOverrides };
  const dynamicWordsPerLine = maxWordsPerLine ?? calculateOptimalWordsPerLine(
    mergedStyle.fontSize,
    width,
    (mergedStyle.padding || 12) * 2, // Total horizontal padding
    mergedStyle.letterSpacing || 0
  );
  
  // Use provided word timings (from ElevenLabs) or generate fallback timings
  const generatedWordTimings = wordTimings && wordTimings.length > 0 
    ? wordTimings 
    : parseTranscriptWithTimings(transcript, durationInFrames / fps);
  
  // Break transcript into chunks with word-level timing
  const chunks = breakIntoChunks(transcript, generatedWordTimings, dynamicWordsPerLine);
  
  // Get current time in seconds
  const currentTime = frame / fps;
  
  // Find currently active chunks with improved timing for single words
  const activeChunks = chunks.filter(chunk => {
    if (chunk.words.length === 0) return false;
    const chunkStartTime = chunk.words[0].startTime;
    let chunkEndTime = chunk.words[chunk.words.length - 1].endTime;
    
    // For single words, extend display time to overlap with next word's start
    if (chunk.words.length === 1) {
      const currentChunkIndex = chunks.findIndex(c => c === chunk);
      const nextChunk = chunks[currentChunkIndex + 1];
      if (nextChunk && nextChunk.words.length > 0) {
        // Show current word until next word starts (with small overlap)
        chunkEndTime = Math.max(chunkEndTime, nextChunk.words[0].startTime - 0.05);
      } else {
        // Last word - extend by 0.3 seconds for better readability
        chunkEndTime += 0.3;
      }
    }
    
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

          // Get the text content for the chunk
          const chunkText = chunk.words.map(w => 
            useCapsLock ? w.word.toUpperCase() : w.word
          ).join(' ');

          return (
            <div
              key={`chunk-${chunkIndex}`}
              style={{
                ...generateCSSFromSubtitleStyle(style, styleOverrides, width, previewScale),
                ...animation,
              }}
            >
              {chunk.words.map((wordTiming, wordIndex) => {
                // Use merged style for consistent styling
                const mergedStyle = { ...style, ...styleOverrides };
                return (
                  <span
                    key={`word-${chunkIndex}-${wordIndex}`}
                    style={{
                      color: mergedStyle.textColor,
                      fontSize: `${mergedStyle.fontSize / previewScale}px`, // Adjust font size for scale
                      fontWeight: mergedStyle.fontWeight,
                      fontFamily: mergedStyle.font,
                      letterSpacing: mergedStyle.letterSpacing ? `${mergedStyle.letterSpacing / previewScale}px` : undefined, // Adjust letter spacing for scale
                      textTransform: mergedStyle.textTransform || 'none',
                    }}
                  >
                    {useCapsLock ? wordTiming.word.toUpperCase() : wordTiming.word}
                    {wordIndex < chunk.words.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
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
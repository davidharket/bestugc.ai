import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { spring } from 'remotion';

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
};

// Predefined subtitle styles
export const SUBTITLE_STYLES: SubtitleStyle[] = [
  {
    id: 'modern-black',
    name: 'Modern Black',
    font: 'Arial, sans-serif',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    fontSize: 28,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 80,
    lineHeight: 1.3,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    font: 'Arial, sans-serif',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    textColor: '#000000',
    borderRadius: 8,
    padding: 10,
    fontSize: 26,
    fontWeight: 500,
    textAlign: 'center',
    maxWidth: 75,
    lineHeight: 1.4,
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
  },
  {
    id: 'bold-orange',
    name: 'Bold Orange',
    font: 'Arial, sans-serif',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    textColor: '#ffffff',
    borderRadius: 15,
    padding: 14,
    fontSize: 30,
    fontWeight: 700,
    textAlign: 'center',
    maxWidth: 85,
    lineHeight: 1.2,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  },
  {
    id: 'gradient-modern',
    name: 'Gradient Modern',
    font: 'Arial, sans-serif',
    backgroundColor: 'linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 142, 83, 0.9))',
    textColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    fontSize: 28,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: 80,
    lineHeight: 1.3,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
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

// Break text into chunks for engaging display
const breakIntoChunks = (text: string, maxWordsPerLine: number = 4): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    chunks.push(words.slice(i, i + maxWordsPerLine).join(' '));
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
  maxWordsPerLine = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Break transcript into engaging chunks
  const chunks = breakIntoChunks(transcript, maxWordsPerLine);
  
  // Use provided word timings or generate them
  const timings = wordTimings || generateChunkTimings(chunks, durationInFrames / fps);
  
  // Get current time in seconds
  const currentTime = frame / fps;
  
  // Find currently active chunks
  const activeChunks = timings.filter(timing => 
    currentTime >= timing.startTime && currentTime <= timing.endTime
  );

  // Position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return {
          top: '10%',
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
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          ...getPositionStyle(),
          zIndex: 1000,
        }}
      >
        {activeChunks.map((timing, index) => {
          const startFrame = timing.startTime * fps;
          const endFrame = timing.endTime * fps;
          
          const animation = getWordAnimation(
            frame,
            startFrame,
            endFrame,
            animationType,
            fps
          );

          return (
            <div
              key={`${timing.word}-${index}`}
              style={{
                background: style.backgroundColor,
                color: style.textColor,
                fontFamily: style.font,
                fontSize: `${style.fontSize}px`,
                fontWeight: style.fontWeight,
                textAlign: style.textAlign,
                borderRadius: `${style.borderRadius}px`,
                padding: `${style.padding}px`,
                margin: '4px 0',
                maxWidth: `${style.maxWidth}%`,
                lineHeight: style.lineHeight,
                textShadow: style.textShadow,
                border: style.border,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                ...animation,
              }}
            >
              {timing.word}
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
  wordsPerSecond: number = 2.5
): WordTiming[] => {
  const words = transcript.split(' ');
  const timings: WordTiming[] = [];
  
  let currentTime = 0;
  const baseTimePerWord = 1 / wordsPerSecond;
  
  words.forEach((word, index) => {
    // Better word duration calculation based on:
    // - Word length
    // - Punctuation (pauses)
    // - Common speech patterns
    let wordDuration = baseTimePerWord;
    
    // Adjust for word length
    if (word.length > 8) {
      wordDuration *= 1.4;
    } else if (word.length > 6) {
      wordDuration *= 1.2;
    } else if (word.length <= 3) {
      wordDuration *= 0.8;
    }
    
    // Add pauses for punctuation
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      wordDuration *= 1.5; // Longer pause for sentence endings
    } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
      wordDuration *= 1.2; // Shorter pause for commas
    }
    
    // Add slight pause at the beginning for natural speech flow
    if (index === 0) {
      currentTime += 0.2;
    }
    
    timings.push({
      word,
      startTime: currentTime,
      endTime: currentTime + wordDuration,
    });
    
    currentTime += wordDuration;
  });
  
  // Scale timings to fit audio duration with better distribution
  const totalEstimatedTime = currentTime;
  const scaleFactor = audioDuration / totalEstimatedTime;
  
  return timings.map(timing => ({
    ...timing,
    startTime: timing.startTime * scaleFactor,
    endTime: timing.endTime * scaleFactor,
  }));
};

export default Subtitles;
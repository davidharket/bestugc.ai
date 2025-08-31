// remotion/components/Subtitles.tsx
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, staticFile, delayRender, continueRender, getInputProps } from 'remotion';
import { spring } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { getAllAvailableFonts, FONT_FALLBACKS, FontConfig } from '../../lib/google-fonts';

// A new component to handle all font loading within Remotion
export const UnifiedFontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [loaded, setLoaded] = useState(false);
  const { customFontData } = getInputProps() as { customFontData?: { fontFamily: string; url: string } };

  useEffect(() => {
    if (loaded) {
      continueRender(handle);
      return;
    }
    
    const allFonts = getAllAvailableFonts();
    const googleFonts = allFonts.filter(f => f.type === 'google');
    
    const fontPromises: Promise<any>[] = googleFonts.map(font => {
      // @ts-ignore
      return new FontFace(font.fontFamily, `url(https://fonts.gstatic.com/s/${font.id}/v20/${font.files.regular})`).load();
    });

    if (customFontData?.fontFamily && customFontData.url) {
      console.log(`[Remotion] Loading custom font: ${customFontData.fontFamily}`);
      const customFont = new FontFace(customFontData.fontFamily, `url(${customFontData.url})`);
      fontPromises.push(customFont.load());
    }

    Promise.all(fontPromises)
      .then((loadedFonts) => {
        loadedFonts.forEach(font => document.fonts.add(font));
        console.log('[Remotion] All Google and custom fonts loaded.');
        setLoaded(true);
        continueRender(handle);
      })
      .catch(err => {
        console.error('[Remotion] Font loading failed:', err);
        setLoaded(true);
        continueRender(handle);
      });
  }, [handle, customFontData, loaded]);

  return null;
};

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
  supportsCaps?: boolean;
  outlineWidth?: number;
  outlineColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

export function calculateOptimalWordsPerLine(
  fontSize: number,
  screenWidth: number = 1080,
  padding: number = 48,
  letterSpacing: number = 0,
  avgCharacterWidth: number = 0.65
): number {
  const effectiveWidth = screenWidth - padding;
  const charWidth = fontSize * avgCharacterWidth + letterSpacing;
  const avgWordWidth = charWidth * 6.2;
  const wordsPerLine = Math.floor((effectiveWidth * 0.85) / avgWordWidth);
  return Math.max(1, Math.min(wordsPerLine, 8));
}

export function generateCSSFromSubtitleStyle(
  style: SubtitleStyle,
  overrides?: Partial<SubtitleStyle>,
  screenWidth: number = 1080,
  previewScale: number = 1.0
): React.CSSProperties {
    const finalStyle = { ...style, ...overrides };
    let textShadow = finalStyle.textShadow;
    if (finalStyle.shadowOffsetX !== undefined || finalStyle.shadowOffsetY !== undefined) {
        const offsetX = finalStyle.shadowOffsetX || 0;
        const offsetY = finalStyle.shadowOffsetY || 0;
        const blur = finalStyle.shadowBlur || 0;
        const color = finalStyle.shadowColor || '#000000';
        textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
    }
    if (finalStyle.outlineWidth && finalStyle.outlineWidth > 0) {
        const width = finalStyle.outlineWidth;
        const color = finalStyle.outlineColor || '#000000';
        const outlineShadows = [];
        for (let x = -width; x <= width; x++) {
            for (let y = -width; y <= width; y++) {
                if (x !== 0 || y !== 0) outlineShadows.push(`${x}px ${y}px 0 ${color}`);
            }
        }
        textShadow = textShadow && textShadow !== 'none' ? `${outlineShadows.join(', ')}, ${textShadow}` : outlineShadows.join(', ');
    }
    return {
        background: finalStyle.backgroundColor,
        color: finalStyle.textColor,
        fontFamily: finalStyle.font,
        fontSize: `${finalStyle.fontSize}px`,
        fontWeight: finalStyle.fontWeight,
        borderRadius: `${finalStyle.borderRadius}px`,
        padding: `${finalStyle.padding}px`,
        lineHeight: finalStyle.lineHeight,
        textShadow,
        border: finalStyle.border,
        letterSpacing: finalStyle.letterSpacing ? `${finalStyle.letterSpacing}px` : undefined,
        textTransform: finalStyle.textTransform || 'none',
        textAlign: finalStyle.textAlign,
        maxWidth: `${screenWidth - (finalStyle.padding * 2)}px`,
        whiteSpace: 'nowrap',
        overflow: 'visible',
        display: 'block',
        margin: '4px 0',
    };
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}
interface SubtitleProps {
  transcript: string;
  wordTimings?: WordTiming[];
  style: SubtitleStyle;
  animationType?: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
  position?: 'bottom' | 'top' | 'center';
  maxWordsPerLine?: number;
  useCapsLock?: boolean;
  styleOverrides?: Partial<SubtitleStyle>;
  previewScale?: number;
}
const getWordAnimation = (frame: number, startFrame: number, endFrame: number, animationType: string, fps: number) => {
    const progress = interpolate(frame, [startFrame, startFrame + fps * 0.3], [0, 1], { extrapolateRight: 'clamp' });
    const exitProgress = interpolate(frame, [endFrame - fps * 0.2, endFrame], [0, 1], { extrapolateRight: 'clamp' });
    switch (animationType) {
        case 'none': return { opacity: 1, transform: 'none' };
        case 'slide': return { opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress), transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)` };
        case 'bounce':
            const bounce = spring({ frame: frame - startFrame, fps, config: { damping: 12, stiffness: 100, mass: 0.5 } });
            return { opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress), transform: `scale(${bounce})` };
        case 'typewriter': return { opacity: progress > 0.5 ? 1 - exitProgress : 0, transform: 'none' };
        case 'fade': default: return { opacity: interpolate(progress, [0, 1], [0, 1]) * (1 - exitProgress), transform: 'none' };
    }
};
const transformText = (text: string) => text.toUpperCase().replace(/\.+$/g, '').replace(/\.\s+/g, ' ');
const isLongWord = (word: string) => word.replace(/[.,!?;:]/g, '').length > 15;
const breakIntoChunks = (text: string, timings: WordTiming[], maxWords: number): { text: string; words: WordTiming[] }[] => {
    const words = text.split(' ');
    const chunks: { text: string; words: WordTiming[] }[] = [];
    let i = 0;
    while (i < words.length) {
        let chunkWords: string[] = [];
        let chunkTimings: WordTiming[] = [];
        if (isLongWord(words[i])) {
            chunks.push({ text: transformText(words[i]), words: [timings[i] || { word: words[i], startTime: 0, endTime: 1 }] });
            i++; continue;
        }
        while (chunkWords.length < maxWords && i < words.length) {
            if (isLongWord(words[i]) && chunkWords.length > 0) break;
            chunkWords.push(words[i]);
            chunkTimings.push(timings[i] || { word: words[i], startTime: i * 0.5, endTime: (i + 1) * 0.5 });
            i++;
            if (words[i - 1]?.match(/[.!?]$/) && i < words.length) {
                const remaining = words.length - i;
                if (remaining <= 2 && chunkWords.length + remaining <= maxWords + 2) {
                    while (i < words.length && !isLongWord(words[i])) {
                        chunkWords.push(words[i]);
                        chunkTimings.push(timings[i] || { word: words[i], startTime: i * 0.5, endTime: (i + 1) * 0.5 });
                        i++;
                    }
                }
                break;
            }
        }
        if (chunkWords.length > 0) {
            chunks.push({ text: transformText(chunkWords.join(' ')), words: chunkTimings.map(t => ({ ...t, word: transformText(t.word) })) });
        }
    }
    return chunks;
};
export const parseTranscriptWithTimings = (transcript: string, duration: number, wps: number = 2.2): WordTiming[] => {
    const words = transcript.split(' ');
    const timings: WordTiming[] = [];
    let time = 0;
    const timePerWord = 1 / wps;
    words.forEach((word, i) => {
        let duration = timePerWord;
        const clean = word.replace(/[.,!?;:]/g, '');
        if (clean.length > 10) duration *= 1.6; else if (clean.length > 7) duration *= 1.3; else if (clean.length > 5) duration *= 1.1; else if (clean.length <= 2) duration *= 0.6;
        if (word.match(/[.!?]$/)) duration *= 1.3; else if (word.match(/[,;:]$/)) duration *= 1.1;
        if (i === 0) time += 0.1;
        timings.push({ word: transformText(word), startTime: time, endTime: time + duration });
        time += duration;
    });
    const scale = (duration * 0.95) / time;
    return timings.map(t => ({ ...t, startTime: t.startTime * scale, endTime: t.endTime * scale }));
};

export const Subtitles: React.FC<SubtitleProps> = ({ transcript, wordTimings, style, animationType = 'fade', position = 'bottom', maxWordsPerLine, useCapsLock = false, styleOverrides, previewScale = 1.0 }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames, width } = useVideoConfig();
    const { customFontData } = getInputProps() as { customFontData?: { fontFamily: string; url: string } };
    
    const mergedStyle = useMemo(() => {
        const baseStyle = { ...style, ...styleOverrides };
        if (customFontData?.fontFamily) {
            baseStyle.font = `"${customFontData.fontFamily}", ${FONT_FALLBACKS['custom'] || 'sans-serif'}`;
        }
        return baseStyle;
    }, [style, styleOverrides, customFontData]);

    const dynamicWordsPerLine = maxWordsPerLine ?? calculateOptimalWordsPerLine(mergedStyle.fontSize, width, (mergedStyle.padding || 12) * 2, mergedStyle.letterSpacing || 0);
    const generatedWordTimings = useMemo(() => wordTimings && wordTimings.length > 0 ? wordTimings : parseTranscriptWithTimings(transcript, durationInFrames / fps), [transcript, wordTimings, durationInFrames, fps]);
    const chunks = useMemo(() => breakIntoChunks(transcript, generatedWordTimings, dynamicWordsPerLine), [transcript, generatedWordTimings, dynamicWordsPerLine]);
    const currentTime = frame / fps;

    const activeChunks = useMemo(() => chunks.filter(chunk => {
        if (chunk.words.length === 0) return false;
        const start = chunk.words[0].startTime;
        let end = chunk.words[chunk.words.length - 1].endTime;
        if (chunk.words.length === 1) {
            const index = chunks.findIndex(c => c === chunk);
            const next = chunks[index + 1];
            if (next) end = Math.max(end, next.words[0].startTime - 0.05);
            else end += 0.3;
        }
        return currentTime >= start && currentTime <= end;
    }), [chunks, currentTime]);

    const getPositionStyle = useCallback(() => {
        switch (position) {
            case 'top': return { top: '8%', left: '50%', transform: 'translateX(-50%)' };
            case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
            case 'bottom': default: return { bottom: '25%', left: '50%', transform: 'translateX(-50%)' };
        }
    }, [position]);
    
    const baseChunkStyle = useMemo(() => generateCSSFromSubtitleStyle(mergedStyle, {}, width, previewScale), [mergedStyle, width, previewScale]);

    return (
        <AbsoluteFill>
            <div style={{ position: 'absolute', ...getPositionStyle(), zIndex: 1000 }}>
                {activeChunks.map((chunk, chunkIndex) => {
                    const startFrame = chunk.words[0].startTime * fps;
                    const endFrame = chunk.words[chunk.words.length - 1].endTime * fps;
                    const animation = getWordAnimation(frame, startFrame, endFrame, animationType, fps);
                    return (
                        <div key={`chunk-${chunkIndex}`} style={{ ...baseChunkStyle, ...animation }}>
                            <span>{useCapsLock ? chunk.text.toUpperCase() : chunk.text}</span>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

export default Subtitles;

import React, { useState, useEffect } from 'react';
import { SubtitleStyle } from '../remotion/components/Subtitles';

interface LiveSubtitlePreviewProps {
  text?: string;
  style?: SubtitleStyle | null;
  position?: 'bottom' | 'top' | 'center';
  animation?: 'fade' | 'slide' | 'typewriter' | 'bounce';
  useCapsLock?: boolean;
  isVisible: boolean;
}

const LiveSubtitlePreview: React.FC<LiveSubtitlePreviewProps> = ({
  text,
  style,
  position = 'bottom',
  animation = 'fade',
  useCapsLock = false,
  isVisible
}) => {
  const [currentText, setCurrentText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Sample text to cycle through when no script is provided
  const sampleTexts = [
    "Transform your ideas into stunning videos",
    "Professional AI-powered video creation",
    "Engage your audience with dynamic content",
    "Your message, beautifully presented"
  ];

  useEffect(() => {
    if (!isVisible || !style) return;

    const displayText = text || sampleTexts[0];
    
    if (animation === 'typewriter') {
      // Typewriter effect
      setCurrentText('');
      setIsAnimating(true);
      let index = 0;
      const words = displayText.split(' ');
      
      const typeWriter = () => {
        if (index < words.length) {
          setCurrentText(words.slice(0, index + 1).join(' '));
          index++;
          setTimeout(typeWriter, 300);
        } else {
          setIsAnimating(false);
          // Reset after showing full text for a while
          setTimeout(() => {
            if (isVisible) {
              setCurrentText('');
              index = 0;
              setTimeout(typeWriter, 500);
            }
          }, 2000);
        }
      };
      
      typeWriter();
    } else {
      // For other animations, show full text with CSS animations
      setCurrentText(displayText);
      setIsAnimating(true);
      
      // Cycle through sample texts if no script provided
      if (!text) {
        const interval = setInterval(() => {
          setCurrentText(prev => {
            const currentIndex = sampleTexts.indexOf(prev);
            return sampleTexts[(currentIndex + 1) % sampleTexts.length];
          });
        }, 3000);
        
        return () => clearInterval(interval);
      }
    }
  }, [text, style, animation, isVisible, useCapsLock]);

  if (!isVisible || !style || !currentText) return null;

  const getPositionStyles = () => {
    const base = "fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-none";
    switch (position) {
      case 'top':
        return `${base} top-16`;
      case 'center':
        return `${base} top-1/2 -translate-y-1/2`;
      case 'bottom':
      default:
        return `${base} bottom-16`;
    }
  };

  const getAnimationClass = () => {
    switch (animation) {
      case 'slide':
        return 'animate-slideInUp';
      case 'bounce':
        return 'animate-bounceIn';
      case 'fade':
      default:
        return 'animate-fadeIn';
    }
  };

  const displayText = useCapsLock ? currentText.toUpperCase() : currentText;

  return (
    <div className={getPositionStyles()}>
      <div
        className={`px-4 py-2 rounded-lg max-w-2xl text-center ${getAnimationClass()}`}
        style={{
          background: style.backgroundColor,
          color: style.textColor,
          fontFamily: style.font,
          fontSize: '18px',
          fontWeight: style.fontWeight,
          borderRadius: `${style.borderRadius}px`,
          textShadow: style.textShadow,
          border: style.border,
          lineHeight: style.lineHeight,
        }}
      >
        {displayText}
      </div>
    </div>
  );
};

export default LiveSubtitlePreview;
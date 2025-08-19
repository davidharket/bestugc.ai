import React, { useState } from 'react';
import { SUBTITLE_STYLES, SubtitleStyle } from '../remotion/components/Subtitles';

interface SubtitleCustomizerProps {
  selectedStyle: SubtitleStyle;
  onStyleChange: (style: SubtitleStyle) => void;
  onAnimationChange: (animation: 'fade' | 'slide' | 'typewriter' | 'bounce') => void;
  onPositionChange: (position: 'bottom' | 'top' | 'center') => void;
  selectedAnimation: 'fade' | 'slide' | 'typewriter' | 'bounce';
  selectedPosition: 'bottom' | 'top' | 'center';
}

const SubtitleCustomizer: React.FC<SubtitleCustomizerProps> = ({
  selectedStyle,
  onStyleChange,
  onAnimationChange,
  onPositionChange,
  selectedAnimation,
  selectedPosition,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const animationOptions = [
    { value: 'fade', label: 'Fade In', description: 'Smooth fade in/out' },
    { value: 'slide', label: 'Slide Up', description: 'Slide from bottom' },
    { value: 'typewriter', label: 'Typewriter', description: 'Appear word by word' },
    { value: 'bounce', label: 'Bounce', description: 'Bouncy spring effect' },
  ];

  const positionOptions = [
    { value: 'bottom', label: 'Bottom', description: 'Bottom of screen' },
    { value: 'center', label: 'Center', description: 'Center of screen' },
    { value: 'top', label: 'Top', description: 'Top of screen' },
  ];

  const StylePreview: React.FC<{ style: SubtitleStyle; isSelected: boolean }> = ({ style, isSelected }) => (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-orange-500 bg-orange-500/10' 
          : 'hover:bg-gray-700 bg-gray-800'
      }`}
      onClick={() => onStyleChange(style)}
    >
      <div className="mb-2 text-sm font-medium text-white">{style.name}</div>
      <div
        className="text-xs px-2 py-1 rounded inline-block"
        style={{
          background: style.backgroundColor,
          color: style.textColor,
          fontFamily: style.font,
          fontSize: '12px',
          fontWeight: style.fontWeight,
          borderRadius: `${style.borderRadius}px`,
          textShadow: style.textShadow,
          border: style.border,
        }}
      >
        Sample text
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Subtitle Customization</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          {isExpanded ? 'Hide Options' : 'Show Options'}
        </button>
      </div>

      {/* Quick Style Preview */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-300 mb-2">Current Style</div>
        <div
          className="inline-block px-4 py-2 rounded-lg text-center"
          style={{
            background: selectedStyle.backgroundColor,
            color: selectedStyle.textColor,
            fontFamily: selectedStyle.font,
            fontSize: '16px',
            fontWeight: selectedStyle.fontWeight,
            borderRadius: `${selectedStyle.borderRadius}px`,
            textShadow: selectedStyle.textShadow,
            border: selectedStyle.border,
          }}
        >
          Your subtitles will look like this
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Style</label>
            <div className="grid grid-cols-2 gap-3">
              {SUBTITLE_STYLES.map((style) => (
                <StylePreview
                  key={style.id}
                  style={style}
                  isSelected={selectedStyle.id === style.id}
                />
              ))}
            </div>
          </div>

          {/* Animation Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Animation</label>
            <div className="grid grid-cols-2 gap-3">
              {animationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onAnimationChange(option.value as any)}
                  className={`p-3 rounded-lg text-left transition-all duration-200 ${
                    selectedAnimation === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Position</label>
            <div className="grid grid-cols-3 gap-3">
              {positionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPositionChange(option.value as any)}
                  className={`p-3 rounded-lg text-center transition-all duration-200 ${
                    selectedPosition === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Advanced Features</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Automatic timing synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Engaging word-by-word display</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Responsive text sizing</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Multi-language support</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtitleCustomizer;
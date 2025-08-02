// components/FontSubtitleSelector.tsx
import React from 'react';
import { SUBTITLE_STYLES, SubtitleStyle } from '../remotion/components/Subtitles';
import CustomDropdown from './CustomDropdown';

interface FontSubtitleSelectorProps {
  selectedStyle: SubtitleStyle | null;
  onStyleChange: (style: SubtitleStyle | null) => void;
  onAnimationChange: (animation: 'fade' | 'slide' | 'typewriter' | 'bounce') => void;
  onPositionChange: (position: 'bottom' | 'top' | 'center') => void;
  selectedAnimation: 'fade' | 'slide' | 'typewriter' | 'bounce';
  selectedPosition: 'bottom' | 'top' | 'center';
  enableSubtitles: boolean;
  onEnableSubtitlesChange: (enabled: boolean) => void;
  useCapsLock: boolean;
  onUseCapsLockChange: (useCaps: boolean) => void;
}

const FontSubtitleSelector: React.FC<FontSubtitleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  onAnimationChange,
  onPositionChange,
  selectedAnimation,
  selectedPosition,
  enableSubtitles,
  onEnableSubtitlesChange,
  useCapsLock,
  onUseCapsLockChange,
}) => {
  const animationOptions = [
    { value: 'fade', label: 'Fade In' },
    { value: 'slide', label: 'Slide Up' },
    { value: 'typewriter', label: 'Typewriter' },
    { value: 'bounce', label: 'Bounce' },
  ];

  const positionOptions = [
    { value: 'bottom', label: 'Bottom' },
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
  ];

  const fontOptions = SUBTITLE_STYLES.map(style => ({
    value: style.id,
    label: style.name
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-white font-medium flex-grow">Subtitles</h4>
        <button
          onClick={() => onEnableSubtitlesChange(!enableSubtitles)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enableSubtitles ? 'bg-orange-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              enableSubtitles ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Font Style</label>
          <CustomDropdown
            value={selectedStyle?.id || fontOptions[0]?.value || ''}
            options={fontOptions}
            onChange={(value) => {
              const style = SUBTITLE_STYLES.find(s => s.id === value);
              onStyleChange(style || null);
            }}
            valueKey="value"
            labelKey="label"
            placeholder="Select font"
            disabled={!enableSubtitles}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Animation</label>
          <CustomDropdown
            value={selectedAnimation}
            options={animationOptions}
            onChange={(value) => onAnimationChange(value as any)}
            valueKey="value"
            labelKey="label"
            placeholder="Select animation"
            disabled={!enableSubtitles}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Position</label>
          <CustomDropdown
            value={selectedPosition}
            options={positionOptions}
            onChange={(value) => onPositionChange(value as any)}
            valueKey="value"
            labelKey="label"
            placeholder="Select position"
            disabled={!enableSubtitles}
          />
        </div>

        {selectedStyle && selectedStyle.supportsCaps && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Format</label>
            <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
              <span className="text-sm text-white">ALL CAPS</span>
              <button
                onClick={() => onUseCapsLockChange(!useCapsLock)}
                disabled={!enableSubtitles}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  useCapsLock ? 'bg-orange-500' : 'bg-gray-600'
                } ${!enableSubtitles ? 'cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${
                    useCapsLock ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSubtitleSelector;

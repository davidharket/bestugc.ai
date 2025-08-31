// components/FontSubtitleSelector.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { SubtitleStyle } from '../remotion/components/Subtitles';
import CustomDropdown from './CustomDropdown';
import FontUploader from './FontUploader';
import customFontManager, { CustomFont } from '../lib/custom-font-loader';
import { getAllAvailableFonts } from '../lib/google-fonts';

interface FontPreset {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  outlineWidth: number;
  outlineColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

const fontPresets: FontPreset[] = [
  { name: 'Standard', fontFamily: 'Arial, sans-serif', fontSize: 50, fontWeight: 700, textColor: '#FFFFFF', outlineWidth: 1, outlineColor: '#000000', shadowOffsetX: 2, shadowOffsetY: 2, shadowBlur: 4, shadowColor: '#000000B3', letterSpacing: 0, textTransform: 'none' },
  { name: 'Modern', fontFamily: 'Roboto, sans-serif', fontSize: 48, fontWeight: 500, textColor: '#FFFFFF', outlineWidth: 0, outlineColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 4, shadowBlur: 10, shadowColor: '#00000080', letterSpacing: 0.5, textTransform: 'none' },
  { name: 'Bold & Clear', fontFamily: 'Montserrat, sans-serif', fontSize: 52, fontWeight: 800, textColor: '#FFFFFF', outlineWidth: 2, outlineColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, shadowColor: '#00000000', letterSpacing: 0, textTransform: 'uppercase' },
  { name: 'Cinematic', fontFamily: 'Georgia, serif', fontSize: 45, fontWeight: 400, textColor: '#FFFFFF', outlineWidth: 0.5, outlineColor: '#111111', shadowOffsetX: 1, shadowOffsetY: 1, shadowBlur: 5, shadowColor: '#000000CC', letterSpacing: 1, textTransform: 'none' },
];

interface FontSubtitleSelectorProps {
  selectedStyle: SubtitleStyle | null;
  onStyleChange: (style: (SubtitleStyle & { url?: string }) | null) => void;
  onAnimationChange: (animation: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none') => void;
  onPositionChange: (position: 'bottom' | 'top' | 'center') => void;
  selectedAnimation: 'fade' | 'slide' | 'typewriter' | 'bounce' | 'none';
  selectedPosition: 'bottom' | 'top' | 'center';
  enableSubtitles: boolean;
  onEnableSubtitlesChange: (enabled: boolean) => void;
  useCapsLock: boolean;
  onUseCapsLockChange: (useCaps: boolean) => void;
  oneWordAtATime?: boolean;
  onOneWordAtATimeChange?: (enabled: boolean) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  fontWeight?: number;
  onFontWeightChange?: (weight: number) => void;
  outlineWidth?: number;
  onOutlineWidthChange?: (width: number) => void;
  outlineColor?: string;
  onOutlineColorChange?: (color: string) => void;
  shadowOffsetX?: number;
  onShadowOffsetXChange?: (offset: number) => void;
  shadowOffsetY?: number;
  onShadowOffsetYChange?: (offset: number) => void;
  shadowBlur?: number;
  onShadowBlurChange?: (blur: number) => void;
  shadowColor?: string;
  onShadowColorChange?: (color: string) => void;
  enableShadow?: boolean;
  onEnableShadowChange?: (enabled: boolean) => void;
  letterSpacing?: number;
  onLetterSpacingChange?: (spacing: number) => void;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  onTextTransformChange?: (transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => void;
  textColor?: string;
  onTextColorChange?: (color: string) => void;
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
  oneWordAtATime,
  onOneWordAtATimeChange,
  fontSize,
  onFontSizeChange,
  fontWeight,
  onFontWeightChange,
  outlineWidth,
  onOutlineWidthChange,
  outlineColor,
  onOutlineColorChange,
  shadowOffsetX,
  onShadowOffsetXChange,
  shadowOffsetY,
  onShadowOffsetYChange,
  shadowBlur,
  onShadowBlurChange,
  shadowColor,
  onShadowColorChange,
  enableShadow,
  onEnableShadowChange,
  letterSpacing,
  onLetterSpacingChange,
  textTransform,
  onTextTransformChange,
  textColor,
  onTextColorChange,
}) => {
  const [showFontUploader, setShowFontUploader] = useState(false);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      const fonts = await customFontManager.loadCustomFonts();
      setCustomFonts(fonts);
    };
    loadFonts();
    const interval = setInterval(loadFonts, 5000);
    return () => clearInterval(interval);
  }, []);

  const applyPreset = (preset: FontPreset) => {
    if (!enableSubtitles) return;
    if (onFontSizeChange) onFontSizeChange(preset.fontSize);
    if (onFontWeightChange) onFontWeightChange(preset.fontWeight);
    if (onTextColorChange) onTextColorChange(preset.textColor);
    if (onOutlineWidthChange) onOutlineWidthChange(preset.outlineWidth);
    if (onOutlineColorChange) onOutlineColorChange(preset.outlineColor);
    if (onShadowOffsetXChange) onShadowOffsetXChange(preset.shadowOffsetX);
    if (onShadowOffsetYChange) onShadowOffsetYChange(preset.shadowOffsetY);
    if (onShadowBlurChange) onShadowBlurChange(preset.shadowBlur);
    if (onShadowColorChange) onShadowColorChange(preset.shadowColor);
    if (onLetterSpacingChange) onLetterSpacingChange(preset.letterSpacing);
    if (onTextTransformChange) onTextTransformChange(preset.textTransform);
    if (selectedStyle) {
        onStyleChange({ ...selectedStyle, font: preset.fontFamily, fontSize: preset.fontSize, fontWeight: preset.fontWeight, textColor: preset.textColor });
    }
  };

  const animationOptions = [{ value: 'none', label: 'No Animation' }, { value: 'fade', label: 'Fade In' }, { value: 'slide', label: 'Slide Up' }, { value: 'bounce', label: 'Bounce' }];
  const positionOptions = [{ value: 'bottom', label: 'Bottom' }, { value: 'center', label: 'Center' }, { value: 'top', label: 'Top' }];
  const textTransformOptions = [{ value: 'none', label: 'None' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' }, { value: 'capitalize', label: 'Capitalize' }];

  const SUBTITLE_STYLES = useMemo(() => {
    return getAllAvailableFonts().map(font => ({
      id: font.id,
      name: font.name,
      font: font.fontFamily,
      fontSize: 50, fontWeight: 600, textColor: '#FFFFFF', backgroundColor: 'transparent',
      borderRadius: 0, padding: 8, textShadow: '1px 1px 2px #000',
      textAlign: 'center' as const, lineHeight: 1.2, maxWidth: 950, border: 'none', supportsCaps: true,
    }));
  }, []);

  const fontOptions = useMemo(() => [
    ...SUBTITLE_STYLES.map(style => ({ value: style.id, label: style.name, type: 'builtin' as const, fontData: style })),
    ...customFonts.map(font => ({ value: font.id, label: `${font.name} (Custom)`, type: 'custom' as const, fontData: font }))
  ], [customFonts, SUBTITLE_STYLES]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-white font-medium flex-grow">Subtitles</h4>
        <button
          onClick={() => onEnableSubtitlesChange(!enableSubtitles)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ enableSubtitles ? 'bg-orange-500' : 'bg-gray-600' }`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ enableSubtitles ? 'translate-x-5' : 'translate-x-1' }`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-400">Font Style</label>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDropdown
                key={`font-dropdown-${customFonts.length}`}
                value={selectedStyle?.id || fontOptions[0]?.value || ''}
                options={fontOptions}
                onChange={(value) => {
                  const selectedOption = fontOptions.find(f => f.value === value);
                  if (!selectedOption) return;
                  
                  const isCustom = selectedOption.type === 'custom';
                  const fontData = selectedOption.fontData as any;

                  const style: SubtitleStyle & { url?: string } = {
                    id: selectedOption.value, name: selectedOption.label, font: fontData.fontFamily,
                    fontSize: 50, fontWeight: 600, textColor: '#FFFFFF', backgroundColor: '#000000CC',
                    borderRadius: 12, padding: 12, textShadow: '2px 2px 4px #000000CC',
                    textAlign: 'center' as const, lineHeight: 1.2, maxWidth: 950, border: 'none', supportsCaps: true,
                    ...(isCustom && { url: fontData.url || fontData.uploadedFile })
                  };
                  onStyleChange(style);
                }}
                valueKey="value"
                labelKey="label"
                placeholder="Select font"
                disabled={!enableSubtitles}
                searchable={true}
                searchPlaceholder="Search fonts..."
              />
            </div>
            <button
              onClick={() => setShowFontUploader(!showFontUploader)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-[15px] transition-colors"
              title="Upload custom font"
            >
              <img src="/upload.svg" alt="Upload" className="w-4 h-4" />
            </button>
          </div>

          {showFontUploader && (
            <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-[15px]">
              <h4 className="text-white font-medium mb-3">Upload Custom Font</h4>
              <FontUploader
                onFontUploaded={async (font) => {
                  const updatedFonts = await customFontManager.loadCustomFonts();
                  setCustomFonts(updatedFonts);
                  const newCustomFont = updatedFonts.find(f => f.id === font.id);
                  if (newCustomFont) {
                    const newStyle: SubtitleStyle & { url?: string } = {
                      id: newCustomFont.id, name: newCustomFont.name, font: newCustomFont.fontFamily,
                      fontSize: 50, fontWeight: 600, textColor: '#FFFFFF', backgroundColor: '#000000CC',
                      borderRadius: 12, padding: 12, textShadow: '2px 2px 4px #000000CC',
                      textAlign: 'center' as const, lineHeight: 1.2, maxWidth: 950, border: 'none', supportsCaps: true,
                      url: newCustomFont.uploadedFile,
                    };
                    onStyleChange(newStyle);
                  }
                  setShowFontUploader(false);
                }}
              />
            </div>
          )}
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {selectedStyle && selectedStyle.supportsCaps && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Format</label>
            <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
              <span className="text-sm text-white">ALL CAPS</span>
              <button
                onClick={() => onUseCapsLockChange(!useCapsLock)}
                disabled={!enableSubtitles}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ useCapsLock ? 'bg-orange-500' : 'bg-gray-600' } ${!enableSubtitles ? 'cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${ useCapsLock ? 'translate-x-4' : 'translate-x-1' }`} />
              </button>
            </div>
          </div>
        )}
        {onOneWordAtATimeChange && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Display</label>
            <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
              <span className="text-sm text-white">One word at a time</span>
              <button
                onClick={() => onOneWordAtATimeChange(!oneWordAtATime)}
                disabled={!enableSubtitles}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${ oneWordAtATime ? 'bg-orange-500' : 'bg-gray-600' } ${!enableSubtitles ? 'cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${ oneWordAtATime ? 'translate-x-4' : 'translate-x-1' }`} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
          <h4 className="text-white font-medium mb-3">Style Presets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fontPresets.map((preset) => (
                  <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      disabled={!enableSubtitles}
                      className={`p-4 text-left rounded-[15px] border transition-all duration-200 ${ !enableSubtitles ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-gray-800 border-gray-700 hover:bg-orange-500/10 hover:border-orange-500 text-white' }`}
                  >
                      <div className="flex flex-col gap-2">
                          <span className="text-sm font-normal text-gray-300">{preset.name}</span>
                          <div
                              className="text-2xl leading-tight"
                              style={{
                                  fontFamily: preset.fontFamily,
                                  fontWeight: preset.fontWeight,
                                  color: preset.textColor,
                                  textTransform: preset.textTransform,
                                  letterSpacing: `${preset.letterSpacing}px`,
                                  textShadow: (() => {
                                    const shadows = [];
                                    if (preset.outlineWidth > 0) {
                                      const width = preset.outlineWidth; const color = preset.outlineColor;
                                      for (let x = -width; x <= width; x++) for (let y = -width; y <= width; y++) if (x !== 0 || y !== 0) shadows.push(`${x}px ${y}px 0 ${color}`);
                                    }
                                    if (preset.shadowOffsetX !== 0 || preset.shadowOffsetY !== 0 || preset.shadowBlur !== 0) shadows.push(`${preset.shadowOffsetX}px ${preset.shadowOffsetY}px ${preset.shadowBlur}px ${preset.shadowColor}`);
                                    return shadows.length > 0 ? shadows.join(', ') : 'none';
                                  })()
                              }}
                          >
                              Aa
                          </div>
                      </div>
                  </button>
              ))}
          </div>
      </div>

      <div className="mt-6 border-t border-gray-700 pt-4">
          <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="text-white font-medium flex items-center gap-2 w-full justify-between">
              <span>Advanced Font Settings</span>
              <svg className={`w-5 h-5 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
          </button>
      </div>

      {selectedStyle && showAdvancedSettings && (
        <div className="mt-4">
          {onFontSizeChange && (
            <div className="lg:col-span-1 mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-1">Font Size</label>
              <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                  <input type="range" min="20" max="100" value={fontSize} onChange={(e) => onFontSizeChange(Number(e.target.value))} disabled={!enableSubtitles} className={`slider ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                  <span className="text-sm text-white ml-3">{fontSize}px</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {onFontWeightChange && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Font Weight</label>
                <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                  <input type="range" min="100" max="900" step="100" value={fontWeight || selectedStyle.fontWeight} onChange={(e) => onFontWeightChange(Number(e.target.value))} disabled={!enableSubtitles} className={`slider ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                  <span className="text-sm text-white ml-3">{fontWeight || selectedStyle.fontWeight}</span>
                </div>
              </div>
            )}
            {onTextColorChange && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Text Color</label>
                <div className={`flex items-center gap-2 p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                  <input type="color" value={textColor || selectedStyle.textColor} onChange={(e) => onTextColorChange(e.target.value)} disabled={!enableSubtitles} className={`w-8 h-8 rounded-lg border-2 border-gray-600 bg-gray-700 cursor-pointer ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                  <input type="text" value={textColor || selectedStyle.textColor} onChange={(e) => onTextColorChange(e.target.value)} disabled={!enableSubtitles} className={`flex-1 bg-transparent text-white text-sm border-none outline-none ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} placeholder="#ffffff" />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {onTextTransformChange && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Text Transform</label>
                <CustomDropdown value={textTransform || 'none'} options={textTransformOptions} onChange={(value) => onTextTransformChange(value as any)} valueKey="value" labelKey="label" disabled={!enableSubtitles} />
              </div>
            )}
            {onLetterSpacingChange && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Letter Spacing</label>
                <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                  <input type="range" min="-2" max="10" step="0.5" value={letterSpacing || 0} onChange={(e) => onLetterSpacingChange(Number(e.target.value))} disabled={!enableSubtitles} className={`slider ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                  <span className="text-sm text-white ml-3">{letterSpacing || 0}px</span>
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <h5 className="text-white text-sm font-medium mb-2">Outline Effect</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onOutlineWidthChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Outline Width</label>
                  <div className={`flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                    <input type="range" min="0" max="5" step="0.5" value={outlineWidth || 0} onChange={(e) => onOutlineWidthChange(Number(e.target.value))} disabled={!enableSubtitles} className={`slider ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                    <span className="text-sm text-white ml-3">{outlineWidth || 0}px</span>
                  </div>
                </div>
              )}
              {onOutlineColorChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Outline Color</label>
                  <div className={`flex items-center gap-2 p-2 bg-gray-800 rounded-[15px] border border-gray-700 transition-opacity ${!enableSubtitles ? 'opacity-50' : ''}`}>
                    <input type="color" value={outlineColor || '#000000'} onChange={(e) => onOutlineColorChange(e.target.value)} disabled={!enableSubtitles} className={`w-8 h-8 rounded-lg border-2 border-gray-600 bg-gray-700 cursor-pointer ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} />
                    <input type="text" value={outlineColor || '#000000'} onChange={(e) => onOutlineColorChange(e.target.value)} disabled={!enableSubtitles} className={`flex-1 bg-transparent text-white text-sm border-none outline-none ${!enableSubtitles ? 'cursor-not-allowed' : ''}`} placeholder="#000000" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-white text-sm font-medium">Drop Shadow</h5>
              {onEnableShadowChange && (
                <button
                  onClick={() => onEnableShadowChange(!enableShadow)}
                  disabled={!enableSubtitles}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ enableShadow ? 'bg-orange-500' : 'bg-gray-600' } ${!enableSubtitles ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ enableShadow ? 'translate-x-5' : 'translate-x-1' }`} />
                </button>
              )}
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 transition-opacity ${(!enableSubtitles || !enableShadow) ? 'opacity-50' : ''}`}>
              {onShadowOffsetXChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Shadow X</label>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700">
                    <input type="range" min="-10" max="10" step="1" value={shadowOffsetX || 0} onChange={(e) => onShadowOffsetXChange(Number(e.target.value))} disabled={!enableSubtitles || !enableShadow} className={`slider ${(!enableSubtitles || !enableShadow) ? 'cursor-not-allowed' : ''}`} />
                    <span className="text-sm text-white ml-3">{shadowOffsetX || 0}px</span>
                  </div>
                </div>
              )}
              {onShadowOffsetYChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Shadow Y</label>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700">
                    <input type="range" min="-10" max="10" step="1" value={shadowOffsetY || 0} onChange={(e) => onShadowOffsetYChange(Number(e.target.value))} disabled={!enableSubtitles || !enableShadow} className={`slider ${(!enableSubtitles || !enableShadow) ? 'cursor-not-allowed' : ''}`} />
                    <span className="text-sm text-white ml-3">{shadowOffsetY || 0}px</span>
                  </div>
                </div>
              )}
              {onShadowBlurChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Shadow Blur</label>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded-[15px] border border-gray-700">
                    <input type="range" min="0" max="20" step="1" value={shadowBlur || 0} onChange={(e) => onShadowBlurChange(Number(e.target.value))} disabled={!enableSubtitles || !enableShadow} className={`slider ${(!enableSubtitles || !enableShadow) ? 'cursor-not-allowed' : ''}`} />
                    <span className="text-sm text-white ml-3">{shadowBlur || 0}px</span>
                  </div>
                </div>
              )}
            </div>
            {onShadowColorChange && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${(!enableSubtitles || !enableShadow) ? 'opacity-50' : ''}`}>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Shadow Color</label>
                  <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-[15px] border border-gray-700">
                    <input type="color" value={shadowColor || '#000000'} onChange={(e) => onShadowColorChange(e.target.value)} disabled={!enableSubtitles || !enableShadow} className={`w-8 h-8 rounded-lg border-2 border-gray-600 bg-gray-700 cursor-pointer ${(!enableSubtitles || !enableShadow) ? 'cursor-not-allowed' : ''}`} />
                    <input type="text" value={shadowColor || '#000000'} onChange={(e) => onShadowColorChange(e.target.value)} disabled={!enableSubtitles || !enableShadow} className={`flex-1 bg-transparent text-white text-sm border-none outline-none ${(!enableSubtitles || !enableShadow) ? 'cursor-not-allowed' : ''}`} placeholder="#000000" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSubtitleSelector;

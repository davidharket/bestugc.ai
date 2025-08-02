// pages/ad/template.tsx
import { useRouter } from 'next/router';
import { useAdCreation } from '../../components/AdCreationContext';
import { TEMPLATE_LIBRARY, VideoTemplate } from '../../lib/templates';
import { avatars } from '../../lib/avatars';
import { useState, useEffect, useCallback } from 'react';
import { TemplatePreviewWithSubtitles } from '../../components/TemplatePreviewWithSubtitles';
import { SUBTITLE_STYLES } from '../../remotion/components/Subtitles';
import FontSubtitleSelector from '../../components/FontSubtitleSelector';
import axios from 'axios';
import toast from 'react-hot-toast';
import TTSCacheService from '../../lib/tts-cache-service';
import CustomDropdown from '../../components/CustomDropdown';

// UPDATED: Added the missing 5 music tracks from your public/music directory
const BACKGROUND_MUSIC_OPTIONS = [
  { id: 'none', name: 'No Background Music', url: '', description: 'Pure voice focus' },
  { id: 'upbeat-corporate', name: 'Happy lo-fi', url: '/music/1.mp3', description: 'Motivating and professional' },
  { id: 'chill-acoustic', name: 'Chill lo-fi', url: '/music/2.mp3', description: 'Relaxed and thoughtful' },
  { id: 'driving-rock', name: 'Tuned down lo-fi', url: '/music/3.mp3', description: 'High-energy and powerful' },
  { id: 'inspiring-piano', name: 'Calm lo-fi', url: '/music/4.mp3', description: 'Emotional and uplifting' },
  { id: 'modern-pop', name: 'Moody lo-fi', url: '/music/5.mp3', description: 'Catchy and current' },
  { id: 'funk', name: 'Funk Groove', url: '/music/funk-313770.mp3', description: 'Retro & groovy' },
  { id: 'happy-pop', name: 'Happy Pop', url: '/music/happy-pop-summer-372383.mp3', description: 'Bright & upbeat' },
  { id: 'lofi', name: 'Classic lo-fi', url: '/music/lofi-for-tiktok-369050.mp3', description: 'TikTok style' },
  { id: 'ambient', name: 'Corporate Upbeat', url: '/music/positive-ambient-background-ambient-euphoria-252100.mp3', description: 'Uplifting atmosphere' },
];


// Simplified Template Card
const TemplateCard: React.FC<{ template: VideoTemplate; isSelected: boolean; onSelect: () => void; }> = ({ template, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
      isSelected
        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400'
        : 'bg-gray-900 border border-gray-700 text-white hover:border-orange-500/50 hover:bg-gray-800'
    }`}
  >
    <h3 className="font-bold text-lg mb-2">{template.name}</h3>
    <p className={`text-sm leading-relaxed ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
      {template.description}
    </p>
  </div>
);


export default function SelectTemplatePage() {
    const router = useRouter();
    const { adData, setAdData } = useAdCreation();
    const [selectedTemplateId, setSelectedTemplateId] = useState(adData.templateId || TEMPLATE_LIBRARY[0].id);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number | undefined>(adData.audioDuration);
    const [isPlayingTTS, setIsPlayingTTS] = useState(false);
    const [ttsAudioRef, setTtsAudioRef] = useState<HTMLAudioElement | null>(null);
    const [selectedMusicId, setSelectedMusicId] = useState<string>(adData.backgroundMusicUrl ?
      (BACKGROUND_MUSIC_OPTIONS.find(m => m.url === adData.backgroundMusicUrl)?.id || 'none') : 'none');
    const [regenerationCount, setRegenerationCount] = useState(0);
    const MAX_REGENERATIONS = 2;

    // Initialize subtitle settings and default language if not set
    useEffect(() => {
      const updates: Partial<typeof adData> = {};
      
      if (!adData.subtitleStyle) {
        updates.subtitleStyle = SUBTITLE_STYLES[0].id;
        updates.subtitleAnimation = 'fade';
        updates.subtitlePosition = 'bottom';
        updates.enableSubtitles = true;
      }
      
      // Set default language if not set
      if (!adData.language) {
        updates.language = 'en';
        console.log('[Template] Setting default language to en');
      }
      
      if (Object.keys(updates).length > 0) {
        setAdData(updates);
      }
    }, []);

    // Check for missing audio and trigger generation
    useEffect(() => {
      console.log('[Template] Audio generation check:', { 
        selectedScript: !!adData.selectedScript, 
        script: !!adData.script,
        language: adData.language, 
        audioUrl: !!adData.audioUrl, 
        isGeneratingAudio,
        avatarId: adData.avatarId
      });
    }, [adData.selectedScript, adData.script, adData.language, adData.audioUrl, isGeneratingAudio, adData.avatarId]);

    const getDurationForExistingAudio = useCallback(async () => {
      if (!adData.audioUrl) return;

      try {
        const durationResponse = await axios.post('/api/video/get-duration', {
          filePath: adData.audioUrl
        });
        const duration = durationResponse.data.durationInSeconds;
        setAudioDuration(duration);
        setAdData({ audioDuration: duration });
      } catch (error) {
        console.error('Error getting existing audio duration:', error);
      }
    }, [adData.audioUrl]);

    const handleGenerateAudio = useCallback(async (forceRegenerate = false) => {
      const scriptToUse = adData.selectedScript || adData.script;
      if (!scriptToUse) {
        console.log('[Template] No script available for audio generation');
        return;
      }
      if (!adData.language) {
        console.log('[Template] No language set for audio generation');
        return;
      }

      console.log('[Template] Starting audio generation...', { scriptLength: scriptToUse.length, language: adData.language, forceRegenerate });
      
      setIsGeneratingAudio(true);
      try {
        const selectedGender = adData.avatarId ?
          (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') :
          'female';
        
        console.log('[Template] Using gender:', selectedGender, 'for avatar:', adData.avatarId);

        // If forcing regeneration, clear cache first
        if (forceRegenerate) {
          console.log('[Template] Clearing TTS cache for regeneration...');
          TTSCacheService.clearCache();
          console.log('[Template] Cache cleared, proceeding with new generation');
        }

        const result = await TTSCacheService.getTTS(scriptToUse, adData.language, selectedGender, adData.avatarId);

        console.log('[Template] Setting audio data:', { audioUrl: result.audioUrl, hasWordTimings: !!result.wordTimings });
        
        // Set generation to false IMMEDIATELY after TTS completes, before any other async operations
        setIsGeneratingAudio(false);
        console.log('[Template] Audio generation completed, isGeneratingAudio set to false');
        
        setAdData({
          audioUrl: result.audioUrl,
          wordTimings: result.wordTimings
        });

        if (forceRegenerate) {
          setRegenerationCount(prev => prev + 1);
        }

        // Fetch duration in the background without blocking the generation state
        if (result.audioUrl) {
          getDurationForExistingAudio();
        }
      } catch (error: any) {
        console.error('[Template] Error generating audio:', error);
        console.error('[Template] Error details:', error?.response?.data || error?.message);
        toast.error('Failed to generate audio. Please try again.');
        
        // Clear the audio URL on error to prevent stuck state
        setAdData({ audioUrl: undefined });
        
        // Ensure generation state is cleared on error
        setIsGeneratingAudio(false);
        console.log('[Template] Audio generation failed, isGeneratingAudio set to false');
      }
    }, [adData.selectedScript, adData.script, adData.language, adData.avatarId]);

    const handleRegenerateAudio = () => {
      if (regenerationCount >= MAX_REGENERATIONS) {
        toast.error(`Maximum ${MAX_REGENERATIONS} regenerations reached.`);
        return;
      }
      if (isGeneratingAudio) {
        console.log('[Template] Audio generation already in progress, ignoring regenerate request');
        return;
      }
      console.log('🔄 REGENERATE BUTTON CLICKED! Current state:', { 
        isGeneratingAudio, 
        regenerationCount,
        audioUrl: !!adData.audioUrl 
      });
      handleGenerateAudio(true);
    };

    // Generate audio automatically when we have script but no audio
    useEffect(() => {
      const shouldGenerateAudio = (adData.selectedScript || adData.script) && adData.language && !adData.audioUrl && !isGeneratingAudio;
      const shouldGetDuration = adData.audioUrl && !audioDuration;
      
      if (shouldGenerateAudio) {
        console.log('[Template] Triggering audio generation');
        handleGenerateAudio();
      } else if (shouldGetDuration) {
        console.log('[Template] Getting duration for existing audio');
        getDurationForExistingAudio();
      }
    }, [adData.selectedScript, adData.script, adData.language, adData.audioUrl, isGeneratingAudio, audioDuration, handleGenerateAudio, getDurationForExistingAudio]);

    const handleTTSPlayPause = () => {
      if (!adData.audioUrl) return;

      if (!ttsAudioRef) {
        const audio = new Audio(adData.audioUrl);
        setTtsAudioRef(audio);
        audio.play();
        setIsPlayingTTS(true);
        audio.onended = () => setIsPlayingTTS(false);
      } else {
        if (isPlayingTTS) {
          ttsAudioRef.pause();
          setIsPlayingTTS(false);
        } else {
          ttsAudioRef.play();
          setIsPlayingTTS(true);
        }
      }
    };

    const handleTemplateSelect = (templateId: string) => {
      setSelectedTemplateId(templateId);
      setAdData({ templateId });
    };

    const handleMusicChange = (musicId: string) => {
        setSelectedMusicId(musicId);
        const selectedMusic = BACKGROUND_MUSIC_OPTIONS.find(m => m.id === musicId);
        setAdData({
          backgroundMusicUrl: selectedMusic?.url || '',
          backgroundMusicVolume: selectedMusic?.id === 'none' ? 0 : 0.1 
        });
    };

    const handleNext = () => {
      setAdData({ templateId: selectedTemplateId });
      router.push('/ad/render');
    };

    const getOrderedAssets = () => {
      const orderedImages = adData.orderedImages || [];
      const orderedVideos = adData.orderedVideos || [];
      const orderedBRoll = adData.orderedBRoll || [];

      const convertBRollUrl = (url: string) => url.startsWith('b-roll/') ? `/api/serve-broll/${url.replace('b-roll/', '')}` : url;

      if (orderedImages.length > 0 || orderedVideos.length > 0 || orderedBRoll.length > 0) {
        const allOrderedAssets = [...orderedImages, ...orderedVideos, ...orderedBRoll];
        return allOrderedAssets
          .sort((a, b) => a.order - b.order)
          .map(asset => convertBRollUrl(asset.url));
      }
      return [
        ...(adData.selectedImages || []),
        ...(adData.selectedVideos || []),
        ...(adData.selectedBRoll || []).map(convertBRollUrl)
      ];
    };

    const allAssets = getOrderedAssets();
    const selectedTemplate = TEMPLATE_LIBRARY.find(t => t.id === selectedTemplateId);

  return (
    <div className="min-h-screen bg-black text-white">
        {/* Hidden audio elements for music previews */}
        {BACKGROUND_MUSIC_OPTIONS.map(music =>
            music.url && <audio key={music.id} id={`music-preview-${music.id}`} src={music.url} preload="none" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Customize Your Ad</h1>
                <p className="text-gray-400">Select a template and fine-tune your ad's style. The preview will update on the right.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">1. Choose a Video Template</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TEMPLATE_LIBRARY.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isSelected={selectedTemplateId === template.id}
                                    onSelect={() => handleTemplateSelect(template.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">2. Fine-Tune Your Style</h2>
                        <div className="space-y-8">
                            {/* Preview Format Toggle - Only show if dual format is enabled */}
                            {adData.enableDualFormat && (
                                <div>
                                    <h4 className="text-white font-medium mb-4">Preview Format</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAdData({ currentPreviewFormat: '9:16' })}
                                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                                (adData.currentPreviewFormat || '9:16') === '9:16'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            9:16 Preview
                                        </button>
                                        <button
                                            onClick={() => setAdData({ currentPreviewFormat: '4:5' })}
                                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                                adData.currentPreviewFormat === '4:5'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            4:5 Preview
                                        </button>
                                    </div>
                                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-blue-300">
                                                <div className="font-medium text-xs mb-1">Multiple Format Selected</div>
                                                <div className="text-xs">You selected multiple formats in step 2. Toggle between previews to see how your ad will look in each format.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <h4 className="text-white font-medium mb-4">Audio & Music</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Voiceover</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleTTSPlayPause}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                isPlayingTTS
                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                }`}
                                                disabled={isGeneratingAudio || !adData.audioUrl}
                                            >
                                                {isGeneratingAudio ? '🎵 Generating...' : (isPlayingTTS ? '❚❚ Pause' : '▶ Play Voiceover')}
                                            </button>
                                            <button
                                                onClick={handleRegenerateAudio}
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:bg-gray-800 disabled:text-gray-500"
                                                disabled={isGeneratingAudio || regenerationCount >= MAX_REGENERATIONS}
                                                title={regenerationCount >= MAX_REGENERATIONS ? `Maximum ${MAX_REGENERATIONS} regenerations reached` : 'Regenerate voiceover'}
                                            >
                                                🔄
                                            </button>
                                        </div>
                                        {regenerationCount > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Regenerations: {regenerationCount}/{MAX_REGENERATIONS}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Background Music</label>
                                        <CustomDropdown
                                            value={selectedMusicId}
                                            options={BACKGROUND_MUSIC_OPTIONS}
                                            onChange={handleMusicChange}
                                            valueKey="id"
                                            labelKey="name"
                                            placeholder="Select music"
                                            renderOption={(music, isSelected, { close }) => (
                                                <div
                                                    key={music.id}
                                                    onClick={() => {
                                                        handleMusicChange(music.id);
                                                        close();
                                                    }}
                                                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between cursor-pointer hover:bg-orange-500/10 transition-colors ${
                                                        isSelected ? 'bg-orange-500/10' : ''
                                                    }`}
                                                >
                                                    <span className="text-white flex-grow truncate">{music.name}</span>
                                                    {music.url && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const audio = document.getElementById(`music-preview-${music.id}`) as HTMLAudioElement;
                                                                if (audio.paused) {
                                                                    document.querySelectorAll<HTMLAudioElement>('audio[id^="music-preview-"]').forEach(a => a.pause());
                                                                    audio.play();
                                                                } else {
                                                                    audio.pause();
                                                                }
                                                            }}
                                                            className="ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center text-orange-400 hover:text-orange-300 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                                                        >
                                                            ▶
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {(adData.selectedScript || adData.script) && (
                                <FontSubtitleSelector
                                    selectedStyle={adData.enableSubtitles ? (SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0]) : null}
                                    onStyleChange={(style) => setAdData({ subtitleStyle: style?.id })}
                                    onAnimationChange={(animation) => setAdData({ subtitleAnimation: animation })}
                                    onPositionChange={(position) => setAdData({ subtitlePosition: position })}
                                    selectedAnimation={adData.subtitleAnimation || 'fade'}
                                    selectedPosition={adData.subtitlePosition || 'bottom'}
                                    enableSubtitles={adData.enableSubtitles !== false}
                                    onEnableSubtitlesChange={(enabled) => setAdData({ enableSubtitles: enabled })}
                                    useCapsLock={adData.useCapsLock || false}
                                    onUseCapsLockChange={(useCaps) => setAdData({ useCapsLock: useCaps })}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        {selectedTemplate && allAssets.length > 0 ? (
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                                    <span className="text-sm text-gray-400">{selectedTemplate.name}</span>
                                </div>
                                <TemplatePreviewWithSubtitles
                                    template={selectedTemplate}
                                    assets={allAssets}
                                    avatarId={adData.avatarId || 1}
                                    script={adData.selectedScript || adData.script || ''}
                                    subtitleStyle={SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0]}
                                    subtitleAnimation={adData.subtitleAnimation || 'fade'}
                                    subtitlePosition={adData.subtitlePosition || 'bottom'}
                                    enableSubtitles={adData.enableSubtitles !== false}
                                    audioUrl={adData.audioUrl}
                                    audioDuration={audioDuration}
                                    useCapsLock={adData.useCapsLock || false}
                                    wordTimings={adData.wordTimings}
                                    currentPreviewFormat={adData.currentPreviewFormat}
                                />
                                <div className="mt-4 text-center text-xs text-gray-400">
                                    Est. Duration: {audioDuration ? `${Math.round(audioDuration)}s` : '...'}
                                </div>
                                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className="text-yellow-400 text-sm">⚠️</span>
                                        <div className="text-xs text-yellow-200">
                                            <p className="font-medium mb-1">Live Preview Notice</p>
                                            <p>This is a style showcase, not the final render. Your actual video will be created on the next page with proper timing and quality.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
                                <p className="text-gray-400">Select a template and upload assets to see a preview.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-between">
                <button
                    className="btn-secondary"
                    onClick={() => router.back()}
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <button
                    className={`btn-primary ${!selectedTemplateId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleNext}
                    disabled={!selectedTemplateId}
                >
                    Continue to Final Step
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
  );
}

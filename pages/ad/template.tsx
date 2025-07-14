// pages/ad/template.tsx
import { useRouter } from 'next/router';
import { useAdCreation } from '../../components/AdCreationContext';
import { TEMPLATE_LIBRARY, VideoTemplate } from '../../lib/templates'; // Import your library
import { useState, useEffect } from 'react';
import { TemplatePreviewWithSubtitles } from '../../components/TemplatePreviewWithSubtitles';
import { SUBTITLE_STYLES } from '../../remotion/components/Subtitles';
import SubtitleCustomizer from '../../components/SubtitleCustomizer';
import axios from 'axios';

// A component to display a single template card
const TemplateCard: React.FC<{
  template: VideoTemplate;
  isSelected: boolean;
  onSelect: () => void;
  showPreview: boolean;
  assets: string[];
  avatarId: number;
}> = ({ template, isSelected, onSelect, showPreview, assets, avatarId }) => (
  <div
    onClick={onSelect}
    className={`p-6 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
      isSelected 
        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
        : 'bg-gray-900 border border-gray-700 text-white hover:border-orange-500/50 hover:bg-gray-800'
    }`}
  >
    <div className="flex gap-4">
      {/* Template Info */}
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-2">{template.name}</h3>
        <p className={`text-sm leading-relaxed mb-3 ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
          {template.description}
        </p>
        
        {/* Template Stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className={`${isSelected ? 'text-orange-200' : 'text-gray-500'}`}>
            {template.timeline.length} scenes
          </span>
          <span className={`${isSelected ? 'text-orange-200' : 'text-gray-500'}`}>
            {template.timeline.filter(scene => scene.assetIndices && scene.assetIndices.length > 0).length} assets used
          </span>
        </div>
      </div>
      
    </div>
  </div>
);


export default function SelectTemplatePage() {
    const router = useRouter();
    const { adData, setAdData } = useAdCreation();
    // This line is now correct, as it's initializing with a string ID.
    const [selectedTemplateId, setSelectedTemplateId] = useState(adData.templateId || TEMPLATE_LIBRARY[0].id);
    const [showPreviews, setShowPreviews] = useState(true);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number | undefined>(adData.audioDuration);
    
    // Initialize subtitle settings if not set
    useEffect(() => {
      if (!adData.subtitleStyle) {
        setAdData({
          subtitleStyle: SUBTITLE_STYLES[0].id,
          subtitleAnimation: 'fade',
          subtitlePosition: 'bottom',
          enableSubtitles: true
        });
      }
    }, []);
  
    // Generate audio automatically when component mounts
    useEffect(() => {
      if (adData.selectedScript && adData.language && !adData.audioUrl && !isGeneratingAudio) {
        handleGenerateAudio();
      } else if (adData.audioUrl && !audioDuration) {
        // Get duration for existing audio
        getDurationForExistingAudio();
      }
    }, [adData.selectedScript, adData.language, adData.audioUrl]);

    // Auto-play audio when available
    useEffect(() => {
      if (adData.audioUrl) {
        const audio = new Audio(adData.audioUrl);
        audio.play().catch(err => {
          // Auto-play might be blocked by browser, that's OK
          console.log('Auto-play blocked:', err);
        });
      }
    }, [adData.audioUrl]);
    
    const getDurationForExistingAudio = async () => {
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
    };

    const handleGenerateAudio = async () => {
      if (!adData.selectedScript || !adData.language) return;
      
      setIsGeneratingAudio(true);
      try {
        const response = await axios.post('/api/tts/elevenlabs', {
          text: adData.selectedScript,
          language: adData.language,
          voiceId: 'auto', // Let the system choose
        });
        
        // Store the audio URL in context for the render page
        setAdData({ audioUrl: response.data.audioUrl });
        
        // Get audio duration
        if (response.data.audioUrl) {
          try {
            const durationResponse = await axios.post('/api/video/get-duration', {
              filePath: response.data.audioUrl
            });
            const duration = durationResponse.data.durationInSeconds;
            setAudioDuration(duration);
            setAdData({ audioDuration: duration });
          } catch (durationError) {
            console.error('Error getting audio duration:', durationError);
          }
        }
      } catch (error) {
        console.error('Error generating audio:', error);
      } finally {
        setIsGeneratingAudio(false);
      }
    };

    const handleTemplateSelect = (templateId: string) => {
      setSelectedTemplateId(templateId);
      setAdData({ templateId });
    };

    const handleNext = () => {
      // This is now correctly saving a string to the context.
      setAdData({ templateId: selectedTemplateId });
      router.push('/ad/render');
    };

    // Get all user assets for preview
    const allAssets = [
      ...(adData.selectedImages || []),
      ...(adData.selectedVideos || [])
    ];

    // Get selected template for detailed preview
    const selectedTemplate = TEMPLATE_LIBRARY.find(t => t.id === selectedTemplateId);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose a Template</h1>
          <p className="text-gray-400">Select a video style. The length will be determined by your script's audio.</p>
        </div>

        <div className="flex gap-8">
          {/* Template Grid */}
          <div className="flex-1">
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Available Templates</h2>
                <button
                  onClick={() => setShowPreviews(!showPreviews)}
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  {showPreviews ? '🔍 Hide Previews' : '👁️ Show Previews'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {TEMPLATE_LIBRARY.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={() => handleTemplateSelect(template.id)}
                    showPreview={showPreviews}
                    assets={allAssets}
                    avatarId={adData.avatarId || 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Preview Sidebar */}
          {selectedTemplate && allAssets.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="card sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-4">Preview: {selectedTemplate.name}</h3>
                <TemplatePreviewWithSubtitles
                  template={selectedTemplate}
                  assets={allAssets}
                  avatarId={adData.avatarId || 1}
                  script={adData.selectedScript || ''}
                  subtitleStyle={SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0]}
                  subtitleAnimation={adData.subtitleAnimation || 'fade'}
                  subtitlePosition={adData.subtitlePosition || 'bottom'}
                  enableSubtitles={adData.enableSubtitles || true}
                  audioUrl={adData.audioUrl}
                  audioDuration={audioDuration}
                />
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Template Details</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• {selectedTemplate.timeline.length} scenes</li>
                    <li>• {selectedTemplate.timeline.filter(scene => scene.assetIndices && scene.assetIndices.length > 0).length} assets used</li>
                    <li>• {audioDuration ? `${Math.round(audioDuration)} sec total` : '~30 sec estimated'}</li>
                    {isGeneratingAudio && <li>• 🎵 Generating audio...</li>}
                  </ul>
                </div>
                
                {/* Subtitle Customizer */}
                {adData.selectedScript && (
                  <div className="mt-4">
                    <SubtitleCustomizer
                      selectedStyle={SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0]}
                      onStyleChange={(style) => setAdData({ subtitleStyle: style.id })}
                      onAnimationChange={(animation) => setAdData({ subtitleAnimation: animation })}
                      onPositionChange={(position) => setAdData({ subtitlePosition: position })}
                      selectedAnimation={adData.subtitleAnimation || 'fade'}
                      selectedPosition={adData.subtitlePosition || 'bottom'}
                    />
                  </div>
                )}
                
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
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
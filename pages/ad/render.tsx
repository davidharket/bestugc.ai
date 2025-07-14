import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react'; // <-- Import useSession
import { TEMPLATE_LIBRARY } from '../../lib/templates';
import { avatars } from '../../lib/avatars';
import { SUBTITLE_STYLES, SubtitleStyle } from '../../remotion/components/Subtitles';

export default function RenderAdPage() {
  const router = useRouter();
  const { data: session } = useSession(); // <-- Get the user's session
  const { adData, setAdData, resetAdData } = useAdCreation();
  
  // Redirect if no ad data is available
  useEffect(() => {
    if (!adData.templateId && !adData.selectedScript) {
      router.push('/ad/create');
    }
  }, [adData, router]);
  const [isRendering, setIsRendering] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewStage, setPreviewStage] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Subtitle settings - use defaults from adData or fallback to defaults
  const selectedSubtitleStyle = SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0];
  const subtitleAnimation = adData.subtitleAnimation || 'fade';
  const subtitlePosition = adData.subtitlePosition || 'bottom';
  const enableSubtitles = adData.enableSubtitles !== false;

  // Initialize subtitle settings if not already set
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

  // Generate audio preview on component mount
  useEffect(() => {
    // Try both selectedScript and script fields
    const scriptToUse = adData.selectedScript || adData.script;
    if (scriptToUse && adData.language && !adData.audioUrl) {
      generateAudioPreview();
    }
  }, [adData.selectedScript, adData.script, adData.language, adData.audioUrl]);

  // Generate video preview when audio is ready
  useEffect(() => {
    const scriptToUse = adData.selectedScript || adData.script;
    const audioSrc = adData.audioUrl || audioUrl;
    if (audioSrc && adData.templateId && scriptToUse) {
      generateVideoPreview();
    }
  }, [audioUrl, adData.audioUrl, adData.templateId, adData.selectedScript, adData.script]);

  // Remove auto-play audio - audio should only play with preview video


  // Handle audio element events
  useEffect(() => {
    if (audioElement) {
      audioElement.addEventListener('ended', () => setIsPlaying(false));
      return () => audioElement.removeEventListener('ended', () => setIsPlaying(false));
    }
  }, [audioElement]);

  const generateAudioPreview = async () => {
    const scriptToUse = adData.selectedScript || adData.script;
    if (!scriptToUse || !adData.language) return;
    
    setIsGeneratingAudio(true);
    try {
      const response = await axios.post('/api/tts/elevenlabs', {
        text: scriptToUse,
        language: adData.language,
        gender: 'female' // Default to female voice
      });
      setAudioUrl(response.data.audioUrl);
      // Store the audio URL in the context for reuse in final render
      setAdData({ audioUrl: response.data.audioUrl });
    } catch (error) {
      console.error('Error generating audio preview:', error);
      toast.error('Failed to generate audio preview');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateVideoPreview = async () => {
    const scriptToUse = adData.selectedScript || adData.script;
    if (!adData.templateId || !scriptToUse) return;
    
    setIsGeneratingPreview(true);
    setPreviewProgress(0);
    setStartTime(Date.now());
    setEstimatedTime(120); // 2 minutes estimated time for preview
    
    // Progress simulation
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 95) return prev;
        const elapsed = (Date.now() - startTime) / 1000;
        const expectedProgress = Math.min(95, (elapsed / 120) * 100);
        return Math.max(prev, expectedProgress);
      });
    }, 500);
    
    try {
      setPreviewStage('Preparing render data...');
      
      // Simulate stage progression
      setTimeout(() => setPreviewStage('Bundling Remotion composition...'), 5000);
      setTimeout(() => setPreviewStage('Rendering video frames...'), 15000);
      setTimeout(() => setPreviewStage('Finalizing video...'), 60000);
      
      const audioSrc = adData.audioUrl || audioUrl;
      const response = await axios.post('/api/render/preview', {
        adData: {
          ...adData,
          audioUrl: audioSrc,
          selectedScript: scriptToUse,
          subtitleStyle: selectedSubtitleStyle.id,
          subtitleAnimation: subtitleAnimation,
          subtitlePosition: subtitlePosition,
          enableSubtitles: enableSubtitles,
        },
        previewDuration: 10, // 10 second preview
      }, {
        timeout: 300000, // 5 minutes timeout
      });
      
      setPreviewProgress(100);
      setPreviewStage('Complete!');
      setPreviewVideoUrl(response.data.previewVideoUrl);
      
    } catch (error) {
      console.error('Error generating video preview:', error);
      toast.error('Failed to generate video preview');
      setPreviewStage('Failed to generate preview');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGeneratingPreview(false);
        setPreviewProgress(0);
        setPreviewStage('');
      }, 1000);
    }
  };

  const handlePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const handleRender = async () => {
    setIsRendering(true);
    const toastId = toast.loading('Saving your ad configuration...');

    // Authentication Check
    if (!session?.user?.id) {
      toast.error('You must be logged in to create an ad.', { id: toastId });
      setIsRendering(false);
      return;
    }

    if (!adData.templateId) {
      toast.error('No template selected. Please go back and choose a template.', { id: toastId });
      setIsRendering(false);
      return;
    }

    try {
      // Step 1: Create the Ad record in the database.
      const createAdResponse = await axios.post('/api/ads/create', { adData });
      const { adId } = createAdResponse.data;

      toast.loading('Ad saved. Starting render job...', { id: toastId });

      // Step 2: Trigger the Inngest job with the new adId and templateId.
      await axios.post('/api/render/start-job', {
        adId: adId,
        templateId: adData.templateId,
      });

      toast.success('Your video is in the queue! Redirecting to your creations.', {
        id: toastId,
        duration: 4000,
      });

      setTimeout(() => {
        resetAdData();
        router.push('/creations');
      }, 2000);

    } catch (e: any) {
      console.error('Error starting render job:', e.response?.data || e.message);
      const errorMessage = e.response?.data?.message || 'Failed to start the render job.';
      toast.error(errorMessage, { id: toastId });
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Ready to Generate Your Video?</h1>
          <p className="text-gray-400">
            Review your ad preview below and click the button to start the rendering process.
          </p>
        </div>

        {/* Ad Preview Section */}
        <div className="flex justify-center mb-8">
          {/* Video Preview */}
          <div className="w-full max-w-md">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">Video Preview</h2>
              

              {/* Audio Generation Status */}
              {isGeneratingAudio && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-green-400"></div>
                    <span className="font-medium text-sm">Generating audio with ElevenLabs...</span>
                  </div>
                  <div className="text-xs text-green-300 mt-1">
                    Estimated time: ~5-10 seconds
                  </div>
                </div>
              )}

              {/* Preview Status */}
              {isGeneratingPreview && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 mb-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-400"></div>
                    <span className="font-medium text-sm">Generating preview with Remotion...</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-blue-300 mb-1">
                      <span>{previewStage}</span>
                      <span>{Math.round(previewProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${previewProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Estimated Time */}
                  <div className="text-xs text-blue-300">
                    Estimated time: ~{estimatedTime} seconds
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {previewVideoUrl ? (
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="aspect-[9/16] w-full max-w-xs">
                      <video
                        src={previewVideoUrl}
                        controls
                        autoPlay
                        muted={false}
                        className="w-full h-full object-cover rounded-lg border border-gray-700"
                        style={{ backgroundColor: 'black' }}
                      />
                    </div>
                  </div>
                  
                  {/* Preview Disclaimers */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-amber-300">
                        <div className="font-medium text-sm mb-1">Preview Mode</div>
                        <div className="text-xs space-y-1">
                          <div>• Background removal will be applied in the final render</div>
                          <div>• Lip-sync with your script will be processed in the final render</div>
                          <div>• This preview shows the basic layout and timing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm">Preview will be generated with Remotion</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Video Summary</h2>
          <div className="space-y-4">
            {adData.brandName && (
              <div className="flex justify-between">
                <span className="text-gray-400">Brand:</span>
                <span className="text-white font-medium">{adData.brandName}</span>
              </div>
            )}
            {adData.format && (
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white font-medium">{adData.format}</span>
              </div>
            )}
            {adData.language && (
              <div className="flex justify-between">
                <span className="text-gray-400">Language:</span>
                <span className="text-white font-medium">{adData.language.toUpperCase()}</span>
              </div>
            )}
            {adData.templateId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Template:</span>
                <span className="text-white font-medium">{adData.templateId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Generate Your Video</h3>
            <p className="text-gray-400">
              Your final video will appear on the 'My Creations' page once rendering is complete. 
              This typically takes 2-5 minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className={`w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${isRendering ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleRender}
              disabled={isRendering}
            >
              {isRendering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Generate Video
                </>
              )}
            </button>
            
            <button
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-800 text-white font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all"
              onClick={() => router.back()}
              disabled={isRendering}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
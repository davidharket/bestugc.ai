import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import TTSCacheService from '../../lib/tts-cache-service';
import { useSession } from 'next-auth/react';
import { avatars } from '../../lib/avatars';
import { SUBTITLE_STYLES, SubtitleStyle } from '../../remotion/components/Subtitles';
import { spendCredits } from '../../lib/credit-operations';

type PreviewStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

interface PreviewState {
  status: PreviewStatus;
  url: string | null;
  progress: number;
  stage: string;
}

export default function RenderAdPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { adData, setAdData, resetAdData } = useAdCreation();

  const [isRendering, setIsRendering] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioGenerationFailed, setAudioGenerationFailed] = useState(false);

  // --- UNIFIED PREVIEW STATE FOR ROBUST QUEUE ---
  const [previewState, setPreviewState] = useState<{ '9:16': PreviewState; '4:5': PreviewState }>({
    '9:16': { status: 'idle', url: null, progress: 0, stage: '' },
    '4:5': { status: 'idle', url: null, progress: 0, stage: '' },
  });
  
  const generationStartedRef = useRef(false);
  const previousAvatarIdRef = useRef<number | null>(null);

  const currentFormat = adData.currentPreviewFormat || '9:16';
  const currentPreviewUrl = previewState[currentFormat].url;
  
  const isAnythingProcessing = previewState['9:16'].status === 'processing' || previewState['4:5'].status === 'processing' || isGeneratingAudio;
  const areAllPreviewsDone = adData.enableDualFormat 
    ? previewState['9:16'].status === 'completed' && previewState['4:5'].status === 'completed'
    : previewState['9:16'].status === 'completed';

  const selectedSubtitleStyle = SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0];
  const subtitleAnimation = adData.subtitleAnimation || 'fade';
  const subtitlePosition = adData.subtitlePosition || 'bottom';
  const enableSubtitles = adData.enableSubtitles !== false;

  useEffect(() => {
    if (!adData.subtitleStyle) setAdData({ subtitleStyle: SUBTITLE_STYLES[0].id, subtitleAnimation: 'fade', subtitlePosition: 'bottom', enableSubtitles: true });
  }, []);

  useEffect(() => {
    setAudioGenerationFailed(false);
  }, [adData.selectedScript, adData.script, adData.language, adData.avatarId]);

  const generateAudioPreview = useCallback(async () => {
    const scriptToUse = adData.selectedScript || adData.script;
    if (!scriptToUse || !adData.language || adData.audioUrl || isGeneratingAudio || audioGenerationFailed) return;
    setIsGeneratingAudio(true);
    try {
      const selectedGender = adData.avatarId ? (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') : 'female';
      const result = await TTSCacheService.getTTS(scriptToUse, adData.language, selectedGender, adData.avatarId);
      setAdData({ audioUrl: result.audioUrl, wordTimings: result.wordTimings });
      setAudioGenerationFailed(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate audio preview.');
      setAudioGenerationFailed(true);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [adData.selectedScript, adData.script, adData.language, adData.avatarId, adData.audioUrl, isGeneratingAudio, audioGenerationFailed, setAdData]);

  useEffect(() => { generateAudioPreview(); }, [generateAudioPreview]);

  useEffect(() => {
    if (adData.avatarId && previousAvatarIdRef.current !== null && previousAvatarIdRef.current !== adData.avatarId && adData.audioUrl) {
      setAdData({ audioUrl: undefined, wordTimings: undefined });
      setPreviewState({ '9:16': { status: 'idle', url: null, progress: 0, stage: '' }, '4:5': { status: 'idle', url: null, progress: 0, stage: '' } });
      generationStartedRef.current = false;
    }
    previousAvatarIdRef.current = adData.avatarId ?? null;
  }, [adData.avatarId, adData.audioUrl, setAdData]);

  const runSinglePreviewJob = useCallback(async (format: '9:16' | '4:5') => {
    const scriptToUse = adData.selectedScript || adData.script;
    const payload = { adData: { ...adData, selectedScript: scriptToUse, currentPreviewFormat: format, subtitleStyle: selectedSubtitleStyle.id, subtitleAnimation, subtitlePosition, enableSubtitles } };
    try {
      const startResponse = await axios.post('/api/render/preview-start', payload);
      const { jobId } = startResponse.data;
      for (let i = 0; i < 120; i++) {
        const res = await axios.get(`/api/render/preview-status/${jobId}`);
        const { status, progress, stage, videoUrl, error } = res.data;
        setPreviewState(prev => ({ ...prev, [format]: { ...prev[format], progress: progress || 5, stage: stage || 'Processing...' } }));
        if (status === 'completed') return videoUrl;
        if (status === 'failed') throw new Error(error || 'Preview job failed');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      throw new Error('Preview generation timed out');
    } catch (error) {
      throw error;
    }
  }, [adData, selectedSubtitleStyle.id, subtitleAnimation, subtitlePosition, enableSubtitles]);

  // --- REVISED ORCHESTRATOR FOR TRUE SEQUENTIAL FLOW ---
  const managePreviewGeneration = useCallback(async () => {
    if (!adData.audioUrl || generationStartedRef.current) return;
    generationStartedRef.current = true;

    // Set initial queue state if dual format is enabled
    if (adData.enableDualFormat) {
        setPreviewState(prev => ({
            ...prev,
            '9:16': { ...prev['9:16'], status: 'processing', stage: 'Starting...' },
            '4:5': { ...prev['4:5'], status: 'queued', stage: 'Queued' }
        }));
    } else {
        setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'processing', stage: 'Starting...' } }));
    }

    // --- 1. ALWAYS RUN 9:16 PREVIEW FIRST ---
    try {
      const url916 = await runSinglePreviewJob('9:16');
      setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'completed', url: url916, stage: 'Complete!' } }));
    } catch (error: any) {
      setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'failed', stage: 'Failed' }, '4:5': { ...prev['4:5'], status: 'idle' } }));
      toast.error(error.message || 'Failed to generate 9:16 preview.');
      return; // Stop the queue if the primary preview fails
    }

    // --- 2. RUN 4:5 PREVIEW ONLY IF ENABLED AND 9:16 SUCCEEDED ---
    if (adData.enableDualFormat) {
      setPreviewState(prev => ({ ...prev, '4:5': { ...prev['4:5'], status: 'processing', stage: 'Starting...' } }));
      try {
        const url4x5 = await runSinglePreviewJob('4:5');
        setPreviewState(prev => ({ ...prev, '4:5': { ...prev['4:5'], status: 'completed', url: url4x5, stage: 'Complete!' } }));
      } catch (error: any) {
        setPreviewState(prev => ({ ...prev, '4:5': { ...prev['4:5'], status: 'failed', stage: 'Failed' } }));
        toast.error(error.message || 'Failed to generate 4:5 preview.');
      }
    }
  }, [adData.audioUrl, adData.enableDualFormat, runSinglePreviewJob]);

  useEffect(() => {
    managePreviewGeneration();
  }, [managePreviewGeneration]);

  const handleFormatChange = (format: '9:16' | '4:5') => setAdData({ currentPreviewFormat: format });
  
  const handleRender = async () => {
    setIsRendering(true);
    const toastId = toast.loading('Saving ad configuration...');
    if (!session?.user?.id || !adData.templateId) {
      toast.error('Session or template missing.', { id: toastId });
      setIsRendering(false);
      return;
    }
    try {
      const createAdResponse = await axios.post('/api/ads/create', { adData });
      const { adId } = createAdResponse.data;
      toast.loading('Starting render job...', { id: toastId });
      await spendCredits(() => axios.post('/api/render/start-job', { adId, templateId: adData.templateId }));
      toast.success('Your video is in the queue!', { id: toastId, duration: 4000 });
      
      // Wait a bit longer for session refresh to complete before navigating
      setTimeout(() => { 
        resetAdData(); 
        router.push('/creations'); 
      }, 3000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start render.', { id: toastId });
      setIsRendering(false);
    }
  };

  // --- REVISED UI LOGIC TO DISPLAY QUEUE STATUS ---
  const getLoadingUIText = () => {
    if (isGeneratingAudio) return { title: 'Generating audio...', stage: 'Contacting ElevenLabs...', progress: 0 };

    if (previewState['9:16'].status === 'processing') {
      const stageText = adData.enableDualFormat ? `${previewState['9:16'].stage} (4:5 is queued)` : previewState['9:16'].stage;
      return { title: 'Generating 9:16 preview...', stage: stageText, progress: previewState['9:16'].progress };
    }
    if (previewState['4:5'].status === 'processing') {
      return { title: 'Generating 4:5 preview...', stage: previewState['4:5'].stage, progress: previewState['4:5'].progress };
    }
    return { title: 'Preparing...', stage: 'Initializing...', progress: 0 };
  };
  const loadingInfo = getLoadingUIText();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Ready to Generate Your Video?</h1>
          <p className="text-gray-400">Review your ad preview below and click the button to start the rendering process.</p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">Video Preview</h2>
              {adData.enableDualFormat && (
                <div className="mb-4 flex justify-center">
                  <div className="bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => handleFormatChange('9:16')} className={`px-4 py-2 rounded-md text-sm transition-colors ${currentFormat === '9:16' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white'}`}>9:16 Preview</button>
                    <button onClick={() => handleFormatChange('4:5')} className={`px-4 py-2 rounded-md text-sm transition-colors ${currentFormat === '4:5' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:text-white'}`}>4:5 Preview</button>
                  </div>
                </div>
              )}
              {isAnythingProcessing && (
                <div className="mb-4 p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl shadow-lg">
                   <div className="flex items-center gap-3 text-orange-400 mb-4">
                     <div className="relative"><div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-400 border-t-transparent"></div></div>
                     <div className="flex-1">
                       <div className="font-semibold text-sm mb-1">{loadingInfo.title}</div>
                       <div className="text-xs text-orange-300 flex items-center gap-2"><span>{Math.round(loadingInfo.progress || 0)}% complete</span><span>•</span><span className="animate-pulse">{loadingInfo.stage}</span></div>
                     </div>
                   </div>
                   <div className="mb-3"><div className="w-full bg-orange-900/30 rounded-full h-3 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out" style={{ width: `${loadingInfo.progress || 0}%` }}></div></div></div>
                </div>
              )}
              {!isAnythingProcessing && !currentPreviewUrl && (
                <div className="text-center p-8 text-gray-400">{audioGenerationFailed ? "Audio generation failed. Please try again." : "Preparing preview..."}</div>
              )}
              {currentPreviewUrl && !isAnythingProcessing && (
                <div>
                  <div className="flex justify-center mb-4">
                    <div className={`${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9:16]'} w-full max-w-xs`}>
                      <video key={currentPreviewUrl} src={currentPreviewUrl} controls autoPlay muted className="w-full h-full object-cover rounded-lg border border-gray-700" style={{ backgroundColor: 'black' }} />
                    </div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <div className="text-amber-300">
                        <div className="font-medium text-sm mb-1">Preview Mode</div>
                        <div className="text-xs space-y-1">
                          <div>• Final render includes background removal & lip-sync.</div>
                          <div>• This preview shows layout and timing.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Video Summary</h2>
          <div className="space-y-4">
            {adData.brandName && ( <div className="flex justify-between"><span className="text-gray-400">Brand:</span><span className="text-white font-medium">{adData.brandName}</span></div> )}
            {adData.format && ( <div className="flex justify-between"><span className="text-gray-400">Format:</span><span className="text-white font-medium">{adData.format}</span></div> )}
            {adData.language && ( <div className="flex justify-between"><span className="text-gray-400">Language:</span><span className="text-white font-medium">{adData.language.toUpperCase()}</span></div> )}
            {adData.templateId && ( <div className="flex justify-between"><span className="text-gray-400">Template:</span><span className="text-white font-medium">{adData.templateId}</span></div> )}
            {adData.enableDualFormat && ( <div className="flex justify-between"><span className="text-gray-400">Output Formats:</span><span className="text-white font-medium">9:16 + 4:5 (Both formats)</span></div> )}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
            <h3 className="text-xl font-semibold text-white mb-2">Generate Your Video</h3>
            <p className="text-gray-400 mb-3">Your final video{adData.enableDualFormat ? 's' : ''} will appear on the 'My Creations' page. This typically takes {adData.enableDualFormat ? '4-10 minutes' : '2-5 minutes'}.</p>
            {adData.enableDualFormat && (<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4"><div className="flex items-center gap-2 text-blue-300"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg><span className="text-sm">Dual format generation uses a single TTS and lipsync call.</span></div></div>)}
            {(!areAllPreviewsDone) && (<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4"><div className="flex items-center gap-2 text-amber-300"><svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><span className="text-sm">{isAnythingProcessing ? 'Please wait for previews to complete before generating.' : 'Previews are required before generating.'}</span></div></div>)}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className={`w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${(isRendering || isAnythingProcessing || !areAllPreviewsDone) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleRender} disabled={isRendering || isAnythingProcessing || !areAllPreviewsDone}>
              {isRendering ? (<><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>Processing...</>) 
              : isAnythingProcessing ? (<><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>Generating Preview...</>) 
              : (<><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Generate Video{adData.enableDualFormat ? 's' : ''}</>)}
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-800 text-white font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all" onClick={() => router.back()} disabled={isRendering}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

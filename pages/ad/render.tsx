// pages/ad/render.tsx
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
  const [finalRenderStarted, setFinalRenderStarted] = useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioGenerationFailed, setAudioGenerationFailed] = useState(false);
  const [showLargeAssetWarning, setShowLargeAssetWarning] = useState(false);

  const [previewState, setPreviewState] = useState<{ '9:16': PreviewState; '4:5': PreviewState }>({
    '9:16': { status: 'idle', url: null, progress: 0, stage: '' },
    '4:5': { status: 'idle', url: null, progress: 0, stage: '' },
  });

  const generationStartedRef = useRef(false);
  const previousAvatarIdRef = useRef<number | null>(null);
  const progressStallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(Date.now());

  const currentFormat = adData.currentPreviewFormat || '9:16';

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
    const payload = { adData: { ...adData, selectedScript: scriptToUse, currentPreviewFormat: format } };
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
  }, [adData]);

  const managePreviewGeneration = useCallback(async () => {
    if (!adData.audioUrl || generationStartedRef.current) return;
    generationStartedRef.current = true;

    if (adData.enableDualFormat) {
        setPreviewState(prev => ({
            ...prev,
            '9:16': { ...prev['9:16'], status: 'processing', stage: 'Starting...' },
            '4:5': { ...prev['4:5'], status: 'queued', stage: 'Queued' }
        }));
    } else {
        setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'processing', stage: 'Starting...' } }));
    }

    try {
      const url916 = await runSinglePreviewJob('9:16');
      setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'completed', url: url916, stage: 'Complete!' } }));
    } catch (error: any) {
      setPreviewState(prev => ({ ...prev, '9:16': { ...prev['9:16'], status: 'failed', stage: 'Failed' }, '4:5': { ...prev['4:5'], status: 'idle' } }));
      toast.error(error.message || 'Failed to generate 9:16 preview.');
      return;
    }

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
    if (finalRenderStarted || isNavigatingAway) return;

    const shouldGeneratePreview = sessionStorage.getItem('shouldGeneratePreview');

    if (shouldGeneratePreview === 'true') {
      sessionStorage.removeItem('shouldGeneratePreview');
      managePreviewGeneration();
    }
  }, [managePreviewGeneration, finalRenderStarted, isNavigatingAway]);

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
      // THIS IS THE KEY CHANGE: Pass the entire adData object to the creation endpoint.
      // This ensures audioUrl and wordTimings are saved to the database.
      const createAdResponse = await axios.post('/api/ads/create', { adData });
      const { adId } = createAdResponse.data;
      
      toast.loading('Starting render job...', { id: toastId });
      setFinalRenderStarted(true);
      await spendCredits(() => axios.post('/api/render/start-job', { adId, templateId: adData.templateId }));
      toast.success('Your video is in the queue!', { id: toastId, duration: 4000 });
      setIsNavigatingAway(true);
      setTimeout(() => {
        resetAdData();
        router.push('/creations');
      }, 1000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start render.', { id: toastId });
      setIsRendering(false);
      setFinalRenderStarted(false);
      setIsNavigatingAway(false);
    }
  };

  const getThreePartLoadingStage = () => {
    if (isGeneratingAudio) {
      return { stage: 1, title: 'Adding Audio', progress: 0, queueInfo: null };
    }
    
    if (previewState['9:16'].status === 'processing' || previewState['4:5'].status === 'processing') {
      let overallProgress = 0;
      let queueInfo = null;
      
      if (adData.enableDualFormat) {
        // Calculate overall progress across both formats
        const format916Progress = previewState['9:16'].status === 'completed' ? 100 : 
                                 previewState['9:16'].status === 'processing' ? previewState['9:16'].progress : 0;
        const format45Progress = previewState['4:5'].status === 'completed' ? 100 :
                                previewState['4:5'].status === 'processing' ? previewState['4:5'].progress : 0;
        
        // Average progress across both formats (each worth 50% of total)
        overallProgress = (format916Progress + format45Progress) / 2;
        
        // Queue information
        if (previewState['9:16'].status === 'processing') {
          queueInfo = { current: '9:16 format', next: previewState['4:5'].status === 'queued' ? '4:5 format' : null };
        } else if (previewState['4:5'].status === 'processing') {
          queueInfo = { current: '4:5 format', next: null };
        }
      } else {
        // Single format - use direct progress
        overallProgress = previewState['9:16'].status === 'processing' ? previewState['9:16'].progress : 0;
      }
      
      if (overallProgress < 33.33) {
        const stageProgress = (overallProgress / 33.33) * 100;
        return { stage: 1, title: 'Adding Audio', progress: stageProgress, queueInfo };
      } else if (overallProgress < 85) {
        const progressInStage = overallProgress - 33.33;
        const stageProgress = (progressInStage / 51.67) * 100;
        return { stage: 2, title: 'Rendering Video', progress: stageProgress, queueInfo };
      } else {
        const progressInStage = overallProgress - 85;
        const stageProgress = (progressInStage / 15) * 100;
        return { stage: 3, title: 'Final Touches', progress: stageProgress, queueInfo };
      }
    }
    return { stage: 1, title: 'Preparing', progress: 0, queueInfo: null };
  };

  const loadingStage = getThreePartLoadingStage();
  const isAnythingProcessing = isGeneratingAudio || previewState['9:16'].status === 'processing' || previewState['4:5'].status === 'processing';

  // Detect progress stall and show large asset warning
  useEffect(() => {
    if (isAnythingProcessing) {
      const currentProgress = Math.round(((loadingStage.stage - 1) * 33.33) + (loadingStage.progress * 0.33));
      
      // If progress is the same as last time, start/continue timer
      if (currentProgress === lastProgressRef.current) {
        const timeSinceLastUpdate = Date.now() - lastProgressUpdateRef.current;
        
        // Show warning after 30 seconds of no progress
        if (timeSinceLastUpdate > 30000 && !showLargeAssetWarning) {
          setShowLargeAssetWarning(true);
        }
      } else {
        // Progress updated, reset timer and hide warning
        lastProgressRef.current = currentProgress;
        lastProgressUpdateRef.current = Date.now();
        setShowLargeAssetWarning(false);
      }
    } else {
      // Not processing, hide warning
      setShowLargeAssetWarning(false);
    }
  }, [isAnythingProcessing, loadingStage.stage, loadingStage.progress, showLargeAssetWarning]);
  const currentPreviewUrl = previewState[currentFormat].url;
  const areAllPreviewsDone = (adData.enableDualFormat ?
    (previewState['9:16'].status === 'completed' && previewState['4:5'].status === 'completed') :
    previewState[currentFormat].status === 'completed');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAnythingProcessing && (
          <div className="flex justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-8 w-full max-w-6xl">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">{loadingStage.title}</h2>
                {loadingStage.queueInfo && (
                  <div className="text-sm text-gray-400">
                    Currently processing: <span className="text-orange-400 font-medium">{loadingStage.queueInfo.current}</span>
                    {loadingStage.queueInfo.next && (
                      <span> • Next: <span className="text-gray-300">{loadingStage.queueInfo.next}</span></span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col items-center flex-1"><div className="relative w-10 h-10 mb-3">{loadingStage.stage > 1 ? <div className="w-10 h-10 flex items-center justify-center"><img src="/success.svg" alt="Complete" className="w-5 h-5" /></div> : loadingStage.stage === 1 ? <div className="relative w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-gray-900 rounded-full animate-spin"></div></div> : <div className="w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-gray-500 bg-transparent"></div></div>}</div><span className={`text-sm font-medium ${loadingStage.stage >= 1 ? 'text-white' : 'text-gray-500'}`}>Adding Audio</span></div>
                <div className="flex-1 mx-4"><div className={`h-1 rounded-full ${loadingStage.stage > 1 ? 'bg-orange-500' : 'bg-gray-700'}`}></div></div>
                <div className="flex flex-col items-center flex-1"><div className="relative w-10 h-10 mb-3">{loadingStage.stage > 2 ? <div className="w-10 h-10 flex items-center justify-center"><img src="/success.svg" alt="Complete" className="w-5 h-5" /></div> : loadingStage.stage === 2 ? <div className="relative w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-gray-900 rounded-full animate-spin"></div></div> : <div className="w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-gray-500 bg-transparent"></div></div>}</div><span className={`text-sm font-medium ${loadingStage.stage >= 2 ? 'text-white' : 'text-gray-500'}`}>Rendering Video</span></div>
                <div className="flex-1 mx-4"><div className={`h-1 rounded-full ${loadingStage.stage > 2 ? 'bg-orange-500' : 'bg-gray-700'}`}></div></div>
                <div className="flex flex-col items-center flex-1"><div className="relative w-10 h-10 mb-3">{loadingStage.stage === 3 ? <div className="relative w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-gray-900 rounded-full animate-spin"></div></div> : <div className="w-10 h-10 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-gray-500 bg-transparent"></div></div>}</div><span className={`text-sm font-medium ${loadingStage.stage >= 3 ? 'text-white' : 'text-gray-500'}`}>Final Touches</span></div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out" style={{ width: `${((loadingStage.stage - 1) * 33.33) + (loadingStage.progress * 0.33)}%` }}></div></div>
              <div className="text-center text-sm text-gray-400">{Math.round(((loadingStage.stage - 1) * 33.33) + (loadingStage.progress * 0.33))}% complete</div>
              
              {/* Large asset warning */}
              {showLargeAssetWarning && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Large assets detected - rendering may take longer than usual</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {!isAnythingProcessing && currentPreviewUrl && (
          <div className="flex justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6 w-full max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">
                    {adData.enableDualFormat && (
                      <div className="mb-4">
                        <div className="relative inline-flex rounded-[12px] border border-gray-700 p-1">
                          {/* Sliding background */}
                          <div 
                            className={`absolute top-1 bottom-1 bg-orange-600 rounded-[8px] transition-all duration-300 ease-in-out ${
                              currentFormat === '9:16' ? 'left-1 w-[calc(50%-2px)]' : 'left-[50%] w-[calc(50%-2px)]'
                            }`}
                          />
                          
                          <button 
                            onClick={() => handleFormatChange('9:16')} 
                            className={`relative z-10 px-6 py-3 rounded-[8px] text-sm font-medium transition-colors duration-300 ${
                              currentFormat === '9:16' 
                                ? 'text-white' 
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            9:16
                          </button>
                          <button 
                            onClick={() => handleFormatChange('4:5')} 
                            className={`relative z-10 px-6 py-3 rounded-[8px] text-sm font-medium transition-colors duration-300 ${
                              currentFormat === '4:5' 
                                ? 'text-white' 
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            4:5
                          </button>
                        </div>
                      </div>
                    )}
                    <div className={`${currentFormat === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]'} w-full`}>
                      <video key={currentPreviewUrl} src={currentPreviewUrl} controls autoPlay muted className="w-full h-full object-cover rounded-[15px] border border-gray-700" style={{ backgroundColor: 'black' }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {/* Add matching spacing to align with video top */}
                  {adData.enableDualFormat && <div className="mb-4 h-[52px]"></div>}
                  
                  <div className="space-y-4 mb-6">
                    {adData.brandName && (<div className="flex justify-between"><span className="text-gray-400">Brand:</span><span className="text-white font-medium">{adData.brandName}</span></div>)}
                    {adData.format && (<div className="flex justify-between"><span className="text-gray-400">Format:</span><span className="text-white font-medium">{adData.format}</span></div>)}
                    {adData.language && (<div className="flex justify-between"><span className="text-gray-400">Language:</span><span className="text-white font-medium">{adData.language.toUpperCase()}</span></div>)}
                    {adData.templateId && (<div className="flex justify-between"><span className="text-gray-400">Template:</span><span className="text-white font-medium">{adData.templateId}</span></div>)}
                  </div>
                  <div className="mt-auto"></div>
                  <div className="flex gap-3 w-full justify-between">
                    <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white font-medium rounded-[15px] border border-gray-700 hover:bg-gray-700 transition-all" onClick={() => router.back()} disabled={isRendering}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Go Back
                    </button>
                    <button className={`flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-normal rounded-[15px] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${(isRendering || !areAllPreviewsDone) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleRender} disabled={isRendering || !areAllPreviewsDone}>
                      {isRendering ? (<><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>Processing...</>) : (<><img src="/ai-star.svg" alt="" className="w-5 h-5" />Generate Video</>)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {!isAnythingProcessing && !currentPreviewUrl && (
          <div className="flex justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-8 w-full max-w-6xl">
              {(audioGenerationFailed || previewState['9:16'].status === 'failed' || previewState['4:5'].status === 'failed') ? (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center"><img src="/fail.svg" alt="Failed" className="w-8 h-8" /></div>
                    <h3 className="text-xl font-semibold text-white mb-2">Preview Generation Failed</h3>
                    <p className="text-gray-400 mb-6">{audioGenerationFailed ? "There was an issue generating the audio." : "The video preview failed to render."}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={() => {
                        if (audioGenerationFailed) {
                          setAudioGenerationFailed(false);
                          generateAudioPreview();
                        } else {
                          setPreviewState({'9:16':{status:'idle',url:null,progress:0,stage:''},'4:5':{status:'idle',url:null,progress:0,stage:''}});
                          generationStartedRef.current = false;
                          managePreviewGeneration();
                        }
                      }} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">Try Again</button>
                      <button onClick={() => router.back()} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">Go Back</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center"><div className="mb-4"><div className="w-12 h-12 mx-auto mb-4 border-2 border-orange-500 border-t-gray-900 rounded-full animate-spin"></div><p className="text-gray-400">Initializing preview generation...</p></div></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// pages/ad/template.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAdCreation } from '../../components/AdCreationContext';
import { TEMPLATE_LIBRARY, VideoTemplate, scaleTemplateForDuration } from '../../lib/templates';
import { avatars } from '../../lib/avatars';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TemplatePreviewWithSubtitles } from '../../components/TemplatePreviewWithSubtitles';
import { getAllAvailableFonts } from '../../lib/google-fonts';
import FontSubtitleSelector from '../../components/FontSubtitleSelector';
import axios from 'axios';
import toast from 'react-hot-toast';
import TTSCacheService from '../../lib/tts-cache-service';
import CustomDropdown from '../../components/CustomDropdown';
import MusicUploader from '../../components/MusicUploader';
import customMusicManager, { CustomMusic } from '../../lib/custom-music-loader';
import customFontManager, { CustomFont } from '../../lib/custom-font-loader';
import ProductVideoLoadingScreen from '../../components/ProductVideoLoadingScreen';
import { getAvatarImagePath } from '../../lib/avatars';
import SimpleLoader from '../../components/SimpleLoader';
import { spendCredits } from '../../lib/credit-operations';
import BarLoader from '../../components/BarLoader';

// Video Thumbnail Component for generating thumbnails without loading full video
const VideoThumbnail: React.FC<{ src: string; className: string; index: number }> = ({ src, className, index }) => {
const [thumbnailUrl, setThumbnailUrl] = React.useState<string>('');
const [showVideo, setShowVideo] = React.useState(false);
const videoRef = React.useRef<HTMLVideoElement>(null);
const canvasRef = React.useRef<HTMLCanvasElement>(null);

React.useEffect(() => {
const generateThumbnail = () => {
const video = videoRef.current;
const canvas = canvasRef.current;
if (!video || !canvas) return;

const context = canvas.getContext('2d');
  if (!context) return;

  // Set canvas size to match video aspect ratio
  canvas.width = 160;
  canvas.height = 160;

  // Draw the current frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to blob URL
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setThumbnailUrl(url);
    }
  }, 'image/jpeg', 0.8);
};

const handleLoadedData = () => {
  const video = videoRef.current;
  if (video) {
    // Seek to 1 second or 10% of video duration, whichever is smaller
    video.currentTime = Math.min(1, video.duration * 0.1);
  }
};

const handleSeeked = () => {
  generateThumbnail();
};

const video = videoRef.current;
if (video) {
  video.addEventListener('loadeddata', handleLoadedData);
  video.addEventListener('seeked', handleSeeked);

  return () => {
    video.removeEventListener('loadeddata', handleLoadedData);
    video.removeEventListener('seeked', handleSeeked);
    if (thumbnailUrl) {
      URL.revokeObjectURL(thumbnailUrl);
    }
  };
}

}, [src]);

return (
<>
{/* Hidden video for thumbnail generation */}
<video
ref={videoRef}
src={src}
muted
preload="metadata"
style={{ display: 'none' }}
crossOrigin="anonymous"
/>
<canvas ref={canvasRef} style={{ display: 'none' }} />
{/* Display thumbnail or fallback */}
  {thumbnailUrl ? (
    <img
      src={thumbnailUrl}
      alt={`Video thumbnail ${index + 1}`}
      className={className}
    />
  ) : (
    <div className={`${className} bg-gray-800 flex items-center justify-center`}>
      <div className="text-center">
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9m4.5-5H15a2.5 2.5 0 010 5h-1.5m-4-5v5" />
        </svg>
        <span className="text-xs text-gray-400">Video</span>
      </div>
    </div>
  )}
</>

);
};

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
<button
onClick={onSelect}
className={`px-3 py-2 text-sm border border-gray-700 rounded-[15px] text-gray-300 transition-colors duration-200 ${ isSelected ? 'border-orange-500' : 'hover:border-orange-500' }`}
style={{ backgroundColor: '#111827' }}
>
{template.name}
  </button>
);


export default function SelectTemplatePage() {
const router = useRouter();
const { data: session, status } = useSession();
const { adData, setAdData, resetAdData } = useAdCreation();

// Authentication check
useEffect(() => {
    if (status === 'loading') return // Still loading
    if (status === 'unauthenticated') {
        signIn()
        return
    }
}, [status])

// Show loading while authenticating
if (status === 'loading') {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <SimpleLoader width={10} />
        </div>
    )
}

// Redirect if not authenticated
if (status === 'unauthenticated') {
    return null
}
const [selectedTemplateId, setSelectedTemplateId] = useState(adData.templateId || TEMPLATE_LIBRARY[0].id);
const [userCredits, setUserCredits] = useState<number | null>(null);
const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
const [audioDuration, setAudioDuration] = useState<number | undefined>(adData.audioDuration);
const [isPlayingTTS, setIsPlayingTTS] = useState(false);
const [ttsAudioRef, setTtsAudioRef] = useState<HTMLAudioElement | null>(null);
const [selectedMusicId, setSelectedMusicId] = useState<string>(adData.backgroundMusicUrl ?
  (BACKGROUND_MUSIC_OPTIONS.find(m => m.url === adData.backgroundMusicUrl)?.id || 'none') : 'none');
const [regenerationCount, setRegenerationCount] = useState(0);
const MAX_REGENERATIONS = 2;
const [showMusicUploader, setShowMusicUploader] = useState(false);
const [customMusic, setCustomMusic] = useState<CustomMusic[]>([]);
const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

// Product video generation states
const [isGeneratingProductVideo, setIsGeneratingProductVideo] = useState(false);
const [generatingImages, setGeneratingImages] = useState(false);
const [generatingVideo, setGeneratingVideo] = useState(false);
const [currentStep, setCurrentStep] = useState(1);

// Final render states
const [isRendering, setIsRendering] = useState(false);
const [finalRenderStarted, setFinalRenderStarted] = useState(false);
const [isNavigatingAway, setIsNavigatingAway] = useState(false);

// Fetch user credits on component mount
useEffect(() => {
  const fetchUserCredits = async () => {
    if (session?.user?.id) {
      try {
        const response = await axios.get('/api/user/credits');
        setUserCredits(response.data.credits || 0);
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    }
  };
  
  fetchUserCredits();
}, [session?.user?.id]);

// Preview render states
const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

const SUBTITLE_STYLES = useMemo(() => {
  return getAllAvailableFonts().map(font => ({
    id: font.id,
    name: font.name,
    font: font.fontFamily,
    fontSize: 50,
    fontWeight: 600,
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 8,
    textShadow: '1px 1px 2px #000',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 950,
    border: 'none',
    supportsCaps: true,
  }));
}, []);

// Add state for current subtitle style (to handle custom fonts)
const [currentSubtitleStyle, setCurrentSubtitleStyle] = useState(() => {
  // Try to find the style from the stored ID, fallback to first built-in style
  return SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle) || SUBTITLE_STYLES[0];
});

// Load custom music and fonts when component mounts
useEffect(() => {
    customMusicManager.loadCustomMusic().then(setCustomMusic);
    customFontManager.loadCustomFonts().then(setCustomFonts);
}, []);

// Handle product video generation on component mount
useEffect(() => {
    if (adData.productVideoData?.includeProductVideo && !adData.productVideoUrl) {
        setIsGeneratingProductVideo(true);
        generateProductVideo();
    }
}, []);

// Update currentSubtitleStyle when custom fonts are loaded or adData.subtitleStyle changes
useEffect(() => {
    if (!adData.subtitleStyle) return;

    // First try to find in built-in styles
    let style = SUBTITLE_STYLES.find(s => s.id === adData.subtitleStyle);

    // If not found, check if it's a custom font
    if (!style && customFonts.length > 0) {
        const customFont = customFonts.find(f => f.id === adData.subtitleStyle);
        if (customFont) {
            // Create a SubtitleStyle object for the custom font
            style = {
                id: customFont.id,
                name: customFont.name,
                font: `"${customFont.name}", sans-serif`,
                fontSize: 50,
                fontWeight: 600,
                textColor: '#FFFFFF',
                backgroundColor: '#000000CC',
                borderRadius: 12,
                padding: 12,
                textShadow: '2px 2px 4px #000000CC',
                textAlign: 'center' as const,
                lineHeight: 1.2,
                maxWidth: 950,
                border: 'none',
                supportsCaps: true,
            };
        }
    }

    if (style) {
        setCurrentSubtitleStyle(style);
    }
}, [adData.subtitleStyle, customFonts]);

// Initialize subtitle settings and default language if not set
useEffect(() => {
  const updates: Partial<typeof adData> = {};

  if (!adData.subtitleStyle) {
    // Find "The Bold Font" style, fallback to first style if not found
    const boldFontStyle = SUBTITLE_STYLES.find(s => s.name === 'The Bold Font (Default)');
    updates.subtitleStyle = boldFontStyle?.id || 'bold-font'; // Use bold-font ID directly
    updates.subtitleAnimation = 'none'; // No animation
    updates.subtitlePosition = 'bottom';
    updates.enableSubtitles = true;
    updates.useCapsLock = true; // All caps
    updates.oneWordAtATime = true; // One word at a time
    
    // Font settings
    updates.fontSize = 70;
    updates.fontWeight = 900;
    updates.textColor = '#FFFFFF'; // White text
    updates.textTransform = 'none';
    updates.letterSpacing = 0;
    
    // Outline settings
    updates.outlineWidth = 3;
    updates.outlineColor = '#000000'; // Black outline
    
    // Shadow settings
    updates.shadowOffsetX = -6;
    updates.shadowOffsetY = 6;
    updates.shadowBlur = 13;
    updates.shadowColor = '#000000'; // Black shadow
  }

  // Set default language if not set
  if (!adData.language) {
    updates.language = 'en';
  }

  if (Object.keys(updates).length > 0) {
    setAdData(updates);
  }
}, []);

// Check for missing audio and trigger generation
useEffect(() => {
    // Audio generation logic here
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
}, [adData.audioUrl, setAdData]);

const handleGenerateAudio = useCallback(async (forceRegenerate = false) => {
  const scriptToUse = adData.selectedScript || adData.script;
  if (!scriptToUse) {
    return;
  }
  if (!adData.language) {
    return;
  }


  setIsGeneratingAudio(true);
  try {
    const selectedGender = adData.avatarId ?
      (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') :
      'female';


    // If forcing regeneration, clear cache first
    if (forceRegenerate) {
      TTSCacheService.clearCache();
    }

    const result = await TTSCacheService.getTTS(scriptToUse, adData.language, selectedGender, adData.avatarId);


    // Set generation to false IMMEDIATELY after TTS completes, before any other async operations
    setIsGeneratingAudio(false);

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

    // Clear the audio URL on error to prevent stuck state
    setAdData({ audioUrl: undefined });

    // Ensure generation state is cleared on error
    setIsGeneratingAudio(false);
  }
}, [adData.selectedScript, adData.script, adData.language, adData.avatarId, getDurationForExistingAudio, setAdData]);

const handleRegenerateAudio = () => {
  if (regenerationCount >= MAX_REGENERATIONS) {
    toast.error(`Maximum ${MAX_REGENERATIONS} regenerations reached.`);
    return;
  }
  if (isGeneratingAudio) {
    return;
  }
  handleGenerateAudio(true);
};

// Generate audio automatically when we have script but no audio (and product video is not generating)
useEffect(() => {
  const shouldGenerateAudio = (adData.selectedScript || adData.script) && adData.language && !adData.audioUrl && !isGeneratingAudio && !isGeneratingProductVideo;
  const shouldGetDuration = adData.audioUrl && !audioDuration;

  if (shouldGenerateAudio) {
    handleGenerateAudio();
  } else if (shouldGetDuration) {
    getDurationForExistingAudio();
  } else if (isGeneratingProductVideo) {
  }
}, [adData.selectedScript, adData.script, adData.language, adData.audioUrl, isGeneratingAudio, audioDuration, isGeneratingProductVideo, handleGenerateAudio, getDurationForExistingAudio]);

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
  // Clear modified timeline when switching templates so it uses the new template's timeline
  setAdData({ templateId, modifiedTimeline: undefined });
};

// Combine built-in and custom music options
const allMusicOptions = [
    ...BACKGROUND_MUSIC_OPTIONS,
    ...customMusic.map(music => ({
        id: `custom-${music.id}`,
        name: `${music.name} (Custom)`,
        url: music.url,
        description: 'Your uploaded music',
        isCustom: true
    }))
];

const handleMusicChange = (musicId: string) => {
    setSelectedMusicId(musicId);
    const selectedMusic = allMusicOptions.find(m => m.id === musicId);
    setAdData({
      backgroundMusicUrl: selectedMusic?.url || '',
      backgroundMusicVolume: selectedMusic?.id === 'none' ? 0 : 0.1
    });
};

const generateProductVideo = async () => {
    const productData = adData.productVideoData;
    if (!productData?.includeProductVideo || !productData.selectedImageId || !productData.avatarId) {
        setIsGeneratingProductVideo(false);
        return;
    }

    try {
        setCurrentStep(1);

        // Step 1: Use existing data from avatar page
        const productDescription = productData.productDescription;
        const generatedImages = productData.generatedImages || [];

        // Find the selected image using the stored selectedImageId
        const selectedImage = generatedImages.find((img: any) => img.id === productData.selectedImageId);
        if (!selectedImage?.url) {
            throw new Error('Selected image not found. Please go back and select an image.');
        }

        setCurrentStep(2);
        setGeneratingVideo(true);

        // Step 2: Generate video from selected image
        const videoResponse = await axios.post('/api/runway/generate-avatar-video', {
            imageUrl: selectedImage.url,
            productDescription
        });

        // Step 3: Wait for video and concatenate
        setCurrentStep(3);
        const finalVideo = await pollVideoStatus(videoResponse.data.taskId, productData.avatarId);

        // Store the video URL in context
        setAdData({ productVideoUrl: finalVideo });

        setIsGeneratingProductVideo(false);

    } catch (error: any) {
        console.error('Error generating product video:', error);
        toast.error(error.response?.data?.error || 'Failed to generate product video');
        setIsGeneratingProductVideo(false);
    }
};

const pollImageStatus = async (taskIds: string[]): Promise<any[]> => {
    for (let i = 0; i < 60; i++) { // Max 5 minutes
        try {
            const response = await axios.post('/api/runway/check-image-status', { taskIds });
            if (response.data.status === 'COMPLETED') {
                return response.data.images;
            } else if (response.data.status === 'FAILED') {
                throw new Error('Image generation failed');
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error('Error checking image status:', error);
        }
    }
    throw new Error('Image generation timeout');
};

const pollVideoStatus = async (taskId: string, avatarId: number): Promise<string> => {
    for (let i = 0; i < 120; i++) { // Max 10 minutes
        try {
            const response = await axios.get(`/api/runway/task-status/${taskId}`);

            if (response.data.status === 'SUCCEEDED') {
                const generatedVideoUrl = response.data.output[0];

                // Concatenate with avatar video
                const avatar = avatars.find(a => a.id === avatarId);
                const avatarKey = avatar?.src.split('/').pop()?.replace('.mp4', '') || '';

                const concatResponse = await axios.post('/api/video/concatenate', {
                    generatedVideoUrl,
                    avatarId: avatarKey
                });

                if (concatResponse.data.success) {
                    return `/api/serve-video${concatResponse.data.videoUrl}`;
                } else {
                    throw new Error('Failed to concatenate videos');
                }
            } else if (response.data.status === 'FAILED') {
                throw new Error('Video generation failed');
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error('Error checking video status:', error);
        }
    }
    throw new Error('Video generation timeout');
};

const handleNext = useCallback(async () => {
  let isMounted = true;
  
  if (!session?.user?.id || !selectedTemplateId || isRendering || isNavigatingAway) {
    if (!session?.user?.id || !selectedTemplateId) {
      console.error('Session or template missing:', { userId: session?.user?.id, templateId: selectedTemplateId });
    }
    return;
  }
  
  try {
    setIsRendering(true);
    setFinalRenderStarted(true);
    
    console.log(`[Template] Starting final render directly for template: ${selectedTemplateId}`);
    
    // Step 1: Create the ad
    const createAdResponse = await axios.post('/api/ads/create', {
      adData: {
        ...adData,
        templateId: selectedTemplateId,
        modifiedTimeline: adData.modifiedTimeline,
      }
    });
    
    if (!isMounted) return;
    
    const { adId } = createAdResponse.data;
    console.log(`[Template] Ad created successfully: ${adId}`);
    
    // Step 2: Start the final render job (this will deduct 10 credits)
    const startJobResponse = await axios.post('/api/render/start-job', {
      adId,
      templateId: selectedTemplateId
    });
    
    if (!isMounted) return;
    
    const { jobId, updatedCredits } = startJobResponse.data;
    console.log(`[Template] Final render job started: ${jobId}, Credits remaining: ${updatedCredits}`);
    
    // Update credits display in frontend
    setUserCredits(updatedCredits);
    
    // Navigate to creations page to show the status
    setIsNavigatingAway(true);
    router.push('/creations');
    
  } catch (e: any) {
    console.error('Error in handleNext:', e);
    if (isMounted && !isNavigatingAway) {
      setIsRendering(false);
      setFinalRenderStarted(false);
      setIsNavigatingAway(false);
      
      // Show specific error messages
      if (e.response?.status === 400 && e.response?.data?.message?.includes('Insufficient credits')) {
        toast.error(e.response.data.message);
      } else if (e.response?.status === 403 && e.response?.data?.code === 'PREMIUM_AVATAR_REQUIRED') {
        toast.error('Premium avatar access denied. Upgrade to use premium avatars.');
      } else {
        toast.error('Failed to start video rendering. Please try again.');
      }
    }
  }
  
  return () => {
    isMounted = false;
  };
}, [session?.user?.id, selectedTemplateId, isRendering, isNavigatingAway, adData, setAdData, router]);

const handleGeneratePreview = useCallback(async () => {
  if (!session?.user?.id || !selectedTemplateId || isGeneratingPreview) {
    return;
  }
  
  setIsGeneratingPreview(true);
  setPreviewVideoUrl(null);
  
  try {
    console.log('[Preview] Starting preview generation...');
    
    const response = await axios.post('/api/render/preview-start', {
      adData: {
        ...adData,
        templateId: selectedTemplateId,
        currentPreviewFormat: adData.currentPreviewFormat || '16:9',
        modifiedTimeline: adData.modifiedTimeline,
        audioUrl: adData.audioUrl,
        avatarId: adData.avatarId,
      },
      previewDuration: 15,
    });
    
    const { jobId } = response.data;
    console.log('[Preview] Preview job started:', jobId);
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 1 minute
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await axios.get(`/api/render/preview-status/${jobId}`);
        const { status, result, error } = statusResponse.data;
        
        console.log('[Preview] Status check:', status);
        
        if (status === 'completed') {
          setPreviewVideoUrl(result.previewVideoUrl);
          console.log('[Preview] Preview completed:', result.previewVideoUrl);
          break;
        } else if (status === 'failed') {
          throw new Error(error || 'Preview generation failed');
        }
        
        attempts++;
      } catch (pollError) {
        console.error('[Preview] Error polling status:', pollError);
        attempts++;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Preview generation timed out');
    }
    
  } catch (error) {
    console.error('[Preview] Error generating preview:', error);
    alert('Failed to generate preview. Please check the console for details.');
  } finally {
    setIsGeneratingPreview(false);
  }
}, [session?.user?.id, selectedTemplateId, isGeneratingPreview, adData]);

const getOrderedAssets = () => {
  const orderedImages = adData.orderedImages || [];
  const orderedVideos = adData.orderedVideos || [];
  const orderedBRoll = adData.orderedBRoll || [];

  // If there's an explicit order, use it. Otherwise, use the selection order.
  if (orderedImages.length > 0 || orderedVideos.length > 0 || orderedBRoll.length > 0) {
    const allOrderedAssets = [...orderedImages, ...orderedVideos, ...orderedBRoll];
    // IMPORTANT: No more transformation. Just return the clean URL.
    return allOrderedAssets
      .sort((a, b) => a.order - b.order)
      .map(asset => asset.url);
  }

  // Fallback for when there is no explicit ordering
  return [
    ...(adData.selectedImages || []),
    ...(adData.selectedVideos || []),
    // IMPORTANT: No more transformation. Use the clean URL directly.
    ...(adData.selectedBRoll || [])
  ];
};

const allAssets = getOrderedAssets();
const baseTemplate = TEMPLATE_LIBRARY.find(t => t.id === selectedTemplateId);
const selectedTemplate = baseTemplate ? scaleTemplateForDuration(baseTemplate, adData.duration || 30) : undefined;

return (
    <div className="min-h-screen bg-black text-white">
        {/* Product Video Loading Screen */}
        {isGeneratingProductVideo && (
            <ProductVideoLoadingScreen currentStep={currentStep} />
        )}
        {/* Hidden audio elements for music previews */}
        {allMusicOptions.map(music => (
            music.url ? <audio key={music.id} id={`music-preview-${music.id}`} src={music.url} preload="none" /> : null
        ))}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Customize Your Ad</h1>
                <p className="text-gray-400">Select a template and fine-tune your ad's style. The preview will update on the right.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">1. Choose a Video Template</h2>
                        <div className="flex flex-wrap gap-2">
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

                    {/* Asset Reordering Section */}
                    {allAssets.length > 1 && (
                        <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">2. Reorder Your Assets</h2>
                                <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                                    {allAssets.length} total
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Drag assets to change their order in the final video. Order matters - the first asset appears first.</p>

                            {/* Asset Grid with Enhanced Design */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {allAssets.map((asset, index) => {
                                        const isVideo = asset.toLowerCase().includes('.mp4') || asset.toLowerCase().includes('.webm');

                                        return (
                                            <div
                                                key={`${asset}-${index}`}
                                                className={`relative group cursor-move rounded-[15px] overflow-hidden border-2 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 aspect-square transform hover:scale-105 ${
                                                    selectedTemplate && index >= selectedTemplate.timeline.length
                                                        ? 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
                                                        : 'bg-gray-800 border-gray-700 hover:border-orange-400'
                                                }`}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', index.toString());
                                                    e.currentTarget.style.opacity = '0.5';
                                                    e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                                                    e.currentTarget.style.zIndex = '50';

                                                    const container = e.currentTarget.closest('.grid');
                                                    if (container) {
                                                        container.classList.add('dragging');
                                                    }
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.style.opacity = '1';
                                                    e.currentTarget.style.transform = '';
                                                    e.currentTarget.style.zIndex = '';

                                                    const container = e.currentTarget.closest('.grid');
                                                    if (container) {
                                                        container.classList.remove('dragging');
                                                    }

                                                    const allItems = container?.querySelectorAll('[draggable="true"]');
                                                    allItems?.forEach((item) => {
                                                        (item as HTMLElement).style.transform = '';
                                                        item.classList.remove('shift-right', 'shift-left', 'move-to-position');
                                                    });
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                    const hoverIndex = index;
                                                    const currentTarget = e.currentTarget as HTMLElement;

                                                    if (dragIndex === hoverIndex) return;

                                                    currentTarget.classList.add('border-orange-500', 'bg-orange-500/10');

                                                    const container = currentTarget.closest('.grid');
                                                    const allItems = container?.querySelectorAll('[draggable="true"]');

                                                    allItems?.forEach((item, itemIndex) => {
                                                        const element = item as HTMLElement;

                                                        element.classList.remove('shift-right', 'shift-left', 'move-to-position');

                                                        if (itemIndex === dragIndex) return;

                                                        let targetPosition = itemIndex;

                                                        if (dragIndex < hoverIndex) {
                                                            if (itemIndex > dragIndex && itemIndex <= hoverIndex) {
                                                                targetPosition = itemIndex - 1;
                                                            }
                                                        } else {
                                                            if (itemIndex >= hoverIndex && itemIndex < dragIndex) {
                                                                targetPosition = itemIndex + 1;
                                                            }
                                                        }

                                                        if (targetPosition < itemIndex) {
                                                            element.classList.add('shift-left');
                                                        } else if (targetPosition > itemIndex) {
                                                            element.classList.add('shift-right');
                                                        }
                                                    });
                                                }}
                                                onDragLeave={(e) => {
                                                    const currentTarget = e.currentTarget as HTMLElement;
                                                    currentTarget.classList.remove('border-orange-500', 'bg-orange-500/10');

                                                    const container = currentTarget.closest('.grid');
                                                    const allItems = container?.querySelectorAll('[draggable="true"]');
                                                    allItems?.forEach((item) => {
                                                        item.classList.remove('shift-right', 'shift-left', 'move-to-position');
                                                    });
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const currentTarget = e.currentTarget as HTMLElement;
                                                    currentTarget.classList.remove('border-orange-500', 'bg-orange-500/10');

                                                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                    const hoverIndex = index;

                                                    const container = currentTarget.closest('.grid');
                                                    const allItems = container?.querySelectorAll('[draggable="true"]');
                                                    allItems?.forEach((item) => {
                                                        item.classList.remove('shift-right', 'shift-left', 'move-to-position');
                                                    });

                                                    if (dragIndex !== hoverIndex) {
                                                        const newAssets = [...allAssets];
                                                        const draggedAsset = newAssets[dragIndex];
                                                        newAssets.splice(dragIndex, 1);
                                                        newAssets.splice(hoverIndex, 0, draggedAsset);

                                                        const orderedAssets = newAssets.map((asset, idx) => ({
                                                            url: asset,
                                                            order: idx
                                                        }));

                                                        const orderedImages: any[] = [];
                                                        const orderedVideos: any[] = [];
                                                        const orderedBRoll: any[] = [];

                                                        orderedAssets.forEach(asset => {
                                                            if (asset.url.includes('b-roll/')) {
                                                                orderedBRoll.push(asset);
                                                            } else if (asset.url.toLowerCase().includes('.mp4') || asset.url.toLowerCase().includes('.webm')) {
                                                                orderedVideos.push(asset);
                                                            } else {
                                                                orderedImages.push(asset);
                                                            }
                                                        });

                                                        setAdData({
                                                            orderedImages: orderedImages.length > 0 ? orderedImages : undefined,
                                                            orderedVideos: orderedVideos.length > 0 ? orderedVideos : undefined,
                                                            orderedBRoll: orderedBRoll.length > 0 ? orderedBRoll : undefined
                                                        });
                                                    }
                                                }}
                                            >
                                                {/* Asset Media */}
                                                <div className="relative w-full h-full">
                                                    {isVideo ? (
                                                        <VideoThumbnail
                                                            src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                                                            className="w-full h-full object-cover"
                                                            index={index}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={asset.startsWith('b-roll/') ? `/${asset}` : asset}
                                                            alt={`Asset ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>

                                                    {selectedTemplate && index >= selectedTemplate.timeline.length && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <div className="bg-gray-700/90 text-gray-300 text-xs px-2 py-1 rounded-md">
                                                                Extra
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Number */}
                                                <div className="absolute top-3 left-3">
                                                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Position and Inclusion Indicator */}
                                                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <div className="bg-gray-900/90 text-gray-300 text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                                        {`${index + 1} of ${allAssets.length}`}
                                                        {selectedTemplate && index < selectedTemplate.timeline.length && (
                                                            <span className="text-green-400 ml-1">• Will be used</span>
                                                        )}
                                                        {selectedTemplate && index >= selectedTemplate.timeline.length && (
                                                            <span className="text-gray-500 ml-1">• Extra asset</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Enhanced Controls */}
                            <div className="mt-6 p-4 bg-gray-800/50 rounded-[10px] border border-gray-700">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                setAdData({
                                                    orderedImages: undefined,
                                                    orderedVideos: undefined,
                                                    orderedBRoll: undefined
                                                });
                                            }}
                                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Reset Order
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {selectedTemplate && (
                                            <span>First {selectedTemplate.timeline.length} asset{selectedTemplate.timeline.length !== 1 ? 's' : ''} will be used in the video</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">{allAssets.length > 1 ? '3. Audio & Music' : '2. Audio & Music'}</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-regular text-gray-400 mb-1">Voiceover</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleTTSPlayPause}
                                                className={`btn-secondary flex-1 flex items-center justify-center rounded-[15px] gap-2 px-3 py-2 br-1 text-sm transition-colors ${
                                                isPlayingTTS
                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                                                }`}
                                                disabled={isGeneratingAudio || !adData.audioUrl}
                                            >
                                                {isGeneratingAudio ? 'Generating...' : (isPlayingTTS ? '❚❚ Pause' : '▶ Play Voiceover')}
                                            </button>
                                            <button
                                                onClick={handleRegenerateAudio}
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-[15px] text-sm transition-colors disabled:bg-gray-800 disabled:text-gray-500"
                                                disabled={isGeneratingAudio || regenerationCount >= MAX_REGENERATIONS}
                                                title={regenerationCount >= MAX_REGENERATIONS ? `Maximum ${MAX_REGENERATIONS} regenerations reached` : 'Regenerate voiceover'}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                        {regenerationCount > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Regenerations: {regenerationCount}/{MAX_REGENERATIONS}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-regular text-gray-400 mb-1">Background Music</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <CustomDropdown
                                                    value={selectedMusicId}
                                                    options={allMusicOptions}
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
                                            <button
                                                onClick={() => setShowMusicUploader(!showMusicUploader)}
                                                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-[15px] transition-colors"
                                                title="Upload custom music"
                                            >
                                                <img src="/upload.svg" alt="Upload" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Music Upload Section */}
                            {showMusicUploader && (
                                <div className="mt-6 border-t border-gray-700 pt-4">
                                    <h4 className="text-white font-regular mb-4">Upload Custom Music</h4>
                                    <MusicUploader
                                        onMusicUploaded={async (music) => {
                                            customMusicManager.addToCache(music);
                                            const updatedMusic = await customMusicManager.loadCustomMusic();
                                            setCustomMusic(updatedMusic);
                                            setShowMusicUploader(false);
                                            const customId = `custom-${music.id}`;
                                            setSelectedMusicId(customId);
                                            setAdData({
                                                backgroundMusicUrl: music.url,
                                                backgroundMusicVolume: 0.1
                                            });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {(adData.selectedScript || adData.script) && (
                        <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6">
                            <h2 className="text-xl font-semibold text-white mb-6">Subtitles</h2>
                            <div>
                                <FontSubtitleSelector
                                    selectedStyle={adData.enableSubtitles ? currentSubtitleStyle : null}
                                    onStyleChange={(style) => {
                                        if (!style) {
                                            setAdData({
                                                subtitleStyle: undefined,
                                                customFontFamily: undefined,
                                                customFontUrl: undefined
                                            });
                                            return;
                                        }

                                        const isBuiltIn = SUBTITLE_STYLES.some(s => s.id === style.id);
                                        setAdData({
                                            subtitleStyle: style.id,
                                            customFontFamily: isBuiltIn ? undefined : style.font.replace(/"/g, ''),
                                            customFontUrl: isBuiltIn ? undefined : (style as any).url,
                                        });
                                        setCurrentSubtitleStyle({
                                            ...style,
                                            textShadow: style.textShadow || '1px 1px 2px #000',
                                            backgroundColor: style.backgroundColor || 'transparent',
                                            borderRadius: style.borderRadius || 0,
                                            padding: style.padding || 8,
                                            textAlign: (style.textAlign || 'center') as 'center',
                                            lineHeight: style.lineHeight || 1.2,
                                            maxWidth: style.maxWidth || 950,
                                            border: style.border || 'none',
                                            supportsCaps: style.supportsCaps !== false
                                        });
                                    }}
                                    onAnimationChange={(animation) => setAdData({ subtitleAnimation: animation })}
                                    onPositionChange={(position) => setAdData({ subtitlePosition: position })}
                                    selectedAnimation={adData.subtitleAnimation || 'none'}
                                    selectedPosition={adData.subtitlePosition || 'bottom'}
                                    enableSubtitles={adData.enableSubtitles !== false}
                                    onEnableSubtitlesChange={(enabled) => setAdData({ enableSubtitles: enabled })}
                                    useCapsLock={adData.useCapsLock || false}
                                    onUseCapsLockChange={(useCaps) => setAdData({ useCapsLock: useCaps })}
                                    oneWordAtATime={adData.oneWordAtATime || false}
                                    onOneWordAtATimeChange={(enabled) => setAdData({ oneWordAtATime: enabled })}
                                    fontSize={adData.fontSize || 50}
                                    onFontSizeChange={(size) => setAdData({ fontSize: size })}
                                    fontWeight={adData.fontWeight}
                                    onFontWeightChange={(weight) => setAdData({ fontWeight: weight })}
                                    outlineWidth={adData.outlineWidth}
                                    onOutlineWidthChange={(width) => setAdData({ outlineWidth: width })}
                                    outlineColor={adData.outlineColor}
                                    onOutlineColorChange={(color) => setAdData({ outlineColor: color })}
                                    shadowOffsetX={adData.shadowOffsetX}
                                    onShadowOffsetXChange={(offset) => setAdData({ shadowOffsetX: offset })}
                                    shadowOffsetY={adData.shadowOffsetY}
                                    onShadowOffsetYChange={(offset) => setAdData({ shadowOffsetY: offset })}
                                    shadowBlur={adData.shadowBlur}
                                    onShadowBlurChange={(blur) => setAdData({ shadowBlur: blur })}
                                    shadowColor={adData.shadowColor}
                                    onShadowColorChange={(color) => setAdData({ shadowColor: color })}
                                    enableShadow={adData.enableShadow !== false}
                                    onEnableShadowChange={(enabled) => setAdData({ enableShadow: enabled })}
                                    letterSpacing={adData.letterSpacing}
                                    onLetterSpacingChange={(spacing) => setAdData({ letterSpacing: spacing })}
                                    textTransform={adData.textTransform}
                                    onTextTransformChange={(transform) => setAdData({ textTransform: transform })}
                                    textColor={adData.textColor}
                                    onTextColorChange={(color) => setAdData({ textColor: color })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        {selectedTemplate && allAssets.length > 0 ? (
                            <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-6">
                                <div className="flex items-center justify-between pb-2">
                                    <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                                    <span className="text-sm text-gray-400">{selectedTemplate.name}</span>
                                </div>
                                <TemplatePreviewWithSubtitles
                                    template={selectedTemplate}
                                    assets={allAssets}
                                    avatarId={adData.avatarId || 1}
                                    script={adData.selectedScript || adData.script || ''}
                                    subtitleStyle={currentSubtitleStyle}
                                    subtitleAnimation={adData.subtitleAnimation || 'none'}
                                    subtitlePosition={adData.subtitlePosition || 'bottom'}
                                    enableSubtitles={adData.enableSubtitles !== false}
                                    audioUrl={isGeneratingProductVideo ? undefined : adData.audioUrl}
                                    audioDuration={isGeneratingProductVideo ? undefined : audioDuration}
                                    useCapsLock={adData.useCapsLock || false}
                                    wordTimings={adData.wordTimings}
                                    oneWordAtATime={adData.oneWordAtATime || false}
                                    fontSize={adData.fontSize || 50}
                                    currentPreviewFormat={adData.currentPreviewFormat}
                                    fontWeight={adData.fontWeight}
                                    outlineWidth={adData.outlineWidth}
                                    outlineColor={adData.outlineColor}
                                    shadowOffsetX={adData.shadowOffsetX}
                                    shadowOffsetY={adData.shadowOffsetY}
                                    shadowBlur={adData.shadowBlur}
                                    shadowColor={adData.shadowColor}
                                    letterSpacing={adData.letterSpacing}
                                    textTransform={adData.textTransform}
                                    textColor={adData.textColor}
                                    productVideoUrl={adData.productVideoUrl}
                                    backgroundMusicUrl={adData.backgroundMusicUrl}
                                />

                                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-blue-300">
                                            <div className="font-medium text-xs mb-1">Preview Showcase</div>
                                            <div className="text-xs leading-relaxed">This is just a showcase. The final render will include precise lip-sync, accurate caption timing, audio synchronization, and background removal.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-900 border border-gray-800 rounded-[15px] p-8 text-center">
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
                    className={`btn-primary ${(isRendering || !selectedTemplateId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleNext}
                    disabled={isRendering || !selectedTemplateId}
                >
                    {isRendering ? (
                        <>
                            <BarLoader size="sm" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <img src="/ai-star.svg" alt="" className="w-5 h-5" />
                             Generate Video
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
);

}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
const session = await getServerSession(context.req, context.res, authOptions);

if (!session) {
return {
redirect: {
destination: '/auth/signin?callbackUrl=' + encodeURIComponent('/ad/template'),
permanent: false,
},
};
}

return {
props: {
session,
},
};
};

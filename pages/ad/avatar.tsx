import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAdCreation } from '../../components/AdCreationContext';
// This is the correct import from our shared library
import { avatars, isAvatarFree } from '../../lib/avatars';
import axios from 'axios';
import toast from 'react-hot-toast';
import TTSCacheService from '../../lib/tts-cache-service';

const genderOptions = ['male', 'female', 'fantasy'];
const ageOptions = ['adult', 'senior'];

export default function AvatarAd() {
  const router = useRouter();
  const { data: session } = useSession();
  const { adData, setAdData } = useAdCreation();
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(adData.avatarId || null);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userPlan = session?.user?.plan;
  const isFreePlan = userPlan === 'FREE';

  useEffect(() => {
    setAdData({ 
      avatarId: selectedAvatar === null ? undefined : selectedAvatar,
      audioUrl: '' // Clear audioUrl to force fresh TTS generation with correct gender
    });
  }, [selectedAvatar]);

  // Generate audio when avatar is selected
  useEffect(() => {
    if (selectedAvatar !== null && adData.selectedScript && adData.language) {
      generateAudio();
    }
  }, [selectedAvatar, adData.selectedScript, adData.language]);

  const generateAudio = async () => {
    if (!adData.selectedScript || !adData.language) return;
    
    setIsGeneratingAudio(true);
    try {
      const selectedGender = adData.avatarId ? 
        (avatars.find(a => a.id === adData.avatarId)?.gender || 'female') : 
        'female';
      
      console.log(`[Avatar] AvatarId: ${adData.avatarId}, Gender: ${selectedGender}, Type: ${typeof adData.avatarId}`);
      
      // Use cached TTS service instead of direct API call
      const result = await TTSCacheService.getTTS(adData.selectedScript, adData.language, selectedGender, adData.avatarId);
      
      // Store the audio URL and word timings in the ad data for later use
      setAdData({ 
        audioUrl: result.audioUrl,
        wordTimings: result.wordTimings 
      });
    } catch (error: any) {
      console.error('Error generating audio:', error);
      if (error.response?.status === 429) {
        const rateLimitInfo = error.response?.data?.rateLimitInfo;
        const resetTime = rateLimitInfo?.resetTime ? new Date(rateLimitInfo.resetTime) : null;
        const resetTimeString = resetTime ? resetTime.toLocaleTimeString() : 'later';
        toast.error(
          `Rate limit exceeded for audio generation. You can generate more audio after ${resetTimeString}.`,
          { duration: 8000 }
        );
      } else {
        toast.error('Failed to generate audio. Please try again.');
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const filteredAvatars = avatars.filter(a =>
    (!gender || a.gender === gender) &&
    (!age || a.age === age)
  );

  const handleAvatarSelect = (avatarId: number) => {
    // Check if avatar is premium and user is on free plan
    if (isFreePlan && !isAvatarFree(avatarId)) {
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedAvatar(avatarId);
  };

  const handleNext = () => {
    if (selectedAvatar !== null) {
      // Additional validation for free users
      if (isFreePlan && !isAvatarFree(selectedAvatar)) {
        setShowUpgradeModal(true);
        return;
      }
      router.push('/ad/template');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose Avatar - Step 4</h1>
          <p className="text-gray-400">Select the AI avatar that will present your video</p>
          
          {/* Audio Generation Status */}
          {isGeneratingAudio && (
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
                <span className="text-orange-400 text-sm">Generating audio for your selected script...</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filter Avatars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gender Filter */}
            <div>
              <label className="block text-gray-300 font-normal mb-3">Gender</label>
              <div className="flex gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt}
                    className={`px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 transition-colors duration-200 ${
                      gender === opt
                        ? 'border-orange-500'
                        : 'hover:border-orange-500'
                    }`}
                    style={{ backgroundColor: '#111827' }}
                    onClick={() => setGender(gender === opt ? null : opt)}
                    type="button"
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Filter */}
            <div>
              <label className="block text-gray-300 font-normal mb-3">Age</label>
              <div className="flex gap-2">
                {ageOptions.map(opt => (
                  <button
                    key={opt}
                    className={`px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 transition-colors duration-200 ${
                      age === opt
                        ? 'border-orange-500'
                        : 'hover:border-orange-500'
                    }`}
                    style={{ backgroundColor: '#111827' }}
                    onClick={() => setAge(age === opt ? null : opt)}
                    type="button"
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- THIS IS THE JSX THAT WAS MISSING --- */}
        {/* Avatar Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Available Avatars
            <span className="text-gray-400 text-sm font-normal ml-2">
              ({filteredAvatars.length} of {avatars.length})
            </span>
          </h2>

          {filteredAvatars.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <img src="/avatar.svg" alt="Avatar" className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">No avatars match the selected filters</p>
                <p className="text-sm">Try adjusting your filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAvatars.map(avatar => {
                const isPremium = !isAvatarFree(avatar.id);
                const isLocked = isFreePlan && isPremium;
                
                return (
                <div
                  key={avatar.id}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                    isLocked 
                      ? 'cursor-pointer' 
                      : 'cursor-pointer hover:scale-105'
                  } ${
                    selectedAvatar === avatar.id
                      ? 'border-2 border-orange-500'
                      : 'border border-gray-700 hover:border-orange-500/50'
                  }`}
                  onClick={() => handleAvatarSelect(avatar.id)}
                >
                  <div className="aspect-[9/16] bg-gray-800">
                    <video 
                      src={avatar.src}
                      loop
                      muted
                      playsInline
                      controls={false}
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                      className="w-full h-full object-cover"
                      preload="metadata"
                      onMouseEnter={e => {
                        // Safe play with error handling and readiness check
                        const video = e.currentTarget;
                        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                          video.play().catch(error => {
                            console.warn(`Failed to play avatar video ${avatar.src}:`, error);
                          });
                        }
                      }}
                      onMouseLeave={e => { 
                        try {
                          const video = e.currentTarget;
                          video.pause(); 
                          video.currentTime = 0; 
                        } catch (error) {
                          console.warn(`Failed to pause avatar video ${avatar.src}:`, error);
                        }
                      }}
                      onError={e => {
                        console.error(`Avatar video error for ${avatar.src}:`, e);
                        // Could show a fallback image here
                      }}
                      onLoadedMetadata={e => {
                        console.log(`Avatar video ${avatar.src} metadata loaded`);
                      }}
                      onCanPlay={e => {
                        console.log(`Avatar video ${avatar.src} can play`);
                      }}
                    />
                  </div>

                  {/* Premium Lock Overlay */}
                  {isLocked && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2 pointer-events-none">
                      <div className="bg-orange-500/20 rounded-full p-1 border border-orange-500">
                        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-orange-400 text-xs font-medium">Premium</span>
                    </div>
                  )}

                  {/* Selection Overlay */}
                  {selectedAvatar === avatar.id && !isLocked && (
                    <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center pointer-events-none">
                      <div className="bg-orange-500 rounded-full p-3 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                </div>
                );
              })}
            </div>
          )}
        </div>
        {/* --- END OF MISSING JSX --- */}

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            className="flex items-center justify-center px-6 py-3 bg-gray-800 text-white font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all"
            onClick={() => router.back()}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            className='btn-primary'
            onClick={handleNext}
            disabled={selectedAvatar === null}
          >
            Next: Choose Template
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Premium Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2937] border border-gray-700 rounded-[20px] p-8 max-w-md w-full mx-4">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500">
                  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-semibold text-white text-center mb-3">
                Premium Avatar
              </h3>
              
              {/* Message */}
              <p className="text-gray-300 text-centered mb-6 leading-relaxed">
                This avatar is part of our premium collection. Upgrade to any paid plan to unlock <strong>all premium avatars</strong> and create unlimited videos.
              </p>
              
              {/* Features List */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Access to all premium avatars
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Fantasy avatars collection
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Video downloads & full controls
                  </li>
                </ul>
              </div>
              
              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.open('/subscription', '_blank')}
                  className="btn-primary w-full"
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn-secondary w-full"
                >
                  Continue with Free Avatars
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

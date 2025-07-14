import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
// This is the correct import from our shared library
import { avatars } from '../../lib/avatars';
import axios from 'axios';

const genderOptions = ['male', 'female'];
const ageOptions = ['adult', 'senior'];
const locationOptions = ['inside', 'outside'];

export default function AvatarAd() {
  const router = useRouter();
  const { adData, setAdData } = useAdCreation();
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(adData.avatarId || null);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    setAdData({ avatarId: selectedAvatar === null ? undefined : selectedAvatar });
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
      const response = await axios.post('/api/tts/elevenlabs', {
        text: adData.selectedScript,
        language: adData.language,
        voiceId: 'auto', // Let the system choose
      });
      // Store the audio URL in the ad data for later use
      setAdData({ audioUrl: response.data.audioUrl });
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const filteredAvatars = avatars.filter(a =>
    (!gender || a.gender === gender) &&
    (!age || a.age === age) &&
    (!location || a.location === location)
  );

  const handleNext = () => {
    if (selectedAvatar !== null) {
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
              <label className="block text-gray-300 font-medium mb-3">Gender</label>
              <div className="flex gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      gender === opt
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                    }`}
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
              <label className="block text-gray-300 font-medium mb-3">Age</label>
              <div className="flex gap-2">
                {ageOptions.map(opt => (
                  <button
                    key={opt}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      age === opt
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                    }`}
                    onClick={() => setAge(age === opt ? null : opt)}
                    type="button"
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-gray-300 font-medium mb-3">Location</label>
              <div className="flex gap-2">
                {locationOptions.map(opt => (
                  <button
                    key={opt}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      location === opt
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                    }`}
                    onClick={() => setLocation(location === opt ? null : opt)}
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
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.044-5.709-2.709M15 17h3a2 2 0 002-2V9a2 2 0 00-2-2h-3m-6 8H6a2 2 0 01-2-2V9a2 2 0 012-2h3m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 7h6" />
                </svg>
                <p className="text-lg">No avatars match the selected filters</p>
                <p className="text-sm">Try adjusting your filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAvatars.map(avatar => (
                <div
                  key={avatar.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedAvatar === avatar.id
                      ? 'ring-4 ring-orange-500 shadow-lg shadow-orange-500/25'
                      : 'border border-gray-700 hover:border-orange-500/50'
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
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
                      onMouseEnter={e => e.currentTarget.play()}
                      onMouseLeave={e => { 
                        e.currentTarget.pause(); 
                        e.currentTarget.currentTime = 0; 
                      }}
                    />
                  </div>

                  {selectedAvatar === avatar.id && (
                    <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center pointer-events-none">
                      <div className="bg-orange-500 rounded-full p-3 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {avatar.label}
                    </p>
                  </div>
                </div>
              ))}
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
            className={`flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${selectedAvatar === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={selectedAvatar === null}
          >
            Next: Choose Template
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
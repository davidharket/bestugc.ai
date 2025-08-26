import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAdCreation, ProductVideoData } from '../../components/AdCreationContext';
// This is the correct import from our shared library
import { avatars, isAvatarFree, canAvatarHoldProducts, getAvatarImagePath } from '../../lib/avatars';
import axios from 'axios';
import toast from 'react-hot-toast';
import TTSCacheService from '../../lib/tts-cache-service';
import SimpleLoader from '../../components/SimpleLoader';
import BarLoader from '../../components/BarLoader';

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
  const [showProductVideoUpgradeModal, setShowProductVideoUpgradeModal] = useState(false);
  
  // Infinite scroll and filters
  const [displayedAvatarsCount, setDisplayedAvatarsCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [planFilter, setPlanFilter] = useState<'free' | 'premium' | null>(null);
  const [productFilter, setProductFilter] = useState<'canHold' | 'cannotHold' | null>(null);

  // Avatar Product Video States
  const [showProductVideo, setShowProductVideo] = useState(false);
  const [productImages, setProductImages] = useState<Array<{url: string, file: File}>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string, taskId: string, status?: string}>>([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [concatenatedVideoUrl, setConcatenatedVideoUrl] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(2);
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set());
  const [showProductHoldingPopup, setShowProductHoldingPopup] = useState(false);
  const [error, setError] = useState('');
  const [includeProductVideo, setIncludeProductVideo] = useState(false);
  

  // Handle product video checkbox change
  const handleProductVideoToggle = (checked: boolean) => {
    setIncludeProductVideo(checked);
    
    if (!checked) {
      // Clear all product video related state when unchecked
      setProductImages([]);
      setProductDescription('');
      setGeneratedImages([]);
      setSelectedImageId('');
      setFinalVideoUrl('');
      setConcatenatedVideoUrl('');
      setError('');
      
      // Clear from context as well
      setAdData({ productVideoUrl: '' });
      
    }
  };

  const userPlan = session?.user?.plan;
  const isFreePlan = userPlan === 'FREE';

  useEffect(() => {
    setAdData({ 
      avatarId: selectedAvatar === null ? undefined : selectedAvatar,
      audioUrl: '' // Clear audioUrl to force fresh TTS generation with correct gender
    });
  }, [selectedAvatar]);

  // Restore product video data when component mounts
  useEffect(() => {
    if (adData.productVideoData) {
      setIncludeProductVideo(adData.productVideoData.includeProductVideo || false);
      setSelectedImageId(adData.productVideoData.selectedImageId || '');
      setProductDescription(adData.productVideoData.productDescription || '');
      
      // Restore attempts remaining
      if (adData.productVideoData.attemptsRemaining !== undefined) {
        setAttemptsRemaining(adData.productVideoData.attemptsRemaining);
      }
      
      // Restore product images if available
      if (adData.productVideoData.productImages) {
        const restoredImages = adData.productVideoData.productImages.map((url: string, index: number) => ({
          url,
          file: new File([], `restored-image-${index}.jpg`, { type: 'image/jpeg' }) // Placeholder file
        }));
        setProductImages(restoredImages);
      }
      
      // Restore generated images if available  
      if (adData.productVideoData.generatedImages) {
        setGeneratedImages(adData.productVideoData.generatedImages);
      }
      
      // If there's already a product video generated, show the product video section
      if (adData.productVideoUrl || adData.productVideoData.includeProductVideo) {
        setShowProductVideo(true);
      }
    }
    
    // Set initial avatar selection from context
    if (adData.avatarId !== undefined) {
      setSelectedAvatar(adData.avatarId);
    }
    
    // Simulate initial loading
    setTimeout(() => {
      setAvatarsLoading(false);
    }, 1000);
  }, []);

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

  // Avatar Product Video Functions
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const removeProductImage = (indexToRemove: number) => {
    const newProductImages = productImages.filter((_, index) => index !== indexToRemove);
    setProductImages(newProductImages);
    
    // Save updated images to context immediately
    const updatedProductVideoData: ProductVideoData = {
      includeProductVideo: adData.productVideoData?.includeProductVideo || false,
      ...adData.productVideoData,
      productImages: newProductImages.map(img => img.url),
      attemptsRemaining,
      avatarId: selectedAvatar || undefined
    };
    setAdData({ productVideoData: updatedProductVideoData });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const totalImages = productImages.length + fileArray.length
    if (totalImages < 1) {
      setError('Please upload at least 1 product image')
      return
    }
    if (totalImages > 2) {
      setError('Maximum 2 product images allowed (Runway API limitation)')
      return
    }

    setUploadingImages(true)
    setError('')

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData()
        formData.append('files', file)
        
        const response = await fetch('/api/upload-temp', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`)
        
        const result = await response.json()
        return {
          url: result.files[0].url,
          file
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      const newProductImages = [...productImages, ...uploadedImages];
      setProductImages(newProductImages);
      
      // Save uploaded images to context immediately
      const updatedProductVideoData: ProductVideoData = {
        includeProductVideo: adData.productVideoData?.includeProductVideo || false,
        ...adData.productVideoData,
        productImages: newProductImages.map(img => img.url),
        attemptsRemaining,
        avatarId: selectedAvatar || undefined
      };
      setAdData({ productVideoData: updatedProductVideoData });
    } catch (error) {
      console.error('Error uploading images:', error)
      setError('Failed to upload images. Please try again.')
    } finally {
      setUploadingImages(false)
    }
  }


  const generateImagesWithDescription = async () => {
    if (productImages.length < 1) {
      setError('Please upload at least 1 product image first')
      return
    }

    if (attemptsRemaining <= 0) {
      setError('No attempts remaining')
      return
    }

    setGeneratingImages(true)
    setError('')
    
    // Clear previous results
    setGeneratedImages([])
    setSelectedImageId('')
    setFadingImages(new Set())

    try {
      // Use selected avatar
      const selectedAvatarData = avatars.find(avatar => avatar.id === selectedAvatar)
      if (!selectedAvatarData) {
        setError('Please select an avatar first')
        return
      }
      
      // Convert avatar video path to image path for API calls
      const avatarImagePath = getAvatarImagePath(selectedAvatarData.src)
      
      
      const descriptionResponse = await axios.post('/api/ai/generate-product-description', {
        images: productImages.map(img => img.url),
        avatarImage: avatarImagePath
      })

      const newDescription = descriptionResponse.data.description
      setProductDescription(newDescription)

      const imagesResponse = await axios.post('/api/runway/generate-avatar-images', {
        productDescription: newDescription,
        avatarImage: avatarImagePath,
        productImages: productImages.map(img => img.url)
      })

      
      if (imagesResponse.data.status === 'PROCESSING') {
        setGeneratedImages(imagesResponse.data.images)
        pollImageStatus(imagesResponse.data.images.map((img: any) => img.taskId))
      } else {
        setGeneratedImages(imagesResponse.data.images)
        setGeneratingImages(false)
      }

      // Decrement attempts and save to context immediately
      const newAttemptsRemaining = attemptsRemaining - 1;
      setAttemptsRemaining(newAttemptsRemaining);
      
      // Save updated attempts to context immediately
      const updatedProductVideoData: ProductVideoData = {
        includeProductVideo: true,
        ...adData.productVideoData,
        attemptsRemaining: newAttemptsRemaining,
        productImages: productImages.map(img => img.url),
        generatedImages,
        productDescription: newDescription || productDescription,
        selectedImageId,
        avatarId: selectedAvatar || undefined
      };
      setAdData({ productVideoData: updatedProductVideoData });
    } catch (error: any) {
      console.error('Error in combined generation:', error)
      setError(error.response?.data?.error || 'Failed to generate description and images')
      setGeneratingImages(false)
    }
  }

  const pollImageStatus = async (taskIds: string[]) => {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    const poll = async () => {
      attempts++

      try {
        const response = await axios.post('/api/runway/check-image-status', {
          taskIds
        })

        
        // Only update images if they've changed to prevent flickering
        setGeneratedImages(prevImages => {
          const newImages = response.data.images
          const hasChanged = newImages.some((newImg: any, index: number) => {
            const prevImg = prevImages[index]
            return !prevImg || prevImg.url !== newImg.url || prevImg.status !== newImg.status
          })
          
          if (hasChanged) {
            // Save updated images to context immediately
            const updatedProductVideoData: ProductVideoData = {
              includeProductVideo: true,
              ...adData.productVideoData,
              generatedImages: newImages,
              productImages: productImages.map(img => img.url),
              attemptsRemaining,
              avatarId: selectedAvatar || undefined
            };
            setAdData({ productVideoData: updatedProductVideoData });
          }
          
          return hasChanged ? newImages : prevImages
        })
        
        if (response.data.status === 'COMPLETED') {
          setGeneratingImages(false)
          return
        } else if (response.data.status === 'FAILED') {
          setError(`Image generation failed: ${response.data.failed} failed`)
          setGeneratingImages(false)
          return
        } else if (attempts >= maxAttempts) {
          setError('Timeout: Image generation took too long')
          setGeneratingImages(false)
          return
        } else {
          setTimeout(poll, 5000)
        }
      } catch (error: any) {
        console.error('Error checking status:', error)
        if (attempts >= maxAttempts) {
          setError('Failed to check image status')
          setGeneratingImages(false)
          return
        } else {
          setTimeout(poll, 5000)
        }
      }
    }

    poll()
  }

  const handleImageLoad = (imageId: string) => {
    setFadingImages(prev => {
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
  }

  const handleParticleFadeComplete = (imageId: string) => {
    setFadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  const generateVideo = async () => {
    if (!selectedImageId) {
      setError('Please select an image first')
      return
    }

    const selectedImage = generatedImages.find(img => img.id === selectedImageId)
    if (!selectedImage) {
      setError('Selected image not found')
      return
    }

    setGeneratingVideo(true)
    setError('')

    try {
      const response = await axios.post('/api/runway/generate-avatar-video', {
        imageUrl: selectedImage.url,
        productDescription
      })

      pollVideoStatus(response.data.taskId)
    } catch (error: any) {
      console.error('Error generating video:', error)
      setError(error.response?.data?.error || 'Failed to generate video')
      setGeneratingVideo(false)
    }
  }

  const pollVideoStatus = async (taskId: string) => {
    try {
      const response = await axios.get(`/api/runway/task-status/${taskId}`)
      
      if (response.data.status === 'SUCCEEDED') {
        const generatedVideoUrl = response.data.output[0]
        setFinalVideoUrl(generatedVideoUrl)
        
        // Store the concatenated video URL in adData for use in template
        try {
          const selectedAvatarData = avatars.find(avatar => avatar.id === selectedAvatar)
          // Generate avatar key from the src filename without extension
          const avatarId = selectedAvatarData 
            ? selectedAvatarData.src.split('/').pop()?.replace('.mp4', '') 
            : 'female-blonde5-adult-inside-new'
          
          const concatResponse = await axios.post('/api/video/concatenate', {
            generatedVideoUrl,
            avatarId
          })
          
          if (concatResponse.data.success) {
            const apiVideoUrl = `/api/serve-video${concatResponse.data.videoUrl}`
            setConcatenatedVideoUrl(apiVideoUrl)
            
            // Store in adData for template use
            setAdData({
              productVideoUrl: apiVideoUrl
            })
            
          } else {
            setError('Failed to concatenate videos')
          }
        } catch (concatError: any) {
          console.error('Error concatenating videos:', concatError)
          setError('Video generation completed but concatenation failed')
        }
        
        setGeneratingVideo(false)
      } else if (response.data.status === 'FAILED') {
        setError('Video generation failed')
        setGeneratingVideo(false)
      } else {
        setTimeout(() => pollVideoStatus(taskId), 5000)
      }
    } catch (error) {
      console.error('Error checking video status:', error)
      setError('Failed to check video status')
      setGeneratingVideo(false)
    }
  }

  // Enhanced filtering with all filters
  const filteredAvatars = avatars.filter(a => {
    // Gender filter
    if (gender && a.gender !== gender) return false;
    
    // Age filter  
    if (age && a.age !== age) return false;
    
    // Plan filter (premium/free) - null means no filter applied
    if (planFilter === 'free' && !isAvatarFree(a.id)) return false;
    if (planFilter === 'premium' && isAvatarFree(a.id)) return false;
    
    // Product holding filter - null means no filter applied
    if (productFilter === 'canHold' && !a.canHoldProducts) return false;
    if (productFilter === 'cannotHold' && a.canHoldProducts) return false;
    
    return true;
  });

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedAvatarsCount(8);
  }, [gender, age, planFilter, productFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && displayedAvatarsCount < filteredAvatars.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayedAvatarsCount(prev => Math.min(prev + 8, filteredAvatars.length));
            setLoadingMore(false);
          }, 500); // Small delay for smooth loading
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadingMore, displayedAvatarsCount, filteredAvatars.length]);

  // Show product holding popup on first visit
  useEffect(() => {
    const hasSeenProductHoldingPopup = localStorage.getItem('hasSeenProductHoldingPopup');
    if (!hasSeenProductHoldingPopup) {
      setShowProductHoldingPopup(true);
    }
  }, []);

  const handleAvatarSelect = (avatarId: number) => {
    // Check if avatar is premium and user is on free plan
    if (isFreePlan && !isAvatarFree(avatarId)) {
      setShowUpgradeModal(true);
      return;
    }
    
    // If changing to a different avatar, clear existing product video
    if (selectedAvatar !== null && selectedAvatar !== avatarId && adData.productVideoUrl) {
      setAdData({ productVideoUrl: '' });
      setConcatenatedVideoUrl('');
      setFinalVideoUrl('');
    }
    
    setSelectedAvatar(avatarId);
  };


  const handleNext = async () => {
    if (selectedAvatar !== null) {
      // Additional validation for free users
      if (isFreePlan && !isAvatarFree(selectedAvatar)) {
        setShowUpgradeModal(true);
        return;
      }
      
      // If product video is selected, deduct credits first
      if (includeProductVideo && selectedImageId) {
        try {
          const response = await axios.post('/api/user/deduct-credits', {
            credits: 10,
            reason: 'Avatar Product Video generation'
          });
          
          if (!response.data.success) {
            toast.error('Failed to deduct credits for product video');
            return;
          }
          
          
          // Trigger credits refresh in the UI
          window.dispatchEvent(new CustomEvent('credits-updated', {
            detail: { credits: response.data.remainingCredits }
          }));
          
        } catch (error: any) {
          console.error('Credit deduction error:', error);
          if (error.response?.status === 400) {
            toast.error(error.response.data.error || 'Insufficient credits for product video');
          } else {
            toast.error('Failed to process credit deduction. Please try again.');
          }
          return;
        }
      }
      
      // Store product video options in context
      const productVideoData = includeProductVideo && selectedImageId ? {
        includeProductVideo: true,
        selectedImageId,
        productDescription,
        productImages: productImages.map(img => img.url),
        generatedImages, // Also store generated images for restoration
        attemptsRemaining, // Store remaining attempts
        avatarId: selectedAvatar || undefined
      } : {
        includeProductVideo: false,
        selectedImageId: '',
        productDescription: '',
        productImages: [],
        generatedImages: [],
        attemptsRemaining: 2, // Reset to default when not using product video
        avatarId: selectedAvatar || undefined
      };
      
      // If user unchecked product video, clear the existing product video URL
      const updatedAdData: any = { 
        avatarId: selectedAvatar || undefined,
        productVideoData
      };
      
      if (!includeProductVideo) {
        // Clear product video URL if user unchecked the option
        updatedAdData.productVideoUrl = '';
      }
      
      setAdData(updatedAdData);
      
      router.push('/ad/template');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation - Moved to top */}
        <div className="flex justify-between mb-8">
          <button
            className="flex btn-secondary"
            onClick={() => router.back()}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            className={`btn-primary ${selectedAvatar === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={selectedAvatar === null}
          >
            Next: Choose Template
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose Avatar</h1>
          <p className="text-gray-400">Select the AI avatar that will present your video</p>
          
          {/* Audio Generation Status */}
          {isGeneratingAudio && (
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <BarLoader size="sm" />
                <span className="text-orange-400 text-sm">Generating audio for your selected script...</span>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Product Video Section - Available to all users */}
        {selectedAvatar !== null && (
          <div className="mb-8">
            <div className="bg-gray-900 rounded-[20px] p-6 border border-orange-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 rounded-full p-2 border border-orange-500">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-white">Make avatars hold your product</h3>
                    {isFreePlan && (
                      <span className="bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-1 text-xs text-orange-400 font-regular">
                        Premium Feature
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">Generate custom videos of your avatar holding and presenting your product</p>
                </div>
                <button
                  onClick={() => {
                    if (isFreePlan) {
                      setShowProductVideoUpgradeModal(true);
                    } else if (avatars.find(a => a.id === selectedAvatar)?.canHoldProducts) {
                      setShowProductVideo(!showProductVideo);
                    } else {
                      setShowUpgradeModal(true);
                    }
                  }}
                  className="ml-auto btn-secondary"
                >
                  {(!isFreePlan && showProductVideo) ? 'Hide' : 'Create'} product video
                </button>
              </div>

              {showProductVideo && !isFreePlan && avatars.find(a => a.id === selectedAvatar)?.canHoldProducts && (
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-900/50 border border-red-500 rounded-[20px] p-4">
                      <p className="text-red-200">{error}</p>
                    </div>
                  )}

                  {/* Upload Product Images */}
                  <div className="bg-gray-900 rounded-[20px] p-6">
                    <h4 className="text-xl font-semibold text-white mb-4">Upload two product images</h4>
                    <div className="flex flex-wrap gap-4">
                      {productImages.map((image, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={image.url}
                            alt={`Product ${i + 1}`}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <button
                            className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => removeProductImage(i)}
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {productImages.length < 2 && (
                        <button 
                          className={`w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors ${
                            uploadingImages ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 hover:text-orange-400'
                          }`}
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImages}
                        >
                        {uploadingImages ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        ) : (
                          <>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs">Upload</span>
                          </>
                        )}
                        </button>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        hidden 
                        ref={imageInputRef} 
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                    </div>
                  </div>

                  {/* Generate First Frame */}
                  {productImages.length > 0 && (
                    <div className="bg-gray-900 rounded-[20px] p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            className={`btn-primary gap-3 ${
                              !generatingImages && attemptsRemaining > 0
                                ? 'btn-primary' 
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                            onClick={generateImagesWithDescription}
                            disabled={generatingImages || attemptsRemaining <= 0}
                          >
                            {generatingImages ? (
                              <>
                                <BarLoader size="xs" />
                                Generating first frame...
                              </>
                            ) : (
                              <>
                                Generate first frame
                                <img src="/ai-star.svg" alt="AI" className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="bg-black px-3 py-2 rounded-lg text-sm font-regular text-white">
                          {attemptsRemaining} attempts
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generated Images Section */}
                  {generatedImages.length > 0 && (
                    <div className="bg-gray-900 rounded-[20px] p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Choose your preferred image:</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {generatedImages.map((image) => (
                          <div 
                            key={image.id}
                            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                              image.url && selectedImageId === image.id
                                ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25'
                                : 'border border-gray-700 hover:border-orange-500/50'
                            } ${image.url ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            onClick={() => image.url && setSelectedImageId(image.id)}
                          >
                            <div className="w-full bg-gray-800 relative overflow-hidden" style={{ aspectRatio: '9/16' }}>
                              {(!image.url || fadingImages.has(image.id)) && (
                                <div className="absolute inset-0 z-30">
                                  <SimpleLoader 
                                    width={40}
                                    fadeOut={fadingImages.has(image.id)}
                                    onFadeComplete={() => handleParticleFadeComplete(image.id)}
                                  />
                                </div>
                              )}
                              {image.url && (
                                <img
                                  src={image.url}
                                  alt={`Generated avatar ${image.id}`}
                                  className="w-full h-full object-contain bg-gray-900 absolute inset-0 z-10"
                                  onLoad={() => handleImageLoad(image.id)}
                                />
                              )}
                            </div>
                            {image.url && selectedImageId === image.id && (
                              <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                                  ✓
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Include Product Video Option */}
                  {selectedImageId && (
                    <div className="bg-gray-900 rounded-[20px] p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">Product Video Options</h3>
                      
                      <div className="flex items-start gap-4">
                        <div className="relative mt-1">
                          <input 
                            type="checkbox" 
                            id="includeProductVideo"
                            checked={includeProductVideo}
                            onChange={(e) => handleProductVideoToggle(e.target.checked)}
                            className="sr-only"
                          />
                          <label htmlFor="includeProductVideo" className="flex items-center cursor-pointer">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              includeProductVideo 
                                ? 'bg-orange-500 border-orange-500' 
                                : 'bg-transparent border-gray-600 hover:border-orange-500'
                            }`}>
                              {includeProductVideo && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </label>
                        </div>
                        <div className="flex-1">
                          <label htmlFor="includeProductVideo" className="text-white font-normal cursor-pointer">
                            Include avatar holding product video
                          </label>
                          <p className="text-gray-400 text-sm mt-1">
                            This will show your avatar holding the product at the beginning of the video
                          </p>
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <img src="/credits.svg" style={{ width: 'auto', height: '15px' }} alt="Credits" />
                            <span className="text-white text-sm font-medium">Costs 10 credits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-[20px] p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filter Avatars</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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

            {/* Plan Filter */}
            <div>
              <label className="block text-gray-300 font-normal mb-3">Plan</label>
              <div className="flex gap-2 flex-wrap">
                {(['free', 'premium'] as const).map(opt => (
                  <button
                    key={opt}
                    className={`px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 transition-colors duration-200 ${
                      planFilter === opt
                        ? 'border-orange-500 text-orange-500'
                        : 'hover:border-orange-500'
                    }`}
                    style={{ backgroundColor: '#111827' }}
                    onClick={() => setPlanFilter(planFilter === opt ? null : opt)}
                    type="button"
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-gray-300 font-normal mb-3">Product Holding</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'canHold', label: 'Can Hold' },
                  { value: 'cannotHold', label: 'Cannot Hold' }
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    className={`px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 transition-colors duration-200 ${
                      productFilter === value
                        ? 'border-orange-500 text-orange-500'
                        : 'hover:border-orange-500'
                    }`}
                    style={{ backgroundColor: '#111827' }}
                    onClick={() => setProductFilter(productFilter === value ? null : value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-[20px] p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Available Avatars
            <span className="text-gray-400 text-sm font-normal ml-2">
              ({filteredAvatars.length} of {avatars.length})
            </span>
          </h2>

          {avatarsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="relative rounded-[20px] overflow-hidden border border-gray-700">
                    {/* Avatar video skeleton */}
                    <div className="aspect-[9/16] bg-gray-800">
                      {/* Overlay elements skeleton */}
                      <div className="absolute bottom-2 right-2 bg-gray-700 rounded-lg p-2 flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        <div className="h-3 bg-gray-600 rounded w-12"></div>
                      </div>
                      <div className="absolute top-2 left-2 bg-gray-700 rounded-lg px-2 py-1 flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        <div className="h-3 bg-gray-600 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAvatars.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <img src="/avatar.svg" alt="Avatar" className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">No avatars match the selected filters</p>
                <p className="text-sm">Try adjusting your filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAvatars.slice(0, displayedAvatarsCount).map(avatar => {
                const isPremium = !isAvatarFree(avatar.id);
                const isLocked = isFreePlan && isPremium;
                
                return (
                <div
                  key={avatar.id}
                  className={`relative rounded-[20px] overflow-hidden transition-all duration-300 ${
                    isLocked 
                      ? 'cursor-pointer' 
                      : 'cursor-pointer'
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
                      }}
                      onCanPlay={e => {
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

                  {/* Can Hold Products Banner */}
                  {canAvatarHoldProducts(avatar.id) && !isLocked && (
                    <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 pointer-events-none">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      <span className="text-white text-xs font-regular">can hold products</span>
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

          {/* Infinite Scroll Load More Indicator */}
          {displayedAvatarsCount < filteredAvatars.length && (
            <div ref={loadMoreRef} className="py-8">
              {loadingMore ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(Math.min(8, filteredAvatars.length - displayedAvatarsCount))].map((_, i) => (
                    <div key={`loading-${i}`} className="relative rounded-[20px] overflow-hidden border border-gray-700">
                      <div className="aspect-[9/16] bg-gray-800 flex items-center justify-center">
                        <BarLoader size="lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 text-sm">
                    Showing {displayedAvatarsCount} of {filteredAvatars.length} avatars
                  </div>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Premium Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-gray-700 rounded-[20px] p-8 max-w-md w-full mx-4">
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
              <div className="bg-black rounded-lg p-4 mb-6">
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

        {/* Premium Product Video Upgrade Modal */}
        {showProductVideoUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2937] border border-gray-700 rounded-[20px] p-8 max-w-md w-full mx-4">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500">
                  <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-semibold text-white text-center mb-3">
                Premium Feature
              </h3>
              
              {/* Message */}
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                This feature is part of our premium collection. Upgrade to any paid plan to unlock <strong>avatar product videos</strong> and create unlimited videos.
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
                    Avatar product holding videos
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
                  onClick={() => window.open('https://bestugc.ai/subscription', '_blank')}
                  className="btn-primary w-full"
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => setShowProductVideoUpgradeModal(false)}
                  className="btn-secondary w-full"
                >
                  Continue with Basic Features
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Holding Feature Popup */}
        {showProductHoldingPopup && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-[25px] border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Close button */}
                <button
                  onClick={() => {
                    localStorage.setItem('hasSeenProductHoldingPopup', 'true');
                    setShowProductHoldingPopup(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    🎉 New Feature: Avatars Can Hold Products!
                  </h2>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                    Your AI avatars can now showcase your products naturally by holding them in their hands!
                  </p>
                </div>

                {/* Video Demo */}
                <div className="mb-8 rounded-[20px] overflow-hidden border border-gray-700">
                  <video
                    className="w-full h-auto"
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src="/landing-page-content/product-holding.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Description */}
                <div className="space-y-6 mb-8">
                  <div className="bg-black/50 rounded-[15px] p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">How it works:</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">1</span>
                        </div>
                        <div>
                          <div className="font-medium text-white mb-1">Upload Product Image</div>
                          <div>Upload a clear image of your product with transparent or simple background</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">2</span>
                        </div>
                        <div>
                          <div className="font-medium text-white mb-1">Select First Frame</div>
                          <div>Choose how the avatar should hold your product in the opening scene</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">3</span>
                        </div>
                        <div>
                          <div className="font-medium text-white mb-1">Generate Video</div>
                          <div>AI creates a natural-looking video with your avatar holding the product</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      localStorage.setItem('hasSeenProductHoldingPopup', 'true');
                      setShowProductHoldingPopup(false);
                    }}
                    className="btn-primary px-8 py-4 text-lg font-medium"
                  >
                    Start Creating with Product Holding
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
        destination: '/auth/signin?callbackUrl=' + encodeURIComponent('/ad/avatar'),
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

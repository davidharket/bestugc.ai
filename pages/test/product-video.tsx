import { useRouter } from 'next/router'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import SimpleLoader from '../../components/SimpleLoader'

interface UploadedImage {
  url: string
  file?: File // Make optional for localStorage compatibility
}

interface GeneratedImage {
  id: string
  url: string | null
  taskId?: string
  status?: string
  selected?: boolean
}

export default function ProductVideoTest() {
  const router = useRouter()
  
  // State for avatar selection
  const [selectedAvatar, setSelectedAvatar] = useState<string>('')
  
  // State for uploaded product images
  const [productImages, setProductImages] = useState<UploadedImage[]>([])
  const [uploadingImages, setUploadingImages] = useState<boolean>(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  // State for AI generation
  const [productDescription, setProductDescription] = useState<string>('')
  const [generatingDescription, setGeneratingDescription] = useState<boolean>(false)
  
  // State for generated avatar images
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generatingImages, setGeneratingImages] = useState<boolean>(false)
  const [selectedImageId, setSelectedImageId] = useState<string>('')
  
  // State for particle fade tracking
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set())
  
  // State for attempt tracking
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(2)
  
  // State for video generation
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('')
  const [concatenatedVideoUrl, setConcatenatedVideoUrl] = useState<string>('')
  const [videoTaskId, setVideoTaskId] = useState<string>('')
  
  // Error states
  const [error, setError] = useState<string>('')

  // Available avatars
  const availableAvatars = [
    { 
      id: 'female-blonde5-adult-inside-new', 
      path: '/avatar-img/female-blonde5-adult-inside-new.png', 
      name: 'Blonde Female (Adult)' 
    },
    { 
      id: 'female-blonde-inside-new', 
      path: '/avatar-img/female-blonde-inside-new.png', 
      name: 'Blonde Female' 
    },
    { 
      id: 'female-blonde4-adult-inside-new', 
      path: '/avatar-img/female-blonde4-adult-inside-new.png', 
      name: 'Blonde Female 4 (Adult)' 
    },
    { 
      id: 'female-brunette-inside-new', 
      path: '/avatar-img/female-brunette-inside-new.png', 
      name: 'Brunette Female' 
    },
    { 
      id: 'male-brunette-adult-inside-new', 
      path: '/avatar-img/male-brunette-adult-inside-new.png', 
      name: 'Brunette Male (Adult)' 
    },
    { 
      id: 'male-brunette2-adult-inside-new', 
      path: '/avatar-img/male-brunette2-adult-inside-new.png', 
      name: 'Brunette Male 2 (Adult)' 
    },
    { 
      id: 'male-brunette3-adult-inside-new', 
      path: '/avatar-img/male-brunette3-adult-inside-new.png', 
      name: 'Brunette Male 3 (Adult)' 
    }
  ]

  // Storage key for persistence
  const STORAGE_KEY = 'product-video-test-state'

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const parsed = JSON.parse(savedState)
          if (parsed.selectedAvatar) setSelectedAvatar(parsed.selectedAvatar)
          if (parsed.productImages) setProductImages(parsed.productImages)
          if (parsed.productDescription) setProductDescription(parsed.productDescription)
          if (parsed.generatedImages) setGeneratedImages(parsed.generatedImages)
          if (parsed.selectedImageId) setSelectedImageId(parsed.selectedImageId)
          if (parsed.finalVideoUrl) setFinalVideoUrl(parsed.finalVideoUrl)
          if (parsed.concatenatedVideoUrl) setConcatenatedVideoUrl(parsed.concatenatedVideoUrl)
          if (parsed.videoTaskId) setVideoTaskId(parsed.videoTaskId)
          if (parsed.attemptsRemaining !== undefined) setAttemptsRemaining(parsed.attemptsRemaining)
        }
      } catch (error) {
        console.warn('Failed to load saved state:', error)
      }
    }
  }, [])

  // Save state to localStorage whenever key states change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stateToSave = {
          selectedAvatar,
          productImages: productImages.map(img => ({ url: img.url })), // Remove File objects
          productDescription,
          generatedImages,
          selectedImageId,
          finalVideoUrl,
          concatenatedVideoUrl,
          videoTaskId,
          attemptsRemaining
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      } catch (error) {
        console.warn('Failed to save state:', error)
      }
    }
  }, [selectedAvatar, productImages, productDescription, generatedImages, selectedImageId, finalVideoUrl, concatenatedVideoUrl, videoTaskId, attemptsRemaining])

  // Resume video polling if there's a taskId but no video URL
  useEffect(() => {
    if (videoTaskId && !finalVideoUrl && !generatingVideo) {
      setGeneratingVideo(true)
      pollVideoStatus(videoTaskId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoTaskId, finalVideoUrl])

  // Handle particle fade when image loads - wait 1 second before starting fade
  const handleImageLoad = (imageId: string) => {
    setTimeout(() => {
      setFadingImages(prev => new Set(prev).add(imageId))
    }, 1000)
  }

  const handleParticleFadeComplete = (imageId: string) => {
    setFadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  // Clear all state
  const clearAllState = () => {
    setSelectedAvatar('')
    setProductImages([])
    setProductDescription('')
    setGeneratedImages([])
    setSelectedImageId('')
    setFinalVideoUrl('')
    setConcatenatedVideoUrl('')
    setVideoTaskId('')
    setFadingImages(new Set())
    setAttemptsRemaining(2)
    setError('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

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
      setProductImages(prev => [...prev, ...uploadedImages])
    } catch (error) {
      console.error('Error uploading images:', error)
      setError('Failed to upload images. Please try again.')
    } finally {
      setUploadingImages(false)
    }
  }

  const generateProductDescription = async () => {
    if (!selectedAvatar) {
      setError('Please select an avatar first')
      return
    }
    if (productImages.length < 1) {
      setError('Please upload at least 1 product image first')
      return
    }

    setGeneratingDescription(true)
    setError('')

    try {
      const selectedAvatarData = availableAvatars.find(avatar => avatar.id === selectedAvatar)
      const response = await axios.post('/api/ai/generate-product-description', {
        images: productImages.map(img => img.url),
        avatarImage: selectedAvatarData?.path || '/avatar-img/female-blonde5-adult-inside-new.png'
      })

      setProductDescription(response.data.description)
    } catch (error: any) {
      console.error('Error generating description:', error)
      setError(error.response?.data?.error || 'Failed to generate product description')
    } finally {
      setGeneratingDescription(false)
    }
  }

  // Combined function to generate description and then images
  const generateImagesWithDescription = async (isRetry: boolean = false) => {
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
    
    // Clear previous results if retrying
    if (isRetry) {
      setGeneratedImages([])
      setSelectedImageId('')
      setFadingImages(new Set())
    }

    try {
      // Use default avatar if none selected
      const selectedAvatarData = availableAvatars.find(avatar => avatar.id === selectedAvatar) || availableAvatars[0]
      console.log('Generating product description...')
      
      const descriptionResponse = await axios.post('/api/ai/generate-product-description', {
        images: productImages.map(img => img.url),
        avatarImage: selectedAvatarData.path
      })

      const newDescription = descriptionResponse.data.description
      setProductDescription(newDescription)
      console.log('Description generated, now generating images...')

      // Step 2: Generate avatar images using the new description
      const imagesResponse = await axios.post('/api/runway/generate-avatar-images', {
        productDescription: newDescription,
        avatarImage: selectedAvatarData.path,
        productImages: productImages.map(img => img.url)
      })

      console.log('Frontend received images response:', imagesResponse.data)
      
      if (imagesResponse.data.status === 'PROCESSING') {
        setGeneratedImages(imagesResponse.data.images)
        // Start polling for completion
        pollImageStatus(imagesResponse.data.images.map((img: any) => img.taskId))
      } else {
        setGeneratedImages(imagesResponse.data.images)
        setGeneratingImages(false)
      }

      // Decrement attempts
      setAttemptsRemaining(prev => prev - 1)
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

        console.log('Status check response:', response.data)
        
        // Only update images if they've changed to prevent flickering
        setGeneratedImages(prevImages => {
          const newImages = response.data.images
          // Check if any image has actually changed
          const hasChanged = newImages.some((newImg: any, index: number) => {
            const prevImg = prevImages[index]
            return !prevImg || prevImg.url !== newImg.url || prevImg.status !== newImg.status
          })
          
          return hasChanged ? newImages : prevImages
        })
        
        if (response.data.status === 'COMPLETED') {
          setGeneratingImages(false)
          // Stop polling - images are complete
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
          // Continue polling only if not complete
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error: any) {
        console.error('Error checking status:', error)
        if (attempts >= maxAttempts) {
          setError('Failed to check image status')
          setGeneratingImages(false)
          return
        } else {
          // Retry status check
          setTimeout(poll, 5000)
        }
      }
    }

    poll()
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

      setVideoTaskId(response.data.taskId)
      
      // Poll for video completion
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
        console.log('Generated video URL received:', generatedVideoUrl)
        setFinalVideoUrl(generatedVideoUrl)
        
        // Automatically concatenate with avatar video
        try {
          console.log('Starting video concatenation...')
          // Use selected avatar or default to first avatar
          const avatarId = selectedAvatar || availableAvatars[0]?.id || 'female-blonde5-adult-inside-new'
          const concatResponse = await axios.post('/api/video/concatenate', {
            generatedVideoUrl,
            avatarId
          })
          
          if (concatResponse.data.success) {
            // Convert to API serve URL format
            const apiVideoUrl = `/api/serve-video${concatResponse.data.videoUrl}`
            setConcatenatedVideoUrl(apiVideoUrl)
            console.log('Video concatenation completed:', apiVideoUrl)
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
        // Still processing, poll again in 5 seconds
        setTimeout(() => pollVideoStatus(taskId), 5000)
      }
    } catch (error) {
      console.error('Error checking video status:', error)
      setError('Failed to check video status')
      setGeneratingVideo(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Avatar Product Video Test</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Avatar Product Video Test</h1>
            <p className="text-gray-400">Test the avatar holding product video generation pipeline</p>
          </div>
          <button
            onClick={clearAllState}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
            <div className="text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Upload Product Images */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Upload product image (max 2)
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {productImages.map((image, i) => (
                <div key={i} className="relative">
                  <img
                    src={image.url}
                    alt={`Product ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
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
        </div>

        {/* Generate First Frame */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className={`btn-primary gap-3 ${
                  productImages.length >= 1 && !generatingImages && attemptsRemaining > 0
                    ? 'btn-primary' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => generateImagesWithDescription(false)}
                disabled={productImages.length < 1 || generatingImages || attemptsRemaining <= 0}
              >
                {generatingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* Generated Images Section - Only show when images exist */}
        {generatedImages.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
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

        {/* Generate Video Section - Only show when image is selected */}
        {selectedImageId && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Generate video and continue</h3>
            
            <button
              className={`btn-primary ${
                !generatingVideo
                  ? 'btn-primary' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={generateVideo}
              disabled={generatingVideo}
            >
              {generatingVideo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Generating video...
                </>
              ) : (
                'Generate video and continue'
              )}
            </button>
            
            {videoTaskId && generatingVideo && (
              <div className="mt-4 bg-gray-800 rounded-lg relative overflow-hidden" style={{ height: '150px' }}>
                <SimpleLoader 
                  fadeOut={false}
                />
              </div>
            )}
            
            {concatenatedVideoUrl && (
              <div className="mt-4">
                <h4 className="font-medium mb-4">Final Video:</h4>
                <video 
                  src={concatenatedVideoUrl}
                  controls
                  autoPlay
                  className="w-full max-w-xs rounded-lg"
                />
                <div className="mt-2">
                  <a 
                    href={concatenatedVideoUrl}
                    download="final-avatar-video.mp4"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download Final Video
                  </a>
                </div>
              </div>
            )}
            
            {finalVideoUrl && !concatenatedVideoUrl && (
              <div className="mt-4">
                <h4 className="font-medium mb-4">Generated Video (Product Scene Only):</h4>
                <video 
                  src={finalVideoUrl}
                  controls
                  className="w-full max-w-xs rounded-lg"
                />
                <p className="text-sm text-gray-400 mt-2">Concatenation in progress...</p>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-start">
          <button 
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => router.push('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

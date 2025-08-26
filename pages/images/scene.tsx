import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import BarLoader from '../../components/BarLoader'
import SimpleLoader from '../../components/SimpleLoader'

export default function ImageScene() {
  const router = useRouter()
  const { data: session } = useSession()
  const [sceneDescription, setSceneDescription] = useState('')
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [enhancedDescription, setEnhancedDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string | null, status?: string, taskId?: string}>>([])
  const [selectedImageId, setSelectedImageId] = useState('')
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set())
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [imageFormat, setImageFormat] = useState<string>('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/images/scene'))
      return
    }

    // Get stored format from session storage
    const storedFormat = sessionStorage.getItem('imageFormat')
    if (storedFormat) {
      setImageFormat(storedFormat)
    } else {
      // If no format stored, redirect back to format selection
      router.push('/images/format')
      return
    }

    // Fetch user credits
    fetchUserCredits()
  }, [session, router])

  const fetchUserCredits = async () => {
    if (session?.user?.id) {
      try {
        const response = await axios.get('/api/user/credits')
        setUserCredits(response.data.credits || 0)
      } catch (error) {
        console.error('Failed to fetch user credits:', error)
      }
    }
  }

  // Auto-enhance description when AI enhancement is enabled (but don't update visible text)
  useEffect(() => {
    if (aiEnhanced && sceneDescription.trim() && userCredits !== null && userCredits >= 5) {
      const enhanceDescription = async () => {
        try {
          const response = await axios.post('/api/ai/enhance-scene-description', {
            description: sceneDescription
          })
          
          const enhanced = response.data.enhancedDescription
          if (enhanced && enhanced.length <= 1000) {
            setEnhancedDescription(enhanced)
            setUserCredits(prev => prev !== null ? prev - 5 : null)
          }
        } catch (error: any) {
          console.error('Error enhancing description:', error)
        }
      }
      
      // Debounce the enhancement to avoid too many calls
      const timeoutId = setTimeout(enhanceDescription, 1000)
      return () => clearTimeout(timeoutId)
    } else if (!aiEnhanced) {
      // Clear enhanced description when AI enhancement is disabled
      setEnhancedDescription('')
    }
  }, [aiEnhanced, sceneDescription, userCredits])

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

  const generateSceneImages = async () => {
    if (!sceneDescription.trim()) {
      return
    }

    if (userCredits !== null && userCredits < 5) {
      return
    }

    if (sceneDescription.length > 1000) {
      return
    }

    setIsGenerating(true)
    try {
      // First, deduct credits
      try {
        const creditResponse = await axios.post('/api/user/deduct-credits', {
          credits: 5,
          reason: 'Scene image generation'
        })
        
        if (!creditResponse.data.success) {
          setIsGenerating(false)
          return
        }
        
        // Update local credit count
        setUserCredits(prev => prev !== null ? prev - 5 : null)
      } catch (error: any) {
        console.error('Error deducting credits:', error)
        setIsGenerating(false)
        if (error.response?.status === 400) {
          // Insufficient credits handled by API error
        } else {
          console.error('Failed to process credit deduction. Please try again.')
        }
        return
      }

      // Use enhanced description if available, otherwise use original
      const descriptionToSend = aiEnhanced && enhancedDescription ? enhancedDescription : sceneDescription
      
      const response = await axios.post('/api/runway/generate-scene-images', {
        description: descriptionToSend,
        aspectRatio: imageFormat,
        count: 4
      })

      if (response.data.images) {
        // Set the pending images and start polling for completion
        setGeneratedImages(response.data.images)
        
        if (response.data.status === 'PROCESSING') {
          setGeneratedImages(response.data.images)
          pollImageStatus(response.data.images.map((img: any) => img.taskId))
        } else {
          setGeneratedImages(response.data.images)
          setIsGenerating(false)
        }
      }
    } catch (error: any) {
      console.error('Error generating images:', error)
      setIsGenerating(false)
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
          
          return hasChanged ? newImages : prevImages
        })
        
        if (response.data.status === 'COMPLETED') {
          setIsGenerating(false)
          return
        } else if (response.data.status === 'FAILED') {
          setIsGenerating(false)
          return
        } else if (attempts >= maxAttempts) {
          setIsGenerating(false)
          return
        } else {
          setTimeout(poll, 5000)
        }
      } catch (error: any) {
        console.error('Error checking status:', error)
        if (attempts >= maxAttempts) {
          setIsGenerating(false)
          return
        } else {
          setTimeout(poll, 5000)
        }
      }
    }

    poll()
  }

  const handleContinue = () => {
    if (!selectedImageId) {
      return
    }

    // Store selected scene data in session storage
    const selectedImage = generatedImages.find(img => img.id === selectedImageId)
    if (selectedImage) {
      sessionStorage.setItem('selectedSceneImage', JSON.stringify(selectedImage))
      sessionStorage.setItem('sceneDescription', sceneDescription)
      // Store enhanced description and AI enhancement status
      sessionStorage.setItem('enhancedDescription', enhancedDescription || '')
      sessionStorage.setItem('aiEnhanced', aiEnhanced.toString())
      router.push('/images/product')
    }
  }

  if (!session || !imageFormat) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const canGenerate = userCredits !== null && userCredits >= 5

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Describe Your Scene</h1>
          <p className="text-gray-400">Describe the scene where you want to showcase your product ({imageFormat} format)</p>
        </div>

        {/* Scene Description Input */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Scene Description</label>
          <textarea
            className="input w-full min-h-[120px] mb-4"
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder="Describe the scene for your product, e.g., 'A modern minimalist kitchen with marble countertops and soft natural lighting'"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{sceneDescription.length}/1000 characters</span>
            </div>
            
            {/* AI Enhancement Option */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="aiEnhanced"
                  checked={aiEnhanced}
                  onChange={(e) => setAiEnhanced(e.target.checked)}
                  className="sr-only"
                />
                <label htmlFor="aiEnhanced" className="flex items-center cursor-pointer">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    aiEnhanced 
                      ? 'bg-orange-500 border-orange-500' 
                      : 'bg-transparent border-gray-600 hover:border-orange-500'
                  }`}>
                    {aiEnhanced && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 text-white">AI-Enhanced</span>
                </label>
              </div>
              
            </div>
          </div>
          
          {/* Generate Scene Images Button */}
          <div className="flex items-center justify-between">
            <button
              className={`btn-primary ${
                !canGenerate || !sceneDescription.trim() || isGenerating
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={generateSceneImages}
              disabled={!canGenerate || !sceneDescription.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <BarLoader size="xs" />
                  Generating Scene Images...
                </>
              ) : (
                <>
                  Generate Scene Images
                  <img src="/ai-star.svg" alt="AI" className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
              <img src="/credits.svg" style={{ width: 'auto', height: '15px' }} alt="Credits" />
              <span className="text-white text-sm font-medium">Costs 5 credits</span>
            </div>
          </div>
          
          {/* Insufficient Credits Warning */}
          {userCredits !== null && userCredits < 5 && (
            <div className="mt-4 bg-red-600/20 border border-red-600/40 rounded-[15px] p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-red-300">
                  <div className="font-medium text-sm mb-1">Insufficient Credits</div>
                  <div className="text-xs space-y-1">
                    <div>" You have {userCredits || 0} credits, but need 5 credits to generate scene images</div>
                    <div>" Please purchase more credits to continue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Choose Your Scene</h3>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((image) => (
                <div 
                  key={image.id}
                  className={`relative rounded-[15px] overflow-hidden group transition-all duration-200 ${
                    selectedImageId === image.id
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25'
                      : 'border border-gray-700 hover:border-orange-500/50'
                  } ${image.url ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => image.url && setSelectedImageId(image.id)}
                >
                  <div className="w-full bg-gray-800 relative overflow-hidden" style={{ aspectRatio: imageFormat.replace(':', '/') }}>
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
                      <>
                        <img
                          src={image.url}
                          alt={`Scene ${image.id}`}
                          className="w-full h-full object-cover absolute inset-0 z-10"
                          onLoad={() => handleImageLoad(image.id)}
                        />
                        {/* Eye icon for fullscreen view */}
                        <button
                          className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors z-20 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullscreenImage(image.url!)
                          }}
                          title="View fullscreen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {selectedImageId === image.id && image.url && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button 
            className="btn-secondary"
            onClick={() => router.push('/images/format')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Format Selection
          </button>
          <button 
            className={`btn-primary ${
              !selectedImageId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleContinue}
            disabled={!selectedImageId}
          >
            Continue to Product Upload
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fullscreenImage}
              alt="Fullscreen view"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-[20px]"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setFullscreenImage(null)
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

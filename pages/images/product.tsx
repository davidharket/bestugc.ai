import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import axios from 'axios'
import BarLoader from '../../components/BarLoader'
import SimpleLoader from '../../components/SimpleLoader'


const PremiumFeatureBlock = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8 bg-gray-900 border border-orange-500/30 rounded-[20px]">
        <img src="/lock-feature.svg" alt="Premium Feature" className="w-16 h-16 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-3">Premium Feature</h1>
        <p className="text-gray-400 mb-8">
          The AI Image Generation pipeline is an exclusive feature for our Pro and Premium subscribers. Upgrade your plan to create stunning product images.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/subscription" className="btn-primary">
            Upgrade to Pro
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

export default function ImageProduct() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [productImages, setProductImages] = useState<Array<{url: string, file: File}>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string | null, status?: string, taskId?: string}>>([])
  const [selectedImageId, setSelectedImageId] = useState('')
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set())
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [sceneData, setSceneData] = useState<{image: any, description: string} | null>(null)
  const [imageFormat, setImageFormat] = useState<string>('')
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [progressStep, setProgressStep] = useState<string>('')
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  
  const hasPremiumAccess = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM'

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/images/product'))
      return
    }

    if (session && !hasPremiumAccess) {
        return; // Render will be handled by the premium block check
    }

    // Get stored data from session storage
    const storedFormat = sessionStorage.getItem('imageFormat')
    const storedSceneImage = sessionStorage.getItem('selectedSceneImage')
    const storedSceneDescription = sessionStorage.getItem('sceneDescription')
    const storedEnhancedDescription = sessionStorage.getItem('enhancedDescription')
    const storedAiEnhanced = sessionStorage.getItem('aiEnhanced') === 'true'

    if (!storedFormat || !storedSceneImage || !storedSceneDescription) {
      // If missing data, redirect back to start
      router.push('/images/format')
      return
    }

    setImageFormat(storedFormat)
    // Show enhanced description if AI was used, otherwise show original
    const displayDescription = storedAiEnhanced && storedEnhancedDescription
      ? storedEnhancedDescription
      : storedSceneDescription

    setSceneData({
      image: JSON.parse(storedSceneImage),
      description: displayDescription
    })

    // Fetch user credits
    fetchUserCredits()
  }, [session, status, router, hasPremiumAccess])

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const totalImages = productImages.length + fileArray.length

    if (totalImages < 1 || totalImages > 2) {
      return
    }

    setUploadingImages(true)

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
    } finally {
      setUploadingImages(false)
    }
  }

  const removeProductImage = (indexToRemove: number) => {
    setProductImages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const generateProductImages = async () => {
    if (productImages.length < 1 || userCredits === null || userCredits < 5 || !sceneData) {
      return
    }

    setIsGenerating(true)
    setShowLoadingScreen(true)

    try {
      // First, deduct credits
      setProgressStep('Deducting credits...')
      try {
        const creditResponse = await axios.post('/api/user/deduct-credits', {
          credits: 5,
          reason: 'Product image generation'
        })

        if (!creditResponse.data.success) {
          setIsGenerating(false)
          setShowLoadingScreen(false)
          setProgressStep('')
          return
        }

        // Update local credit count
        setUserCredits(prev => prev !== null ? prev - 5 : null)
      } catch (error: any) {
        console.error('Error deducting credits:', error)
        setIsGenerating(false)
        setShowLoadingScreen(false)
        setProgressStep('')
        if (error.response?.status === 400) {
          // Insufficient credits handled by API error
        } else {
          console.error('Failed to process credit deduction. Please try again.')
        }
        return
      }

      // First, generate description of the product in the scene
      setProgressStep('Creating optimized scene description...')

      // Check if we're using a template
      const selectedTemplate = sessionStorage.getItem('selectedTemplate')
      const isTemplate = selectedTemplate && selectedTemplate !== ''

      const descriptionResponse = await axios.post('/api/ai/generate-product-scene-description', {
        productImages: productImages.map(img => img.url),
        sceneImage: sceneData.image.url,
        sceneDescription: sceneData.description,
        isTemplate: isTemplate
      })

      const productSceneDescription = descriptionResponse.data.description

      // Ensure description is under 1000 characters for Runway
      const trimmedDescription = productSceneDescription.length > 1000
        ? productSceneDescription.substring(0, 1000)
        : productSceneDescription

      // Then generate images using Runway
      setProgressStep('Generating your product images...')
      const imagesResponse = await axios.post('/api/runway/generate-product-scene-images', {
        description: trimmedDescription,
        sceneImage: sceneData.image.url,
        productImages: productImages.map(img => img.url),
        aspectRatio: imageFormat,
        count: 4
      })

      if (imagesResponse.data.images) {
        // Save pending images to database immediately before redirect
        setProgressStep('Saving to your gallery...')
        await savePendingImages(imagesResponse.data.images)

        // Hide loading screen and redirect to gallery
        setShowLoadingScreen(false)
        setProgressStep('')

        // Now redirect to gallery where loading states will be visible
        router.push('/images')

      }
    } catch (error: any) {
      console.error('Error generating product images:', error)
      setIsGenerating(false)
      setShowLoadingScreen(false)
      setProgressStep('')
    }
  }

  const savePendingImages = async (images: any[]) => {
    if (!sceneData) return

    try {
      const savePromises = images.map(async (img: any) => {
        await axios.post('/api/product-images', {
          imageUrl: img.url || '', // Empty for pending images
          sceneDescription: sceneData.description,
          sceneImageUrl: sceneData.image.url,
          productImageUrls: productImages.map(pImg => pImg.url),
          aspectRatio: imageFormat,
          enhancedDescription: sessionStorage.getItem('enhancedDescription'),
          aiEnhanced: sessionStorage.getItem('aiEnhanced') === 'true',
          runwayTaskId: img.taskId,
          status: 'PENDING'
        })
      })

      await Promise.all(savePromises)
    } catch (error) {
      console.error('Error saving pending images to database:', error)
    }
  }

  // Loading Screen Component - Full Screen Overlay
  const LoadingScreen = () => {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-50">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 py-2 text-center whitespace-nowrap">Creating Product Images</h1>
          <div className="flex justify-center mb-12">
            <SimpleLoader width={60} />
          </div>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed text-center">
            {progressStep || 'Getting started...'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading screen during generation process
  if (showLoadingScreen) {
    return <LoadingScreen />
  }

  if (status === 'loading' || (status === 'authenticated' && !sceneData)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  
  if (status === 'authenticated' && !hasPremiumAccess) {
    return <PremiumFeatureBlock />;
  }

  const canGenerate = userCredits !== null && userCredits >= 5

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Product Images</h1>
          <p className="text-gray-400">Upload 1-2 images of your product to place in the scene</p>
        </div>

        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Selected Scene</h3>
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-800">
              <img
                src={sceneData!.image.url}
                alt="Selected scene"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">{sceneData!.description}</p>
              <p className="text-gray-500 text-xs mt-1">Format: {imageFormat}</p>
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Product Images</h3>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <img src="/credits.svg" style={{ width: 'auto', height: '15px' }} alt="Credits" />
              <span className="text-white text-sm font-medium">Costs 5 credits</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
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
          <p className="text-gray-500 text-sm">Upload 1-2 high-quality images of your product (max 2 images)</p>
        </div>

        {userCredits !== null && userCredits < 5 && productImages.length > 0 && (
          <div className="card mb-8">
            <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-red-300">
                  <div className="font-medium text-sm mb-1">Insufficient Credits</div>
                  <div className="text-xs space-y-1">
                    <div>" You have {userCredits || 0} credits, but need 5 credits to generate product images</div>
                    <div>" Please purchase more credits to continue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            className="btn-secondary"
            onClick={() => router.push('/images/format')}
            disabled={isGenerating}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Templates
          </button>
          <button
            className={`btn-primary ${
              !canGenerate || productImages.length === 0 || isGenerating
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            onClick={generateProductImages}
            disabled={!canGenerate || productImages.length === 0 || isGenerating}
          >
            Generate Product Images
            <img src="/ai-star.svg" alt="AI" className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

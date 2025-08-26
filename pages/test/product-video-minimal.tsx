import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'

interface UploadedImage {
  url: string
  file?: File
}

interface GeneratedImage {
  id: string
  url: string | null
  taskId?: string
  status?: string
  selected?: boolean
}

export default function ProductVideoMinimal() {
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
  
  // Error states
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('Page loaded')

  // Storage key for persistence
  const STORAGE_KEY = 'product-video-minimal-state'

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const parsed = JSON.parse(savedState)
          if (parsed.productImages) setProductImages(parsed.productImages)
          if (parsed.productDescription) setProductDescription(parsed.productDescription)
          if (parsed.generatedImages) setGeneratedImages(parsed.generatedImages)
          if (parsed.selectedImageId) setSelectedImageId(parsed.selectedImageId)
          setDebugInfo('State loaded from localStorage')
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
          productImages: productImages.map(img => ({ url: img.url })),
          productDescription,
          generatedImages,
          selectedImageId
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
        setDebugInfo(`State saved: ${generatedImages.length} images in memory`)
      } catch (error) {
        console.warn('Failed to save state:', error)
      }
    }
  }, [productImages, productDescription, generatedImages, selectedImageId])

  // Debug: Log when component re-renders
  useEffect(() => {
    console.log('Component rendered:', { 
      images: generatedImages.length, 
      description: !!productDescription 
    })
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const totalImages = productImages.length + fileArray.length
    if (totalImages < 2) {
      setError('Please upload at least 2 product images total')
      return
    }
    if (totalImages > 2) {
      setError('Maximum 2 product images allowed')
      return
    }

    setUploadingImages(true)
    setError('')
    setDebugInfo('Uploading images...')

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData()
        formData.append('files', file)
        
        const response = await fetch('/api/test/upload-temp-debug', {
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
      setDebugInfo(`Uploaded ${uploadedImages.length} images successfully`)
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError('Failed to upload images')
      setDebugInfo(`Upload failed: ${error.message}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const generateProductDescription = async () => {
    if (productImages.length < 2) {
      setError('Please upload at least 2 product images first')
      return
    }

    setGeneratingDescription(true)
    setError('')
    setDebugInfo('Generating product description...')

    try {
      const response = await axios.post('/api/ai/generate-product-description', {
        images: productImages.map(img => img.url),
        avatarImage: '/avatar-img/female-blonde5-adult-inside-new.png'
      })

      setProductDescription(response.data.description)
      setDebugInfo('Description generated successfully')
    } catch (error: any) {
      console.error('Error generating description:', error)
      setError(error.response?.data?.error || 'Failed to generate product description')
      setDebugInfo('Description generation failed')
    } finally {
      setGeneratingDescription(false)
    }
  }

  const generateAvatarImages = async () => {
    if (!productDescription || productImages.length < 2) {
      setError('Please generate product description first')
      return
    }

    setGeneratingImages(true)
    setError('')
    setDebugInfo('Starting image generation with Runway...')

    try {
      const response = await axios.post('/api/runway/generate-avatar-images', {
        productDescription,
        avatarImage: '/avatar-img/female-blonde5-adult-inside-new.png',
        productImages: productImages.map(img => img.url)
      })

      console.log('Frontend received response:', response.data)
      console.log('Images array:', response.data.images)
      
      if (response.data.status === 'PROCESSING') {
        setGeneratedImages(response.data.images)
        setDebugInfo(`Tasks created, polling for completion...`)
        // Start polling for completion
        pollImageStatus(response.data.images.map((img: any) => img.taskId))
      } else {
        setGeneratedImages(response.data.images)
        setDebugInfo(`Successfully generated ${response.data.images.length} images`)
        setGeneratingImages(false)
      }
    } catch (error: any) {
      console.error('Error generating images:', error)
      setError(error.response?.data?.error || 'Failed to generate avatar images')
      setDebugInfo('Image generation failed')
      setGeneratingImages(false)
    }
  }

  const pollImageStatus = async (taskIds: string[]) => {
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max

    const poll = async () => {
      attempts++
      setDebugInfo(`Checking image status... (attempt ${attempts}/${maxAttempts})`)

      try {
        const response = await axios.post('/api/runway/check-image-status', {
          taskIds
        })

        console.log('Status check response:', response.data)
        
        // Update images with current status
        setGeneratedImages(response.data.images)
        
        if (response.data.status === 'COMPLETED') {
          setDebugInfo(`All ${response.data.completed} images completed successfully!`)
          setGeneratingImages(false)
        } else if (response.data.status === 'FAILED') {
          setError(`Image generation failed: ${response.data.failed} failed`)
          setDebugInfo('Some images failed to generate')
          setGeneratingImages(false)
        } else if (attempts >= maxAttempts) {
          setError('Timeout: Image generation took too long')
          setDebugInfo('Timeout reached')
          setGeneratingImages(false)
        } else {
          // Continue polling
          setDebugInfo(`Progress: ${response.data.completed}/${response.data.total} completed, ${response.data.processing} processing...`)
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error: any) {
        console.error('Error checking status:', error)
        if (attempts >= maxAttempts) {
          setError('Failed to check image status')
          setDebugInfo('Status check failed')
          setGeneratingImages(false)
        } else {
          // Retry status check
          setTimeout(poll, 5000)
        }
      }
    }

    poll()
  }

  const clearAllState = () => {
    setProductImages([])
    setProductDescription('')
    setGeneratedImages([])
    setSelectedImageId('')
    setError('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setDebugInfo('All state cleared')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Minimal Product Video Test</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Minimal Product Video Test</h1>
          <p className="text-gray-400">No Layout component - pure React test</p>
          <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/50 rounded text-sm">
            <strong>Debug:</strong> {debugInfo}
          </div>
          <div className="mt-2">
            <button
              onClick={clearAllState}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded">
            <div className="text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Step 1: Upload Product Images */}
        <div className="bg-gray-900 rounded p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Step 1: Upload 2 Product Images
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {productImages.map((image, i) => (
                <div key={i} className="relative">
                  <img
                    src={image.url}
                    alt={`Product ${i + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
              ))}
              
              {productImages.length < 2 && (
                <button 
                  className={`w-24 h-24 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center text-gray-400 transition-colors ${
                    uploadingImages ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 hover:text-orange-400'
                  }`}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  ) : (
                    <>
                      <span className="text-2xl">+</span>
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
            
            <p className="text-sm text-gray-400">
              Uploaded {productImages.length}/2 images
            </p>
          </div>
        </div>

        {/* Step 2: Generate Product Description */}
        <div className="bg-gray-900 rounded p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Step 2: Generate Product Description
          </h2>
          
          <div className="space-y-4">
            <button
              className={`px-6 py-2 rounded font-medium transition-colors ${
                productImages.length === 2 && !generatingDescription
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={generateProductDescription}
              disabled={productImages.length !== 2 || generatingDescription}
            >
              {generatingDescription ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Product Description'
              )}
            </button>
            
            {productDescription && (
              <div className="mt-4 p-4 bg-gray-800 rounded">
                <h3 className="font-medium mb-2">Generated Description:</h3>
                <p className="text-gray-300">{productDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Generate Avatar Images */}
        <div className="bg-gray-900 rounded p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Step 3: Generate Avatar Images
          </h2>
          
          <div className="space-y-4">
            <button
              className={`px-6 py-2 rounded font-medium transition-colors ${
                productDescription && !generatingImages
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={generateAvatarImages}
              disabled={!productDescription || generatingImages}
            >
              {generatingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Generating images...
                </>
              ) : (
                'Generate Avatar Images (4 options)'
              )}
            </button>
            
            {generatedImages.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-4">Generated Images:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <div 
                      key={image.id}
                      className={`relative rounded overflow-hidden transition-all ${
                        image.url && selectedImageId === image.id
                          ? 'ring-2 ring-orange-500'
                          : 'border border-gray-700 hover:border-orange-500/50'
                      } ${image.url ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      onClick={() => image.url && setSelectedImageId(image.id)}
                    >
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`Generated avatar ${image.id}`}
                          className="w-full h-80 object-contain bg-gray-900"
                        />
                      ) : (
                        <div className="w-full h-80 bg-gray-800 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                          <div className="text-sm text-gray-400">
                            {image.status || 'Processing...'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Task: {image.taskId?.slice(-8)}
                          </div>
                        </div>
                      )}
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
          </div>
        </div>
      </div>
    </div>
  )
}
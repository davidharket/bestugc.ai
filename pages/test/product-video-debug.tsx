import { useRouter } from 'next/router'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'

interface UploadedImage {
  url: string
  file?: File // Make optional for localStorage compatibility
}

interface GeneratedImage {
  id: string
  url: string
  selected?: boolean
}

export default function ProductVideoDebug() {
  const router = useRouter()
  
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
  
  // State for video generation
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('')
  const [videoTaskId, setVideoTaskId] = useState<string>('')
  
  // Error states
  const [error, setError] = useState<string>('')
  
  // Debug info
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...')

  useEffect(() => {
    setDebugInfo('Page loaded successfully')
  }, [])

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
      setError('Maximum 2 product images allowed (Runway API limitation)')
      return
    }

    setUploadingImages(true)
    setError('')
    setDebugInfo(`Uploading ${fileArray.length} files...`)

    try {
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData()
        formData.append('files', file)
        
        setDebugInfo(`Uploading ${file.name}...`)
        
        // Use debug upload endpoint that doesn't require auth
        const response = await fetch('/api/test/upload-temp-debug', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to upload ${file.name}: ${response.status} - ${errorText}`)
        }
        
        const result = await response.json()
        return {
          url: result.files[0].url,
          file
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      setProductImages(prev => [...prev, ...uploadedImages])
      setDebugInfo(`Successfully uploaded ${uploadedImages.length} files`)
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError(`Failed to upload images: ${error.message}`)
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
    setDebugInfo('Generating product description with AI...')

    try {
      const response = await axios.post('/api/ai/generate-product-description', {
        images: productImages.map(img => img.url),
        avatarImage: '/avatar-img/female-blonde5-adult-inside-new.png'
      })

      setProductDescription(response.data.description)
      setDebugInfo('Product description generated successfully')
    } catch (error: any) {
      console.error('Error generating description:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to generate product description'
      setError(errorMsg)
      setDebugInfo(`Description generation failed: ${errorMsg}`)
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
    setDebugInfo('Generating avatar images with Runway...')

    try {
      const response = await axios.post('/api/runway/generate-avatar-images', {
        productDescription,
        avatarImage: '/avatar-img/female-blonde5-adult-inside-new.png',
        productImages: productImages.map(img => img.url)
      })

      setGeneratedImages(response.data.images)
      setDebugInfo(`Generated ${response.data.images.length} avatar images`)
    } catch (error: any) {
      console.error('Error generating images:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to generate avatar images'
      setError(errorMsg)
      setDebugInfo(`Image generation failed: ${errorMsg}`)
    } finally {
      setGeneratingImages(false)
    }
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
    setDebugInfo('Starting video generation...')

    try {
      const response = await axios.post('/api/runway/generate-avatar-video', {
        imageUrl: selectedImage.url,
        productDescription
      })

      setVideoTaskId(response.data.taskId)
      setDebugInfo(`Video generation started, task ID: ${response.data.taskId}`)
      
      // Poll for video completion
      pollVideoStatus(response.data.taskId)
    } catch (error: any) {
      console.error('Error generating video:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to generate video'
      setError(errorMsg)
      setDebugInfo(`Video generation failed: ${errorMsg}`)
      setGeneratingVideo(false)
    }
  }

  const pollVideoStatus = async (taskId: string) => {
    try {
      setDebugInfo(`Checking video status for task ${taskId}...`)
      const response = await axios.get(`/api/runway/task-status/${taskId}`)
      
      if (response.data.status === 'SUCCEEDED') {
        setFinalVideoUrl(response.data.output[0])
        setGeneratingVideo(false)
        setDebugInfo('Video generation completed successfully!')
      } else if (response.data.status === 'FAILED') {
        setError('Video generation failed')
        setGeneratingVideo(false)
        setDebugInfo('Video generation failed')
      } else {
        setDebugInfo(`Video status: ${response.data.status}, polling again in 5s...`)
        // Still processing, poll again in 5 seconds
        setTimeout(() => pollVideoStatus(taskId), 5000)
      }
    } catch (error: any) {
      console.error('Error checking video status:', error)
      setError('Failed to check video status')
      setGeneratingVideo(false)
      setDebugInfo(`Status check failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Avatar Product Video Debug</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Avatar Product Video Debug</h1>
          <p className="text-gray-400">Debug version without authentication</p>
          <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/50 rounded text-sm">
            <strong>Debug:</strong> {debugInfo}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
            <div className="text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Step 1: Upload Product Images */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Step 1: Upload Product Images (minimum 2)
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
              Uploaded {productImages.length} image(s). Need at least 2 images to continue.
            </p>
          </div>
        </div>

        {/* Step 2: Generate Product Description */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Step 2: Generate Product Description with AI
          </h2>
          
          <div className="space-y-4">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                productImages.length >= 2 && !generatingDescription
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={generateProductDescription}
              disabled={productImages.length < 2 || generatingDescription}
            >
              {generatingDescription ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Generating description...
                </>
              ) : (
                'Generate Product Description'
              )}
            </button>
            
            {productDescription && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-medium mb-2">Generated Description:</h3>
                <p className="text-gray-300">{productDescription}</p>
              </div>
            )}
          </div>
        </div>

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
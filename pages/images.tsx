import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import SimpleLoader from '../components/SimpleLoader'
import BarLoader from '../components/BarLoader'

interface ProductImage {
  id: string
  imageUrl: string
  sceneDescription: string
  sceneImageUrl: string
  productImageUrls: string
  aspectRatio: string
  enhancedDescription?: string
  aiEnhanced: boolean
  runwayTaskId?: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function Images() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayedImagesCount, setDisplayedImagesCount] = useState(12)

  // Check if user has premium access (PRO or PREMIUM)
  const hasPremiumAccess = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM'
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchImages = async (page = 1, limit = 12) => {
    if (status !== 'authenticated') return

    try {
      const response = await axios.get('/api/product-images', {
        params: { page, limit }
      })

      if (page === 1) {
        setImages(response.data.images)
      } else {
        setImages(prev => [...prev, ...response.data.images])
      }

      setHasMore(response.data.hasMore)
      setError(null)
    } catch (e: any) {
      console.error('Error fetching images:', e)
      setError(e.response?.data?.error || 'Failed to load your images.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      signIn()
      return
    }

    fetchImages()
  }, [status])

  // Check and update pending images with Runway status
  const checkAndUpdatePendingImages = async () => {
    try {
      // Get all pending images with task IDs
      const pendingImages = images.filter(img => 
        (img.status === 'PENDING' || img.status === 'PROCESSING') && img.runwayTaskId
      )

      if (pendingImages.length === 0) return

      console.log(`Checking status for ${pendingImages.length} pending images...`)
      
      // Extract task IDs
      const taskIds = pendingImages.map(img => img.runwayTaskId).filter(Boolean)
      
      // Check status with Runway API
      const statusResponse = await axios.post('/api/runway/check-image-status', {
        taskIds: taskIds
      })

      if (statusResponse.data?.images) {
        const statusResults = statusResponse.data.images
        
        // Update each completed image in the database
        const updatePromises = statusResults.map(async (result: any) => {
          if (result.status === 'SUCCEEDED' && result.url) {
            console.log(`Updating completed image: ${result.taskId} -> ${result.url}`)
            
            // Update in database
            await axios.patch('/api/product-images', {
              runwayTaskId: result.taskId,
              imageUrl: result.url,
              status: 'COMPLETED'
            })
          } else if (result.status === 'FAILED' || result.status === 'ERROR') {
            console.log(`Marking failed image: ${result.taskId}`)
            
            // Mark as failed in database
            await axios.patch('/api/product-images', {
              runwayTaskId: result.taskId,
              status: 'FAILED'
            })
          }
        })

        await Promise.all(updatePromises)
        
        // Refresh the images list to show updates
        await fetchImages(1, displayedImagesCount)
        
        console.log('Updated pending images, refreshed gallery')
      }
    } catch (error) {
      console.error('Error checking pending images:', error)
    }
  }

  // Start polling for pending images
  useEffect(() => {
    if (images.length === 0) return

    const hasPendingImages = images.some(img => img.status === 'PENDING' || img.status === 'PROCESSING')

    if (hasPendingImages && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        checkAndUpdatePendingImages()
      }, 5000) // Poll every 5 seconds
    } else if (!hasPendingImages && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [images, displayedImagesCount])

  // Infinite scroll observer
  useEffect(() => {
    if (status === 'loading') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && displayedImagesCount < images.length) {
          setLoadingMore(true)
          setTimeout(() => {
            setDisplayedImagesCount(prev => Math.min(prev + 12, images.length))
            setLoadingMore(false)
          }, 500)
        } else if (entries[0].isIntersecting && !loadingMore && hasMore && displayedImagesCount >= images.length) {
          // Load more from API
          setLoadingMore(true)
          fetchImages(Math.floor(images.length / 12) + 1, 12)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [loadingMore, hasMore, displayedImagesCount, images.length, status])

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      // Use our proxy endpoint to handle CORS and authentication
      const downloadUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=product-image-${imageId}.jpg`

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `product-image-${imageId}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-white mb-4">Loading your images...</div>
        <BarLoader />
      </div>
    )
  }

  const visibleImages = images.slice(0, displayedImagesCount)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Images</h1>
            <p className="text-gray-400">View and manage your AI-generated product images.</p>
          </div>
          {hasPremiumAccess ? (
            <Link href="/images/format" className="btn-primary">
              Create New Image
            </Link>
          ) : (
            <Link href="/subscription" className="btn-primary">
              Upgrade to Create Images
            </Link>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-[15px] p-6 text-center mb-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchImages()}
              className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-4 py-2 rounded-[15px] hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-16">
            <img src="/videos.svg" alt="Images" className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No images created yet</h3>
            {hasPremiumAccess ? (
              <>
                <p className="text-gray-400 mb-6">Start creating your first AI-generated product image!</p>
                <Link href="/images/format" className="btn-primary">
                  Create Your First Image
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-6">Upgrade to a Pro plan to start creating AI-generated product images.</p>
                <Link href="/subscription" className="btn-primary">
                  Upgrade Your Plan
                </Link>
              </>
            )}
          </div>
        )}

        {/* Masonry Grid */}
        {!loading && !error && visibleImages.length > 0 && (
          <>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
              {visibleImages.map((image) => (
                <div key={image.id} className="break-inside-avoid mb-2">
                  <div
                    className="relative group cursor-pointer rounded-[15px] overflow-hidden bg-gray-800"
                    onClick={() => image.imageUrl && setFullscreenImage(image.imageUrl)}
                  >
                    {image.status === 'PENDING' || image.status === 'PROCESSING' || !image.imageUrl ? (
                      // Placeholder for loading images
                      <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                        <SimpleLoader width={40} />
                      </div>
                    ) : (
                      <>
                        <img
                          src={image.imageUrl}
                          alt={image.sceneDescription}
                          className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
                        />

                        {/* Hover overlay with download button */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(image.imageUrl, image.id)
                            }}
                            className="relative z-10 mb-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors pointer-events-auto"
                            title="Download image"
                          >
                            <img src="/download.svg" alt="Download" className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  Loading more images...
                </div>
              ) : hasMore ? (
                <div className="text-gray-500 text-sm">Scroll down for more images</div>
              ) : visibleImages.length > 12 ? (
                <div className="text-center text-gray-500 text-sm">
                  You've reached the end • {visibleImages.length} images total
                </div>
              ) : null}
            </div>
          </>
        )}
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

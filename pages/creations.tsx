// pages/creations.tsx
import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface Ad {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  status: string
  finalVideoUrl?: string
  brandName?: string
  productUrl?: string
  format?: string
  duration?: number
  language?: string
  isWatermarked?: boolean
}

function AdCard({ ad, onDelete, onCancel }: { 
  ad: Ad; 
  onDelete: (adId: string) => void; 
  onCancel: (adId: string) => void; 
}) {
  const getVideoUrl = (finalVideoUrl: string | undefined) => {
    if (!finalVideoUrl) return '';
    
    if (finalVideoUrl.startsWith('http')) return finalVideoUrl;
    
    // Use the current window location to build the correct URL
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      
      // If the path starts with /renders/, use the serve-video API
      if (finalVideoUrl.startsWith('/renders/')) {
        const filename = finalVideoUrl.replace('/renders/', '');
        const fullUrl = `${baseUrl}/api/serve-video/${filename}`;
        console.log('Generated video URL:', fullUrl, 'from:', finalVideoUrl);
        return fullUrl;
      }
      
      // Otherwise use direct path
      const fullUrl = `${baseUrl}${finalVideoUrl}`;
      console.log('Generated video URL:', fullUrl, 'from:', finalVideoUrl);
      return fullUrl;
    }
    
    return finalVideoUrl;
  };

  const renderStatus = () => {
    switch (ad.status) {
      case 'PENDING':
      case 'RENDERING':
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-gray-800 rounded-lg p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-3"></div>
            <p className="text-orange-400 font-medium">Processing...</p>
            <p className="text-gray-400 text-xs mt-1">Status: {ad.status}</p>
          </div>
        );
      case 'COMPLETED':
        const videoUrl = getVideoUrl(ad.finalVideoUrl);
        return (
          <div className="relative group">
            <video
              key={videoUrl} // Force re-render when URL changes
              src={videoUrl}
              className="w-full max-w-full h-auto rounded-lg bg-gray-800 video-player"
              playsInline
              controls
              preload="metadata"
              crossOrigin="anonymous"
              style={{
                WebkitAppearance: 'none',
                aspectRatio: 'auto',
              }}
              onLoadedMetadata={(e) => {
                // Set the current time to 0.1 seconds to get the first frame as poster
                const video = e.target as HTMLVideoElement;
                video.currentTime = 0.1;
              }}
              onError={(e) => {
                console.error('Video failed to load:', videoUrl);
                console.error('Error details:', e);
              }}
              onLoadStart={() => {
                console.log('Video started loading:', videoUrl);
              }}
              onCanPlay={() => {
                console.log('Video can play:', videoUrl);
              }}
              onLoadedData={() => {
                console.log('Video data loaded:', videoUrl);
              }}
              onPlay={(e) => {
                // Hide overlay when playing
                const overlay = e.currentTarget.parentElement?.querySelector('.video-overlay') as HTMLElement;
                if (overlay) overlay.style.display = 'none';
              }}
              onPause={(e) => {
                // Show overlay when paused
                const overlay = e.currentTarget.parentElement?.querySelector('.video-overlay') as HTMLElement;
                if (overlay) overlay.style.display = 'flex';
              }}
            />
            {/* Smart overlay - only shows when paused and doesn't block controls */}
            <div className="video-overlay absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-orange-500/90 backdrop-blur-sm text-white rounded-full p-3 shadow-2xl transform group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-red-900/20 border border-red-800 rounded-lg p-4">
            <span className="text-red-400 text-4xl mb-2">❌</span>
            <p className="text-red-400 font-medium">Failed</p>
            <p className="text-gray-400 text-xs text-center mt-1">Something went wrong during processing</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400">Status: {ad.status || 'Unknown'}</p>
          </div>
        )
    }
  }

  // Determine which actions are available
  const canCancel = ad.status === 'PENDING' || ad.status === 'RENDERING';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-orange-500/50 transition-all duration-200">
      {/* Video/Status Display */}
      <div className="mb-4">{renderStatus()}</div>
      
      {/* Ad Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-white truncate" title={ad.brandName || 'Ad'}>
          {ad.brandName || `Ad #${ad.id.slice(0, 8)}`}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
          {ad.format && <span>{ad.format}</span>}
          {ad.duration && <span>{ad.duration}s</span>}
          {ad.language && <span>{ad.language.toUpperCase()}</span>}
        </div>
        
        {ad.productUrl && (
          <div className="text-xs text-gray-500 truncate">
            🔗 {ad.productUrl}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        {ad.status === 'COMPLETED' && (
          <span className="inline-flex items-center px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
            ✅ Ready
          </span>
        )}
        {(ad.status === 'PENDING' || ad.status === 'RENDERING') && (
          <span className="inline-flex items-center px-2 py-1 bg-orange-900/50 text-orange-400 text-xs rounded-full">
            ⏳ Processing
          </span>
        )}
        {ad.status === 'FAILED' && (
          <span className="inline-flex items-center px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded-full">
            ❌ Failed
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Conditional buttons based on status */}
        {ad.status === 'COMPLETED' && ad.finalVideoUrl ? (
          <>
            <a
              href={getVideoUrl(ad.finalVideoUrl)}
              download
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              📥 Download
            </a>
            <button
              onClick={() => onDelete(ad.id)}
              className="bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              🗑️ Delete
            </button>
          </>
        ) : canCancel ? (
          <>
            <button
              onClick={() => onCancel(ad.id)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              ⏹️ Cancel
            </button>
            <button
              onClick={() => onDelete(ad.id)}
              className="bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              🗑️ Delete
            </button>
          </>
        ) : (
          <>
            {/* For failed/other states, show only delete button */}
            <div></div>
            <button
              onClick={() => onDelete(ad.id)}
              className="bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function MyCreations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')

  const fetchAds = async () => {
    if (status === 'authenticated') {
      try {
        const res = await axios.get<Ad[]>('/api/ads')
        console.log('Fetched ads data:', res.data)
        setAds(res.data)
      } catch (e: any) {
        console.error('Error fetching ads:', e)
        setError(e.response?.data?.error || 'Failed to load your creations.')
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchAds()
    const interval = setInterval(fetchAds, 15000)
    return () => clearInterval(interval)
  }, [status])

  if (status === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
    </div>
  )

  if (status === 'unauthenticated' || !session?.user) {
    signIn()
    return null
  }

  const handleCancelAd = async (adId: string) => {
    if (!confirm('Are you sure you want to cancel this ad creation?')) return;
    
    try {
      await axios.post(`/api/ads/${adId}`);
      toast.success('Ad cancellation requested.');
      fetchAds(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel ad:', error);
      toast.error('Failed to cancel ad. Please try again.');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/ads/${adId}`);
      toast.success('Ad deleted successfully.');
      setAds(ads.filter((ad) => ad.id !== adId));
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error('Failed to delete ad. Please try again.');
    }
  };


  const filteredAds = ads.filter(ad => {
    switch (filter) {
      case 'completed': return ad.status === 'COMPLETED';
      case 'processing': return ad.status === 'PENDING' || ad.status === 'RENDERING';
      case 'failed': return ad.status === 'FAILED';
      default: return true;
    }
  });

  const stats = {
    total: ads.length,
    completed: ads.filter(ad => ad.status === 'COMPLETED').length,
    processing: ads.filter(ad => ad.status === 'PENDING' || ad.status === 'RENDERING').length,
    failed: ads.filter(ad => ad.status === 'FAILED').length
  };

  console.log('Current state:', {
    loading,
    error,
    adsLength: ads.length,
    filteredAdsLength: filteredAds.length,
    filter,
    firstAd: ads[0]
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Creations</h1>
            <p className="text-gray-400">Manage all your AI video ads in one place</p>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 sm:mt-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-center"
          >
            Create New Ad
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total Ads</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-gray-400 text-sm">Completed</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-2xl font-bold text-orange-400">{stats.processing}</p>
            <p className="text-gray-400 text-sm">Processing</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-gray-400 text-sm">Failed</p>
          </div>
        </div>

        {/* Filters */}
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'processing', label: 'Processing', count: stats.processing },
              { key: 'failed', label: 'Failed', count: stats.failed }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  filter === key
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

        </div>

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse">
                <div className="h-48 bg-gray-800 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAds}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredAds.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'No ads created yet' : `No ${filter} ads`}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start creating your first AI video ad!' 
                : `You don't have any ${filter} ads at the moment.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Create Your First Ad
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filteredAds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAds.map(ad => (
              <AdCard 
                key={ad.id} 
                ad={ad} 
                onDelete={handleDeleteAd} 
                onCancel={handleCancelAd} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
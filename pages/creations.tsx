// pages/creations.tsx
import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
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
  finalVideoUrl4x5?: string
  brandName?: string
  productUrl?: string
  format?: string
  duration?: number
  language?: string
  isWatermarked?: boolean
  enableDualFormat?: boolean
}

function AdCard({ ad, onDelete, onCancel, userPlan }: { 
  ad: Ad; 
  onDelete: (adId: string) => void; 
  onCancel: (adId: string) => void;
  userPlan?: string;
}) {
  const [isMuted, setIsMuted] = useState(true); // Start muted for free users
  const [currentFormat, setCurrentFormat] = useState<'9:16' | '4:5'>('9:16'); // Format toggle for dual format videos
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };
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
        const hasDualFormat = ad.enableDualFormat && ad.finalVideoUrl4x5;
        const currentVideoUrl = currentFormat === '4:5' && ad.finalVideoUrl4x5 
          ? getVideoUrl(ad.finalVideoUrl4x5) 
          : getVideoUrl(ad.finalVideoUrl);
        
        return (
          <div className="relative group">
            {/* Format Toggle for Dual Format Videos */}
            {hasDualFormat && (
              <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-sm rounded-lg p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentFormat('9:16')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      currentFormat === '9:16'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    9:16
                  </button>
                  <button
                    onClick={() => setCurrentFormat('4:5')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      currentFormat === '4:5'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    4:5
                  </button>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              key={currentVideoUrl} // Force re-render when URL changes
              src={currentVideoUrl}
              className="w-full max-w-full h-auto rounded-lg bg-gray-800 video-player"
              playsInline
              controls={userPlan !== 'FREE'} // Only show controls for paid users
              autoPlay={userPlan === 'FREE'} // Auto-play for free users since they can't control it
              loop={userPlan === 'FREE'} // Loop for free users
              muted={userPlan === 'FREE' ? isMuted : false} // Control mute state for free users
              controlsList={userPlan === 'FREE' ? 'nodownload nofullscreen noremoteplayback' : undefined}
              preload="metadata"
              crossOrigin="anonymous"
              onContextMenu={userPlan === 'FREE' ? (e) => e.preventDefault() : undefined} // Disable right-click for free users
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
                console.error('Video failed to load:', currentVideoUrl);
                console.error('Error details:', e);
              }}
              onLoadStart={() => {
                console.log('Video started loading:', currentVideoUrl);
              }}
              onCanPlay={() => {
                console.log('Video can play:', currentVideoUrl);
              }}
              onLoadedData={() => {
                console.log('Video data loaded:', currentVideoUrl);
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
            
            {/* Watermark overlay for free users - always visible */}
            {userPlan === 'FREE' && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium border border-purple-500/50 pointer-events-none z-10">
                🎬 Upgrade for Controls
              </div>
            )}
            
            
            {/* Upgrade overlay for free users when video is clicked */}
            {userPlan === 'FREE' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer z-20"
                   onClick={() => window.open('/subscription', '_blank')}>
                <div className="bg-gradient-to-r from-purple-500/90 to-pink-600/90 backdrop-blur-sm text-white rounded-xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-200 text-center max-w-sm mx-4">
                  <div className="bg-purple-500/20 rounded-full p-3 mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Upgrade for Full Control</h3>
                  <p className="text-sm text-purple-100 mb-3">Get video controls, downloads & no watermark</p>
                  <div className="text-xs text-purple-200">Click to view pricing</div>
                </div>
              </div>
            )}
            
            {/* Play overlay - shows when paused and doesn't block controls */}
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
      
      {/* Audio Control for Free Users */}
      {userPlan === 'FREE' && ad.status === 'COMPLETED' && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Audio Control:</span>
          <button
            onClick={toggleMute}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
            title={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                Unmute
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Mute
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Ad Info */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-white truncate" title={ad.brandName || 'Ad'}>
          {ad.brandName || `Ad #${ad.id.slice(0, 8)}`}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
          {ad.enableDualFormat && ad.finalVideoUrl4x5 ? (
            <span className="bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">9:16 + 4:5</span>
          ) : ad.format ? (
            <span>{ad.format}</span>
          ) : null}
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
            {userPlan === 'FREE' ? (
              <Link
                href="/subscription"
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-center px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium group relative overflow-hidden"
                title="Upgrade to any paid plan to download your videos. Your existing videos won't count against new credits!"
              >
                <span className="relative z-10">🔒 Upgrade to Download</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </Link>
            ) : (
              <a
                href={getVideoUrl(ad.finalVideoUrl)}
                download
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
              >
                📥 Download
              </a>
            )}
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

        {/* Free User Upgrade Banner */}
        {session?.user?.plan === 'FREE' && stats.completed > 0 && (
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-purple-500/20 rounded-lg p-3 flex-shrink-0">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Unlock Video Downloads</h3>
                <p className="text-gray-300 mb-4">
                  Upgrade to download your completed videos. <strong className="text-purple-400">Your existing {stats.completed} video{stats.completed === 1 ? '' : 's'} won't count against your new credits</strong> - they're yours to keep forever once you upgrade!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/subscription"
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-center"
                  >
                    View Pricing Plans
                  </Link>
                  <Link
                    href="/subscription"
                    className="bg-gray-800 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-center border border-gray-600"
                  >
                    Buy Credits Only
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
                userPlan={session?.user?.plan || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
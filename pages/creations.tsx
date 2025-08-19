// pages/creations.tsx
import { useSession, signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Ad } from '../types/Ad';
import AdCard from '../components/AdCard';

export default function MyCreations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const scrollPositionRef = useRef(0);
  
  // Infinite scroll state
  const [displayedAdsCount, setDisplayedAdsCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [retryModal, setRetryModal] = useState<{isOpen: boolean, adId: string, brandName: string} | null>(null);

  const fetchAds = async (isPolling = false) => {
    if (status !== 'authenticated') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    // Don't show loader on background polls or when tab is not visible
    if (!isPolling && isTabVisible) {
      setLoading(true);
    }

    try {
      const res = await axios.get<Ad[]>('/api/ads');
      console.log(`Fetched ads data (${isPolling ? 'polling' : 'initial'}):`, res.data.length, 'ads');
      
      // Only update ads state if data actually changed to prevent unnecessary re-renders
      const currentAdsJson = JSON.stringify(ads);
      const newAdsJson = JSON.stringify(res.data);
      
      if (currentAdsJson !== newAdsJson) {
        setAds(res.data);
        console.log('Ads updated - data changed');
      } else if (isPolling) {
        console.log('Ads data unchanged - skipping state update');
      }
      
      setError(null);
    } catch (e: any) {
      console.error('Error fetching ads:', e);
      setError(e.response?.data?.error || 'Failed to load your creations.');
      // Stop polling on error to avoid repeated failures
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } finally {
      // Only update loading state if it's not a background poll
      if (!isPolling && isTabVisible) {
        setLoading(false);
      }
    }
  };

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      if (!isVisible) {
        // Save scroll position when tab becomes hidden
        scrollPositionRef.current = window.scrollY;
        console.log('Tab became hidden, saved scroll position:', scrollPositionRef.current);
      } else {
        // Restore scroll position when tab becomes visible
        console.log('Tab became visible, restoring scroll position:', scrollPositionRef.current);
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
        }, 0);
      }
      
      setIsTabVisible(isVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status]);

  // Start/stop polling based on processing status and tab visibility
  const startPollingIfNeeded = (adsData: Ad[]) => {
    const hasProcessingAds = adsData.some(ad => 
      ad.status === 'PENDING' || ad.status === 'RENDERING' || ad.status === 'QUEUED'
    );
    
    // Clear existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Only start polling if we have processing ads, tab is visible, and user is authenticated
    if (hasProcessingAds && isTabVisible && status === 'authenticated') {
      console.log('Starting polling - processing ads detected and tab is visible');
      pollingRef.current = setInterval(() => {
        // Only poll if tab is still visible
        if (!document.hidden) {
          fetchAds(true);
        }
      }, 15000); // Increased to 15 seconds to reduce excessive refreshing
    } else {
      console.log('Not starting polling:', { hasProcessingAds, isTabVisible, status });
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      signIn();
      return;
    }
    
    // Initial fetch - the polling will be handled by the separate useEffect
    fetchAds();

    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        console.log('Clearing polling interval on unmount.');
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status]);

  // Optimized polling management - only restart when actually needed
  useEffect(() => {
    if (ads.length === 0 || status !== 'authenticated') return;
    
    const hasProcessingAds = ads.some(ad => 
      ad.status === 'PENDING' || ad.status === 'RENDERING' || ad.status === 'QUEUED'
    );
    
    // Only start polling if we have processing ads and tab is visible
    // But don't restart polling just because tab visibility changed
    if (hasProcessingAds && isTabVisible && !pollingRef.current) {
      console.log('Starting polling - processing ads detected');
      startPollingIfNeeded(ads);
    } else if (!hasProcessingAds && pollingRef.current) {
      // Stop polling if no processing ads
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log('Stopped polling - no processing ads');
    }
  }, [ads.length, status]); // Removed isTabVisible to prevent tab switching from restarting polling

  // Handle tab visibility changes more efficiently - prevent unnecessary refreshes
  useEffect(() => {
    if (!isTabVisible && pollingRef.current) {
      // Pause polling when tab becomes hidden
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log('Paused polling - tab hidden');
    } else if (isTabVisible && !pollingRef.current && ads.length > 0) {
      // Resume polling when tab becomes visible if we have processing ads
      // BUT don't refetch data - just resume polling
      const hasProcessingAds = ads.some(ad => 
        ad.status === 'PENDING' || ad.status === 'RENDERING' || ad.status === 'QUEUED'
      );
      if (hasProcessingAds) {
        console.log('Resumed polling - tab visible (no data refetch)');
        // Start polling without triggering a data fetch
        pollingRef.current = setInterval(() => {
          if (!document.hidden) {
            fetchAds(true);
          }
        }, 15000);
      }
    }
  }, [isTabVisible]);


  // Reset displayed count when filter changes
  useEffect(() => {
    setDisplayedAdsCount(6);
  }, [filter]);

  if (status === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
    </div>
  )

  // This part is now handled in the useEffect
  // if (status === 'unauthenticated' || !session?.user) {
  //   signIn()
  //   return null
  // }

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

  const handleRetryAd = (adId: string) => {
    // Find the ad to get its brand name for the modal
    const ad = ads.find(a => a.id === adId);
    setRetryModal({
      isOpen: true,
      adId: adId,
      brandName: ad?.brandName || `Video #${adId.slice(0, 6)}`
    });
  };

  const confirmRetryAd = async () => {
    if (!retryModal) return;
    
    try {
      // Find the ad to get its template ID
      const ad = ads.find(a => a.id === retryModal.adId);
      if (!ad || !ad.templateId) {
        toast.error('Cannot retry this ad - template information missing.');
        setRetryModal(null);
        return;
      }

      const toastId = toast.loading('Retrying video creation...');
      
      // Call the same API endpoint used for new renders
      await axios.post('/api/render/start-job', {
        adId: retryModal.adId,
        templateId: ad.templateId
      });
      
      toast.success('Video retry started! Your video is now in the queue.', { id: toastId });
      
      // Refresh the ads list to show updated status
      fetchAds();
      setRetryModal(null);
    } catch (error: any) {
      console.error('Failed to retry ad:', error);
      const errorMessage = error.response?.data?.message || 'Failed to retry video creation. Please try again.';
      toast.error(errorMessage);
      setRetryModal(null);
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

  // Infinite scroll observer - moved here after filteredAds is defined
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && displayedAdsCount < filteredAds.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayedAdsCount(prev => Math.min(prev + 6, filteredAds.length));
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
  }, [loadingMore, displayedAdsCount, filteredAds.length]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Filter Tabs - with sliding animation */}
        <div className="relative mb-8 max-w-md">
          <div className="flex bg-black rounded-[20px] p-1 relative">
            {/* Sliding background indicator */}
            <div 
              className="absolute top-1 bottom-1 bg-orange-600 rounded-[15px] transition-all duration-300 ease-in-out"
              style={{
                width: `${100/3}%`,
                left: `${(['all', 'completed', 'processing'].indexOf(filter as string)) * (100/3)}%`
              }}
            />
            
            {[
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Completed' },
              { key: 'processing', label: 'Processing' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`relative z-10 flex-1 px-4 py-3 rounded-[15px] text-sm font-medium transition-all duration-300 ${
                  filter === key
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade Banner - matching CREATIONS.png design */}
        {session?.user?.plan === 'FREE' && stats.completed > 0 && (
          <div className="bg-[#1f2937] border border-gray-700 rounded-[20px] p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <img src="/lock.svg" alt="Lock" className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Unlock video downloads</h3>
                <p className="text-gray-300 mb-4">
                  Upgrade to download your completed videos. Your existing {stats.completed} videos won't count against your new credits - they're yours to keep forever once you upgrade!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/subscription"
                    className="btn-primary px-6 py-3 text-center"
                  >
                    View plans
                  </Link>
                  <Link
                    href="/subscription"
                    className="btn-secondary px-6 py-3 text-center"
                  >
                    Buy credits
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full max-w-sm mx-auto">
                {/* Skeleton card container - matching AdCard design */}
                <div className="bg-[#1f2937] rounded-[20px] border border-gray-700 flex flex-col animate-pulse">
                  {/* Video area skeleton */}
                  <div className="flex-shrink-0">
                    <div className="relative rounded-t-[20px] overflow-hidden aspect-[9/16] bg-gray-800">
                      {/* Play button skeleton */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content area skeleton */}
                  <div className="flex-1 p-6 flex flex-col">
                    {/* Title skeleton */}
                    <div className="h-6 bg-gray-800 rounded-lg w-3/4 mb-2"></div>

                    {/* Metadata skeleton */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-4 bg-gray-800 rounded w-20"></div>
                      <div className="h-4 bg-gray-800 rounded w-12"></div>
                      <div className="h-4 bg-gray-800 rounded w-8"></div>
                      <div className="h-4 bg-gray-800 rounded w-6"></div>
                    </div>

                    {/* Status badge skeleton */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                        <div className="h-4 bg-gray-800 rounded w-16"></div>
                      </div>
                    </div>

                    {/* Buttons skeleton */}
                    <div className="mt-auto flex flex-col gap-3">
                      {/* Avatar button skeleton */}
                      <div className="h-10 bg-gray-800 rounded-[15px] w-full"></div>
                      
                      {/* Bottom row skeleton */}
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 h-10 bg-gray-800 rounded-[15px]"></div>
                        <div className="h-10 w-20 bg-gray-800 rounded-[15px]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
                onClick={() => fetchAds()}
                className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
              >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredAds.length === 0 && (
          <div className="text-center py-16">
            <img src="/videos.svg" alt="Videos" className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'No videos created yet' : `No ${filter} videos`}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start creating your first AI video!' 
                : `You don't have any ${filter} videos at the moment.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard"
                className="btn-primary"
              >
                Create Your First Ad
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filteredAds.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAds.slice(0, displayedAdsCount).map(ad => (
                <AdCard 
                  key={ad.id} 
                  ad={ad} 
                  onDelete={handleDeleteAd} 
                  onCancel={handleCancelAd}
                  onRetry={handleRetryAd}
                  userPlan={session?.user?.plan || undefined}
                />
              ))}
            </div>
            
            {/* Load more trigger */}
            {displayedAdsCount < filteredAds.length && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="animate-spin border-2 border-orange-500 border-t-transparent rounded-full w-5 h-5"></div>
                    Loading more videos...
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Scroll down for more videos</div>
                )}
              </div>
            )}
            
            {/* End of list indicator */}
            {displayedAdsCount >= filteredAds.length && filteredAds.length > 6 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                You've reached the end • {filteredAds.length} videos total
              </div>
            )}
          </>
        )}

        {/* Custom Retry Confirmation Modal */}
        {retryModal?.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2937] border border-gray-700 rounded-[20px] p-6 max-w-md w-full mx-4">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-white text-center mb-2">
                Retry Video Creation
              </h3>
              
              {/* Message */}
              <p className="text-gray-300 text-center mb-6">
                Are you sure you want to retry <strong>"{retryModal.brandName}"</strong>? This will spend credits again and create a new video.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRetryModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-[15px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRetryAd}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[15px] font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Retry Video
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// pages/dashboard.tsx (Final, Bulletproof Version)
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation } from '../components/AdCreationContext'
import axios from 'axios'
import Link from 'next/link'
import FirstTimeLoginPopup from '../components/FirstTimeLoginPopup'

// This is the main "guard" component. Its only job is to check authentication.
export default function Dashboard() {
  const { data: session, status } = useSession()

  // This effect handles redirecting unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn(); // Redirect to the login page
    }
  }, [status]);

  // This handles the loading state and prevents any further rendering
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-3xl text-white">Loading Dashboard...</h1>
      </div>
    );
  }

  // This handles the unauthenticated state by showing a placeholder
  // while the useEffect above triggers the redirect. This prevents crashes.
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-3xl text-white">Redirecting to login...</h1>
      </div>
    );
  }

  // If we reach this point, we are GUARANTEED to have a user session.
  // Now we can safely render the actual content.
  return <DashboardContent />;
}

// This is the actual content of the dashboard.
// It's only rendered when the user is authenticated.
function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { resetAdData } = useAdCreation()
  const [productUrl, setProductUrl] = useState('')
  const [recentVideos, setRecentVideos] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [freshCredits, setFreshCredits] = useState<number | null>(null)
  const [freshPlan, setFreshPlan] = useState<string | null>(null)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  
  // This check reassures TypeScript and handles any edge cases.
  // It should never be reached in practice but is required for the build to pass.
  if (!session || !session.user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <h1 className="text-3xl text-white">Loading user data...</h1>
        </div>
    );
  }

  useEffect(() => {
    if (router.isReady) {
      const { payment_success, payment_canceled, session_id, error_message } = router.query;
      let shouldClearQuery = false;

      if (payment_success === 'true' && session_id) {
        shouldClearQuery = true;
      } else if (payment_canceled === 'true') {
        shouldClearQuery = true;
      } else if (error_message) {
        shouldClearQuery = true;
      }

      if (shouldClearQuery) {
        const { pathname, query } = router;
        delete query.payment_success;
        delete query.payment_canceled;
        delete query.session_id;
        delete query.error_message;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query]);

  // Check if this is the user's first time logging in
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      const hasSeenWelcomePopup = localStorage.getItem('hasSeenWelcomePopup')
      if (!hasSeenWelcomePopup) {
        setShowWelcomePopup(true)
      }
    }
  }, [session, status])

  useEffect(() => {
    const handleCreditsUpdated = (event: CustomEvent) => {
      setFreshCredits(event.detail.credits)
      setFreshPlan(event.detail.plan)
    }

    const fetchFreshUserDataIfNeeded = async () => {
      if (!session.user?.credits && status === 'authenticated') {
        try {
          const response = await fetch('/api/user/current')
          if (response.ok) {
            const userData = await response.json()
            setFreshCredits(userData.credits)
            setFreshPlan(userData.plan)
          }
        } catch (error) {
          console.error('Failed to fetch fresh user data:', error)
        }
      }
    }

    fetchFreshUserDataIfNeeded()
    window.addEventListener('credits-updated', handleCreditsUpdated as EventListener)

    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdated as EventListener)
    }
  }, [session.user.credits, status])

  useEffect(() => {
    const fetchRecentVideos = async () => {
      if (status === 'authenticated') {
        try {
          const res = await axios.get('/api/ads')
          const videos = res.data.slice(0, 3)
          setRecentVideos(videos)
        } catch (e: any) {
          console.error('Error fetching videos:', e)
        } finally {
          setLoadingRecent(false)
        }
      }
    }
    fetchRecentVideos()
  }, [status])

  interface UserSession extends NonNullable<typeof session.user> {
    plan?: string;
    credits?: number;
  }
  const baseUser = session.user as UserSession;

  const user = {
    ...baseUser,
    credits: freshCredits !== null ? freshCredits : (baseUser?.credits ?? 0),
    plan: freshPlan !== null ? freshPlan : (baseUser?.plan || 'FREE')
  };

  const VIDEO_CREATION_COST = 10;
  const canCreateVideo = (user.credits ?? 0) >= VIDEO_CREATION_COST;

  const handleCreateVideo = () => {
    resetAdData()
    if (productUrl.trim()) {
      router.push(`/ad/create?productUrl=${encodeURIComponent(productUrl)}`)
    } else {
      router.push('/ad/create')
    }
  }

  const handleCreateFromScratch = () => {
    resetAdData()
    router.push('/ad/create')
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'RENDERING':
        return (
          <div className="flex items-center gap-2">
            <img src="/pending.svg" alt="Processing" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(33%) saturate(1582%) hue-rotate(358deg) brightness(97%) contrast(92%)' }} />
            <span className="text-orange-400 text-sm">Processing...</span>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-2">
            <img src="/success.svg" alt="Completed" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(96%) saturate(407%) hue-rotate(88deg) brightness(103%) contrast(93%)' }} />
            <span className="text-green-400 text-sm">Completed</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-2">
            <img src="/fail.svg" alt="Failed" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(94%) saturate(1455%) hue-rotate(339deg) brightness(97%) contrast(97%)' }} />
            <span className="text-red-400 text-sm">Failed</span>
          </div>
        );
      default:
        return <span className="text-gray-400 text-sm">{status}</span>;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold leading-tight sm:leading-relaxed tracking-wide mb-4 sm:mb-6 lg:mb-8">
          Welcome back, {' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
            {user.name?.split(' ')[0] || 'Creator'}
          </span>
        </h1>
        <p className="text-base sm:text-lg text-white max-w-2xl mx-auto px-4">
          Ready to create your next high-converting AI video?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Creation Panel - Left Side */}
        <div className="lg:col-span-2">
          <div className="rounded-[15px] sm:rounded-[20px] border border-gray-700 p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#111827' }}>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Create New Video</h2>

            <div className="space-y-6">
              {/* Product Link Input */}
              <div>
                <label className="block text-sm font-normal text-gray-300 mb-3">
                  Start with a product link (optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={productUrl}
                    onChange={e => setProductUrl(e.target.value)}
                    className="flex-1 bg-black border border-gray-700 rounded-[15px] px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="https://yourstore.com/product-page"
                  />
                  <button
                    className="btn-primary px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    onClick={handleCreateVideo}
                    disabled={!canCreateVideo}
                    title={!canCreateVideo ? `You need at least ${VIDEO_CREATION_COST} credits to create a video.` : 'Start with product link'}
                  >
                    <img src="/ai-star.svg" alt="AI" className="w-4 h-4" />
                    <span className="hidden sm:inline">Start with Link</span>
                    <span className="sm:hidden">Start</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-gray-400" style={{ backgroundColor: '#111827' }}>or</span>
                </div>
              </div>

              {/* From Scratch */}
              <button
                className="w-full py-4 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateFromScratch}
                disabled={!canCreateVideo}
                title={!canCreateVideo ? `You need at least ${VIDEO_CREATION_COST} credits to create a video.` : 'Create a video from scratch'}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="font-normal">Create Video From Scratch</span>
                </div>
              </button>

              {!canCreateVideo && (
                <div className="bg-red-900/20 border border-red-800 rounded-[15px] p-4">
                  <p className="text-red-400 text-sm text-center">
                    You need at least {VIDEO_CREATION_COST} credits to create a new video.
                    <Link href="/subscription" className="text-orange-400 hover:text-orange-300 ml-1 transition-colors">
                      Top up your credits
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Images Panel */}
          <div className="mt-6 sm:mt-8">
            <div className="rounded-[15px] sm:rounded-[20px] border border-gray-700 p-4 sm:p-6 lg:p-8 relative overflow-hidden" style={{ backgroundColor: '#111827' }}>
              {/* Background Images */}
              <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('/product-img.png')`
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              
              {/* Content */}
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Generate Product Images</h2>
                
                <div className="space-y-6">
                  <p className="text-gray-300 text-sm">
                    Create stunning AI-powered product images with professional scenes and lighting.
                  </p>
                  
                  <button
                    className="w-full py-4 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => router.push('/images/format')}
                    disabled={!canCreateVideo}
                    title={!canCreateVideo ? 'You need credits to generate product images.' : 'Generate product images'}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <img src="/ai-star.svg" alt="AI" className="w-4 h-4" />
                      <span className="font-normal">Generate Product Images</span>
                    </div>
                  </button>

                  {!canCreateVideo && (
                    <div className="bg-red-900/20 border border-red-800 rounded-[15px] p-4">
                      <p className="text-red-400 text-sm text-center">
                        You need credits to generate product images.
                        <Link href="/subscription" className="text-orange-400 hover:text-orange-300 ml-1 transition-colors">
                          Top up your credits
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4 sm:space-y-6">
          {/* Recent Activity */}
          <div className="rounded-[15px] sm:rounded-[20px] border border-gray-700 p-4 sm:p-6" style={{ backgroundColor: '#111827' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Recent Activity</h3>
              <Link href="/creations" className="text-orange-400 hover:text-orange-300 text-sm font-normal">
                View All
              </Link>
            </div>

            {loadingRecent ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-black rounded-[15px] p-3 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentVideos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <img src="/videos.svg" alt="Videos" className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">No videos created yet.</p>
                <p className="text-xs">Create your first video!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-black rounded-[15px] p-3 border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white text-sm font-normal truncate flex-1 min-w-0 mr-2" title={video.brandName || `Video #${video.id.slice(0, 6)}`}>
                        {video.brandName || `Video #${video.id.slice(0, 6)}`}
                      </h4>
                      {renderStatus(video.status)}
                    </div>
                    <p className="text-gray-400 text-xs">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="rounded-[15px] sm:rounded-[20px] border border-gray-700 p-4 sm:p-6" style={{ backgroundColor: '#111827' }}>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Account</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Credits</p>
                <div className="flex items-center justify-between bg-black border border-gray-700 rounded-[15px] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src="/credits.svg" alt="Credits" className="w-5 h-5" />
                    <span className="text-white font-normal">{user.credits ?? 0}</span>
                  </div>
                  <Link
                    href="/subscription"
                    className="text-orange-400 hover:text-orange-300 text-lg font-normal transition-colors"
                    title="Buy more credits"
                  >
                    +
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Plan</p>
                <span className="text-white font-normal">{user.plan || 'FREE'} Plan</span>
              </div>
              <Link
                href="/subscription"
                className="btn-primary px-4 py-2 text-sm block text-center"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* First Time Login Popup */}
      <FirstTimeLoginPopup 
        isOpen={showWelcomePopup} 
        onClose={() => setShowWelcomePopup(false)} 
      />
    </div>
  )
}

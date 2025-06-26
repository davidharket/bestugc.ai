// pages/dashboard.tsx
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation } from '../components/AdCreationContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { resetAdData } = useAdCreation()
  const [productUrl, setProductUrl] = useState('')
  const [recentAds, setRecentAds] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [stats, setStats] = useState({
    totalAds: 0,
    completedAds: 0,
    inProgress: 0
  })

  useEffect(() => {
    if (router.isReady) {
      const { payment_success, payment_canceled, session_id, error_message } = router.query;
      let shouldClearQuery = false;

      if (payment_success === 'true' && session_id) {
        toast.success('Payment successful! Your account has been updated.');
        shouldClearQuery = true;
      } else if (payment_canceled === 'true') {
        const message = Array.isArray(error_message) ? error_message[0] : error_message;
        toast.error(message || 'Payment canceled or failed. Please try again.');
        shouldClearQuery = true;
      } else if (error_message) {
        const message = Array.isArray(error_message) ? error_message[0] : error_message;
        toast.error(message);
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

  useEffect(() => {
    const fetchRecentAds = async () => {
      if (status === 'authenticated') {
        try {
          const res = await axios.get('/api/ads')
          const ads = res.data.slice(0, 3) // Only show 3 most recent
          setRecentAds(ads)
          
          // Calculate stats
          setStats({
            totalAds: res.data.length,
            completedAds: res.data.filter((ad: any) => ad.status === 'COMPLETED').length,
            inProgress: res.data.filter((ad: any) => ad.status === 'PENDING' || ad.status === 'RENDERING').length
          })
        } catch (e: any) {
          console.error('Error fetching ads:', e)
        } finally {
          setLoadingRecent(false)
        }
      }
    }

    fetchRecentAds()
    const interval = setInterval(fetchRecentAds, 30000) // Update every 30s
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

  interface UserSession extends NonNullable<typeof session.user> {
    plan?: string;
    credits?: number;
  }
  const user = session.user as UserSession;

  const AD_CREATION_COST = 10;
  const canCreateAd = user.credits !== undefined && user.credits >= AD_CREATION_COST;

  const handleCreateAd = () => {
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
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
            <span className="text-orange-400 text-sm">Processing...</span>
          </div>
        );
      case 'COMPLETED':
        return <span className="text-green-400 text-sm">✅ Completed</span>;
      case 'FAILED':
        return <span className="text-red-400 text-sm">❌ Failed</span>;
      default:
        return <span className="text-gray-400 text-sm">{status}</span>;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="text-gray-400">Ready to create your next viral video ad?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⭐</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Credits</p>
                <p className="text-2xl font-bold text-white">{user.credits ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Ads</p>
                <p className="text-2xl font-bold text-white">{stats.totalAds}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedAds}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Creation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Video Ad</h2>
              
              <div className="space-y-6">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Start with a product URL (optional)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={productUrl}
                      onChange={e => setProductUrl(e.target.value)}
                      className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="https://example.com/product"
                    />
                    <button 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCreateAd}
                      disabled={!canCreateAd}
                      title={!canCreateAd ? `You need at least ${AD_CREATION_COST} credits to create an ad.` : 'Start with product URL'}
                    >
                      Start with URL
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gray-900 text-gray-400">or</span>
                  </div>
                </div>

                {/* From Scratch */}
                <button 
                  className="w-full py-4 border-2 border-gray-700 text-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-400 hover:bg-black/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCreateFromScratch}
                  disabled={!canCreateAd}
                  title={!canCreateAd ? `You need at least ${AD_CREATION_COST} credits to create an ad.` : 'Create an ad from scratch'}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">✨</span>
                    <span className="font-medium">Create Ad From Scratch</span>
                  </div>
                </button>

                {!canCreateAd && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <p className="text-red-400 text-sm text-center">
                      You need at least {AD_CREATION_COST} credits to create a new ad. 
                      <Link href="/subscription" className="text-orange-400 hover:text-orange-300 ml-1 underline">
                        Top up your credits
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/creations" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500/50 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white">📹</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">My Creations</h3>
                    <p className="text-gray-400 text-sm">View all your video ads</p>
                  </div>
                </div>
              </Link>

              <Link href="/subscription" className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500/50 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white">💎</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Subscription</h3>
                    <p className="text-gray-400 text-sm">Manage plan & billing</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Link href="/creations" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                  View All
                </Link>
              </div>

              {loadingRecent ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-black rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentAds.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-3 block">🎬</span>
                  <p className="text-sm">No ads created yet.</p>
                  <p className="text-xs">Create your first video ad!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAds.map(ad => (
                    <div key={ad.id} className="bg-black rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white text-sm font-medium truncate">
                          {ad.brandName || `Ad #${ad.id.slice(0, 6)}`}
                        </h4>
                        {renderStatus(ad.status)}
                      </div>
                      <p className="text-gray-400 text-xs">
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Plan</span>
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-1 rounded text-white text-xs font-medium">
                    {user.plan || 'FREE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Credits</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{user.credits ?? 0}</span>
                    <Link href="/subscription" className="text-orange-400 hover:text-orange-300 text-xs">
                      +
                    </Link>
                  </div>
                </div>
              </div>

              <Link 
                href="/subscription"
                className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 block"
              >
                Upgrade Plan
              </Link>
            </div>

            {/* Help & Support */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Link href="/help" className="block text-orange-400 hover:text-orange-300 text-sm">
                  📚 Help Center
                </Link>
                <Link href="/about" className="block text-orange-400 hover:text-orange-300 text-sm">
                  🎯 How It Works
                </Link>
                <a href="mailto:support@ageco.ai" className="block text-orange-400 hover:text-orange-300 text-sm">
                  💬 Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
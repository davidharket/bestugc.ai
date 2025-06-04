import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation, AdCreationData } from '../components/AdCreationContext'
import axios from 'axios'

interface Ad extends AdCreationData {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  finalVideoUrl?: string
  isWatermarked?: boolean
}

export default function Dashboard() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const { resetAdData } = useAdCreation()
  const [productUrl, setProductUrl] = useState('')
  const [library, setLibrary] = useState<Ad[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(true)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [isBillingLoading, setIsBillingLoading] = useState(false)
  const [stripeMessage, setStripeMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    const fetchAds = async () => {
      if (status === 'authenticated') {
        setLoadingLibrary(true)
        setLibraryError(null)
        try {
          const res = await axios.get<Ad[]>('/api/ads')
          setLibrary(res.data)
        } catch (e: any) {
          console.error("Error fetching ads:", e)
          setLibraryError(e.response?.data?.error || 'Failed to load your creations.')
        } finally {
          setLoadingLibrary(false)
        }
      }
    }
    fetchAds()
  }, [status])

  // Effect to handle Stripe redirect query parameters
  useEffect(() => {
    if (router.isReady) {
      const { payment_success, payment_canceled, session_id } = router.query;
      let shouldClearQuery = false;

      if (payment_success === 'true' && session_id) {
        setStripeMessage({ type: 'success', text: 'Payment successful! Your account has been updated.' });
        updateSession(); // Refetch session to get updated credits/plan
        shouldClearQuery = true;
      } else if (payment_canceled === 'true') {
        setStripeMessage({ type: 'error', text: 'Payment canceled or failed. Please try again or contact support if the issue persists.' });
        shouldClearQuery = true;
      }

      if (shouldClearQuery) {
        // Clean the query parameters from URL without reloading the page
        const { pathname, query } = router;
        delete query.payment_success;
        delete query.payment_canceled;
        delete query.session_id;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, updateSession, router]);

  if (status === 'loading') return <div className="p-8">Loading session...</div>
  if (status === 'unauthenticated' || !session?.user) {
    signIn()
    return null
  }

  interface UserSession extends NonNullable<typeof session.user> {
    plan?: string;
    credits?: number;
  }
  const user = session.user as UserSession;

  const AD_CREATION_COST = 10; // Define here for frontend use as well
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

  const redirectToCheckout = async (itemType: 'plan' | 'credits', itemId: string) => {
    if (!session?.user) {
      signIn()
      return
    }
    setIsBillingLoading(true)
    try {
      const { data } = await axios.post('/api/stripe/checkout-sessions', {
        itemType,
        itemId,
      })
      if (data.url) {
        router.push(data.url)
      } else {
        setLibraryError('Could not initiate payment. Please try again.')
      }
    } catch (error: any) {
      console.error("Error redirecting to checkout:", error)
      setLibraryError(error.response?.data?.error || 'Failed to start payment process.')
    } finally {
      setIsBillingLoading(false)
    }
  }

  const redirectToCustomerPortal = async () => {
    if (!session?.user) return
    setIsBillingLoading(true)
    try {
      const { data } = await axios.post('/api/stripe/customer-portal');
      if (data.url) {
        router.push(data.url);
      }
    } catch (error: any) {
      console.error("Error redirecting to customer portal:", error);
      setLibraryError(error.response?.data?.error || 'Could not open customer portal.');
    } finally {
      setIsBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="text-right">
                <p className="text-sm text-gray-600">Plan: <span className="font-semibold text-blue-600">{user.plan || 'FREE'}</span></p>
                <p className="text-sm text-gray-600">Credits: <span className="font-semibold text-blue-600">{user.credits ?? 0}</span></p>
            </div>
        </div>

        <div className="mb-10 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Ad</h2>
          <label className="block mb-2 font-medium text-gray-700">Enter product URL (optional)</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={productUrl}
              onChange={e => setProductUrl(e.target.value)}
              className="border rounded px-3 py-2 flex-grow focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://example.com/product"
            />
            <button 
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateAd}
                disabled={isBillingLoading || !canCreateAd}
                title={!canCreateAd ? `You need at least ${AD_CREATION_COST} credits to create an ad.` : 'Start with product URL'}
            >
                Start with URL
            </button>
          </div>
          <div className="text-center my-3 text-gray-500">or</div>
          <button 
            className="w-full px-4 py-2 border rounded hover:bg-gray-100 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateFromScratch}
            disabled={isBillingLoading || !canCreateAd}
            title={!canCreateAd ? `You need at least ${AD_CREATION_COST} credits to create an ad.` : 'Create an ad from scratch'}
          >
            Create Ad From Scratch
          </button>
          {!canCreateAd && (
            <p className="text-center text-red-500 text-sm mt-3">
              You need at least {AD_CREATION_COST} credits to create a new ad. Please top up your credits.
            </p>
          )}
        </div>

        <div className="mb-10 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Manage Account & Billing</h2>
            {libraryError && !stripeMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-[10px]">{libraryError}</div>}
            {stripeMessage && (
              <div className={`mb-4 p-3 rounded-[10px] text-sm ${stripeMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stripeMessage.text}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg mb-2">Basic Plan</h3>
                    <p className="text-sm text-gray-600 mb-1">499kr - 100 Credits</p>
                    <button onClick={() => redirectToCheckout('plan', 'BASIC')} disabled={isBillingLoading || user.plan === 'BASIC'} className="w-full mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300">{user.plan === 'BASIC' ? 'Current Plan' : 'Choose Basic'}</button>
                </div>
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg mb-2">Pro Plan</h3>
                    <p className="text-sm text-gray-600 mb-1">999kr - 250 Credits</p>
                    <button onClick={() => redirectToCheckout('plan', 'PRO')} disabled={isBillingLoading || user.plan === 'PRO'} className="w-full mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300">{user.plan === 'PRO' ? 'Current Plan' : 'Choose Pro'}</button>
                </div>
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg mb-2">Premium Plan</h3>
                    <p className="text-sm text-gray-600 mb-1">1499kr - 400 Credits</p>
                    <button onClick={() => redirectToCheckout('plan', 'PREMIUM')} disabled={isBillingLoading || user.plan === 'PREMIUM'} className="w-full mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300">{user.plan === 'PREMIUM' ? 'Current Plan' : 'Choose Premium'}</button>
                </div>
                 <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="font-semibold text-lg mb-2">Manage Subscription</h3>
                    <p className="text-sm text-gray-600 mb-1">View invoices or cancel plan.</p>
                    <button onClick={redirectToCustomerPortal} disabled={isBillingLoading || user.plan === 'FREE'} className="w-full mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300">Go to Portal</button>
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Top-up Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-md mb-1">50 Credits</h3>
                    <button onClick={() => redirectToCheckout('credits', 'TOPUP_50')} disabled={isBillingLoading} className="w-full mt-2 bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 disabled:bg-gray-300">Buy 50 Credits</button>
                </div>
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-md mb-1">100 Credits</h3>
                    <button onClick={() => redirectToCheckout('credits', 'TOPUP_100')} disabled={isBillingLoading} className="w-full mt-2 bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 disabled:bg-gray-300">Buy 100 Credits</button>
                </div>
                <div className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-md mb-1">200 Credits</h3>
                    <button onClick={() => redirectToCheckout('credits', 'TOPUP_200')} disabled={isBillingLoading} className="w-full mt-2 bg-indigo-500 text-white py-2 px-3 rounded hover:bg-indigo-600 disabled:bg-gray-300">Buy 200 Credits</button>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Previous Creations</h2>
            {loadingLibrary && <div className="text-center text-gray-500 py-4">Loading your creations...</div>}
            {!loadingLibrary && !libraryError && library.length === 0 && (
              <div className="border rounded p-4 text-gray-400">(No previous creations found. Create one above!)</div>
            )}
            {!loadingLibrary && !libraryError && library.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {library.map(ad => (
                  <div key={ad.id} className="border rounded p-4 bg-white shadow">
                    <h3 className="font-semibold mb-1">{ad.brandName || ad.productUrl || 'Untitled Ad'}</h3>
                    <p className="text-xs text-gray-500 mb-2">Created: {new Date(ad.createdAt).toLocaleDateString()}</p>
                    <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">
                      {ad.finalVideoUrl ? <video src={ad.finalVideoUrl} className="w-full h-full object-cover" controls /> : '(Video Preview Placeholder)'}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Format: {ad.format || 'N/A'}, Duration: {ad.duration || 'N/A'}s</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
} 
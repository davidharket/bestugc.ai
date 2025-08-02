// pages/subscription.tsx
import { useSession, signIn } from 'next-auth/react'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { updateSubscription } from '../lib/credit-operations'

const plans = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: '499kr',
    priceNum: 499,
    credits: 100,
    savings: '0% savings',
    features: [
      '100 Credits per month',
      'Standard AI Avatars',
      'All Video Templates',
      'Multiple Formats (9:16, 16:9)',
      'Email Support',
      'HD Video Quality'
    ],
    popular: false,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '999kr',
    priceNum: 999,
    credits: 250,
    savings: '20% savings',
    features: [
      '250 Credits per month',
      'Premium AI Avatars',
      'Advanced Templates',
      'Custom Branding',
      'No Watermark',
      'Priority Support',
      '4K Video Quality'
    ],
    popular: true,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '1499kr',
    priceNum: 1499,
    credits: 400,
    savings: '25% savings',
    features: [
      '400 Credits per month',
      'All Premium Features',
      'API Access',
      'White-label Solution',
      'Dedicated Account Manager',
      '24/7 Support',
      'Custom Integrations'
    ],
    popular: false,
    color: 'from-purple-500 to-purple-600'
  }
];

const creditPacks = [
  {
    id: 'TOPUP_10',
    name: '10 Credits',
    price: '49kr',
    priceNum: 49,
    credits: 10,
    bonus: null
  },
  {
    id: 'TOPUP_20',
    name: '20 Credits',
    price: '89kr',
    priceNum: 89,
    credits: 20,
    bonus: '10% savings',
    popular: true
  },
  {
    id: 'TOPUP_30',
    name: '30 Credits',
    price: '119kr',
    priceNum: 119,
    credits: 30,
    bonus: '20% savings'
  }
];

export default function Subscription() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)

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

  const redirectToCheckout = async (itemType: 'plan' | 'credits', itemId: string) => {
    setIsLoading(true)
    setLoadingItem(itemId)
    
    try {
      await updateSubscription(async () => {
        const { data } = await axios.post('/api/stripe/checkout-sessions', {
          itemType,
          itemId,
        })
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.error('Could not initiate payment. Please try again.')
        }
        return data
      })
    } catch (error: any) {
      console.error("Error redirecting to checkout:", error)
      toast.error(error.response?.data?.error || 'Failed to start payment process.')
    } finally {
      setIsLoading(false)
      setLoadingItem(null)
    }
  }

  const redirectToCustomerPortal = async () => {
    setIsLoading(true)
    
    try {
      const { data } = await axios.post('/api/stripe/customer-portal');
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error("Error redirecting to customer portal:", error);
      toast.error(error.response?.data?.error || 'Could not open customer portal.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = plans.find(plan => plan.id === user.plan) || null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Subscription & Credits</h1>
            <p className="text-gray-400">Manage your plan and top up credits</p>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 sm:mt-0 text-orange-400 hover:text-orange-300 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Current Status */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💎</div>
              <p className="text-gray-400 text-sm">Current Plan</p>
              <p className="text-xl font-bold text-white">{user.plan || 'FREE'}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-gray-400 text-sm">Available Credits</p>
              <p className="text-xl font-bold text-orange-400">{user.credits ?? 0}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎬</div>
              <p className="text-gray-400 text-sm">Cost per Video</p>
              <p className="text-xl font-bold text-white">10 credits</p>
            </div>
          </div>
          
          {currentPlan && (
            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
              <p className="text-gray-400 mb-3">You're on the <span className="text-white font-medium">{currentPlan.name}</span> plan</p>
              <button
                onClick={redirectToCustomerPortal}
                disabled={isLoading}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            </div>
          )}
        </div>

        {/* Plans Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Unlock more credits and premium features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gray-900 border-2 rounded-xl p-6 transition-all duration-200 hover:scale-105 ${
                  plan.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                    : user.plan === plan.id
                    ? 'border-green-500 shadow-lg shadow-green-500/25'
                    : 'border-gray-800 hover:border-orange-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {user.plan === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-lg">/month</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white text-sm font-medium`}>
                    {plan.credits} Credits Included
                  </div>
                  {plan.savings && plan.savings !== '0% savings' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded-full">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => redirectToCheckout('plan', plan.id)}
                  disabled={isLoading || user.plan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg'
                      : user.plan === plan.id
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {loadingItem === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></div>
                      Loading...
                    </div>
                  ) : user.plan === plan.id ? (
                    'Current Plan'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Top-ups */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Need More{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Credits?
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Top up anytime to keep creating amazing videos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`bg-gray-900 border-2 rounded-xl p-6 transition-all duration-200 hover:scale-105 ${
                  pack.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                    : 'border-gray-800 hover:border-orange-500/50'
                }`}
              >
                {pack.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Best Value
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">⭐</div>
                  <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-white">{pack.price}</span>
                  </div>
                  {pack.bonus && (
                    <div className="inline-flex items-center px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
                      {pack.bonus}
                    </div>
                  )}
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm">
                    {(pack.priceNum / pack.credits).toFixed(1)}kr per credit
                  </p>
                </div>

                <button
                  onClick={() => redirectToCheckout('credits', pack.id)}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                    pack.popular
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {loadingItem === pack.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></div>
                      Loading...
                    </div>
                  ) : (
                    `Buy ${pack.credits} Credits`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-gray-900 rounded-xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How do credits work?</h3>
              <p className="text-gray-400 text-sm">Each video ad creation costs 10 credits. Credits never expire and can be used anytime.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I change my plan?</h3>
              <p className="text-gray-400 text-sm">Yes! You can upgrade, downgrade, or cancel your subscription anytime through the billing portal.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400 text-sm">We accept all major credit cards, debit cards, and digital wallets through Stripe.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a free trial?</h3>
              <p className="text-gray-400 text-sm">Yes! New users get 20 free credits to create 2 video ads and test our platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
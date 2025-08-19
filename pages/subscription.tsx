// pages/subscription.tsx
import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
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
    popular: false
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
    popular: true
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '1499kr',
    priceNum: 1499,
    credits: 400,
    savings: '33% savings',
    features: [
      '400 Credits per month',
      'Exclusive AI Avatars',
      'White-label Solution',
      'API Access',
      'Custom Integrations',
      '24/7 Dedicated Support',
      '8K Video Quality'
    ],
    popular: false
  }
]

const creditPacks = [
  {
    id: 'TOPUP_10',
    name: '10 Credits',
    price: '49kr',
    credits: 10,
    pricePerCredit: '4.9kr'
  },
  {
    id: 'TOPUP_20',
    name: '20 Credits',
    price: '89kr',
    credits: 20,
    pricePerCredit: '4.5kr',
    popular: true,
    savings: 'Save 10%'
  },
  {
    id: 'TOPUP_30',
    name: '30 Credits',
    price: '119kr',
    credits: 30,
    pricePerCredit: '4.0kr',
    savings: 'Save 20%'
  }
]

export default function Subscription() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileChanged, setProfileChanged] = useState(false)

  // Initialize profile form with session data
  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || '',
        email: session.user.email || ''
      })
    }
  }, [session])

  // Check if profile form has changed
  useEffect(() => {
    if (session?.user) {
      const hasChanged = 
        profileForm.name !== (session.user.name || '') ||
        profileForm.email !== (session.user.email || '')
      setProfileChanged(hasChanged)
    }
  }, [profileForm, session])

  const handleProfileChange = (field: 'name' | 'email', value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  const handleProfileSave = async () => {
    setProfileLoading(true)
    
    try {
      const response = await axios.put('/api/user/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      })

      if (response.data.user) {
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: response.data.user.name,
            email: response.data.user.email
          }
        })
        
        // Dispatch global event for other components
        window.dispatchEvent(new CustomEvent('session-refresh'))
        
        toast.success('Profile updated successfully!')
        setProfileChanged(false)
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileCancel = () => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || '',
        email: session.user.email || ''
      })
      setProfileChanged(false)
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin border-4 border-orange-500 border-t-transparent rounded-full w-12 h-12"></div>
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

  const redirectToCheckout = async (itemId: string) => {
    setIsLoading(true)
    setLoadingItem(itemId)
    
    try {
      await updateSubscription(async () => {
        const { data } = await axios.post('/api/stripe/checkout-sessions', {
          items: [{ id: itemId }],
          currentCredits: user.credits
        });
        
        if (data.url) {
          window.location.href = data.url;
        }
        
        return data;
      });
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast.error(error.response?.data?.error || 'Subscription update failed.');
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-7xl font-semibold leading-relaxed tracking-wide mb-8">
            Your{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
              Account
            </span>
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Manage your subscription, settings, and account preferences
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-white text-center mb-12">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-[20px] border-2 p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                    : user.plan === plan.id
                    ? 'border-green-500 shadow-lg shadow-green-500/25'
                    : 'border-gray-700 hover:border-orange-500/50'
                }`} 
                style={{ backgroundColor: plan.popular ? 'rgba(232, 90, 18, 0.05)' : '#111827' }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-normal">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-semibold text-white mb-1">{plan.price}</div>
                  <p className="text-gray-400 text-sm">/month</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-normal mt-3" style={{ backgroundColor: plan.popular ? '#e85a12' : '#374151' }}>
                    {plan.credits} credits/month
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img src="/success.svg" alt="Included" className="w-4 h-4 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => redirectToCheckout(plan.id)}
                  disabled={user.plan === plan.id || loadingItem === plan.id}
                  className={`w-full py-4 px-6 rounded-[15px] text-lg font-normal transition-all duration-300 transform hover:scale-105 ${
                    user.plan === plan.id
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : plan.popular 
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                  style={{ fontWeight: '400' }}
                >
                  {loadingItem === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin border-4 border-current border-t-transparent rounded-full w-4 h-4"></div>
                      Processing...
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
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-white text-center mb-4">Need More Credits?</h2>
          <p className="text-gray-400 text-center mb-12">Top up your account with additional credits anytime</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-[20px] border-2 p-6 transition-all duration-300 hover:scale-105 ${
                  pack.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                    : 'border-gray-700 hover:border-orange-500/50'
                }`}
                style={{ backgroundColor: pack.popular ? 'rgba(232, 90, 18, 0.05)' : '#111827' }}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-normal">
                      Best Value
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="text-3xl font-semibold text-white mb-2">{pack.credits}</div>
                  <p className="text-gray-400 text-sm mb-4">Credits</p>
                  <div className="text-2xl font-semibold text-orange-400 mb-1">{pack.price}</div>
                  {pack.savings && (
                    <div className="mt-2">
                      <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-xs">
                        {pack.savings}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => redirectToCheckout(pack.id)}
                  disabled={loadingItem === pack.id}
                  className={`w-full py-3 px-4 rounded-[15px] text-sm font-normal transition-all duration-300 transform hover:scale-105 ${
                    pack.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                  style={{ fontWeight: '400' }}
                >
                  {loadingItem === pack.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin border-4 border-current border-t-transparent rounded-full w-4 h-4"></div>
                      Processing...
                    </div>
                  ) : (
                    `Buy ${pack.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="rounded-[20px] border border-gray-700 p-8 mb-16" style={{ backgroundColor: '#111827' }}>
          <h2 className="text-2xl font-semibold text-white mb-6">Profile Settings</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter your display name"
                  disabled={profileLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter your email"
                  disabled={profileLoading}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleProfileSave}
                disabled={!profileChanged || profileLoading || !profileForm.name.trim() || !profileForm.email.trim()}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button 
                onClick={handleProfileCancel}
                disabled={!profileChanged || profileLoading}
                className="btn-secondary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
            {profileChanged && (
              <p className="text-orange-400 text-sm">You have unsaved changes</p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-[20px] border border-gray-700 p-8 mb-16" style={{ backgroundColor: '#111827' }}>
          <h2 className="text-2xl font-semibold text-white mb-6">Preferences</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Email Notifications</h3>
                <p className="text-gray-400 text-sm">Receive notifications about your video processing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Marketing Emails</h3>
                <p className="text-gray-400 text-sm">Receive updates about new features and promotions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Auto-download Videos</h3>
                <p className="text-gray-400 text-sm">Automatically download completed videos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </div>


        {/* Account Actions */}
        <div className="rounded-[20px] border border-red-800 p-8 mb-16" style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)' }}>
          <h2 className="text-2xl font-semibold text-white mb-6">Account Actions</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Sign Out</h3>
                <p className="text-gray-400 text-sm">Sign out of your account on this device</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-400 font-medium">Delete Account</h3>
                <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-semibold text-white mb-8">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="rounded-[20px] border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
              <div className="p-6">
                <h3 className="text-white font-semibold mb-2">Can I change my plan anytime?</h3>
                <p className="text-gray-300 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
              <div className="p-6">
                <h3 className="text-white font-semibold mb-2">Do credits expire?</h3>
                <p className="text-gray-300 text-sm">No, credits never expire. You can use them whenever you want to create videos.</p>
              </div>
            </div>
            <div className="rounded-[20px] border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
              <div className="p-6">
                <h3 className="text-white font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-300 text-sm">We accept all major credit cards, PayPal, and bank transfers through Stripe.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-red-800 max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <img src="/trash.svg" alt="Delete" className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Delete Account</h3>
                <p className="text-gray-400 text-sm">
                  This action cannot be undone. All your videos, credits, and account data will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
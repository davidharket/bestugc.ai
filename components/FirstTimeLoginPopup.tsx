import { useState } from 'react'
import { useRouter } from 'next/router'
import { updateSubscription } from '../lib/credit-operations'
import axios from 'axios'

const plans = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: '$49.90',
    priceNum: 49.90,
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
    price: '$99.90',
    priceNum: 99.90,
    credits: 250,
    savings: '20% savings',
    features: [
      '250 Credits per month',
      'Premium AI Avatars',
      'Advanced Templates',
      'Custom Branding',
      'No Watermark',
      'Priority Support',
    ],
    popular: true
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '$149.90',
    priceNum: 149.90,
    credits: 400,
    savings: '33% savings',
    features: [
      '400 Credits per month',
      'Exclusive AI Avatars',
      'White-label Solution',
      'API Access',
      'Custom Integrations',
      '24/7 Human Support',
    ],
    popular: false
  }
]

interface FirstTimeLoginPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function FirstTimeLoginPopup({ isOpen, onClose }: FirstTimeLoginPopupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true)
    setLoadingItem(planId)
    
    try {
      await updateSubscription(async () => {
        const { data } = await axios.post('/api/stripe/checkout-sessions', {
          itemType: 'plan',
          itemId: planId
        })
        
        if (data.url) {
          window.location.href = data.url
        }
        
        return data
      })
    } catch (error) {
      console.error('Error subscribing:', error)
    } finally {
      setIsLoading(false)
      setLoadingItem(null)
    }
  }

  const handleContinueFree = () => {
    // Mark that user has seen the popup
    localStorage.setItem('hasSeenWelcomePopup', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-[25px] border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome to Best UGC! 🎉
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Choose the perfect plan to start creating amazing AI video content. You can always upgrade later.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-[20px] border-2 p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                    : 'border-gray-700 hover:border-orange-500/50'
                }`} 
                style={{ 
                  backgroundColor: plan.popular 
                    ? 'rgba(232, 90, 18, 0.05)' 
                    : '#000000'
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-left mb-8">
                  <h3 className="text-2xl font-normal text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-semibold text-white mb-1">{plan.price}</div>
                  <p className="text-gray-400 text-sm">/month</p>
                  <div className="inline-flex items-center px-3 border border-[#eb590c] py-1 rounded-[8px] text-white text-sm font-normal mt-3 gap-2" style={{ backgroundColor: plan.popular ? '#e85a12' : '#111111' }}>
                    <img src="/credits.svg" style={{ width: 'auto', height: '12px' }} alt="Credits" />
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
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-[15px] text-lg font-normal transition-all duration-300 transform ${
                    plan.popular 
                      ? 'btn-primary'
                      : 'btn-secondary'
                  } ${
                    isLoading && loadingItem === plan.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  style={{ fontWeight: '400' }}
                >
                  {isLoading && loadingItem === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Continue with Free Plan Button */}
          <button
            onClick={handleContinueFree}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white py-4 px-8 rounded-[15px] font-medium transition-all duration-200 hover:transform hover:scale-[1.02]"
          >
            Continue with Free Plan
          </button>

          {/* Close button */}
          <button
            onClick={handleContinueFree}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
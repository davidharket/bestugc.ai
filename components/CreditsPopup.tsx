// components/CreditsPopup.tsx
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { purchaseCredits } from '../lib/credit-operations'

interface CreditsPopupProps {
  isOpen: boolean
  onClose: () => void
  currentCredits: number
}

const creditPacks = [
  {
    id: 'TOPUP_10',
    name: '10 Credits',
    price: '49kr',
    credits: 10,
    pricePerCredit: '4.9kr',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'TOPUP_20',
    name: '20 Credits',
    price: '89kr',
    credits: 20,
    pricePerCredit: '4.5kr',
    popular: true,
    savings: '10% savings',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'TOPUP_30',
    name: '30 Credits',
    price: '119kr',
    credits: 30,
    pricePerCredit: '4.0kr',
    savings: '20% savings',
    color: 'from-purple-500 to-purple-600'
  }
]

export const CreditsPopup: React.FC<CreditsPopupProps> = ({ isOpen, onClose, currentCredits }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)

  if (!isOpen) return null

  const redirectToCheckout = async (itemId: string) => {
    setIsLoading(true)
    setLoadingItem(itemId)
    
    try {
      await purchaseCredits(async () => {
        const { data } = await axios.post('/api/stripe/checkout-sessions', {
          itemType: 'credits',
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Top Up Credits</h2>
              <p className="text-gray-400 mt-1">You currently have {currentCredits} credits</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Info */}
          <div className="bg-black/50 rounded-lg p-4 mb-6 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎬</span>
              </div>
              <div>
                <p className="text-white font-medium">Each video ad costs 10 credits</p>
                <p className="text-gray-400 text-sm">Credits never expire and can be used anytime</p>
              </div>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="space-y-4">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative border-2 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] ${
                  pack.popular 
                    ? 'border-orange-500 bg-gradient-to-r from-orange-500/10 to-orange-600/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:border-orange-500/50'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-4">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {pack.savings && (
                  <div className="absolute -top-2 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {pack.savings}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${pack.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white text-xl">⭐</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                      <p className="text-gray-400 text-sm">{pack.pricePerCredit} per credit</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-white mb-1">{pack.price}</div>
                    <button
                      onClick={() => redirectToCheckout(pack.id)}
                      disabled={isLoading}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                        pack.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {loadingItem === pack.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Credits never expire</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Instant credit delivery</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">
                Need a subscription instead?{' '}
                <button 
                  onClick={onClose}
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  View subscription plans
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
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
    credits: 10
  },
  {
    id: 'TOPUP_20',
    name: '20 Credits',
    price: '89kr',
    credits: 20,
    popular: true,
    savings: '10% savings'
  },
  {
    id: 'TOPUP_30',
    name: '30 Credits',
    price: '119kr',
    credits: 30,
    savings: '20% savings'
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
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-lg w-full">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Top Up Credits</h2>
              <p className="text-gray-400 text-sm mt-1">You currently have {currentCredits} credits</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Quick Info */}
          <div className="bg-black/50 rounded-lg p-3 mb-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-600 rounded-lg flex items-center justify-center">
                <img src="/videos.svg" alt="Videos" className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Each video ad costs 10 credits</p>
                <p className="text-gray-400 text-xs">Credits never expire and can be used anytime</p>
              </div>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="space-y-3">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative border rounded-lg p-3 transition-all duration-200 ${
                  pack.popular 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:border-orange-500/50'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-3">
                    <span className="bg-gradient-to-r from-orange-600 to-orange-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <img src="/credits.svg" alt="Credits" className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-white">{pack.name}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-medium text-white mb-1">{pack.price}</div>
                    <button
                      onClick={() => redirectToCheckout(pack.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-sm transition-all duration-200 disabled:opacity-50 text-sm ${
                        pack.popular
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                    >
                      {loadingItem === pack.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin border-2 border-current border-t-transparent rounded-full w-3 h-3"></div>
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
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Never expire</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Instant delivery</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-green-400">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <p className="text-gray-500 text-xs">
                Need a subscription?{' '}
                <button 
                  onClick={() => {
                    onClose();
                    window.location.href = '/subscription';
                  }}
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  View plans
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
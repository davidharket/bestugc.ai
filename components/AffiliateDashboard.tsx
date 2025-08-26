// components/AffiliateDashboard.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import BarLoader from './BarLoader'

interface AffiliateStats {
  totalClicks: number
  totalSignups: number
  conversionRate: number
  pendingCommissions: number
  approvedCommissions: number
  totalPayouts: number
  totalEarnings: number
  availableForPayout: number
}

interface AffiliateData {
  id: string
  affiliateCode: string
  commissionRate: number
  isActive: boolean
  totalEarnings: number
  paidOut: number
  pendingPayout: number
  createdAt: string
}

interface Referral {
  id: string
  status: string
  signupDate: string
  conversionDate?: string
  firstPurchaseAmount?: number
  totalSpent: number
  user: {
    name: string
    email: string
    createdAt: string
    plan: string
  }
}

export default function AffiliateDashboard() {
  const { data: session, status } = useSession()
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAffiliateData()
    }
  }, [status])

  const fetchAffiliateData = async () => {
    try {
      const response = await fetch('/api/affiliate/stats')
      const data = await response.json()

      if (response.ok) {
        setAffiliate(data.affiliate)
        setStats(data.stats)
        setReferrals(data.referrals)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load affiliate data')
    } finally {
      setLoading(false)
    }
  }

  const registerAsAffiliate = async () => {
    try {
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Successfully registered as affiliate!')
        // Refresh the page to update the interface
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give time for the toast to show
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Failed to register as affiliate')
    }
  }

  const copyAffiliateLink = () => {
    if (!affiliate) return
    
    const link = `${window.location.origin}?ref=${affiliate.affiliateCode}`
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true)
      toast.success('Affiliate link copied!')
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BarLoader size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please sign in to access the affiliate dashboard.</p>
          <Link href="/auth/signin" className="btn-primary px-6 py-3">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error === 'User is not an affiliate') {
    return (
      <div className="min-h-screen bg-black py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Become an Affiliate</h1>
          <p className="text-xl text-gray-300 mb-8">
            Join our affiliate program and earn 10% commission on every referral for life!
          </p>
          <button
            onClick={registerAsAffiliate}
            className="btn-primary px-8 py-4"
          >
            Register as Affiliate
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!affiliate || !stats) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
            Affiliate{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
              Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Track your earnings and manage your affiliate program
          </p>
        </div>

        {/* Affiliate Link Section */}
        <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Affiliate Link</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-black border border-gray-600 rounded-lg px-4 py-3">
              <code className="text-white text-sm break-all">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${affiliate.affiliateCode}`}
              </code>
            </div>
            <button
              onClick={copyAffiliateLink}
              className={`btn-secondary px-6 py-3 transition-all duration-200 ${
                copySuccess 
                  ? 'text-white' 
                  : 'hover:text-white'
              }`}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p><strong>Affiliate Code:</strong> {affiliate.affiliateCode}</p>
            <p><strong>Commission Rate:</strong> {(affiliate.commissionRate * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Total Clicks</h3>
            <p className="text-3xl font-semibold text-orange-600">{stats.totalClicks}</p>
          </div>
          
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Signups</h3>
            <p className="text-3xl font-semibold text-orange-600">{stats.totalSignups}</p>
          </div>
          
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Conversion Rate</h3>
            <p className="text-3xl font-semibold text-orange-600">{stats.conversionRate}%</p>
          </div>
          
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Total Earnings</h3>
            <p className="text-3xl font-semibold text-orange-600">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Pending Commissions</h3>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.pendingCommissions)}</p>
            <p className="text-sm text-gray-400">Awaiting approval</p>
          </div>
          
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Available for Payout</h3>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.availableForPayout)}</p>
            <p className="text-sm text-gray-400">Ready to be paid</p>
          </div>
          
          <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Total Paid Out</h3>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(stats.totalPayouts)}</p>
            <p className="text-sm text-gray-400">Lifetime payments</p>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-gray-900 rounded-[20px] border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Your Referrals</h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No referrals yet</p>
              <p className="text-gray-500 text-sm mt-2">Share your affiliate link to start earning!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-4 text-white font-semibold">User</th>
                    <th className="pb-4 text-white font-semibold">Plan</th>
                    <th className="pb-4 text-white font-semibold">Status</th>
                    <th className="pb-4 text-white font-semibold">Signup Date</th>
                    <th className="pb-4 text-white font-semibold">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-gray-800">
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{referral.user.name}</div>
                          <div className="text-sm text-gray-400">{referral.user.email}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          {referral.user.plan}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-4">{formatDate(referral.signupDate)}</td>
                      <td className="py-4">{formatCurrency(referral.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

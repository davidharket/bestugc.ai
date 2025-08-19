// pages/api/affiliate/stats.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { getAffiliateStats, prisma } from '../../../lib/affiliate-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get user's affiliate record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { affiliate: true }
    })

    if (!user?.affiliate) {
      return res.status(404).json({ error: 'User is not an affiliate' })
    }

    const stats = await getAffiliateStats(user.affiliate.id)

    if (!stats) {
      return res.status(404).json({ error: 'Affiliate not found' })
    }

    // Don't expose sensitive user data
    const sanitizedReferrals = stats.affiliate.referrals.map(referral => ({
      id: referral.id,
      status: referral.status,
      signupDate: referral.signupDate,
      conversionDate: referral.conversionDate,
      firstPurchaseAmount: referral.firstPurchaseAmount,
      totalSpent: referral.totalSpent,
      user: {
        name: referral.user.name,
        email: referral.user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
        createdAt: referral.user.createdAt,
        plan: referral.user.plan
      }
    }))

    const response = {
      affiliate: {
        id: stats.affiliate.id,
        affiliateCode: stats.affiliate.affiliateCode,
        commissionRate: stats.affiliate.commissionRate,
        isActive: stats.affiliate.isActive,
        totalEarnings: stats.affiliate.totalEarnings,
        paidOut: stats.affiliate.paidOut,
        pendingPayout: stats.affiliate.pendingPayout,
        createdAt: stats.affiliate.createdAt
      },
      referrals: sanitizedReferrals,
      stats: stats.stats
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
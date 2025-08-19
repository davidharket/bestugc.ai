// pages/api/admin/affiliates.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma, processMonthlyPayouts } from '../../../lib/affiliate-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is admin (you should implement proper admin check)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.email !== 'david@drift.as') { // Replace with your admin email
      return res.status(403).json({ error: 'Forbidden - Admin access required' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetAffiliates(req, res)
      case 'POST':
        return await handleAffiliateActions(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in admin affiliates API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGetAffiliates(req: NextApiRequest, res: NextApiResponse) {
  const affiliates = await prisma.affiliate.findMany({
    include: {
      user: {
        select: { email: true, name: true, createdAt: true }
      },
      referrals: {
        include: {
          user: {
            select: { email: true, name: true, plan: true, createdAt: true }
          }
        }
      },
      commissions: {
        where: { status: { in: ['PENDING', 'APPROVED'] } }
      },
      payouts: true,
      _count: {
        select: {
          referrals: true,
          commissions: true,
          clicks: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const affiliateStats = affiliates.map(affiliate => {
    const pendingCommissions = affiliate.commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0)
    
    const approvedCommissions = affiliate.commissions
      .filter(c => c.status === 'APPROVED')
      .reduce((sum, c) => sum + c.amount, 0)

    const totalPayouts = affiliate.payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0)

    return {
      ...affiliate,
      stats: {
        pendingCommissions,
        approvedCommissions,
        totalPayouts,
        conversionRate: affiliate._count.clicks > 0 
          ? ((affiliate._count.referrals / affiliate._count.clicks) * 100).toFixed(2)
          : '0.00'
      }
    }
  })

  res.status(200).json(affiliateStats)
}

async function handleAffiliateActions(req: NextApiRequest, res: NextApiResponse) {
  const { action, affiliateId, commissionIds } = req.body

  switch (action) {
    case 'approve_commissions':
      if (!commissionIds || !Array.isArray(commissionIds)) {
        return res.status(400).json({ error: 'Invalid commission IDs' })
      }

      await prisma.commission.updateMany({
        where: {
          id: { in: commissionIds },
          status: 'PENDING'
        },
        data: { status: 'APPROVED' }
      })

      res.status(200).json({ message: 'Commissions approved' })
      break

    case 'process_payouts':
      const minimumPayout = req.body.minimumPayout || 50
      const payoutResults = await processMonthlyPayouts(minimumPayout)
      
      res.status(200).json({ 
        message: 'Payouts processed',
        payouts: payoutResults 
      })
      break

    case 'deactivate_affiliate':
      if (!affiliateId) {
        return res.status(400).json({ error: 'Affiliate ID required' })
      }

      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: { isActive: false }
      })

      res.status(200).json({ message: 'Affiliate deactivated' })
      break

    case 'activate_affiliate':
      if (!affiliateId) {
        return res.status(400).json({ error: 'Affiliate ID required' })
      }

      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: { isActive: true }
      })

      res.status(200).json({ message: 'Affiliate activated' })
      break

    default:
      res.status(400).json({ error: 'Invalid action' })
  }
}
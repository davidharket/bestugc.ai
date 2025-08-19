// pages/api/affiliate/register.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { createAffiliate } from '../../../lib/affiliate-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { customCode } = req.body

    const affiliate = await createAffiliate(session.user.id, customCode)

    res.status(200).json({
      success: true,
      affiliate: {
        id: affiliate.id,
        affiliateCode: affiliate.affiliateCode,
        commissionRate: affiliate.commissionRate,
        isActive: affiliate.isActive
      }
    })
  } catch (error: any) {
    console.error('Error creating affiliate:', error)
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' })
    }
    
    if (error.message === 'User is already an affiliate') {
      return res.status(400).json({ error: 'User is already an affiliate' })
    }
    
    if (error.message === 'Could not generate unique affiliate code') {
      return res.status(500).json({ error: 'Could not generate unique affiliate code. Please try again.' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
}
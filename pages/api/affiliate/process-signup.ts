// pages/api/affiliate/process-signup.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { processAffiliateSignup } from '../../../lib/affiliate-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get affiliate code from request body (sent from client)
    const { affiliateCode } = req.body

    if (!affiliateCode) {
      return res.status(200).json({ message: 'No affiliate code provided' })
    }

    const referral = await processAffiliateSignup(session.user.id, affiliateCode)

    if (referral) {
      res.status(200).json({
        success: true,
        message: 'Affiliate attribution processed',
        referralId: referral.id
      })
    } else {
      res.status(200).json({
        success: false,
        message: 'Affiliate attribution not processed (invalid code or existing referral)'
      })
    }
  } catch (error) {
    console.error('Error processing affiliate signup:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
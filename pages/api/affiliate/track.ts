// pages/api/affiliate/track.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { trackAffiliateClick } from '../../../lib/affiliate-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { affiliateCode, landingPage } = req.body

    if (!affiliateCode || !landingPage) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get request metadata
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']
    const referrer = req.headers.referer
    
    // Track the click
    const click = await trackAffiliateClick(affiliateCode, {
      ip,
      userAgent,
      referrer,
      landingPage,
      // You could add GeoIP lookup here for country
    })

    if (!click) {
      return res.status(404).json({ error: 'Invalid affiliate code' })
    }

    res.status(200).json({ success: true, clickId: click.id })
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
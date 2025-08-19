import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { Ad } from '@prisma/client'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log(`[/api/ads] ${req.method} request received`)
    
    const session = await getServerSession(req, res, authOptions)
    console.log('[/api/ads] Session check:', session ? 'authenticated' : 'not authenticated')
    
    if (!session || !session.user?.id) {
      console.log('[/api/ads] Unauthorized access attempt')
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const userId = session.user.id
    console.log('[/api/ads] User ID:', userId)

    if (req.method === 'GET') {
      try {
        console.log('[/api/ads] Fetching ads from database...')
        const adsFromDb: Ad[] = await prisma.ad.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        })
        console.log(`[/api/ads] Found ${adsFromDb.length} ads`)
        
        const ads = adsFromDb.map((ad: Ad) => ({
          ...ad,
          selectedImages: ad.selectedImages ? JSON.parse(ad.selectedImages) : [],
          selectedVideos: ad.selectedVideos ? JSON.parse(ad.selectedVideos) : [],
        }))
        
        console.log('[/api/ads] Successfully processed ads, sending response')
        res.status(200).json(ads)
      } catch (dbError) {
        console.error('[/api/ads] Database error:', dbError)
        res.status(500).json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' })
      }
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (globalError) {
    console.error('[/api/ads] Global error:', globalError)
    res.status(503).json({ error: 'Service temporarily unavailable', details: globalError instanceof Error ? globalError.message : 'Unknown error' })
  }
}

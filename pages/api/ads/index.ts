import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient, Ad } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const adsFromDb: Ad[] = await prisma.ad.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      const ads = adsFromDb.map((ad: Ad) => ({
        ...ad,
        selectedImages: ad.selectedImages ? JSON.parse(ad.selectedImages) : [],
        selectedVideos: ad.selectedVideos ? JSON.parse(ad.selectedVideos) : [],
      }))
      res.status(200).json(ads)
    } catch (error) {
      console.error('Failed to fetch ads:', error)
      res.status(500).json({ error: 'Failed to fetch ads' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

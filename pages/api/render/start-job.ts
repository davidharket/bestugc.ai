import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { inngest } from '../../../inngest/client'
import { AdCreationData } from '../../../components/AdCreationContext'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { adData } = req.body as { adData: AdCreationData }

  if (!adData) {
    return res.status(400).json({ message: 'Missing ad data' })
  }

  try {
    // Create a new Ad record in the database
    const newAd = await prisma.ad.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        productUrl: adData.productUrl,
        summary: adData.summary,
        brandName: adData.brandName,
        logoUrl: adData.logoUrl,
        description: adData.description,
        selectedImages: JSON.stringify(adData.selectedImages),
        selectedVideos: JSON.stringify(adData.selectedVideos),
        showPromo: adData.showPromo,
        originalPrice: adData.originalPrice,
        promoPrice: adData.promoPrice,
        promoDetails: adData.promoDetails,
        format: adData.format,
        duration: adData.duration,
        language: adData.language,
        audience: adData.audience,
        script: adData.script,
        avatarId: adData.avatarId,
        templateId: adData.templateId,
      },
    })

    // Send an event to Inngest to trigger the video rendering job
    await inngest.send({
      name: 'ad/render.requested',
      data: {
        adId: newAd.id,
        adData: adData,
      },
    })

    // Respond to the client that the job has been accepted
    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: newAd.id,
    })
  } catch (error) {
    console.error('Failed to start render job:', error)
    return res.status(500).json({ message: 'Failed to start render job' })
  }
}

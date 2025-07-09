import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { inngest } from '../../../lib/inngest'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  let session = await getServerSession(req, res, authOptions)

  // --- Test Script Authentication ---
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-test-secret'] === process.env.TEST_SECRET_KEY
  ) {
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      return res.status(500).json({ message: 'No test user found in database.' });
    }
    session = {
      user: { id: testUser.id, email: testUser.email },
      expires: '2999-01-01T00:00:00.000Z',
    };
  }
  // --- End Test Script Authentication ---

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { adId } = req.body

  if (!adId) {
    return res.status(400).json({ message: 'Missing adId' })
  }

  try {
    // Get the existing ad
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true }
    })

    if (!existingAd) {
      return res.status(404).json({ message: 'Ad not found' })
    }

    // Check if user owns this ad
    if (existingAd.userId !== session.user.id) {
      return res.status(403).json({ message: 'Unauthorized to restart this ad' })
    }

    // Reset the ad status
    await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'PENDING',
        finalVideoUrl: null,
        updatedAt: new Date()
      }
    })

    // Prepare the ad data for the pipeline
    const adData = {
      productUrl: existingAd.productUrl,
      summary: existingAd.summary,
      brandName: existingAd.brandName,
      logoUrl: existingAd.logoUrl,
      description: existingAd.description,
      selectedImages: JSON.parse(existingAd.selectedImages || '[]'),
      selectedVideos: JSON.parse(existingAd.selectedVideos || '[]'),
      showPromo: existingAd.showPromo,
      originalPrice: existingAd.originalPrice,
      promoPrice: existingAd.promoPrice,
      promoDetails: existingAd.promoDetails,
      format: existingAd.format,
      duration: existingAd.duration,
      language: existingAd.language,
      audience: existingAd.audience,
      script: existingAd.script,
      avatarId: parseInt(existingAd.avatarId || '1'),
      templateId: parseInt(existingAd.templateId || '1'),
    }

    // Send an event to Inngest to trigger the video rendering job
    const { ids } = await inngest.send({
      name: 'ad/render.requested',
      data: {
        adId: existingAd.id,
        templateId: existingAd.templateId || '1', // ✅ FIX: Pass templateId directly
      },
    });

    // Store the run ID
    if (ids && ids.length > 0) {
      await prisma.ad.update({
        where: { id: existingAd.id },
        data: { inngestRunId: ids[0] },
      });
    }

    // Respond to the client that the job has been restarted
    return res.status(202).json({
      message: 'Video rendering job restarted.',
      adId: existingAd.id,
    })
  } catch (error) {
    console.error('Failed to restart render job:', error)
    return res.status(500).json({ message: 'Failed to restart render job' })
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient, Prisma, Ad } from '@prisma/client'
import type { AdCreationData } from '../../../components/AdCreationContext'

const prisma = new PrismaClient()

const AD_CREATION_COST = 10; // Define the cost of creating an ad

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'POST') {
    const adData = req.body as AdCreationData & { finalVideoUrl?: string }

    // Basic validation (can be expanded with Zod or similar)
    if (!adData.templateId) {
      return res.status(400).json({ error: 'Missing required ad data (templateId)' })
    }
    if (!adData.finalVideoUrl) {
        return res.status(400).json({ error: 'Missing finalVideoUrl' });
    }

    try {
      // Start a transaction
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Fetch user to check credits
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true, plan: true }, // Select plan as well for isWatermarked logic
        });

        if (!user) {
          // Should not happen if session is valid, but good for robustness
          throw new Error('User not found'); 
        }

        if (user.credits < AD_CREATION_COST) {
          // Throw a specific error type or message to be caught and sent as 402/403
          const error = new Error('Insufficient credits');
          (error as any).statusCode = 402; // Custom property for status code
          throw error;
        }

        // 2. Create the Ad
        const newAd = await tx.ad.create({
          data: {
            userId,
            // Spread all fields from AdCreationData
            productUrl: adData.productUrl,
            summary: adData.summary,
            brandName: adData.brandName,
            logoUrl: adData.logoUrl,
            description: adData.description,
            selectedImages: adData.selectedImages ? JSON.stringify(adData.selectedImages) : null,
            selectedVideos: adData.selectedVideos ? JSON.stringify(adData.selectedVideos) : null,
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
            finalVideoUrl: adData.finalVideoUrl,
            isWatermarked: user.plan === 'FREE', // Use fetched user's plan
          },
        });

        // 3. Decrement user credits
        await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: AD_CREATION_COST } },
        });

        return newAd;
      });

      // We need to parse the stringified fields before sending the response for the new ad
      const responseAd = {
        ...result, // result is the newAd from the transaction
        selectedImages: result.selectedImages ? JSON.parse(result.selectedImages) : [],
        selectedVideos: result.selectedVideos ? JSON.parse(result.selectedVideos) : [],
      };
      res.status(201).json(responseAd)
    } catch (error: any) {
      console.error("Failed to save ad and deduct credits:", error);
      if (error.statusCode === 402) {
        return res.status(402).json({ error: 'Insufficient credits to create ad.' });
      }
      if (error.message === 'User not found') { // Catch specific error from transaction
         return res.status(404).json({ error: 'User not found.' });
      }
      res.status(500).json({ error: 'Failed to save ad' })
    }
  } else if (req.method === 'GET') {
    try {
      const adsFromDb: Ad[] = await prisma.ad.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      const ads = adsFromDb.map((ad: Ad) => ({
        ...ad,
        selectedImages: ad.selectedImages ? JSON.parse(ad.selectedImages) : [],
        selectedVideos: ad.selectedVideos ? JSON.parse(ad.selectedVideos) : [],
      }));

      res.status(200).json(ads)
    } catch (error) {
      console.error("Failed to fetch ads:", error);
      // It's good practice to also check for JSON.parse errors if the data could be malformed
      // For now, a general error will suffice.
      res.status(500).json({ error: 'Failed to fetch ads' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 
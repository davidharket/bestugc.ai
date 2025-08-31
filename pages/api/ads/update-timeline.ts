// pages/api/ads/update-timeline.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized. You must be logged in.' });
  }

  const { adId, modifiedTimeline } = req.body;

  if (!adId) {
    return res.status(400).json({ error: 'Missing adId.' });
  }

  if (!modifiedTimeline || !Array.isArray(modifiedTimeline)) {
    return res.status(400).json({ error: 'Missing or invalid modifiedTimeline.' });
  }

  try {
    // Verify the ad belongs to the current user
    const existingAd = await prisma.ad.findFirst({
      where: { 
        id: adId, 
        userId: session.user.id 
      }
    });

    if (!existingAd) {
      return res.status(404).json({ error: 'Ad not found or access denied.' });
    }

    // Update the ad with the modified timeline
    const updatedAd = await prisma.ad.update({
      where: { id: adId },
      data: {
        modifiedTimeline: JSON.stringify(modifiedTimeline)
      }
    });

    console.log(`[API] Updated ad ${adId} with modified timeline containing ${modifiedTimeline.length} scenes`);

    res.status(200).json({ 
      success: true, 
      message: `Timeline updated for ad ${adId}` 
    });

  } catch (error) {
    console.error("Failed to update ad timeline:", error);
    res.status(500).json({ error: 'Failed to update ad timeline in database.' });
  }
}
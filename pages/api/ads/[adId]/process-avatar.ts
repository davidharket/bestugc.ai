// pages/api/ads/[adId]/process-avatar.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '../../../../lib/prisma'
import axios from 'axios'

type Data = {
  success?: boolean;
  lipsyncedAvatarUrl?: string;
  lipsyncedAvatarNoBgUrl?: string;
  error?: string;
  details?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { adId } = req.query as { adId: string };
    const { lipsyncedVideoUrl } = req.body;

    if (!lipsyncedVideoUrl) {
      return res.status(400).json({ error: 'lipsyncedVideoUrl is required' });
    }

    // 1. Verify the ad belongs to the user
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        userId: session.user.id
      }
    });

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // 2. Save the original lipsynced avatar URL
    console.log(`[Avatar Processing] Saving lipsynced avatar URL for ad ${adId}`);
    await prisma.ad.update({
      where: { id: adId },
      data: {
        lipsyncedAvatarUrl: lipsyncedVideoUrl
      }
    });

    // 3. Process through background removal
    console.log(`[Avatar Processing] Starting background removal for ${lipsyncedVideoUrl}`);
    
    const internalSecret = process.env.INTERNAL_SECRET_KEY;
    if (!internalSecret) {
      throw new Error('INTERNAL_SECRET_KEY not configured');
    }

    try {
      const backgroundRemovalResponse = await axios.post(
        `${process.env.NEXTAUTH_URL || '***REMOVED***'}/api/video/remove-background`,
        {
          videoUrl: lipsyncedVideoUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': internalSecret
          },
          timeout: 300000 // 5 minutes timeout
        }
      );

      const cutoutVideoUrl = backgroundRemovalResponse.data.cutoutVideoUrl;
      console.log(`[Avatar Processing] Background removal completed: ${cutoutVideoUrl}`);

      // 4. Save the background-removed avatar URL
      await prisma.ad.update({
        where: { id: adId },
        data: {
          lipsyncedAvatarNoBgUrl: cutoutVideoUrl
        }
      });

      return res.status(200).json({
        success: true,
        lipsyncedAvatarUrl: lipsyncedVideoUrl,
        lipsyncedAvatarNoBgUrl: cutoutVideoUrl
      });

    } catch (bgRemovalError: any) {
      console.error(`[Avatar Processing] Background removal failed:`, bgRemovalError.message);
      
      // Still save the original lipsynced avatar even if background removal fails
      return res.status(200).json({
        success: true,
        lipsyncedAvatarUrl: lipsyncedVideoUrl,
        error: 'Background removal failed, but original avatar saved',
        details: bgRemovalError.message
      });
    }

  } catch (error: any) {
    console.error(`[Avatar Processing] API error:`, error.message);
    return res.status(500).json({
      error: 'Avatar processing failed',
      details: error.message
    });
  }
}
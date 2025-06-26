// pages/api/ads/create.ts
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

  // --- THE FIX: Get the user session on the server ---
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    // This is a security check. If the user isn't logged in, reject the request.
    return res.status(401).json({ error: 'Unauthorized. You must be logged in.' });
  }
  const userId = session.user.id;
  // --- END OF FIX ---

  // We only need adData from the request body now.
  const { adData } = req.body;

  if (!adData) {
    return res.status(400).json({ error: 'Missing ad data.' });
  }

  try {
    const newAd = await prisma.ad.create({
      data: {
        // Use the secure userId from the session
        userId: userId,
        status: 'QUEUED',
        productUrl: adData.productUrl,
        summary: adData.summary,
        brandName: adData.brandName,
        logoUrl: adData.logoUrl,
        description: adData.description,
        selectedImages: JSON.stringify(adData.selectedImages || []),
        selectedVideos: JSON.stringify(adData.selectedVideos || []),
        showPromo: adData.showPromo,
        originalPrice: adData.originalPrice,
        promoPrice: adData.promoPrice,
        promoDetails: adData.promoDetails,
        format: adData.format,
        duration: adData.duration,
        language: adData.language,
        audience: adData.audience,
        script: adData.script,
        avatarId: adData.avatarId?.toString(),
        templateId: adData.templateId,
        syncLabsJobId: adData.syncLabsJobId,
      },
    });

    res.status(201).json({ adId: newAd.id });

  } catch (error) {
    console.error("Failed to create ad record:", error);
    res.status(500).json({ error: 'Failed to save ad to database.' });
  }
}
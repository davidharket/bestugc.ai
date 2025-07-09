// pages/api/render/restart-job.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { renderQueue } from '../../../lib/queue'; // ✅ Import the BullMQ queue

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { adId } = req.body;

  if (!adId) {
    return res.status(400).json({ message: 'Missing adId' });
  }

  try {
    const existingAd = await prisma.ad.findUnique({
      where: { id: adId, userId: session.user.id },
    });

    if (!existingAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    // ✅ This is the main logic change. Instead of inngest.send, we add to the queue.
    const job = await renderQueue.add('render-video-job', {
        adId: existingAd.id,
        templateId: existingAd.templateId,
    });

    // Reset the ad status and link it to the new BullMQ job ID
    await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'QUEUED', // Set status to QUEUED
        finalVideoUrl: null,
        updatedAt: new Date(),
        inngestRunId: job.id, // We reuse this field for the BullMQ job ID
      },
    });

    console.log(`[API /restart-job] Job ${job.id} added to the render queue for Ad ID: ${adId}`);

    return res.status(202).json({
      message: 'Video rendering job restarted.',
      adId: existingAd.id,
      jobId: job.id,
    });

  } catch (error: any) {
    console.error('Failed to restart render job:', error);
    return res.status(500).json({ message: 'Failed to restart render job', details: error.message });
  }
}

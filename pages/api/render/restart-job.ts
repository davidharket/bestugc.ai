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
    // Use a transaction to ensure credit deduction and job creation are atomic
    const result = await prisma.$transaction(async (tx) => {
      const existingAd = await tx.ad.findUnique({
        where: { id: adId, userId: session.user!.id },
      });

      if (!existingAd) {
        throw new Error('Ad not found');
      }

      // Determine credit cost based on dual format
      const creditCost = existingAd.enableDualFormat ? 15 : 10;

      // Check if user has enough credits and deduct credits for video restart
      const user = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { credits: true }
      });

      if (!user || user.credits < creditCost) {
        throw new Error(`Insufficient credits. You need at least ${creditCost} credits to restart ${existingAd.enableDualFormat ? 'dual format video' : 'video'} rendering.`);
      }

      // Deduct credits from user's balance
      const updatedUser = await tx.user.update({
        where: { id: session.user!.id },
        data: { credits: { decrement: creditCost } }
      });
      
      // ✅ This is the main logic change. Instead of inngest.send, we add to the queue.
      const job = await renderQueue.add('render-video-job', {
          adId: existingAd.id,
          templateId: existingAd.templateId,
      });

      // Reset the ad status and link it to the new BullMQ job ID
      await tx.ad.update({
        where: { id: adId },
        data: {
          status: 'QUEUED', // Set status to QUEUED
          finalVideoUrl: null,
          updatedAt: new Date(),
          inngestRunId: job.id, // We reuse this field for the BullMQ job ID
        },
      });

      return { job, existingAd, updatedCredits: updatedUser.credits, creditCost };
    });

    const { job, existingAd, creditCost } = result;

    console.log(`[API /restart-job] Job ${job.id} added to the render queue for Ad ID: ${adId}. ${creditCost} credits deducted from user ${session.user!.id}`);

    return res.status(202).json({
      message: 'Video rendering job restarted.',
      adId: existingAd.id,
      jobId: job.id,
      triggerFrequentPolling: true, // Signal frontend to start frequent polling
    });

  } catch (error: any) {
    console.error('Failed to restart render job:', error);
    
    // Check if it's a credit-related or not found error
    if (error.message?.includes('Insufficient credits')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message?.includes('Ad not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Failed to restart render job', details: error.message });
  }
}

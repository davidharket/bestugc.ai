// pages/api/render/start-job.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { renderQueue } from '../../../lib/queue'; // <-- Import the BullMQ queue

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

  const { adId, templateId } = req.body;

  if (!adId || !templateId) {
    return res.status(400).json({ message: 'Missing adId or templateId' });
  }

  try {
    // Use a transaction to ensure credit deduction and job creation are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Get the ad to check if dual format is enabled
      const ad = await tx.ad.findUnique({
        where: { id: adId },
        select: { enableDualFormat: true }
      });

      if (!ad) {
        throw new Error('Ad not found.');
      }

      // Determine credit cost based on dual format
      const creditCost = ad.enableDualFormat ? 15 : 10;
      
      // First, check if user has enough credits and deduct credits for video creation
      const user = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { credits: true }
      });

      if (!user || user.credits < creditCost) {
        throw new Error(`Insufficient credits. You need at least ${creditCost} credits to create ${ad.enableDualFormat ? 'dual format videos' : 'a video'}.`);
      }

      // Deduct credits from user's balance
      const updatedUser = await tx.user.update({
        where: { id: session.user!.id },
        data: { credits: { decrement: creditCost } }
      });

      // Add a job to the BullMQ queue
      const job = await renderQueue.add('render-video-job', {
          adId: adId,
          templateId: templateId,
      });

      // Update the Ad record with the BullMQ job ID for tracking and reset status if it was failed
      await tx.ad.update({
        where: { id: adId },
        data: { 
          inngestRunId: job.id, // We can reuse the same DB field for the job ID
          status: 'QUEUED' // Reset status to QUEUED for retry cases
        },
      });

      return { job, updatedCredits: updatedUser.credits, creditCost };
    });

    const { job } = result;

    console.log(`[API] Job ${job.id} added to the render queue for Ad ID: ${adId}. ${result.creditCost} credits deducted from user ${session.user!.id}`);

    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: adId,
      jobId: job.id,
      updatedCredits: result.updatedCredits,
      triggerFrequentPolling: true, // Signal frontend to start frequent polling
    });

  } catch (error: any) {
    console.error('Failed to add job to render queue:', error);
    
    // Check if it's a credit-related error
    if (error.message?.includes('Insufficient credits')) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Failed to start render job' });
  }
}

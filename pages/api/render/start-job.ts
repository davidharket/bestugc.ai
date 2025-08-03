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
    // Get ad data to check format selection
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { enableDualFormat: true }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    // Calculate credits based on format selection
    // Single format: 10 credits, 2 formats: 15 credits, 3+ formats: 15 + 5 per additional format
    const baseCredits = 10;
    let totalCredits = baseCredits;
    
    if (ad.enableDualFormat) {
      totalCredits = 15; // 2 formats cost 15 credits
      // Note: Currently only 2 formats are supported (9:16 and 4:5)
      // Future: if more than 2 formats, add 5 credits per additional format
    }

    // Use a transaction to ensure credit deduction and job creation are atomic
    const result = await prisma.$transaction(async (tx) => {
      // First, check if user has enough credits and deduct credits for video creation
      const user = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { credits: true }
      });

      if (!user || user.credits < totalCredits) {
        throw new Error(`Insufficient credits. You need at least ${totalCredits} credits to create ${ad.enableDualFormat ? 'videos in multiple formats' : 'a video'}.`);
      }

      // Deduct credits from user's balance
      const updatedUser = await tx.user.update({
        where: { id: session.user!.id },
        data: { credits: { decrement: totalCredits } }
      });

      // Add a job to the BullMQ queue
      const job = await renderQueue.add('render-video-job', {
          adId: adId,
          templateId: templateId,
      });

      // Update the Ad record with the BullMQ job ID for tracking
      await tx.ad.update({
        where: { id: adId },
        data: { inngestRunId: job.id }, // We can reuse the same DB field for the job ID
      });

      return { job, updatedCredits: updatedUser.credits };
    });

    const { job } = result;

    console.log(`[API] Job ${job.id} added to the render queue for Ad ID: ${adId}. ${totalCredits} credits deducted from user ${session.user!.id}`);

    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: adId,
      jobId: job.id,
      updatedCredits: result.updatedCredits,
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

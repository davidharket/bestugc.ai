// pages/api/render/start-job.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { renderQueue } from '../../../lib/queue'; // Your BullMQ queue
import { randomUUID } from 'crypto';

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

      // First, check if user has enough credits
      const user = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { credits: true }
      });

      if (!user || user.credits < creditCost) {
        throw new Error(`Insufficient credits. You need at least ${creditCost} credits.`);
      }

      // ✅ FIXED: Generate a new, truly unique job ID for every request
      const uniqueJobId = randomUUID();

      // Add a job to the BullMQ queue with our custom, guaranteed-unique ID
      const job = await renderQueue.add('render-video-job', {
          adId: adId,
          templateId: templateId,
      }, {
        jobId: uniqueJobId // Use the new UUID as the BullMQ job ID
      });

      // Deduct credits from user's balance
      const updatedUser = await tx.user.update({
        where: { id: session.user!.id },
        data: { credits: { decrement: creditCost } }
      });

      // ✅ FIXED: Update the Ad record with the new, unique job ID and set status to PENDING
      await tx.ad.update({
        where: { id: adId },
        data: {
          inngestRunId: uniqueJobId, // Store the unique ID in the database
          status: 'PENDING'
        },
      });

      return { job, updatedCredits: updatedUser.credits, creditCost };
    });

    const { job } = result;

    console.log(`[API] Job ${job.id} added to the render queue for Ad ID: ${adId}. ${result.creditCost} credits deducted from user ${session.user!.id}`);

    // Return a success response
    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: adId,
      jobId: job.id,
      updatedCredits: result.updatedCredits,
    });

  } catch (error: any) {
    console.error('Failed to add job to render queue:', error);

    if (error.message?.includes('Insufficient credits')) {
      return res.status(400).json({ message: error.message });
    }

    // This will catch the unique constraint error and other issues
    return res.status(500).json({ message: 'Failed to start render job' });
  }
}

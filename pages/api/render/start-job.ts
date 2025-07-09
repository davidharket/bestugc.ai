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
    // ---- THIS IS THE MAIN CHANGE ----
    // Remove the Inngest call and add a job to the BullMQ queue instead.
    const job = await renderQueue.add('render-video-job', {
        adId: adId,
        templateId: templateId,
    });
    // ---------------------------------

    // Update the Ad record with the BullMQ job ID for tracking
    await prisma.ad.update({
      where: { id: adId },
      data: { inngestRunId: job.id }, // We can reuse the same DB field for the job ID
    });

    console.log(`[API] Job ${job.id} added to the render queue for Ad ID: ${adId}`);

    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: adId,
      jobId: job.id,
    });

  } catch (error) {
    console.error('Failed to add job to render queue:', error);
    return res.status(500).json({ message: 'Failed to start render job' });
  }
}

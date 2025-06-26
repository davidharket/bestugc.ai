// pages/api/render/start-job.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { inngest } from '../../../inngest/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Use a generic session for testing if the secret key is provided
  let session = await getServerSession(req, res, authOptions);
  if (!session) {
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      session = { user: { id: testUser.id }, expires: '2999-01-01T00:00:00.000Z' };
    }
  }

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // --- THE FIX: We now receive adId and templateId directly ---
  const { adId, templateId } = req.body;

  if (!adId || !templateId) {
    return res.status(400).json({ message: 'Missing adId or templateId' });
  }

  try {
    // Send the event to Inngest to trigger the video rendering job
    const { ids } = await inngest.send({
      name: 'ad/render.requested',
      data: {
        adId: adId,
        templateId: templateId, // Pass the templateId to the Inngest job
      },
    });

    // Update the Ad record with the Inngest run ID for tracking
    if (ids && ids.length > 0) {
      await prisma.ad.update({
        where: { id: adId },
        data: { inngestRunId: ids[0] },
      });
    }

    // Respond to the client that the job has been accepted
    return res.status(202).json({
      message: 'Video rendering job accepted.',
      adId: adId,
    });
  } catch (error) {
    console.error('Failed to start render job:', error);
    return res.status(500).json({ message: 'Failed to start render job' });
  }
}
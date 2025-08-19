// pages/api/ads/[adId]/cancel.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { inngest } from '../../../../lib/inngest';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { adId } = req.query;

  if (req.method === 'POST') {
    try {
      const ad = await prisma.ad.findFirst({
        where: {
          id: adId as string,
          userId: session.user.id,
        },
      });

      if (!ad || !ad.inngestRunId) {
        return res.status(404).json({ error: 'Ad not found or cancellation not possible.' });
      }

      // ✅ CORRECT FIX: Use inngest.send to dispatch a cancellation event.
      await inngest.send({
        name: "inngest/run.cancel",
        data: {
          run_id: ad.inngestRunId,
        },
      });
      
      await prisma.ad.update({
        where: { id: ad.id },
        data: { status: 'CANCELED' },
      });

      res.status(200).json({ message: 'Cancellation request sent.' });
    } catch (error) {
      console.error('Failed to cancel ad:', error);
      res.status(500).json({ error: 'Failed to cancel ad' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
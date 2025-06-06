import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { inngest } from '../inngest';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { adData, templateId } = req.body as any;

  if (!adData || !templateId) {
    return res.status(400).json({ error: 'Missing adData or templateId' });
  }

  try {
    const newAd = await prisma.ad.create({
      data: {
        userId: session.user.id,
        ...adData,
        templateId: templateId,
        status: 'PENDING',
      },
    });

    await inngest.send({
      name: 'ad/render.requested',
      data: { adId: newAd.id, adData },
    });

    res.status(202).json({ id: newAd.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start render job' });
  }
}

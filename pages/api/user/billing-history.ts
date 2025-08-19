import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return empty array since we don't have a payments table yet
    // TODO: Implement actual database query when payments table is added
    // const billingHistory = await prisma.payment.findMany({
    //   where: {
    //     user: {
    //       email: session.user.email
    //     }
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   },
    //   take: 10
    // });

    res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, page, userAgent, referrer } = req.body;

    // Basic validation
    if (!sessionId || !page) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user session (optional)
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id || null;

    // Extract country from request headers (optional, basic implementation)
    const country = req.headers['cf-ipcountry'] as string || 
                   req.headers['x-vercel-ip-country'] as string || 
                   null;

    // Check if we already tracked this session + page combination recently (last 5 minutes)
    // This prevents duplicate tracking from single-page app navigation
    const recentVisit = await prisma.visitorStats.findFirst({
      where: {
        sessionId,
        page,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        }
      }
    });

    if (recentVisit) {
      return res.status(200).json({ message: 'Visit already tracked recently' });
    }

    // Create the visitor stats record
    await prisma.visitorStats.create({
      data: {
        sessionId,
        page,
        userAgent: userAgent?.substring(0, 500) || null, // Limit length
        referrer: referrer?.substring(0, 500) || null, // Limit length
        country,
        userId
      }
    });

    return res.status(200).json({ message: 'Visit tracked successfully' });

  } catch (error: any) {
    console.error('Error tracking visit:', error);
    return res.status(500).json({ error: 'Failed to track visit' });
  } finally {
    await prisma.$disconnect();
  }
}
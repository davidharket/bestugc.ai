import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated (optional - you can add admin check here)
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { timeframe = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get total visits
    const totalVisits = await prisma.visitorStats.count({
      where: {
        timestamp: {
          gte: startDate
        }
      }
    });

    // Get unique visitors (by sessionId)
    const uniqueVisitors = await prisma.visitorStats.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        sessionId: true
      }
    });

    // Get top pages
    const topPages = await prisma.visitorStats.groupBy({
      by: ['page'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        page: true
      },
      orderBy: {
        _count: {
          page: 'desc'
        }
      },
      take: 10
    });

    // Get visits by country
    const visitsByCountry = await prisma.visitorStats.groupBy({
      by: ['country'],
      where: {
        timestamp: {
          gte: startDate
        },
        country: {
          not: null
        }
      },
      _count: {
        country: true
      },
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 10
    });

    // Get referrers
    const topReferrers = await prisma.visitorStats.groupBy({
      by: ['referrer'],
      where: {
        timestamp: {
          gte: startDate
        },
        referrer: {
          not: null
        },
        NOT: {
          referrer: ''
        }
      },
      _count: {
        referrer: true
      },
      orderBy: {
        _count: {
          referrer: 'desc'
        }
      },
      take: 10
    });

    // Get daily visits for the chart
    const dailyVisits = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as visits,
        COUNT(DISTINCT sessionId) as unique_visitors
      FROM VisitorStats 
      WHERE timestamp >= ${startDate.toISOString()}
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp)
    `;

    return res.status(200).json({
      timeframe,
      summary: {
        totalVisits,
        uniqueVisitors: uniqueVisitors.length,
        averageVisitsPerVisitor: totalVisits / Math.max(uniqueVisitors.length, 1)
      },
      topPages: topPages.map(p => ({ page: p.page, visits: p._count.page })),
      visitsByCountry: visitsByCountry.map(c => ({ country: c.country, visits: c._count.country })),
      topReferrers: topReferrers.map(r => ({ referrer: r.referrer, visits: r._count.referrer })),
      dailyVisits
    });

  } catch (error: any) {
    console.error('Error fetching visitor stats:', error);
    return res.status(500).json({ error: 'Failed to fetch visitor stats' });
  } finally {
    await prisma.$disconnect();
  }
}
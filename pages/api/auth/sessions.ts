import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { 
  getActiveSessionsCount,
  terminateUserSessions,
  logSessionActivity
} from '../../../lib/session-utils'
import { getClientIP } from '../../../lib/rate-limit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ipAddress = getClientIP(req)
  const userAgent = req.headers['user-agent']

  if (req.method === 'GET') {
    try {
      // Get active sessions for the user
      const activeSessions = await prisma.session.findMany({
        where: {
          userId: session.user.id,
          expires: { gt: new Date() }
        },
        select: {
          id: true,
          sessionToken: true,
          expires: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      })

      // Get security logs for session activity
      const recentLogs = await prisma.securityLog.findMany({
        where: {
          userId: session.user.id,
          action: { contains: 'SESSION' },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      return res.status(200).json({
        activeSessions: activeSessions.map(s => ({
          id: s.id,
          sessionToken: s.sessionToken.substring(0, 16) + '...',
          expires: s.expires,
          lastActivity: s.createdAt,
        })),
        recentActivity: recentLogs,
        totalActiveSessions: activeSessions.length
      })
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { sessionId, terminateAll } = req.body

      if (terminateAll) {
        // Get current session token to exclude it
        const currentSession = await prisma.session.findFirst({
          where: {
            userId: session.user.id,
            expires: { gt: new Date() }
          }
        })

        const terminatedCount = await terminateUserSessions(
          session.user.id,
          currentSession?.sessionToken
        )

        await logSessionActivity(
          session.user.id,
          currentSession?.sessionToken || 'unknown',
          'TERMINATED',
          ipAddress,
          userAgent
        )

        return res.status(200).json({
          message: `Terminated ${terminatedCount} sessions`,
          terminatedCount
        })
      }

      if (sessionId) {
        // Terminate specific session
        await prisma.session.delete({
          where: { id: sessionId }
        })

        await logSessionActivity(
          session.user.id,
          sessionId,
          'TERMINATED',
          ipAddress,
          userAgent
        )

        return res.status(200).json({
          message: 'Session terminated successfully'
        })
      }

      return res.status(400).json({ error: 'Invalid request' })
    } catch (error) {
      console.error('Error terminating sessions:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
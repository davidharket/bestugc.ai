import { PrismaClient } from '@prisma/client'
import { logSecurityEvent } from './security-utils'

const prisma = new PrismaClient()

const MAX_CONCURRENT_SESSIONS = 3 // Maximum concurrent sessions per user

export async function validateAndLimitSessions(
  userId: string,
  currentSessionToken: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ allowed: boolean; terminatedSessions?: number }> {
  try {
    // Get all active sessions for this user
    const activeSessions = await prisma.session.findMany({
      where: { 
        userId,
        expires: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    // If we're under the limit, allow the session
    if (activeSessions.length < MAX_CONCURRENT_SESSIONS) {
      return { allowed: true }
    }

    // Check if current session is already in the list
    const currentSessionExists = activeSessions.some(
      session => session.sessionToken === currentSessionToken
    )

    if (currentSessionExists) {
      return { allowed: true }
    }

    // We're at the limit and this is a new session
    // Terminate the oldest sessions to make room
    const sessionsToTerminate = activeSessions.slice(MAX_CONCURRENT_SESSIONS - 1)
    
    if (sessionsToTerminate.length > 0) {
      await prisma.session.deleteMany({
        where: {
          sessionToken: {
            in: sessionsToTerminate.map(s => s.sessionToken)
          }
        }
      })

      await logSecurityEvent({
        userId,
        ipAddress,
        userAgent,
        action: 'SESSIONS_TERMINATED_LIMIT_EXCEEDED',
        details: { 
          terminatedCount: sessionsToTerminate.length,
          maxSessions: MAX_CONCURRENT_SESSIONS
        },
        severity: 'INFO',
      })
    }

    return { 
      allowed: true, 
      terminatedSessions: sessionsToTerminate.length 
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { allowed: true } // Allow on error to avoid breaking auth
  }
}

export async function logSessionActivity(
  userId: string,
  sessionToken: string,
  action: 'CREATED' | 'ACCESSED' | 'TERMINATED',
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    userId,
    ipAddress,
    userAgent,
    action: `SESSION_${action}`,
    details: { 
      sessionToken: sessionToken.substring(0, 16) + '...',
      timestamp: new Date().toISOString()
    },
    severity: 'INFO',
  })
}

export async function terminateUserSessions(
  userId: string,
  excludeSessionToken?: string
): Promise<number> {
  const whereClause: any = { userId }
  
  if (excludeSessionToken) {
    whereClause.sessionToken = { not: excludeSessionToken }
  }

  const terminatedSessions = await prisma.session.deleteMany({
    where: whereClause
  })

  return terminatedSessions.count
}

export async function getActiveSessionsCount(userId: string): Promise<number> {
  const count = await prisma.session.count({
    where: { 
      userId,
      expires: { gt: new Date() }
    }
  })

  return count
}

export async function detectSuspiciousSessionActivity(
  userId: string,
  currentIpAddress: string,
  userAgent?: string
): Promise<{ suspicious: boolean; reason?: string }> {
  // Get recent sessions from different IPs
  const recentSessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    },
    include: {
      user: {
        select: { ipAddress: true }
      }
    }
  })

  // Get recent security logs for this user
  const recentLogs = await prisma.securityLog.findMany({
    where: {
      userId,
      action: { in: ['LOGIN_SUCCESS', 'SESSION_CREATED'] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Check for multiple different IP addresses in recent activity
  const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress))
  
  if (uniqueIPs.size > 3) {
    return { 
      suspicious: true, 
      reason: 'Multiple IP addresses detected in recent activity' 
    }
  }

  // Check for rapid session creation
  const sessionCreationLogs = recentLogs.filter(log => 
    log.action === 'SESSION_CREATED' && 
    log.createdAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
  )

  if (sessionCreationLogs.length > 5) {
    return { 
      suspicious: true, 
      reason: 'Rapid session creation detected' 
    }
  }

  return { suspicious: false }
}
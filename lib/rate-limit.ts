import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RateLimitConfig {
  maxRequests: number
  windowMinutes: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  script_generation: { maxRequests: 1000, windowMinutes: 60 }, // Effectively unlimited for development
  audio_generation: { maxRequests: 1000, windowMinutes: 60 },  // Effectively unlimited for development
  account_creation: { maxRequests: 3, windowMinutes: 60 },     // 3 accounts per hour per IP
  email_signup: { maxRequests: 5, windowMinutes: 1440 },       // 5 signups per day per email domain
  login_attempts: { maxRequests: 10, windowMinutes: 60 },      // 10 login attempts per hour
  email_verification_resend: { maxRequests: 5, windowMinutes: 60 }, // 5 resends per hour per IP
}

export async function checkRateLimit(userId: string, action: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
  current: number
}> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )
  
  const resetTime = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000))

  // Get or create usage record for this window
  const usage = await prisma.rateLimitUsage.upsert({
    where: {
      userId_action_windowStart: {
        userId,
        action,
        windowStart,
      },
    },
    update: {},
    create: {
      userId,
      action,
      windowStart,
      count: 0,
    },
  })

  const current = usage.count
  const remaining = Math.max(0, config.maxRequests - current)
  const allowed = current < config.maxRequests

  return {
    allowed,
    remaining,
    resetTime,
    current,
  }
}

export async function incrementRateLimit(userId: string, action: string): Promise<void> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )

  await prisma.rateLimitUsage.upsert({
    where: {
      userId_action_windowStart: {
        userId,
        action,
        windowStart,
      },
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      userId,
      action,
      windowStart,
      count: 1,
    },
  })
}

export async function getRateLimitStatus(userId: string, action: string): Promise<{
  current: number
  limit: number
  remaining: number
  resetTime: Date
}> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )
  
  const resetTime = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000))

  const usage = await prisma.rateLimitUsage.findUnique({
    where: {
      userId_action_windowStart: {
        userId,
        action,
        windowStart,
      },
    },
  })

  const current = usage?.count || 0
  const remaining = Math.max(0, config.maxRequests - current)

  return {
    current,
    limit: config.maxRequests,
    remaining,
    resetTime,
  }
}

// IP-based rate limiting for account creation
export async function checkIPRateLimit(ipAddress: string, action: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
  current: number
}> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )
  
  const resetTime = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000))

  // Get or create IP usage record for this window
  const usage = await prisma.iPRateLimit.upsert({
    where: {
      ipAddress_action_windowStart: {
        ipAddress,
        action,
        windowStart,
      },
    },
    update: {},
    create: {
      ipAddress,
      action,
      windowStart,
      count: 0,
    },
  })

  const current = usage.count
  const remaining = Math.max(0, config.maxRequests - current)
  const allowed = current < config.maxRequests

  return {
    allowed,
    remaining,
    resetTime,
    current,
  }
}

export async function incrementIPRateLimit(ipAddress: string, action: string): Promise<void> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )

  await prisma.iPRateLimit.upsert({
    where: {
      ipAddress_action_windowStart: {
        ipAddress,
        action,
        windowStart,
      },
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      ipAddress,
      action,
      windowStart,
      count: 1,
    },
  })
}

// Email domain-based rate limiting
export async function checkEmailDomainRateLimit(emailDomain: string, action: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
  current: number
}> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )
  
  const resetTime = new Date(windowStart.getTime() + (config.windowMinutes * 60 * 1000))

  // Get or create email domain usage record for this window
  const usage = await prisma.emailDomainRateLimit.upsert({
    where: {
      emailDomain_action_windowStart: {
        emailDomain,
        action,
        windowStart,
      },
    },
    update: {},
    create: {
      emailDomain,
      action,
      windowStart,
      count: 0,
    },
  })

  const current = usage.count
  const remaining = Math.max(0, config.maxRequests - current)
  const allowed = current < config.maxRequests

  return {
    allowed,
    remaining,
    resetTime,
    current,
  }
}

export async function incrementEmailDomainRateLimit(emailDomain: string, action: string): Promise<void> {
  const config = RATE_LIMITS[action]
  if (!config) {
    throw new Error(`Unknown action: ${action}`)
  }

  const now = new Date()
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / config.windowMinutes) * config.windowMinutes
  )

  await prisma.emailDomainRateLimit.upsert({
    where: {
      emailDomain_action_windowStart: {
        emailDomain,
        action,
        windowStart,
      },
    },
    update: {
      count: {
        increment: 1,
      },
    },
    create: {
      emailDomain,
      action,
      windowStart,
      count: 1,
    },
  })
}

// Utility function to extract IP address from request
export function getClientIP(req: any): string {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}
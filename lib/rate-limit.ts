import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RateLimitConfig {
  maxRequests: number
  windowMinutes: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  script_generation: { maxRequests: 1000, windowMinutes: 60 }, // Effectively unlimited for development
  audio_generation: { maxRequests: 1000, windowMinutes: 60 },  // Effectively unlimited for development
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
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export interface SecurityLogEvent {
  userId?: string
  ipAddress: string
  userAgent?: string
  action: string
  details?: any
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
}

export async function logSecurityEvent(event: SecurityLogEvent): Promise<void> {
  await prisma.securityLog.create({
    data: {
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.action,
      details: event.details ? JSON.stringify(event.details) : null,
      severity: event.severity || 'INFO',
    },
  })
}

export function generateDeviceFingerprint(req: any): string {
  const userAgent = req.headers['user-agent'] || ''
  const acceptLanguage = req.headers['accept-language'] || ''
  const acceptEncoding = req.headers['accept-encoding'] || ''
  const accept = req.headers['accept'] || ''
  
  // Create a hash from various browser headers
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}${acceptLanguage}${acceptEncoding}${accept}`)
    .digest('hex')
  
  return fingerprint
}

export async function trackDeviceFingerprint(
  fingerprint: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  const properties = {
    userAgent,
    timestamp: new Date().toISOString(),
  }

  await prisma.deviceFingerprint.upsert({
    where: { fingerprint },
    update: {
      lastSeen: new Date(),
      userCount: { increment: 1 },
      properties: JSON.stringify(properties),
    },
    create: {
      fingerprint,
      ipAddress,
      userAgent,
      properties: JSON.stringify(properties),
    },
  })
}

export async function isDeviceSuspicious(fingerprint: string): Promise<boolean> {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { fingerprint },
  })

  if (!device) return false

  // Mark as suspicious if too many accounts from same device
  const suspiciousThreshold = 3
  return device.userCount >= suspiciousThreshold || device.isSuspicious
}

export async function generateEmailVerificationToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex')
}

export async function isEmailVerificationTokenValid(
  email: string,
  token: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      emailVerificationToken: true,
      emailVerificationExpires: true,
    },
  })

  if (!user?.emailVerificationToken || !user?.emailVerificationExpires) {
    return false
  }

  return (
    user.emailVerificationToken === token &&
    new Date() < user.emailVerificationExpires
  )
}

export async function markEmailAsVerified(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  })
}

export async function handleFailedLogin(email: string, ipAddress: string): Promise<{
  accountLocked: boolean
  attemptsRemaining: number
}> {
  const maxAttempts = 5
  const lockoutDuration = 30 * 60 * 1000 // 30 minutes

  const user = await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
  })

  const attemptsRemaining = Math.max(0, maxAttempts - user.failedLoginAttempts)

  if (user.failedLoginAttempts >= maxAttempts) {
    const lockedUntil = new Date(Date.now() + lockoutDuration)
    
    await prisma.user.update({
      where: { email },
      data: {
        accountLocked: true,
        lockedUntil,
      },
    })

    await logSecurityEvent({
      userId: user.id,
      ipAddress,
      action: 'ACCOUNT_LOCKED',
      details: { reason: 'Too many failed login attempts' },
      severity: 'WARNING',
    })

    return { accountLocked: true, attemptsRemaining: 0 }
  }

  return { accountLocked: false, attemptsRemaining }
}

export async function handleSuccessfulLogin(email: string): Promise<void> {
  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      accountLocked: false,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  })
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      accountLocked: true,
      lockedUntil: true,
    },
  })

  if (!user?.accountLocked) return false

  // Check if lockout period has expired
  if (user.lockedUntil && new Date() > user.lockedUntil) {
    await prisma.user.update({
      where: { email },
      data: {
        accountLocked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    })
    return false
  }

  return true
}
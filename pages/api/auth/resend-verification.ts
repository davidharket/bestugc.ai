import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { 
  generateEmailVerificationToken,
  logSecurityEvent
} from '../../../lib/security-utils'
import { checkIPRateLimit, incrementIPRateLimit, getClientIP } from '../../../lib/rate-limit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  const ipAddress = getClientIP(req)
  const userAgent = req.headers['user-agent']

  try {
    // Rate limit resend requests (5 per hour)
    const rateLimit = await checkIPRateLimit(ipAddress, 'email_verification_resend')
    if (!rateLimit.allowed) {
      await logSecurityEvent({
        ipAddress,
        userAgent,
        action: 'EMAIL_VERIFICATION_RESEND_RATE_LIMITED',
        details: { email },
        severity: 'WARNING',
      })
      
      return res.status(429).json({ 
        error: 'Too many verification emails sent. Please try again later.' 
      })
    }

    // Check if user exists and needs verification
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        email: true, 
        isEmailVerified: true 
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' })
    }

    // Generate new verification token
    const token = await generateEmailVerificationToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { email },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    })

    // Increment rate limit
    await incrementIPRateLimit(ipAddress, 'email_verification_resend')

    // TODO: Send verification email here
    // For now, we'll just return the verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    await logSecurityEvent({
      userId: user.id,
      ipAddress,
      userAgent,
      action: 'EMAIL_VERIFICATION_RESENT',
      details: { email },
      severity: 'INFO',
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Verification email sent',
      // Remove this in production and send actual email
      verificationUrl
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    
    await logSecurityEvent({
      ipAddress,
      userAgent,
      action: 'EMAIL_VERIFICATION_RESEND_ERROR',
      details: { email, error: error instanceof Error ? error.message : 'Unknown error' },
      severity: 'ERROR',
    })
    
    return res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
}
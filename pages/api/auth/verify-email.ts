import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { 
  isEmailVerificationTokenValid, 
  markEmailAsVerified,
  logSecurityEvent
} from '../../../lib/security-utils'
import { getClientIP } from '../../../lib/rate-limit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get token and email from query (GET) or body (POST)
  let token, email
  if (req.method === 'GET') {
    ({ token, email } = req.query)
  } else {
    ({ token, email } = req.body)
  }

  if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid token or email' })
  }

  const ipAddress = getClientIP(req)
  const userAgent = req.headers['user-agent']

  try {
    // Validate the token
    const isValid = await isEmailVerificationTokenValid(email, token)
    
    if (!isValid) {
      await logSecurityEvent({
        ipAddress,
        userAgent,
        action: 'EMAIL_VERIFICATION_FAILED',
        details: { email, reason: 'Invalid or expired token' },
        severity: 'WARNING',
      })
      
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      })
    }

    // Mark email as verified
    await markEmailAsVerified(email)

    // Get user for logging
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    await logSecurityEvent({
      userId: user?.id,
      ipAddress,
      userAgent,
      action: 'EMAIL_VERIFIED',
      details: { email },
      severity: 'INFO',
    })

    if (req.method === 'GET') {
      // For GET requests (clicking email link), redirect to verification page
      return res.redirect(302, `/auth/verify-email?verified=true&email=${encodeURIComponent(email as string)}`)
    } else {
      // For POST requests (from verification page), return JSON
      return res.status(200).json({ 
        success: true, 
        message: 'Email verified successfully' 
      })
    }
  } catch (error) {
    console.error('Email verification error:', error)
    
    await logSecurityEvent({
      ipAddress,
      userAgent,
      action: 'EMAIL_VERIFICATION_ERROR',
      details: { email, error: error instanceof Error ? error.message : 'Unknown error' },
      severity: 'ERROR',
    })
    
    return res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
}
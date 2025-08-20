import { NextApiRequest, NextApiResponse } from 'next'
import { sendVerificationEmail, generateEmailVerificationToken } from '../../lib/security-utils'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }

  try {
    // Check if user exists, if so use their actual token
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerificationToken: true, isEmailVerified: true }
    })

    let token: string
    if (user && user.emailVerificationToken) {
      // Use existing token
      token = user.emailVerificationToken
    } else {
      // Generate new token and save it (for testing purposes)
      token = generateEmailVerificationToken()
      if (user) {
        await prisma.user.update({
          where: { email },
          data: {
            emailVerificationToken: token,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        })
      }
    }

    await sendVerificationEmail(email, token)
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      verificationUrl: `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    })
  } catch (error) {
    console.error('Test email error:', error)
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
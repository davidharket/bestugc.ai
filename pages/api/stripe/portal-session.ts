import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { stripe } from '../../../lib/stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe client is not initialized. Check STRIPE_SECRET_KEY.' })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'POST') {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true }, // Only select the stripeCustomerId
      })

      if (!dbUser || !dbUser.stripeCustomerId) {
        console.warn(`User ${userId} attempted to access billing portal without a Stripe customer ID.`)
        return res.status(400).json({ error: 'Stripe customer ID not found for this user. No subscriptions to manage yet.' })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'
      const returnUrl = `${appUrl}/dashboard` // Or your account/settings page

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: returnUrl,
      })

      if (!portalSession.url) {
        console.error('Stripe Billing Portal session URL is null', portalSession)
        return res.status(500).json({ error: 'Failed to create Stripe Billing Portal session, URL missing.' })
      }

      res.status(200).json({ url: portalSession.url })

    } catch (error: any) {
      console.error("Stripe Billing Portal session creation failed:", error)
      res.status(500).json({ error: 'Failed to create Stripe Billing Portal session', details: error.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
} 
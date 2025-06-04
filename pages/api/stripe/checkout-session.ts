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

  if (!session || !session.user?.id || !session.user.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id
  const userEmail = session.user.email

  if (req.method === 'POST') {
    const { priceId, mode = 'subscription', quantity = 1 } = req.body

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId in request body' })
    }
    if (!['subscription', 'payment'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be \'subscription\' or \'payment\'.' })
    }

    try {
      let dbUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!dbUser) {
        // This should ideally not happen if the user is authenticated via NextAuth
        // and your NextAuth callbacks correctly create/link users.
        // However, as a fallback, you might consider creating the user here if absolutely necessary
        // or throwing a more specific error.
        console.error(`User with ID ${userId} not found in DB, though session exists.`)
        return res.status(500).json({ error: 'User not found in database.' })
      }

      let stripeCustomerId = dbUser.stripeCustomerId

      if (!stripeCustomerId) {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail,
          name: dbUser.name || undefined, 
          metadata: {
            userId: userId,
          },
        })
        stripeCustomerId = customer.id

        // Update user in DB with Stripe Customer ID
        dbUser = await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: stripeCustomerId },
        })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '***REMOVED***'

      // Create a Stripe Checkout session
      const stripeSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: quantity }],
        mode: mode as 'subscription' | 'payment',
        success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing`, // Or your page where users choose plans
        // To prefill email, if desired and customer is not set or email is not on customer
        // customer_email: mode === 'payment' && !stripeCustomerId ? userEmail : undefined,
        // Allow promo codes if you plan to use them
        // allow_promotion_codes: true,
        // If it's a subscription, you might want to include trial period days, etc.
        // subscription_data: mode === 'subscription' ? {
        //   trial_period_days: 14, // Example: 14-day trial
        //   metadata: { userId } // Store userId in subscription metadata as well
        // } : undefined,
        metadata: {
          userId: userId, // Include userId in checkout session metadata
          priceId: priceId
        }
      })

      if (!stripeSession.url) {
        console.error('Stripe session URL is null', stripeSession)
        return res.status(500).json({ error: 'Failed to create Stripe session, URL missing.' })
      }

      res.status(200).json({ sessionId: stripeSession.id, url: stripeSession.url })

    } catch (error: any) {
      console.error("Stripe Checkout session creation failed:", error)
      res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: error.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
} 
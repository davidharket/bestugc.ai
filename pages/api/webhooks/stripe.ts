import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { buffer } from 'micro'

const prisma = new PrismaClient()

// Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set in .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15', // Match the version used elsewhere
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Define credit amounts for plans and top-ups
const PLAN_CREDITS: Record<string, number> = {
  BASIC: 100,    // Corresponds to 499kr plan
  PRO: 250,      // Corresponds to 999kr plan
  PREMIUM: 400,  // Corresponds to 1499kr plan
}

const CREDIT_TOPUP_AMOUNTS: Record<string, number> = {
  TOPUP_10: 10,
  TOPUP_20: 20,
  TOPUP_30: 30,
}

// Disable Next.js body parsing for this route to access the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const itemType = session.metadata?.itemType
        const itemId = session.metadata?.itemId

        if (!userId || !itemType || !itemId) {
          console.error('Webhook Error: Missing metadata from checkout session', session.id)
          return res.status(400).send('Webhook Error: Missing metadata')
        }

        if (itemType === 'plan' && session.subscription) {
          const planName = itemId.toUpperCase() // e.g., BASIC, PRO
          const creditsToGrant = PLAN_CREDITS[planName]
          
          // Retrieve the actual subscription object to get proper dates and price ID
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription.toString())
          
          await prisma.subscription.create({
            data: {
              userId: userId,
              stripeSubscriptionId: session.subscription.toString(),
              stripePriceId: stripeSubscription.items.data[0]?.price.id || 'unknown_price_id',
              status: stripeSubscription.status,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
          })
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planName,
              credits: { increment: creditsToGrant },
            },
          })
          console.log(`User ${userId} subscribed to ${planName} plan, ${creditsToGrant} credits granted.`)
        } else if (itemType === 'credits') {
          const creditsToGrant = CREDIT_TOPUP_AMOUNTS[itemId]
          await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: creditsToGrant } },
          })
          console.log(`User ${userId} purchased ${creditsToGrant} credits.`)
        }
        break

      case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionIdForInvoice = invoice.subscription?.toString()
        if (subscriptionIdForInvoice && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionIdForInvoice },
            include: { user: true },
          })
          if (subscription && subscription.user) {
            const planName = subscription.user.plan
            const creditsToGrant = PLAN_CREDITS[planName]
            if (creditsToGrant) {
              await prisma.user.update({
                where: { id: subscription.userId },
                data: { credits: { increment: creditsToGrant } }, 
              })
              console.log(`User ${subscription.userId} renewed ${planName} plan, ${creditsToGrant} credits granted.`)
            }
            // Update subscription period
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                currentPeriodStart: new Date(invoice.period_start * 1000),
                currentPeriodEnd: new Date(invoice.period_end * 1000),
                status: 'active' // Ensure status is active
              }
            })
          }
        }
        break

      case 'customer.subscription.updated':
        const subUpdated = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subUpdated.id },
          data: {
            status: subUpdated.status,
            stripePriceId: subUpdated.items.data[0]?.price.id,
            cancelAtPeriodEnd: subUpdated.cancel_at_period_end,
            currentPeriodStart: new Date(subUpdated.current_period_start * 1000),
            currentPeriodEnd: new Date(subUpdated.current_period_end * 1000),
            canceledAt: subUpdated.canceled_at ? new Date(subUpdated.canceled_at * 1000) : null,
            trialStart: subUpdated.trial_start ? new Date(subUpdated.trial_start * 1000) : null,
            trialEnd: subUpdated.trial_end ? new Date(subUpdated.trial_end * 1000) : null,
          },
        })
        // If subscription is canceled and past due, or explicitly ended, update user plan
        if (subUpdated.status === 'canceled' || (subUpdated.cancel_at_period_end && new Date(subUpdated.current_period_end * 1000) < new Date())) {
          const relatedSub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subUpdated.id } })
          if (relatedSub) {
            await prisma.user.update({
              where: { id: relatedSub.userId },
              data: { plan: 'FREE' } // Revert to FREE plan, credits are not reset here, handled by usage.
            })
            console.log(`User ${relatedSub.userId} plan reverted to FREE due to subscription status: ${subUpdated.status}`)
          }
        }
        break

      case 'customer.subscription.deleted': // Similar to canceled
        const subDeleted = event.data.object as Stripe.Subscription
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subDeleted.id }
        })
        if (dbSub) {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: { plan: 'FREE' }
          })
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: { status: 'deleted' } // Or 'canceled'
          })
          console.log(`User ${dbSub.userId} plan reverted to FREE due to subscription deletion.`)
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
    res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error.message, event.type, event.data.object)
    res.status(500).json({ error: 'Webhook handler failed', details: error.message })
  }
} 
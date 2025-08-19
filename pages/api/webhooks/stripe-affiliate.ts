// pages/api/webhooks/stripe-affiliate.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { calculateCommission } from '../../../lib/affiliate-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    // Get raw body for webhook verification
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)
    
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.amount_total) return

  // Get customer details
  const customer = await stripe.customers.retrieve(session.customer as string)
  if (!customer || customer.deleted) return

  // Find user by customer email
  const { prisma } = await import('../../../lib/affiliate-utils')
  const user = await prisma.user.findUnique({
    where: { email: (customer as Stripe.Customer).email! }
  })

  if (!user) return

  // Calculate commission for initial purchase
  const purchaseAmount = session.amount_total / 100 // Convert from cents
  await calculateCommission(
    user.id,
    purchaseAmount,
    session.subscription as string,
    'SIGNUP'
  )
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.amount_paid || !invoice.subscription) return

  // Skip the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') return

  // Get customer details
  const customer = await stripe.customers.retrieve(invoice.customer as string)
  if (!customer || customer.deleted) return

  // Find user by customer email
  const { prisma } = await import('../../../lib/affiliate-utils')
  const user = await prisma.user.findUnique({
    where: { email: (customer as Stripe.Customer).email! }
  })

  if (!user) return

  // Calculate commission for recurring payment
  const purchaseAmount = invoice.amount_paid / 100 // Convert from cents
  await calculateCommission(
    user.id,
    purchaseAmount,
    invoice.subscription as string,
    'RECURRING'
  )
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // This is handled by checkout.session.completed
  console.log('Subscription created:', subscription.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle subscription changes (upgrades/downgrades)
  console.log('Subscription updated:', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Handle subscription cancellation
  console.log('Subscription deleted:', subscription.id)
  
  // You might want to mark related commissions as cancelled here
  // depending on your business logic
}

export const config = {
  api: {
    bodyParser: false,
  },
}
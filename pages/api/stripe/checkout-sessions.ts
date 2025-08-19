import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure STRIPE_SECRET_KEY is set in your .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

// Stripe Price IDs for plans and credit top-ups
const PLAN_PRICE_IDS: Record<string, string> = {
  BASIC: 'price_1RmVP7Cse2bWjZUuxe6qVDXR',    // Basic subscription plan
  PRO: 'price_1RmVPaCse2bWjZUuF1QNnBf0',      // Pro subscription plan
  PREMIUM: 'price_1RmVPmCse2bWjZUu54p90iVP',  // Premium subscription plan
};

const CREDIT_TOPUP_PRICE_IDS: Record<string, string> = {
  TOPUP_10: 'price_1RmVQ2Cse2bWjZUuC8icXn8n',  // 10 credits
  TOPUP_20: 'price_1RmVQGCse2bWjZUuXGghklOL',  // 20 credits
  TOPUP_30: 'price_1RmVQpCse2bWjZUuA12G3RxE',  // 30 credits
};

interface CheckoutRequestBody {
  itemType: 'plan' | 'credits';
  itemId: string; // e.g., "BASIC", "PRO", "TOPUP_50"
  quantity?: number; // Typically 1 for plans, but might be used for credits if needed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  const { itemType, itemId, quantity = 1 } = req.body as CheckoutRequestBody;

  if (!itemType || !itemId) {
    return res.status(400).json({ error: 'Missing itemType or itemId' });
  }

  let priceId: string | undefined;
  let mode: Stripe.Checkout.SessionCreateParams.Mode;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (itemType === 'plan') {
    priceId = PLAN_PRICE_IDS[itemId];
    mode = 'subscription';
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid planId' });
    }
    lineItems.push({ price: priceId, quantity: 1 });
  } else if (itemType === 'credits') {
    priceId = CREDIT_TOPUP_PRICE_IDS[itemId];
    mode = 'payment'; // One-time purchase for credits
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid creditBundleId' });
    }
    lineItems.push({ price: priceId, quantity: quantity > 0 ? quantity : 1 });
  } else {
    return res.status(400).json({ error: 'Invalid itemType' });
  }

  try {
    // Get or create Stripe Customer ID
    let user = await prisma.user.findUnique({ where: { id: userId } });
    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: userEmail, name: session.user.name || undefined });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const successUrl = `${process.env.NEXTAUTH_URL}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard?payment_canceled=true`;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Enable coupon codes
      // Pass metadata to identify the user and purchase type in webhooks
      metadata: {
        userId: userId,
        itemType: itemType,
        itemId: itemId,
        quantity: quantity.toString(), // Stripe metadata values must be strings
      },
    });

    if (!checkoutSession.url) {
        return res.status(500).json({ error: 'Could not create Stripe Checkout session.'});
    }

    res.status(200).json({ sessionId: checkoutSession.id, url: checkoutSession.url });

  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: error.message });
  }
} 
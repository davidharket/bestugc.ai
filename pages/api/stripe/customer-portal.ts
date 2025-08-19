import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      // This should ideally not happen if a user is trying to manage a subscription,
      // as they would have a stripeCustomerId from their initial subscription.
      // However, if they are on a FREE plan and never subscribed, they won't have one.
      return res.status(400).json({ error: 'Stripe customer ID not found. Please subscribe to a plan first to manage billing.' });
    }

    const returnUrl = `${process.env.NEXTAUTH_URL}/dashboard`; // URL to return to after portal session

    let configuration;
    try {
      const configurations = await stripe.billingPortal.configurations.list({ limit: 1 });
      configuration = configurations.data[0]?.id;
    } catch (error) {
      console.log('No existing configuration found, will create default');
    }

    if (!configuration) {
      const newConfig = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Manage your Best UGC subscription',
        },
        features: {
          payment_method_update: { enabled: true },
          subscription_cancel: { 
            enabled: true,
            mode: 'at_period_end'
          },
          subscription_pause: { enabled: false },
        },
      });
      configuration = newConfig.id;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
      configuration: configuration,
    });

    if (!portalSession.url) {
        return res.status(500).json({ error: 'Could not create Stripe Customer Portal session.' })
    }

    res.status(200).json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Stripe Customer Portal error:', error);
    res.status(500).json({ error: 'Failed to create Stripe Customer Portal session', details: error.message });
  }
} 
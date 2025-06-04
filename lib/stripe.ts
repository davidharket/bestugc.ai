import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('STRIPE_SECRET_KEY is not set in production environment');
  } else {
    // In development, it's helpful to have a more lenient warning, 
    // but for actual Stripe operations, it will be required.
    console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
  }
}

// Initialize Stripe with a check for the secret key
// The non-null assertion (!) is used because we throw an error if it's not set in prod,
// and Stripe SDK expects a string.
// In a real scenario, you might handle the absence of the key more gracefully
// or ensure it's always present before this module is even loaded.
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      typescript: true,
    })
  : null; // Or a mock/dummy client for development if preferred

// Example usage (optional, can be removed or expanded):
// async function getStripeAccount() {
//   if (!stripe) return null;
//   try {
//     const account = await stripe.accounts.retrieve();
//     console.log('Stripe account:', account.id);
//     return account;
//   } catch (error) {
//     console.error('Error retrieving Stripe account:', error);
//     return null;
//   }
// }

// getStripeAccount(); 
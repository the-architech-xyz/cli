import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe on the client side
export const getStripe = () => {
  return loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);
};

// Payment intent creation
export const createPaymentIntent = async (amount: number, currency = 'usd') => {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount * 100, // Convert to cents
      currency,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
};

// Subscription creation
export const createSubscription = async (priceId: string, customerId?: string) => {
  const response = await fetch('/api/stripe/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      customerId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return response.json();
};

// Customer portal
export const createCustomerPortalSession = async (customerId: string) => {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  return response.json();
};

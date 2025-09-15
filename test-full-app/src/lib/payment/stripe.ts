import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: 'Full Stack Test App',
    version: '1.0.0',
  },
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  successUrl: process.env.APP_URL + '/payment/success',
  cancelUrl: process.env.APP_URL + '/payment/cancel',
  currency: 'usd',
  mode: 'payment' as const,
};

// Price IDs for different subscription tiers
export const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

// Product configuration
export const PRODUCTS = {
  basic: {
    name: 'Basic Plan',
    description: 'Perfect for individuals',
    price: 9.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  },
  pro: {
    name: 'Pro Plan',
    description: 'Great for small teams',
    price: 29.99,
    features: ['All Basic features', 'Feature 4', 'Feature 5', 'Feature 6'],
  },
  enterprise: {
    name: 'Enterprise Plan',
    description: 'For large organizations',
    price: 99.99,
    features: ['All Pro features', 'Feature 7', 'Feature 8', 'Feature 9', 'Priority Support'],
  },
};

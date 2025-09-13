/**
 * Stripe Payment Processing Blueprint
 * 
 * Sets up complete Stripe integration for payments and subscriptions
 * Creates payment components, API routes, and webhook handling
 */

import { Blueprint } from '../../../types/adapter.js';
import { IntegrationGuideGenerator } from '../../../core/services/integration/integration-guide-generator.js';

export const stripeBlueprint: Blueprint = {
  id: 'stripe-payment-setup',
  name: 'Stripe Payment Processing Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['stripe', '@stripe/stripe-js']
    },
    {
      type: 'ADD_SCRIPT',
      name: 'stripe:listen',
      command: 'stripe listen --forward-to localhost:3000/api/payment/webhook'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'stripe:test',
      command: 'stripe trigger payment_intent.succeeded'
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.payment_config}}/stripe.ts',
      content: `import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: '{{project.name}}',
    version: '1.0.0',
  },
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  successUrl: process.env.APP_URL + '/payment/success',
  cancelUrl: process.env.APP_URL + '/payment/cancel',
  currency: '{{module.parameters.currency}}',
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
};`
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.payment_config}}/client.ts',
      content: `import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe on the client side
export const getStripe = () => {
  return loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);
};

// Payment intent creation
export const createPaymentIntent = async (amount: number, currency = '{{module.parameters.currency}}') => {
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
};`
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_SECRET_KEY',
      value: 'sk_test_...',
      description: 'Stripe secret key for server-side operations'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_PUBLISHABLE_KEY',
      value: 'pk_test_...',
      description: 'Stripe publishable key for client-side operations'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_WEBHOOK_SECRET',
      value: 'whsec_...',
      description: 'Stripe webhook secret for webhook verification'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_BASIC_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for basic plan'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_PRO_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for pro plan'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_ENTERPRISE_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for enterprise plan'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'APP_URL',
      value: 'http://localhost:3000',
      description: 'Application URL for Stripe redirects'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_PUBLISHABLE_KEY',
      value: 'pk_test_...',
      description: 'Public Stripe publishable key for client-side'
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.payment_config}}/INTEGRATION_GUIDE.md',
      content: `# Stripe Payment Processing Integration Guide

## Overview
Stripe provides complete payment processing capabilities including one-time payments, subscriptions, and marketplace functionality.

## Prerequisites
No specific prerequisites required.

## Manual Integration Steps

### Stripe CLI Setup (Recommended for Development)
1. **Install Stripe CLI**:
   \`\`\`bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   winget install stripe.stripe-cli
   
   # Linux
   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
   tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin
   \`\`\`

2. **Login to Stripe**:
   \`\`\`bash
   stripe login
   \`\`\`

3. **Start webhook forwarding** (for development):
   \`\`\`bash
   npm run stripe:listen
   \`\`\`

4. **Test webhooks**:
   \`\`\`bash
   npm run stripe:test
   \`\`\`

### Environment Setup
1. **Add Stripe keys** to your environment variables:
\`\`\`bash
# .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:3000
\`\`\`

### Framework Integration
1. **Create Stripe client** in your app:
\`\`\`typescript
// {{paths.payment_config}}/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});
\`\`\`

2. **Integration with your framework**:
   - Use the Stripe client utilities provided in \`{{paths.payment_config}}/client.ts\`
   - Implement API routes using your framework's HTTP handling
   - Set up webhook endpoints using your framework's webhook handling
   - For framework integration, use the appropriate \`stripe-{framework}-integration\` adapter

## Configuration Examples

### Configuration Options

#### currency
- **Type**: select
- **Required**: No
- **Default**: \`"usd"\`
- **Choices**: usd, eur, gbp, cad, aud, jpy
- **Description**: Default currency for payments

#### mode
- **Type**: select
- **Required**: No
- **Default**: \`"test"\`
- **Choices**: test, live
- **Description**: Stripe mode (test or live)

#### webhooks
- **Type**: boolean
- **Required**: No
- **Default**: \`true\`
- **Description**: Enable webhook handling

#### dashboard
- **Type**: boolean
- **Required**: No
- **Default**: \`true\`
- **Description**: Enable Stripe Dashboard integration

## Troubleshooting

### Common Issues

#### Configuration Errors
- Ensure all required environment variables are set
- Check that all dependencies are properly installed
- Verify that the module is correctly imported

#### Integration Issues
- Make sure the module is compatible with your framework version
- Check that all required adapters are installed first
- Verify that the configuration matches the expected format

#### Performance Issues
- Check for memory leaks in long-running processes
- Monitor resource usage during peak times
- Consider implementing caching strategies

### Getting Help
- Check the [Stripe documentation](https://stripe.com/docs)
- Search for existing issues in the project repository
- Create a new issue with detailed error information

## Support
For more information, visit the [Stripe documentation](https://stripe.com/docs).
`
    }
  ]
};

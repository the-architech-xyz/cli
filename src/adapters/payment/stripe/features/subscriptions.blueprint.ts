/**
 * Stripe Subscriptions Feature Blueprint
 * 
 * Adds subscription management capabilities to an existing Stripe setup
 * This feature can be added to projects that already have Stripe configured
 */

import { Blueprint } from '../../../../types/adapter.js';

const subscriptionsFeatureBlueprint: Blueprint = {
  id: 'stripe-subscriptions-feature',
  name: 'Stripe Subscriptions Feature',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stripe/subscriptions.ts',
      content: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Subscription Plan Interface
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

// Subscription Management Utilities
export class SubscriptionManager {
  static async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  static async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' = '{{#if module.parameters.proration}}create_prorations{{else}}none{{/if}}'
  ) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: prorationBehavior,
    });

    return updatedSubscription;
  }

  static async cancelSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }

  static async createBillingPortalSession(customerId: string, returnUrl?: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || process.env.NEXT_PUBLIC_APP_URL + '/dashboard/billing',
    });

    return session;
  }

  static async getSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price', 'customer'],
    });

    return subscription;
  }

  static async listSubscriptions(customerId: string) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.items.data.price'],
    });

    return subscriptions;
  }

  static async pauseSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void',
      },
    });

    return subscription;
  }

  static async resumeSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });

    return subscription;
  }
}

// Webhook Utilities
export class SubscriptionWebhooks {
  static handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Handle subscription created event
    console.log('Subscription created:', subscription.id);
    // Add your business logic here
  }

  static handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Handle subscription updated event
    console.log('Subscription updated:', subscription.id);
    // Add your business logic here
  }

  static handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Handle subscription deleted event
    console.log('Subscription deleted:', subscription.id);
    // Add your business logic here
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stripe/billing-portal.ts',
      content: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Billing Portal Configuration
export interface BillingPortalConfig {
  business_profile: {
    headline?: string;
    privacy_policy_url?: string;
    terms_of_service_url?: string;
  };
  features: {
    customer_update?: {
      enabled: boolean;
      allowed_updates: string[];
    };
    invoice_history?: {
      enabled: boolean;
    };
    payment_method_update?: {
      enabled: boolean;
    };
    subscription_cancel?: {
      enabled: boolean;
      mode: 'at_period_end' | 'immediately';
    };
    subscription_pause?: {
      enabled: boolean;
    };
  };
}

// Billing Portal Manager
export class BillingPortalManager {
  static async createPortalSession(
    customerId: string,
    returnUrl: string,
    config?: Partial<BillingPortalConfig>
  ) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...config,
    });

    return session;
  }

  static async createPortalConfiguration(config: BillingPortalConfig) {
    const configuration = await stripe.billingPortal.configurations.create(config);
    return configuration;
  }

  static async updatePortalConfiguration(
    configurationId: string,
    config: Partial<BillingPortalConfig>
  ) {
    const configuration = await stripe.billingPortal.configurations.update(
      configurationId,
      config
    );
    return configuration;
  }

  static async listPortalConfigurations() {
    const configurations = await stripe.billingPortal.configurations.list();
    return configurations;
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'docs/integrations/stripe-subscriptions.md',
      content: `# Stripe Subscriptions Integration Guide

## Overview

This guide shows how to integrate Stripe Subscriptions with your authentication and database systems.

## Prerequisites

- Stripe account with API keys
- Authentication system (Better Auth, NextAuth, etc.)
- Database for storing subscription data

## Basic Setup

### 1. Environment Variables

\`\`\`bash
# .env.local
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
\`\`\`

### 2. Database Schema

Add subscription fields to your user model:

\`\`\`typescript
// User model
interface User {
  id: string;
  email: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  subscriptionPlan?: string;
}
\`\`\`

## Integration Examples

### With Better Auth

\`\`\`typescript
// src/app/api/subscriptions/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionManager } from '@/lib/stripe/subscriptions';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, trialDays } = await request.json();

    // Get or create Stripe customer
    const customerId = session.user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const subscription = await SubscriptionManager.createSubscription(
      customerId,
      priceId,
      trialDays
    );

    // Update user in database
    // await updateUser(session.user.id, { subscriptionId: subscription.id });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
\`\`\`

### With Database (Drizzle/Prisma)

\`\`\`typescript
// src/lib/db/subscriptions.ts
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    subscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
  }
) {
  return await db
    .update(users)
    .set(subscriptionData)
    .where(eq(users.id, userId));
}
\`\`\`

## Webhook Handling

\`\`\`typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionWebhooks } from '@/lib/stripe/subscriptions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
      SubscriptionWebhooks.handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      SubscriptionWebhooks.handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      SubscriptionWebhooks.handleSubscriptionDeleted(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
\`\`\`

## UI Components

### Subscription Plans Component

\`\`\`typescript
// src/components/subscriptions/SubscriptionPlans.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export function SubscriptionPlans({ plans, currentPlan, onSelectPlan, loading }: SubscriptionPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className={currentPlan === plan.id ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              \${(plan.price / 100).toFixed(2)}/\${plan.interval}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => onSelectPlan(plan.id)}
              disabled={loading || currentPlan === plan.id}
              className="w-full"
            >
              {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
\`\`\`

## Best Practices

1. **Always validate webhooks** with Stripe's signature verification
2. **Store subscription data** in your database for quick access
3. **Handle edge cases** like failed payments and subscription changes
4. **Use Stripe's test mode** during development
5. **Implement proper error handling** for all API calls

## Common Patterns

### Subscription Status Check

\`\`\`typescript
export function hasActiveSubscription(user: User): boolean {
  return user.subscriptionStatus === 'active';
}

export function getSubscriptionPlan(user: User): string | null {
  return user.subscriptionPlan || null;
}
\`\`\`

### Access Control

\`\`\`typescript
export function requireSubscription(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await auth();
    
    if (!hasActiveSubscription(session.user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
    }
    
    return handler(req, ...args);
  };
}
\`\`\`
`
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_SECRET_KEY',
      value: 'sk_test_...',
      description: 'Stripe secret key for subscriptions'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_PUBLISHABLE_KEY',
      value: 'pk_test_...',
      description: 'Stripe publishable key for client-side'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_WEBHOOK_SECRET',
      value: 'whsec_...',
      description: 'Stripe webhook secret for verification'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_BASIC_PLAN_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for basic plan (create in Stripe Dashboard)'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_PRO_PLAN_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for pro plan (create in Stripe Dashboard)'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_ENTERPRISE_PLAN_PRICE_ID',
      value: 'price_...',
      description: 'Stripe price ID for enterprise plan (create in Stripe Dashboard)'
    }
  ]
};

export default subscriptionsFeatureBlueprint;

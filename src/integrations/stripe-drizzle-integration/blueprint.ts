import { Blueprint } from '../../types/adapter.js';

const stripeDrizzleIntegrationBlueprint: Blueprint = {
  id: 'stripe-drizzle-integration',
  name: 'Stripe Drizzle Integration',
  description: 'Integrates Stripe with Drizzle ORM for database operations',
  version: '1.0.0',
  actions: [
    // PURE MODIFIER: Add Stripe database schema to existing schema
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/db/schema.ts',
      condition: '{{#if integration.features.paymentTracking}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'pgTable', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'text', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'timestamp', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'integer', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'boolean', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'jsonb', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'uuid', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'index', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'relations', from: 'drizzle-orm', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Stripe Payment Records Table
export const stripePayments = pgTable('stripe_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull(), // succeeded, pending, failed, canceled
  paymentMethod: text('payment_method').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  stripePaymentIntentIdIdx: index('stripe_payments_payment_intent_id_idx').on(table.stripePaymentIntentId),
  stripeCustomerIdIdx: index('stripe_payments_customer_id_idx').on(table.stripeCustomerId),
  statusIdx: index('stripe_payments_status_idx').on(table.status),
  createdAtIdx: index('stripe_payments_created_at_idx').on(table.createdAt),
}));

// Stripe Subscriptions Table
export const stripeSubscriptions = pgTable('stripe_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  status: text('status').notNull(), // active, canceled, incomplete, past_due, etc.
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  stripeSubscriptionIdIdx: index('stripe_subscriptions_subscription_id_idx').on(table.stripeSubscriptionId),
  stripeCustomerIdIdx: index('stripe_subscriptions_customer_id_idx').on(table.stripeCustomerId),
  statusIdx: index('stripe_subscriptions_status_idx').on(table.status),
  createdAtIdx: index('stripe_subscriptions_created_at_idx').on(table.createdAt),
}));

// Stripe Webhook Events Table
export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  processed: boolean('processed').default(false).notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  stripeEventIdIdx: index('stripe_webhook_events_event_id_idx').on(table.stripeEventId),
  typeIdx: index('stripe_webhook_events_type_idx').on(table.type),
  processedIdx: index('stripe_webhook_events_processed_idx').on(table.processed),
  createdAtIdx: index('stripe_webhook_events_created_at_idx').on(table.createdAt),
}));

// Relations
export const stripePaymentsRelations = relations(stripePayments, ({ one }) => ({
  customer: one(stripeSubscriptions, {
    fields: [stripePayments.stripeCustomerId],
    references: [stripeSubscriptions.stripeCustomerId],
  }),
}));

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ many }) => ({
  payments: many(stripePayments),
}));

// Types
export type StripePayment = typeof stripePayments.$inferSelect;
export type NewStripePayment = typeof stripePayments.$inferInsert;
export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type NewStripeSubscription = typeof stripeSubscriptions.$inferInsert;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;`
          }
        ]
      }
    },

    // PURE MODIFIER: Add Stripe database adapter to existing payment utilities
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/payment/stripe.ts',
      condition: '{{#if integration.features.paymentTracking}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'db', from: '@/lib/db', type: 'import' },
          { name: 'stripePayments', from: '@/lib/db/schema', type: 'import' },
          { name: 'stripeSubscriptions', from: '@/lib/db/schema', type: 'import' },
          { name: 'stripeWebhookEvents', from: '@/lib/db/schema', type: 'import' },
          { name: 'type NewStripePayment', from: '@/lib/db/schema', type: 'import' },
          { name: 'type NewStripeSubscription', from: '@/lib/db/schema', type: 'import' },
          { name: 'type NewStripeWebhookEvent', from: '@/lib/db/schema', type: 'import' },
          { name: 'eq', from: 'drizzle-orm', type: 'import' },
          { name: 'and', from: 'drizzle-orm', type: 'import' },
          { name: 'desc', from: 'drizzle-orm', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `/**
 * Stripe Database Integration
 */
export class StripeDrizzleAdapter {
  /**
   * Log a payment to the database
   */
  static async logPayment(payment: NewStripePayment) {
    try {
      const [insertedPayment] = await db
        .insert(stripePayments)
        .values(payment)
        .returning();
      
      return insertedPayment;
    } catch (error) {
      console.error('Failed to log payment to database:', error);
      throw error;
    }
  }

  /**
   * Log a subscription to the database
   */
  static async logSubscription(subscription: NewStripeSubscription) {
    try {
      const [insertedSubscription] = await db
        .insert(stripeSubscriptions)
        .values(subscription)
        .returning();
      
      return insertedSubscription;
    } catch (error) {
      console.error('Failed to log subscription to database:', error);
      throw error;
    }
  }

  /**
   * Log a webhook event to the database
   */
  static async logWebhookEvent(event: NewStripeWebhookEvent) {
    try {
      const [insertedEvent] = await db
        .insert(stripeWebhookEvents)
        .values(event)
        .returning();
      
      return insertedEvent;
    } catch (error) {
      console.error('Failed to log webhook event to database:', error);
      throw error;
    }
  }

  /**
   * Get payments by customer ID
   */
  static async getPaymentsByCustomer(customerId: string, limit: number = 50) {
    try {
      return await db
        .select()
        .from(stripePayments)
        .where(eq(stripePayments.stripeCustomerId, customerId))
        .orderBy(desc(stripePayments.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get payments from database:', error);
      throw error;
    }
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  static async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    try {
      const [subscription] = await db
        .select()
        .from(stripeSubscriptions)
        .where(eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .limit(1);
      
      return subscription;
    } catch (error) {
      console.error('Failed to get subscription from database:', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    stripeSubscriptionId: string, 
    status: string, 
    metadata?: Record<string, any>
  ) {
    try {
      return await db
        .update(stripeSubscriptions)
        .set({
          status,
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .returning();
    } catch (error) {
      console.error('Failed to update subscription in database:', error);
      throw error;
    }
  }

  /**
   * Mark webhook event as processed
   */
  static async markWebhookEventProcessed(stripeEventId: string) {
    try {
      return await db
        .update(stripeWebhookEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(stripeWebhookEvents.stripeEventId, stripeEventId))
        .returning();
    } catch (error) {
      console.error('Failed to mark webhook event as processed:', error);
      throw error;
    }
  }

  /**
   * Get unprocessed webhook events
   */
  static async getUnprocessedWebhookEvents(limit: number = 100) {
    try {
      return await db
        .select()
        .from(stripeWebhookEvents)
        .where(eq(stripeWebhookEvents.processed, false))
        .orderBy(desc(stripeWebhookEvents.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get unprocessed webhook events:', error);
      throw error;
    }
  }
}`
          }
        ]
      }
    }
  ]
};

export const blueprint = stripeDrizzleIntegrationBlueprint;

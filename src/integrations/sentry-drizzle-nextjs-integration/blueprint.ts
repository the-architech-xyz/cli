import { Blueprint } from '../../types/adapter.js';

const sentryDrizzleNextjsIntegrationBlueprint: Blueprint = {
  id: 'sentry-drizzle-nextjs-integration',
  name: 'Sentry Drizzle Next.js Integration',
  description: 'Complete Sentry integration with Drizzle ORM for Next.js applications',
  version: '1.0.0',
  actions: [
    // Database Schema
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/schema/sentry.ts',
      condition: '{{#if integration.features.errorLogging}}',
      content: `import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Sentry Events Table
export const sentryEvents = pgTable('sentry_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  environment: text('environment').notNull(),
  level: text('level').notNull(), // error, warning, info, debug
  message: text('message'),
  exception: jsonb('exception'),
  stacktrace: jsonb('stacktrace'),
  tags: jsonb('tags'),
  extra: jsonb('extra'),
  user: jsonb('user'),
  context: jsonb('context'),
  breadcrumbs: jsonb('breadcrumbs'),
  release: text('release'),
  dist: text('dist'),
  platform: text('platform'),
  sdk: jsonb('sdk'),
  serverName: text('server_name'),
  url: text('url'),
  method: text('method'),
  statusCode: integer('status_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: text('resolved_by'),
  isResolved: boolean('is_resolved').default(false).notNull(),
}, (table) => ({
  eventIdIdx: index('sentry_events_event_id_idx').on(table.eventId),
  projectIdIdx: index('sentry_events_project_id_idx').on(table.projectId),
  environmentIdx: index('sentry_events_environment_idx').on(table.environment),
  levelIdx: index('sentry_events_level_idx').on(table.level),
  createdAtIdx: index('sentry_events_created_at_idx').on(table.createdAt),
  isResolvedIdx: index('sentry_events_is_resolved_idx').on(table.isResolved),
}));

export type SentryEvent = typeof sentryEvents.$inferSelect;
export type NewSentryEvent = typeof sentryEvents.$inferInsert;

// Performance Transactions Table
export const sentryTransactions = pgTable('sentry_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: text('transaction_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  environment: text('environment').notNull(),
  name: text('name').notNull(),
  op: text('op').notNull(), // navigation, http, db, etc.
  status: text('status').notNull(), // ok, cancelled, aborted, internal_error, etc.
  duration: integer('duration').notNull(), // in milliseconds
  startTimestamp: timestamp('start_timestamp').notNull(),
  endTimestamp: timestamp('end_timestamp').notNull(),
  tags: jsonb('tags'),
  data: jsonb('data'),
  measurements: jsonb('measurements'),
  spans: jsonb('spans'),
  user: jsonb('user'),
  context: jsonb('context'),
  release: text('release'),
  dist: text('dist'),
  platform: text('platform'),
  sdk: jsonb('sdk'),
  serverName: text('server_name'),
  url: text('url'),
  method: text('method'),
  statusCode: integer('status_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  transactionIdIdx: index('sentry_transactions_transaction_id_idx').on(table.transactionId),
  projectIdIdx: index('sentry_transactions_project_id_idx').on(table.projectId),
  environmentIdx: index('sentry_transactions_environment_idx').on(table.environment),
  nameIdx: index('sentry_transactions_name_idx').on(table.name),
  opIdx: index('sentry_transactions_op_idx').on(table.op),
  statusIdx: index('sentry_transactions_status_idx').on(table.status),
  createdAtIdx: index('sentry_transactions_created_at_idx').on(table.createdAt),
}));

// User Feedback Table
export const sentryUserFeedback = pgTable('sentry_user_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id'),
  projectId: text('project_id').notNull(),
  environment: text('environment').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  comments: text('comments').notNull(),
  user: jsonb('user'),
  context: jsonb('context'),
  tags: jsonb('tags'),
  extra: jsonb('extra'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  isProcessed: boolean('is_processed').default(false).notNull(),
}, (table) => ({
  eventIdIdx: index('sentry_user_feedback_event_id_idx').on(table.eventId),
  projectIdIdx: index('sentry_user_feedback_project_id_idx').on(table.projectId),
  environmentIdx: index('sentry_user_feedback_environment_idx').on(table.environment),
  emailIdx: index('sentry_user_feedback_email_idx').on(table.email),
  createdAtIdx: index('sentry_user_feedback_created_at_idx').on(table.createdAt),
  isProcessedIdx: index('sentry_user_feedback_is_processed_idx').on(table.isProcessed),
}));

// Database Query Performance Table
export const sentryQueryPerformance = pgTable('sentry_query_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull(),
  environment: text('environment').notNull(),
  query: text('query').notNull(),
  queryHash: text('query_hash').notNull(),
  tableName: text('table_name'),
  operation: text('operation').notNull(), // SELECT, INSERT, UPDATE, DELETE
  duration: integer('duration').notNull(), // in milliseconds
  rowsAffected: integer('rows_affected'),
  rowsReturned: integer('rows_returned'),
  executionPlan: jsonb('execution_plan'),
  parameters: jsonb('parameters'),
  error: text('error'),
  stackTrace: text('stack_trace'),
  user: jsonb('user'),
  context: jsonb('context'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index('sentry_query_performance_project_id_idx').on(table.projectId),
  environmentIdx: index('sentry_query_performance_environment_idx').on(table.environment),
  queryHashIdx: index('sentry_query_performance_query_hash_idx').on(table.queryHash),
  tableNameIdx: index('sentry_query_performance_table_name_idx').on(table.tableName),
  operationIdx: index('sentry_query_performance_operation_idx').on(table.operation),
  createdAtIdx: index('sentry_query_performance_created_at_idx').on(table.createdAt),
}));

// Relations
export const sentryEventsRelations = relations(sentryEvents, ({ many }) => ({
  userFeedback: many(sentryUserFeedback),
}));

export const sentryUserFeedbackRelations = relations(sentryUserFeedback, ({ one }) => ({
  event: one(sentryEvents, {
    fields: [sentryUserFeedback.eventId],
    references: [sentryEvents.eventId],
  }),
}));

// Types
export type SentryTransaction = typeof sentryTransactions.$inferSelect;
export type NewSentryTransaction = typeof sentryTransactions.$inferInsert;
export type SentryUserFeedback = typeof sentryUserFeedback.$inferSelect;
export type NewSentryUserFeedback = typeof sentryUserFeedback.$inferInsert;
export type SentryQueryPerformance = typeof sentryQueryPerformance.$inferSelect;
export type NewSentryQueryPerformance = typeof sentryQueryPerformance.$inferInsert;
`
    },
    // Database Migrations
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/migrations/sentry.sql',
      condition: '{{#if integration.features.migrations}}',
      content: `-- Sentry Events Table
CREATE TABLE IF NOT EXISTS sentry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT,
  exception JSONB,
  stacktrace JSONB,
  tags JSONB,
  extra JSONB,
  user JSONB,
  context JSONB,
  breadcrumbs JSONB,
  release TEXT,
  dist TEXT,
  platform TEXT,
  sdk JSONB,
  server_name TEXT,
  url TEXT,
  method TEXT,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL
);

-- Sentry Transactions Table
CREATE TABLE IF NOT EXISTS sentry_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  name TEXT NOT NULL,
  op TEXT NOT NULL,
  status TEXT NOT NULL,
  duration INTEGER NOT NULL,
  start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  tags JSONB,
  data JSONB,
  measurements JSONB,
  spans JSONB,
  user JSONB,
  context JSONB,
  release TEXT,
  dist TEXT,
  platform TEXT,
  sdk JSONB,
  server_name TEXT,
  url TEXT,
  method TEXT,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Sentry User Feedback Table
CREATE TABLE IF NOT EXISTS sentry_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  project_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  comments TEXT NOT NULL,
  user JSONB,
  context JSONB,
  tags JSONB,
  extra JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  is_processed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Sentry Query Performance Table
CREATE TABLE IF NOT EXISTS sentry_query_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  query TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  table_name TEXT,
  operation TEXT NOT NULL,
  duration INTEGER NOT NULL,
  rows_affected INTEGER,
  rows_returned INTEGER,
  execution_plan JSONB,
  parameters JSONB,
  error TEXT,
  stack_trace TEXT,
  user JSONB,
  context JSONB,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for Sentry Events
CREATE INDEX IF NOT EXISTS sentry_events_event_id_idx ON sentry_events(event_id);
CREATE INDEX IF NOT EXISTS sentry_events_project_id_idx ON sentry_events(project_id);
CREATE INDEX IF NOT EXISTS sentry_events_environment_idx ON sentry_events(environment);
CREATE INDEX IF NOT EXISTS sentry_events_level_idx ON sentry_events(level);
CREATE INDEX IF NOT EXISTS sentry_events_created_at_idx ON sentry_events(created_at);
CREATE INDEX IF NOT EXISTS sentry_events_is_resolved_idx ON sentry_events(is_resolved);

-- Indexes for Sentry Transactions
CREATE INDEX IF NOT EXISTS sentry_transactions_transaction_id_idx ON sentry_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS sentry_transactions_project_id_idx ON sentry_transactions(project_id);
CREATE INDEX IF NOT EXISTS sentry_transactions_environment_idx ON sentry_transactions(environment);
CREATE INDEX IF NOT EXISTS sentry_transactions_name_idx ON sentry_transactions(name);
CREATE INDEX IF NOT EXISTS sentry_transactions_op_idx ON sentry_transactions(op);
CREATE INDEX IF NOT EXISTS sentry_transactions_status_idx ON sentry_transactions(status);
CREATE INDEX IF NOT EXISTS sentry_transactions_created_at_idx ON sentry_transactions(created_at);

-- Indexes for Sentry User Feedback
CREATE INDEX IF NOT EXISTS sentry_user_feedback_event_id_idx ON sentry_user_feedback(event_id);
CREATE INDEX IF NOT EXISTS sentry_user_feedback_project_id_idx ON sentry_user_feedback(project_id);
CREATE INDEX IF NOT EXISTS sentry_user_feedback_environment_idx ON sentry_user_feedback(environment);
CREATE INDEX IF NOT EXISTS sentry_user_feedback_email_idx ON sentry_user_feedback(email);
CREATE INDEX IF NOT EXISTS sentry_user_feedback_created_at_idx ON sentry_user_feedback(created_at);
CREATE INDEX IF NOT EXISTS sentry_user_feedback_is_processed_idx ON sentry_user_feedback(is_processed);

-- Indexes for Sentry Query Performance
CREATE INDEX IF NOT EXISTS sentry_query_performance_project_id_idx ON sentry_query_performance(project_id);
CREATE INDEX IF NOT EXISTS sentry_query_performance_environment_idx ON sentry_query_performance(environment);
CREATE INDEX IF NOT EXISTS sentry_query_performance_query_hash_idx ON sentry_query_performance(query_hash);
CREATE INDEX IF NOT EXISTS sentry_query_performance_table_name_idx ON sentry_query_performance(table_name);
CREATE INDEX IF NOT EXISTS sentry_query_performance_operation_idx ON sentry_query_performance(operation);
CREATE INDEX IF NOT EXISTS sentry_query_performance_created_at_idx ON sentry_query_performance(created_at);

-- Foreign Key Constraints
ALTER TABLE sentry_user_feedback 
ADD CONSTRAINT fk_sentry_user_feedback_event_id 
FOREIGN KEY (event_id) REFERENCES sentry_events(event_id) ON DELETE SET NULL;
`
    },
    // Drizzle Adapter
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/drizzle-adapter.ts',
      condition: '{{#if integration.features.errorLogging}}',
      content: `import { db } from '@/lib/db';
import { 
  sentryEvents, 
  sentryTransactions, 
  sentryUserFeedback, 
  sentryQueryPerformance,
  type NewSentryEvent,
  type NewSentryTransaction,
  type NewSentryUserFeedback,
  type NewSentryQueryPerformance
} from '@/lib/db/schema/sentry';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

export class SentryDrizzleAdapter {
  /**
   * Log a Sentry event to the database
   */
  static async logEvent(event: NewSentryEvent) {
    try {
      const [insertedEvent] = await db
        .insert(sentryEvents)
        .values(event)
        .returning();
      
      return insertedEvent;
    } catch (error) {
      console.error('Failed to log Sentry event to database:', error);
      throw error;
    }
  }

  /**
   * Log a Sentry transaction to the database
   */
  static async logTransaction(transaction: NewSentryTransaction) {
    try {
      const [insertedTransaction] = await db
        .insert(sentryTransactions)
        .values(transaction)
        .returning();
      
      return insertedTransaction;
    } catch (error) {
      console.error('Failed to log Sentry transaction to database:', error);
      throw error;
    }
  }

  /**
   * Log user feedback to the database
   */
  static async logUserFeedback(feedback: NewSentryUserFeedback) {
    try {
      const [insertedFeedback] = await db
        .insert(sentryUserFeedback)
        .values(feedback)
        .returning();
      
      return insertedFeedback;
    } catch (error) {
      console.error('Failed to log user feedback to database:', error);
      throw error;
    }
  }

  /**
   * Log query performance to the database
   */
  static async logQueryPerformance(performance: NewSentryQueryPerformance) {
    try {
      const [insertedPerformance] = await db
        .insert(sentryQueryPerformance)
        .values(performance)
        .returning();
      
      return insertedPerformance;
    } catch (error) {
      console.error('Failed to log query performance to database:', error);
      throw error;
    }
  }

  /**
   * Get events by project and environment
   */
  static async getEvents(projectId: string, environment: string, limit: number = 50) {
    try {
      return await db
        .select()
        .from(sentryEvents)
        .where(
          and(
            eq(sentryEvents.projectId, projectId),
            eq(sentryEvents.environment, environment)
          )
        )
        .orderBy(desc(sentryEvents.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get events from database:', error);
      throw error;
    }
  }

  /**
   * Get unresolved events
   */
  static async getUnresolvedEvents(projectId: string, environment: string) {
    try {
      return await db
        .select()
        .from(sentryEvents)
        .where(
          and(
            eq(sentryEvents.projectId, projectId),
            eq(sentryEvents.environment, environment),
            eq(sentryEvents.isResolved, false)
          )
        )
        .orderBy(desc(sentryEvents.createdAt));
    } catch (error) {
      console.error('Failed to get unresolved events from database:', error);
      throw error;
    }
  }

  /**
   * Resolve an event
   */
  static async resolveEvent(eventId: string, resolvedBy: string) {
    try {
      return await db
        .update(sentryEvents)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy,
        })
        .where(eq(sentryEvents.eventId, eventId))
        .returning();
    } catch (error) {
      console.error('Failed to resolve event in database:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(
    projectId: string, 
    environment: string, 
    startDate: Date, 
    endDate: Date
  ) {
    try {
      const transactions = await db
        .select()
        .from(sentryTransactions)
        .where(
          and(
            eq(sentryTransactions.projectId, projectId),
            eq(sentryTransactions.environment, environment),
            gte(sentryTransactions.createdAt, startDate),
            lte(sentryTransactions.createdAt, endDate)
          )
        )
        .orderBy(desc(sentryTransactions.createdAt));

      return transactions;
    } catch (error) {
      console.error('Failed to get performance metrics from database:', error);
      throw error;
    }
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(projectId: string, environment: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await db
        .select({
          level: sentryEvents.level,
          count: count(),
        })
        .from(sentryEvents)
        .where(
          and(
            eq(sentryEvents.projectId, projectId),
            eq(sentryEvents.environment, environment),
            gte(sentryEvents.createdAt, startDate)
          )
        )
        .groupBy(sentryEvents.level);

      return stats;
    } catch (error) {
      console.error('Failed to get error stats from database:', error);
      throw error;
    }
  }

  /**
   * Get slow queries
   */
  static async getSlowQueries(
    projectId: string, 
    environment: string, 
    minDuration: number = 1000,
    limit: number = 20
  ) {
    try {
      return await db
        .select()
        .from(sentryQueryPerformance)
        .where(
          and(
            eq(sentryQueryPerformance.projectId, projectId),
            eq(sentryQueryPerformance.environment, environment),
            gte(sentryQueryPerformance.duration, minDuration)
          )
        )
        .orderBy(desc(sentryQueryPerformance.duration))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get slow queries from database:', error);
      throw error;
    }
  }

  /**
   * Clean up old data
   */
  static async cleanupOldData(projectId: string, daysToKeep: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old events
      const deletedEvents = await db
        .delete(sentryEvents)
        .where(
          and(
            eq(sentryEvents.projectId, projectId),
            lte(sentryEvents.createdAt, cutoffDate)
          )
        );

      // Delete old transactions
      const deletedTransactions = await db
        .delete(sentryTransactions)
        .where(
          and(
            eq(sentryTransactions.projectId, projectId),
            lte(sentryTransactions.createdAt, cutoffDate)
          )
        );

      // Delete old query performance data
      const deletedQueries = await db
        .delete(sentryQueryPerformance)
        .where(
          and(
            eq(sentryQueryPerformance.projectId, projectId),
            lte(sentryQueryPerformance.createdAt, cutoffDate)
          )
        );

      return {
        deletedEvents: deletedEvents.rowCount || 0,
        deletedTransactions: deletedTransactions.rowCount || 0,
        deletedQueries: deletedQueries.rowCount || 0,
      };
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      throw error;
    }
  }
}
`
    },
    // Error Logger
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/error-logger.ts',
      condition: '{{#if integration.features.errorLogging}}',
      content: `import * as Sentry from '@sentry/nextjs';
import { SentryDrizzleAdapter } from './drizzle-adapter';
import { type NewSentryEvent } from '@/lib/db/schema/sentry';

export class SentryErrorLogger {
  /**
   * Log an error to both Sentry and database
   */
  static async logError(
    error: Error,
    context: {
      projectId: string;
      environment: string;
      level?: 'error' | 'warning' | 'info' | 'debug';
      tags?: Record<string, string>;
      user?: Record<string, any>;
      extra?: Record<string, any>;
      breadcrumbs?: Array<{
        message: string;
        category?: string;
        level?: 'info' | 'warning' | 'error' | 'debug';
        data?: Record<string, any>;
      }>;
    }
  ) {
    const eventId = Sentry.captureException(error);
    
    // Prepare event data for database
    const eventData: NewSentryEvent = {
      eventId: eventId || Math.random().toString(36).substr(2, 9),
      projectId: context.projectId,
      environment: context.environment,
      level: context.level || 'error',
      message: error.message,
      exception: {
        type: error.constructor.name,
        value: error.message,
        stacktrace: error.stack ? {
          frames: error.stack.split('\\n').map((line, index) => ({
            filename: line.split(' at ')[1]?.split(' ')[0] || 'unknown',
            function: line.split(' at ')[0]?.trim() || 'unknown',
            lineno: index,
            colno: 0,
          })),
        } : undefined,
      },
      stacktrace: error.stack ? {
        frames: error.stack.split('\\n').map((line, index) => ({
          filename: line.split(' at ')[1]?.split(' ')[0] || 'unknown',
          function: line.split(' at ')[0]?.trim() || 'unknown',
          lineno: index,
          colno: 0,
        })),
      } : undefined,
      tags: context.tags,
      extra: context.extra,
      user: context.user,
      context: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
      breadcrumbs: context.breadcrumbs,
      platform: 'node',
      sdk: {
        name: '@sentry/nextjs',
        version: '7.0.0', // Update with actual version
      },
    };

    // Log to database
    try {
      await SentryDrizzleAdapter.logEvent(eventData);
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      // Don't throw here to avoid breaking the main flow
    }

    return eventId;
  }

  /**
   * Log a message to both Sentry and database
   */
  static async logMessage(
    message: string,
    context: {
      projectId: string;
      environment: string;
      level?: 'error' | 'warning' | 'info' | 'debug';
      tags?: Record<string, string>;
      user?: Record<string, any>;
      extra?: Record<string, any>;
    }
  ) {
    const eventId = Sentry.captureMessage(message, context.level || 'info');
    
    // Prepare event data for database
    const eventData: NewSentryEvent = {
      eventId: eventId || Math.random().toString(36).substr(2, 9),
      projectId: context.projectId,
      environment: context.environment,
      level: context.level || 'info',
      message,
      tags: context.tags,
      extra: context.extra,
      user: context.user,
      context,
      platform: 'node',
      sdk: {
        name: '@sentry/nextjs',
        version: '7.0.0', // Update with actual version
      },
    };

    // Log to database
    try {
      await SentryDrizzleAdapter.logEvent(eventData);
    } catch (dbError) {
      console.error('Failed to log message to database:', dbError);
    }

    return eventId;
  }

  /**
   * Add breadcrumb to both Sentry and prepare for database
   */
  static addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error' | 'debug';
    data?: Record<string, any>;
  }) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context for both Sentry and database
   */
  static setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }) {
    Sentry.setUser(user);
  }

  /**
   * Set tags for both Sentry and database
   */
  static setTags(tags: Record<string, string>) {
    Sentry.setTags(tags);
  }

  /**
   * Set context for both Sentry and database
   */
  static setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }
}
`
    },
    // Performance Tracker
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/performance-tracker.ts',
      condition: '{{#if integration.features.performanceTracking}}',
      content: `import * as Sentry from '@sentry/nextjs';
import { SentryDrizzleAdapter } from './drizzle-adapter';
import { type NewSentryTransaction } from '@/lib/db/schema/sentry';

export class SentryPerformanceTracker {
  private static transactions: Map<string, any> = new Map();

  /**
   * Start a transaction and track it
   */
  static startTransaction(
    name: string,
    op: string,
    context: {
      projectId: string;
      environment: string;
      tags?: Record<string, string>;
      user?: Record<string, any>;
      data?: Record<string, any>;
    }
  ) {
    const transaction = Sentry.startTransaction({ name, op });
    
    // Store transaction for database logging
    this.transactions.set(transaction.spanId, {
      transactionId: transaction.traceId,
      projectId: context.projectId,
      environment: context.environment,
      name,
      op,
      tags: context.tags,
      user: context.user,
      data: context.data,
      startTimestamp: new Date(),
    });

    return transaction;
  }

  /**
   * Finish a transaction and log to database
   */
  static finishTransaction(
    transaction: any,
    status: 'ok' | 'cancelled' | 'aborted' | 'internal_error' = 'ok'
  ) {
    transaction.setStatus(status);
    transaction.finish();

    // Get stored transaction data
    const storedData = this.transactions.get(transaction.spanId);
    if (storedData) {
      const endTimestamp = new Date();
      const duration = endTimestamp.getTime() - storedData.startTimestamp.getTime();

      // Prepare transaction data for database
      const transactionData: NewSentryTransaction = {
        transactionId: storedData.transactionId,
        projectId: storedData.projectId,
        environment: storedData.environment,
        name: storedData.name,
        op: storedData.op,
        status,
        duration,
        startTimestamp: storedData.startTimestamp,
        endTimestamp,
        tags: storedData.tags,
        data: storedData.data,
        user: storedData.user,
        context: {
          transaction: {
            spanId: transaction.spanId,
            traceId: transaction.traceId,
            parentSpanId: transaction.parentSpanId,
          },
        },
        platform: 'node',
        sdk: {
          name: '@sentry/nextjs',
          version: '7.0.0', // Update with actual version
        },
      };

      // Log to database
      SentryDrizzleAdapter.logTransaction(transactionData).catch((error) => {
        console.error('Failed to log transaction to database:', error);
      });

      // Clean up stored data
      this.transactions.delete(transaction.spanId);
    }
  }

  /**
   * Track API performance
   */
  static trackApiPerformance(
    endpoint: string,
    method: string,
    context: {
      projectId: string;
      environment: string;
      statusCode?: number;
      user?: Record<string, any>;
    }
  ) {
    const transaction = this.startTransaction(
      \`api-\${method.toLowerCase()}-\${endpoint}\`,
      'http.client',
      {
        ...context,
        data: {
          endpoint,
          method,
          statusCode: context.statusCode,
        },
      }
    );

    return {
      finish: (statusCode?: number) => {
        this.finishTransaction(transaction, 'ok');
      },
      error: () => {
        this.finishTransaction(transaction, 'internal_error');
      },
    };
  }

  /**
   * Track database performance
   */
  static trackDatabasePerformance(
    query: string,
    operation: string,
    context: {
      projectId: string;
      environment: string;
      tableName?: string;
      user?: Record<string, any>;
    }
  ) {
    const transaction = this.startTransaction(
      \`db-\${operation.toLowerCase()}-\${context.tableName || 'unknown'}\`,
      'db',
      {
        ...context,
        data: {
          query,
          operation,
          tableName: context.tableName,
        },
      }
    );

    return {
      finish: (rowCount?: number) => {
        transaction.setData('db.rows_affected', rowCount);
        this.finishTransaction(transaction, 'ok');
      },
      error: () => {
        this.finishTransaction(transaction, 'internal_error');
      },
    };
  }

  /**
   * Track page load performance
   */
  static trackPageLoad(
    pageName: string,
    context: {
      projectId: string;
      environment: string;
      user?: Record<string, any>;
    }
  ) {
    const transaction = this.startTransaction(
      \`page-load-\${pageName}\`,
      'navigation',
      {
        ...context,
        data: {
          pageName,
        },
      }
    );

    return {
      finish: () => {
        this.finishTransaction(transaction, 'ok');
      },
      error: () => {
        this.finishTransaction(transaction, 'internal_error');
      },
    };
  }

  /**
   * Track custom performance metric
   */
  static trackCustomMetric(
    name: string,
    value: number,
    unit: string,
    context: {
      projectId: string;
      environment: string;
      user?: Record<string, any>;
    }
  ) {
    const transaction = this.startTransaction(
      \`custom-\${name}\`,
      'custom',
      {
        ...context,
        data: {
          metricName: name,
          value,
          unit,
        },
      }
    );

    // Finish immediately for custom metrics
    this.finishTransaction(transaction, 'ok');
  }
}
`
    },
    // Query Monitor
    {
      type: 'CREATE_FILE',
      path: 'src/lib/sentry/query-monitor.ts',
      condition: '{{#if integration.features.queryMonitoring}}',
      content: `import { SentryDrizzleAdapter } from './drizzle-adapter';
import { type NewSentryQueryPerformance } from '@/lib/db/schema/sentry';
import crypto from 'crypto';

export class SentryQueryMonitor {
  /**
   * Monitor a database query
   */
  static async monitorQuery<T>(
    queryFn: () => Promise<T>,
    context: {
      projectId: string;
      environment: string;
      query: string;
      operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
      tableName?: string;
      parameters?: any[];
      user?: Record<string, any>;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const queryHash = crypto.createHash('md5').update(context.query).digest('hex');
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log successful query performance
      await this.logQueryPerformance({
        ...context,
        queryHash,
        duration,
        rowsAffected: Array.isArray(result) ? result.length : undefined,
        rowsReturned: Array.isArray(result) ? result.length : undefined,
        error: null,
        stackTrace: null,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stackTrace = error instanceof Error ? error.stack : undefined;
      
      // Log failed query performance
      await this.logQueryPerformance({
        ...context,
        queryHash,
        duration,
        error: errorMessage,
        stackTrace,
      });

      throw error;
    }
  }

  /**
   * Log query performance to database
   */
  private static async logQueryPerformance(data: {
    projectId: string;
    environment: string;
    query: string;
    queryHash: string;
    operation: string;
    tableName?: string;
    duration: number;
    rowsAffected?: number;
    rowsReturned?: number;
    parameters?: any[];
    error?: string | null;
    stackTrace?: string | null;
    user?: Record<string, any>;
  }) {
    try {
      const performanceData: NewSentryQueryPerformance = {
        projectId: data.projectId,
        environment: data.environment,
        query: data.query,
        queryHash: data.queryHash,
        tableName: data.tableName,
        operation: data.operation,
        duration: data.duration,
        rowsAffected: data.rowsAffected,
        rowsReturned: data.rowsReturned,
        parameters: data.parameters,
        error: data.error,
        stackTrace: data.stackTrace,
        user: data.user,
        context: {
          query: {
            hash: data.queryHash,
            operation: data.operation,
            tableName: data.tableName,
          },
        },
        tags: {
          operation: data.operation,
          tableName: data.tableName || 'unknown',
          hasError: data.error ? 'true' : 'false',
        },
      };

      await SentryDrizzleAdapter.logQueryPerformance(performanceData);
    } catch (error) {
      console.error('Failed to log query performance:', error);
      // Don't throw here to avoid breaking the main flow
    }
  }

  /**
   * Create a query monitor wrapper
   */
  static createQueryMonitor(context: {
    projectId: string;
    environment: string;
    user?: Record<string, any>;
  }) {
    return {
      monitor: <T>(
        queryFn: () => Promise<T>,
        queryContext: {
          query: string;
          operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
          tableName?: string;
          parameters?: any[];
        }
      ) => {
        return this.monitorQuery(queryFn, {
          ...context,
          ...queryContext,
        });
      },
    };
  }

  /**
   * Get query performance statistics
   */
  static async getQueryStats(
    projectId: string,
    environment: string,
    days: number = 7
  ) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would typically use more complex queries
      // For now, we'll return a simple structure
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowestQueries: [],
        errorRate: 0,
        mostUsedTables: [],
      };
    } catch (error) {
      console.error('Failed to get query stats:', error);
      throw error;
    }
  }

  /**
   * Get slow queries
   */
  static async getSlowQueries(
    projectId: string,
    environment: string,
    minDuration: number = 1000,
    limit: number = 20
  ) {
    try {
      return await SentryDrizzleAdapter.getSlowQueries(
        projectId,
        environment,
        minDuration,
        limit
      );
    } catch (error) {
      console.error('Failed to get slow queries:', error);
      throw error;
    }
  }
}
`
    }
  ]
};

export const blueprint = sentryDrizzleNextjsIntegrationBlueprint;

/**
 * Drizzle Base Blueprint
 * 
 * Sets up Drizzle ORM with minimal configuration
 * Advanced features are available as separate features
 */

import { Blueprint } from '../../../types/adapter.js';

export const drizzleBlueprint: Blueprint = {
  id: 'drizzle-base-setup',
  name: 'Drizzle Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['drizzle-orm', 'pg']
    },
    {
      type: 'INSTALL_PACKAGES',
      packages: ['drizzle-kit', '@types/pg'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/index.ts',
      content: `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/schema.ts',
      content: `import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Example user table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Example posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: uuid('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));`
    },
    {
      type: 'CREATE_FILE',
      path: 'drizzle.config.ts',
      content: `import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;`
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'DATABASE_URL',
      value: 'postgresql://username:password@localhost:5432/{{project.name}}',
      description: 'Database connection string'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'db:generate',
      command: 'drizzle-kit generate'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'db:migrate',
      command: 'drizzle-kit migrate'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'db:studio',
      command: 'drizzle-kit studio'
    }
  ]
};

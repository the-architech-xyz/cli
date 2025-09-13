import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'better-auth-drizzle-integration',
  name: 'Better Auth Drizzle Integration',
  description: 'Complete Drizzle ORM integration for Better Auth',
  version: '2.0.0',
  actions: [
    // Install Better Auth Drizzle adapter
    {
      type: 'INSTALL_PACKAGES',
      packages: ['better-auth'],
      isDev: false
    },
    
    // PURE MODIFIER: Enhance the Drizzle schema with auth tables
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/db/schema.ts',
      condition: '{{#if integration.features.userSchema}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'boolean', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'integer', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'primaryKey', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'createId', from: '@paralleldrive/cuid2', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Better Auth tables
export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const authAccounts = pgTable('auth_accounts', {
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const authVerificationTokens = pgTable('auth_verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
}, (vt) => ({
  pk: primaryKey({ columns: [vt.identifier, vt.token] }),
}));`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the auth config with Drizzle adapter
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/auth/config.ts',
      condition: '{{#if integration.features.adapterLogic}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'drizzleAdapter', from: 'better-auth/adapters/drizzle', type: 'import' },
          { name: 'db', from: '@/lib/db', type: 'import' },
          { name: 'authUsers', from: '@/lib/db/schema', type: 'import' },
          { name: 'authSessions', from: '@/lib/db/schema', type: 'import' },
          { name: 'authAccounts', from: '@/lib/db/schema', type: 'import' },
          { name: 'authVerificationTokens', from: '@/lib/db/schema', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Drizzle adapter configuration
const drizzleAdapterConfig = drizzleAdapter(db, {
  users: authUsers,
  sessions: authSessions,
  accounts: authAccounts,
  verificationTokens: authVerificationTokens,
});`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the auth config with database integration
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/auth/config.ts',
      condition: '{{#if integration.features.adapterLogic}}',
      modifier: 'js-config-merger',
      params: {
        exportName: 'auth',
        propertiesToMerge: {
          database: 'drizzleAdapterConfig',
          emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
          },
          socialProviders: {
            google: {
              clientId: 'process.env.GOOGLE_CLIENT_ID!',
              clientSecret: 'process.env.GOOGLE_CLIENT_SECRET!',
            },
            github: {
              clientId: 'process.env.GITHUB_CLIENT_ID!',
              clientSecret: 'process.env.GITHUB_CLIENT_SECRET!',
            },
          },
          session: {
            expiresIn: '60 * 60 * 24 * 7', // 7 days
            updateAge: '60 * 60 * 24', // 1 day
          },
          user: {
            additionalFields: {
              role: {
                type: 'string',
                required: false,
                defaultValue: 'user',
              },
            },
          },
        },
        mergeStrategy: 'deep'
      }
    },
    
    // Add environment variables for social providers
    {
      type: 'ADD_ENV_VAR',
      key: 'GOOGLE_CLIENT_ID',
      value: 'your-google-client-id',
      description: 'Google OAuth client ID'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'GOOGLE_CLIENT_SECRET',
      value: 'your-google-client-secret',
      description: 'Google OAuth client secret'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'GITHUB_CLIENT_ID',
      value: 'your-github-client-id',
      description: 'GitHub OAuth client ID'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'GITHUB_CLIENT_SECRET',
      value: 'your-github-client-secret',
      description: 'GitHub OAuth client secret'
    }
  ]
};
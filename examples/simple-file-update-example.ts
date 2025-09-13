// Example: Simple File Update System
// This shows how to use the new strategy-based approach

import { Blueprint } from '../src/types/adapter.js';

export const betterAuthDrizzleIntegrationBlueprint: Blueprint = {
  id: 'better-auth-drizzle-integration',
  name: 'Better Auth Drizzle Integration',
  description: 'Integrates Better Auth with Drizzle ORM using simple file updates',
  version: '1.0.0',
  actions: [
    // 1. Update existing auth config with merge strategy
    {
      type: 'ADD_CONTENT',
      target: 'src/lib/auth/config.ts',
      strategy: 'merge',
      fileType: 'typescript',
      content: `import { betterAuth } from "better-auth";
import { drizzleAdapterConfig } from './drizzle-adapter';

export const auth = betterAuth({
  database: drizzleAdapterConfig,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
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
});

export type User = typeof auth.$Infer.User;`
    },

    // 2. Create drizzle adapter (new file)
    {
      type: 'ADD_CONTENT',
      target: 'src/lib/auth/drizzle-adapter.ts',
      strategy: 'replace', // Default - create new file
      content: `import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/connection";
import { users, sessions, accounts, verificationTokens } from "../db/schema";

export const drizzleAdapterConfig = drizzleAdapter(db, {
  users,
  sessions,
  accounts,
  verificationTokens,
});`
    },

    // 3. Add environment variables (uses existing append logic)
    {
      type: 'ADD_CONTENT',
      target: '.env.example',
      strategy: 'append', // Uses existing appendToEnv logic
      content: `# Better Auth Configuration
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret`
    },

    // 4. Add dependencies (uses existing mergePackageJson logic)
    {
      type: 'ADD_CONTENT',
      target: 'package.json',
      strategy: 'merge', // Uses existing mergePackageJson logic
      content: `{
  "dependencies": {
    "better-auth": "^1.3.8"
  }
}`
    }
  ]
};

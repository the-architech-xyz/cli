# Better Auth Integration Guide

## Overview
Better Auth provides a modern, secure authentication system with support for multiple providers and database adapters.

## Prerequisites
This adapter works standalone but can be integrated with:

- **Database adapters**: For database sessions (optional)
- **Email adapters**: For email verification (optional)

## Manual Integration Steps

### Database Integration

#### Drizzle Integration
1. **Update your Drizzle schema** with the required tables:
\`\`\`typescript
// In your Drizzle schema file
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  type: text('type').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull()
});
\`\`\`

2. **Update your Better Auth configuration**:
\`\`\`typescript
// In your auth configuration
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { users, sessions, accounts, verificationTokens } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "postgresql", // or "mysql", "sqlite"
    schema: { users, sessions, accounts, verificationTokens }
  }),
  // ... rest of your configuration
});
\`\`\`

#### Prisma Integration
1. **Update your Prisma schema** with the required models:
\`\`\`prisma
// In your schema.prisma
model User {
  id            String    @id
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id
  userId            String
  provider          String
  providerAccountId String
  type              String
  accessToken       String?
  refreshToken      String?
  expiresAt         DateTime?
  tokenType         String?
  scope             String?
  idToken           String?
  sessionState      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
}
\`\`\`

2. **Update your Better Auth configuration**:
\`\`\`typescript
// In your auth configuration
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  // ... rest of your configuration
});
\`\`\`

### Email Integration
To enable email verification and password reset:

1. **Install an email adapter** (e.g., Resend, SendGrid)
2. **Configure email settings** in your Better Auth config:
\`\`\`typescript
export const auth = betterAuth({
  // ... database config
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Send email using your email service
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: \`<a href="\${url}">Reset password</a>\`
      });
    },
    sendVerificationEmail: async ({ user, url }) => {
      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: \`<a href="\${url}">Verify email</a>\`
      });
    }
  }
});
\`\`\`

## Configuration Examples

### Configuration Options

#### providers
- **Type**: array
- **Required**: No
- **Default**: \`["email"]\`
- **Description**: Authentication providers to enable

#### database
- **Type**: select
- **Required**: No
- **Default**: \`"drizzle"\`
- **Choices**: drizzle, prisma
- **Description**: Database adapter to use

#### session
- **Type**: select
- **Required**: No
- **Default**: \`"jwt"\`
- **Choices**: jwt, database
- **Description**: Session management strategy

#### csrf
- **Type**: boolean
- **Required**: No
- **Default**: \`true\`
- **Description**: Enable CSRF protection

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
- Check the [Better Auth documentation](https://better-auth.com/docs)
- Search for existing issues in the project repository
- Create a new issue with detailed error information

## Support
For more information, visit the [Better Auth documentation](https://better-auth.com/docs).

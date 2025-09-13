/**
 * Integration Guide Generator - V1 "Perfect Isolated Kits"
 * 
 * Generates decentralized integration guides for each adapter.
 * Each adapter is responsible for documenting how to integrate with other modules.
 */

import { AdapterConfig } from '../../../types/adapter.js';

export class IntegrationGuideGenerator {
  /**
   * Generate integration guide for an adapter
   */
  static generateForAdapter(adapter: AdapterConfig): string {
    const guide = `# ${adapter.name} Integration Guide

## Overview
${adapter.description}

## Prerequisites
${this.generatePrerequisites(adapter)}

## Manual Integration Steps
${this.generateIntegrationSteps(adapter)}

## Configuration Examples
${this.generateConfigExamples(adapter)}

## Troubleshooting
${this.generateTroubleshooting(adapter)}

## Support
For more information, visit the [${adapter.name} documentation](${this.getDocumentationUrl(adapter)}).
`;

    return guide;
  }

  /**
   * Generate prerequisites section
   */
  private static generatePrerequisites(adapter: AdapterConfig): string {
    if (!adapter.dependencies || adapter.dependencies.length === 0) {
      return 'No specific prerequisites required.';
    }

    let prerequisites = 'This adapter requires the following modules to be installed first:\n\n';
    
    adapter.dependencies.forEach(dep => {
      const [category, id] = dep.split('/');
      prerequisites += `- **${category}/${id}**: Required for ${adapter.name} functionality\n`;
    });

    return prerequisites;
  }

  /**
   * Generate integration steps
   */
  private static generateIntegrationSteps(adapter: AdapterConfig): string {
    switch (adapter.id) {
      case 'better-auth':
        return this.generateBetterAuthIntegration();
      case 'stripe':
        return this.generateStripeIntegration();
      case 'drizzle':
        return this.generateDrizzleIntegration();
      case 'prisma':
        return this.generatePrismaIntegration();
      case 'nextjs':
        return this.generateNextjsIntegration();
      default:
        return this.generateGenericIntegration(adapter);
    }
  }

  /**
   * Generate Better Auth integration steps
   */
  private static generateBetterAuthIntegration(): string {
    return `### Database Integration

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
import { db } from "{{paths.database_config}}";
import { users, sessions, accounts, verificationTokens } from "{{paths.database_config}}/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
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
`;
  }

  /**
   * Generate Stripe integration steps
   */
  private static generateStripeIntegration(): string {
    return `### Environment Setup
1. **Add Stripe keys** to your environment variables:
\`\`\`bash
# .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

2. **Add API routes** for payment processing:
\`\`\`typescript
// {{paths.api_routes}}/stripe/checkout/route.ts
import { stripe } from '{{paths.payment_config}}/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { priceId, quantity = 1 } = await request.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/cancel\`,
  });

  return NextResponse.json({ sessionId: session.id });
}
\`\`\`

### Webhook Integration
1. **Create webhook endpoint**:
\`\`\`typescript
// {{paths.api_routes}}/stripe/webhook/route.ts
import { stripe } from '{{paths.payment_config}}/stripe';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // Handle successful payment
      console.log('Payment succeeded:', session.id);
      break;
    default:
      console.log(\`Unhandled event type: \${event.type}\`);
  }

  return NextResponse.json({ received: true });
}
\`\`\`
`;
  }

  /**
   * Generate Drizzle integration steps
   */
  private static generateDrizzleIntegration(): string {
    return `### Database Setup
1. **Install database driver** (choose one):
\`\`\`bash
# PostgreSQL
npm install pg @types/pg

# MySQL
npm install mysql2

# SQLite
npm install better-sqlite3
\`\`\`

2. **Create database connection**:
\`\`\`typescript
// {{paths.database_config}}/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);
\`\`\`

3. **Define your schema**:
\`\`\`typescript
// {{paths.database_config}}/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
\`\`\`

### Framework Integration
1. **Create database utilities**:
\`\`\`typescript
// {{paths.database_config}}/queries.ts
import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export async function getUserByEmail(email: string) {
  return await db.select().from(users).where(eq(users.email, email));
}
\`\`\`

2. **Use in API routes**:
\`\`\`typescript
// {{paths.api_routes}}/users/route.ts
import { getUserByEmail } from '{{paths.database_config}}/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return Response.json({ error: 'Email required' }, { status: 400 });
  }
  
  const user = await getUserByEmail(email);
  return Response.json(user);
}
\`\`\`
`;
  }

  /**
   * Generate Prisma integration steps
   */
  private static generatePrismaIntegration(): string {
    return `### Database Setup
1. **Install Prisma**:
\`\`\`bash
npm install prisma @prisma/client
\`\`\`

2. **Initialize Prisma**:
\`\`\`bash
npx prisma init
\`\`\`

3. **Configure database URL** in \`.env\`:
\`\`\`bash
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"
\`\`\`

4. **Define your schema** in \`prisma/schema.prisma\`:
\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
\`\`\`

5. **Generate client and migrate**:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### Framework Integration
1. **Create Prisma client**:
\`\`\`typescript
// {{paths.database_config}}/index.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
\`\`\`

2. **Use in API routes**:
\`\`\`typescript
// {{paths.api_routes}}/users/route.ts
import { prisma } from '{{paths.database_config}}';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return Response.json({ error: 'Email required' }, { status: 400 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return Response.json(user);
}
\`\`\`
`;
  }

  /**
   * Generate Next.js integration steps
   */
  private static generateNextjsIntegration(): string {
    return `### Project Structure
The Next.js adapter creates the following structure:
\`\`\`
{{paths.source_root}}
├── app/                 # App Router (if enabled)
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # UI components (if Shadcn/ui enabled)
├── lib/               # Shared utilities
└── public/            # Static assets
\`\`\`

### Integration with Other Modules
1. **Database Integration**: Place database configs in \`{{paths.database_config}}\`
2. **Auth Integration**: Place auth configs in \`{{paths.auth_config}}\`
3. **Payment Integration**: Place payment configs in \`{{paths.payment_config}}\`
4. **Email Integration**: Place email configs in \`{{paths.email_config}}\`

### API Routes
Create API routes in the \`{{paths.api_routes}}\` directory:
\`\`\`typescript
// {{paths.api_routes}}/hello/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from API!' });
}
\`\`\`

### Environment Variables
Add your environment variables to \`.env.local\`:
\`\`\`bash
# Database
DATABASE_URL="your-database-url"

# Auth
AUTH_SECRET="your-auth-secret"

# Payment
STRIPE_SECRET_KEY="your-stripe-key"

# Email
RESEND_API_KEY="your-resend-key"
\`\`\`
`;
  }

  /**
   * Generate generic integration steps
   */
  private static generateGenericIntegration(adapter: AdapterConfig): string {
    return `### Basic Integration
1. **Install dependencies** (if any):
\`\`\`bash
npm install ${adapter.id}
\`\`\`

2. **Configure the module** in your application:
\`\`\`typescript
// Import and configure ${adapter.name}
import { ${adapter.id} } from '${adapter.id}';

// Add your configuration here
\`\`\`

3. **Use in your application**:
\`\`\`typescript
// Add usage examples here
\`\`\`
`;
  }

  /**
   * Generate configuration examples
   */
  private static generateConfigExamples(adapter: AdapterConfig): string {
    if (!adapter.parameters) {
      return 'No specific configuration required.';
    }

    let examples = '### Configuration Options\n\n';
    
    Object.entries(adapter.parameters).forEach(([key, param]: [string, any]) => {
      examples += `#### ${key}\n`;
      examples += `- **Type**: ${param.type}\n`;
      examples += `- **Required**: ${param.required ? 'Yes' : 'No'}\n`;
      if (param.default !== undefined) {
        examples += `- **Default**: \`${JSON.stringify(param.default)}\`\n`;
      }
      if (param.choices) {
        examples += `- **Choices**: ${param.choices.join(', ')}\n`;
      }
      examples += `- **Description**: ${param.description}\n\n`;
    });

    return examples;
  }

  /**
   * Generate troubleshooting section
   */
  private static generateTroubleshooting(adapter: AdapterConfig): string {
    return `### Common Issues

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
- Check the [${adapter.name} documentation](${this.getDocumentationUrl(adapter)})
- Search for existing issues in the project repository
- Create a new issue with detailed error information
`;
  }

  /**
   * Get documentation URL for adapter
   */
  private static getDocumentationUrl(adapter: AdapterConfig): string {
    const urls: Record<string, string> = {
      'nextjs': 'https://nextjs.org/docs',
      'better-auth': 'https://better-auth.com/docs',
      'stripe': 'https://stripe.com/docs',
      'drizzle': 'https://orm.drizzle.team/docs',
      'prisma': 'https://www.prisma.io/docs',
      'resend': 'https://resend.com/docs',
      'sentry': 'https://docs.sentry.io',
      'shadcn-ui': 'https://ui.shadcn.com/docs',
      'tailwind-css': 'https://tailwindcss.com/docs',
      'vitest': 'https://vitest.dev/guide',
      'docker': 'https://docs.docker.com',
      'zustand': 'https://docs.pmnd.rs/zustand',
      'next-intl': 'https://next-intl-docs.vercel.app/docs',
      'sequelize': 'https://sequelize.org/docs',
      'typeorm': 'https://typeorm.io/docs',
      'web3': 'https://web3js.readthedocs.io'
    };

    return urls[adapter.id] || 'https://github.com/your-org/architech';
  }
}

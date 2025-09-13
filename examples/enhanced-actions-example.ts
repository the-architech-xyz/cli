/**
 * Enhanced Actions Example
 * 
 * Demonstrates the new semantic actions for proper integration patterns
 */

import { Blueprint } from '../src/types/adapter.js';

// Example: Sentry-NextJS Integration using new actions
export const sentryNextjsIntegrationExample: Blueprint = {
  id: 'sentry-nextjs-integration-example',
  name: 'Sentry Next.js Integration (Enhanced)',
  description: 'Example of proper integration using new semantic actions',
  version: '1.0.0',
  actions: [
    // 1. Install dependencies
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@sentry/nextjs']
    },

    // 2. Add environment variables
    {
      type: 'ADD_ENV_VAR',
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      value: 'https://your-dsn@sentry.io/project-id',
      description: 'Sentry DSN for client-side error tracking'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_DSN',
      value: 'https://your-dsn@sentry.io/project-id',
      description: 'Sentry DSN for server-side error tracking'
    },

    // 3. Enhance Next.js config (instead of creating duplicate files)
    {
      type: 'ENHANCE_FILE',
      path: 'next.config.js',
      modifier: 'nextjs-config-wrapper',
      params: {
        wrapperName: 'withSentryConfig',
        importFrom: '@sentry/nextjs',
        options: {
          org: 'your-org',
          project: 'your-project'
        }
      }
    },

    // 4. Add TypeScript imports to existing files
    {
      type: 'ADD_TS_IMPORT',
      path: 'src/app/layout.tsx',
      imports: [
        {
          moduleSpecifier: '@sentry/nextjs',
          namedImports: ['Sentry']
        }
      ]
    },

    // 5. Merge JSON configurations
    {
      type: 'MERGE_JSON',
      path: 'package.json',
      content: {
        scripts: {
          'sentry:upload-sourcemaps': 'sentry-cli sourcemaps upload --release $SENTRY_RELEASE'
        }
      }
    },

    // 6. Create only truly new files (API routes, components)
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/sentry/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const { message, level } = await request.json();
    
    Sentry.captureMessage(message, level);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Failed to log message' }, { status: 500 });
  }
}
`
    }
  ]
};

// Example: Stripe-NextJS Integration using new actions
export const stripeNextjsIntegrationExample: Blueprint = {
  id: 'stripe-nextjs-integration-example',
  name: 'Stripe Next.js Integration (Enhanced)',
  description: 'Example of proper integration using new semantic actions',
  version: '1.0.0',
  actions: [
    // 1. Install dependencies
    {
      type: 'INSTALL_PACKAGES',
      packages: ['stripe', '@stripe/stripe-js']
    },

    // 2. Add environment variables
    {
      type: 'ADD_ENV_VAR',
      key: 'STRIPE_SECRET_KEY',
      value: 'sk_test_...',
      description: 'Stripe secret key for server-side operations'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      value: 'pk_test_...',
      description: 'Stripe publishable key for client-side operations'
    },

    // 3. Add NPM scripts
    {
      type: 'ADD_SCRIPT',
      name: 'stripe:listen',
      command: 'stripe listen --forward-to localhost:3000/api/stripe/webhooks'
    },

    // 4. Enhance existing payment configuration
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/payment/stripe.ts',
      modifier: 'drizzle-schema-adder',
      params: {
        schemaDefinitions: [
          `export const stripeConfig = {
  apiKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};`
        ],
        imports: ['stripe']
      }
    },

    // 5. Create only new API routes (framework-specific)
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/stripe/webhooks/route.ts',
      content: `import { NextRequest, NextResponse } from 'next/server';
import { stripeWebhookHandler } from '@/lib/payment/webhooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const event = await stripeWebhookHandler(body, signature);
    
    return NextResponse.json({ received: true, event: event.type });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
`
    }
  ]
};

// Example: Tailwind-Shadcn Integration using new actions
export const tailwindShadcnIntegrationExample: Blueprint = {
  id: 'tailwind-shadcn-integration-example',
  name: 'Tailwind Shadcn Integration (Enhanced)',
  description: 'Example of proper integration using new semantic actions',
  version: '1.0.0',
  actions: [
    // 1. Install dependencies
    {
      type: 'INSTALL_PACKAGES',
      packages: ['tailwindcss', 'clsx', 'tailwind-merge']
    },

    // 2. Enhance Tailwind config
    {
      type: 'ENHANCE_FILE',
      path: 'tailwind.config.js',
      modifier: 'tailwind-config-plugin-adder',
      params: {
        pluginName: 'tailwindcss-animate',
        pluginPath: 'tailwindcss-animate'
      }
    },

    // 3. Merge TypeScript config
    {
      type: 'MERGE_JSON',
      path: 'tsconfig.json',
      content: {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        }
      }
    },

    // 4. Enhance existing utils file instead of creating duplicate
    {
      type: 'APPEND_TO_FILE',
      path: 'src/lib/utils.ts',
      content: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
    }
  ]
};


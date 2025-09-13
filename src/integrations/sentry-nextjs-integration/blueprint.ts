import { Blueprint } from '../../types/adapter.js';

const sentryNextjsIntegrationBlueprint: Blueprint = {
  id: 'sentry-nextjs-integration',
  name: 'Sentry Next.js Integration',
  description: 'Complete error monitoring and performance tracking for Next.js',
  version: '2.0.0',
  actions: [
    // Install Next.js specific Sentry package
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@sentry/nextjs'],
      isDev: false
    },
    // Add Next.js specific environment variables
    {
      type: 'ADD_ENV_VAR',
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      value: 'https://...@sentry.io/...',
      description: 'Sentry DSN for client-side error tracking'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_ORG',
      value: 'your-org',
      description: 'Sentry organization slug'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_PROJECT',
      value: 'your-project',
      description: 'Sentry project name'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SENTRY_AUTH_TOKEN',
      value: 'sntrys_...',
      description: 'Sentry auth token for releases'
    },
    
    // PURE MODIFIER: Enhance Next.js config with Sentry wrapper
    {
      type: 'ENHANCE_FILE',
      path: 'next.config.js',
      condition: '{{#if integration.features.errorTracking}}',
      modifier: 'js-export-wrapper',
      params: {
        exportToWrap: 'default',
        wrapperFunction: {
          name: 'withSentryConfig',
          importFrom: '@sentry/nextjs'
        },
        wrapperOptions: {
          org: 'process.env.SENTRY_ORG',
          project: 'process.env.SENTRY_PROJECT',
          authToken: 'process.env.SENTRY_AUTH_TOKEN',
          silent: true,
          widenClientFileUpload: true,
          hideSourceMaps: true,
          disableLogger: true,
          automaticVercelMonitors: true,
        }
      }
    },
    
    // PURE MODIFIER: Enhance the Sentry client config created by the adapter
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/sentry/client.ts',
      condition: '{{#if integration.features.errorTracking}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'withSentryConfig', from: '@sentry/nextjs', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Sentry configuration
export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
};`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the Sentry server config created by the adapter
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/sentry/server.ts',
      condition: '{{#if integration.features.errorTracking}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'withSentryConfig', from: '@sentry/nextjs', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific server-side Sentry configuration
export const sentryServerConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
};`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the main Sentry config with Next.js specific features
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/sentry/config.ts',
      condition: '{{#if integration.features.errorTracking}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'withSentryConfig', from: '@sentry/nextjs', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Sentry configuration
export const nextjsSentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  replaysOnErrorSampleRate: 1.0,
};

// Next.js specific error reporting
export const reportNextjsError = (error: Error, context?: Record<string, unknown>) => {
  // This will be implemented by the Next.js specific integration
  console.error('Next.js Error reported:', error, context);
};

// Next.js specific performance monitoring
export const startNextjsSpan = (name: string, op: string) => {
  // This will be implemented by the Next.js specific integration
  return { name, op, framework: 'nextjs' };
};`
          }
        ]
      }
    },
    
    // PURE MODIFIER: Enhance the root layout with Sentry provider
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/layout.tsx',
      condition: '{{#if integration.features.errorTracking}}',
      modifier: 'jsx-wrapper',
      params: {
        targetComponent: 'body',
        wrapperComponent: {
          name: 'Sentry.Provider',
          importFrom: '@sentry/nextjs',
          props: {
            dsn: 'process.env.NEXT_PUBLIC_SENTRY_DSN'
          }
        },
        wrapStrategy: 'provider'
      }
    },
    
    // PURE MODIFIER: Create Next.js middleware (only if it doesn't exist)
    {
      type: 'ENHANCE_FILE',
      path: 'src/middleware.ts',
      condition: '{{#if integration.features.middleware}}',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: '* as Sentry', from: '@sentry/nextjs', type: 'import' },
          { name: 'NextRequest', from: 'next/server', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
});

export async function middleware(request: NextRequest) {
  return Sentry.withSentryMiddleware(request);
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};`
          }
        ]
      }
    }
  ]
};

export const blueprint = sentryNextjsIntegrationBlueprint;
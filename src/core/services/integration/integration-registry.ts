/**
 * Integration Feature Registry
 * 
 * Manages integration features that connect adapters with frameworks
 */

import { IntegrationAdapter } from '@/types/integration.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationAdapter> = new Map();

  constructor() {
    // For V1, hardcode registration of the initial integration adapters
    this.loadIntegrationAdapters();
  }

  private loadIntegrationAdapters() {
    // Load Better Auth Next.js Integration
    const betterAuthNextjsIntegration = {
      id: 'better-auth-nextjs-integration',
      name: 'Better Auth Next.js Integration',
      description: 'Complete Next.js integration for Better Auth with API routes, middleware, and UI components',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['better-auth']
      },
      requirements: {
        modules: ['better-auth', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/app/api/auth/[...all]/route.ts',
          'src/middleware.ts',
          'src/lib/auth/nextjs-handler.ts',
          'src/lib/auth/middleware.ts',
          'src/components/auth/auth-provider.tsx',
          'src/components/auth/login-form.tsx',
          'src/components/auth/register-form.tsx',
          'src/components/auth/user-menu.tsx'
        ],
        components: [
          'auth-provider',
          'login-form', 
          'register-form',
          'user-menu'
        ],
        pages: []
      },
      sub_features: {
        apiRoutes: {
          name: 'API Routes',
          description: 'Next.js API routes for authentication endpoints',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Next.js middleware for authentication and route protection',
          type: 'boolean' as const,
          default: true
        },
        uiComponents: {
          name: 'UI Components',
          description: 'React components for authentication UI',
          type: 'string' as const,
          default: 'shadcn',
          options: ['shadcn', 'chakra', 'mui', 'none']
        },
        adminPanel: {
          name: 'Admin Panel',
          description: 'Admin API routes for user management',
          type: 'boolean' as const,
          default: false
        },
        emailVerification: {
          name: 'Email Verification',
          description: 'Email verification API routes and components',
          type: 'boolean' as const,
          default: false
        },
        mfa: {
          name: 'Multi-Factor Authentication',
          description: 'MFA API routes and components',
          type: 'boolean' as const,
          default: false
        },
        passwordReset: {
          name: 'Password Reset',
          description: 'Password reset API routes and components',
          type: 'boolean' as const,
          default: false
        }
      },
      blueprint: {
        id: 'better-auth-nextjs-integration',
        name: 'Better Auth Next.js Integration',
        description: 'Complete Next.js integration for Better Auth',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(betterAuthNextjsIntegration);

    // Load Better Auth Drizzle Integration
    const betterAuthDrizzleIntegration = {
      id: 'better-auth-drizzle-integration',
      name: 'Better Auth Drizzle Integration',
      description: 'Complete Drizzle ORM integration for Better Auth with database schema and adapter',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['better-auth', 'drizzle']
      },
      requirements: {
        modules: ['better-auth', 'drizzle'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/auth/drizzle-adapter.ts',
          'src/lib/db/schema/auth.ts',
          'src/lib/db/migrations/auth.sql',
          'src/lib/auth/database.ts'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        userSchema: {
          name: 'User Schema',
          description: 'Drizzle schema for users, sessions, and accounts tables',
          type: 'boolean' as const,
          default: true
        },
        adapterLogic: {
          name: 'Adapter Logic',
          description: 'Drizzle adapter implementation for Better Auth',
          type: 'boolean' as const,
          default: true
        },
        migrations: {
          name: 'Database Migrations',
          description: 'SQL migrations for auth tables',
          type: 'boolean' as const,
          default: true
        },
        indexes: {
          name: 'Database Indexes',
          description: 'Performance indexes for auth queries',
          type: 'boolean' as const,
          default: true
        },
        seedData: {
          name: 'Seed Data',
          description: 'Sample data for development and testing',
          type: 'boolean' as const,
          default: false
        }
      },
      blueprint: {
        id: 'better-auth-drizzle-integration',
        name: 'Better Auth Drizzle Integration',
        description: 'Complete Drizzle ORM integration for Better Auth',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(betterAuthDrizzleIntegration);

    // Load Stripe Next.js Integration
    const stripeNextjsIntegration = {
      id: 'stripe-nextjs-integration',
      name: 'Stripe Next.js Integration',
      description: 'Complete Next.js integration for Stripe with API routes, webhooks, and payment processing',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['stripe']
      },
      requirements: {
        modules: ['stripe', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/app/api/stripe/webhooks/route.ts',
          'src/app/api/stripe/checkout/route.ts',
          'src/app/api/stripe/subscriptions/route.ts',
          'src/app/api/stripe/invoices/route.ts',
          'src/app/api/stripe/refunds/route.ts',
          'src/lib/stripe/nextjs-handler.ts',
          'src/lib/stripe/webhooks.ts',
          'src/lib/stripe/checkout.ts',
          'src/lib/stripe/subscriptions.ts'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        webhooks: {
          name: 'Webhooks',
          description: 'Stripe webhook handlers for payment events',
          type: 'boolean' as const,
          default: true
        },
        checkout: {
          name: 'Checkout',
          description: 'Stripe Checkout integration for payments',
          type: 'boolean' as const,
          default: true
        },
        subscriptions: {
          name: 'Subscriptions',
          description: 'Subscription management and billing',
          type: 'boolean' as const,
          default: false
        },
        invoices: {
          name: 'Invoices',
          description: 'Invoice generation and management',
          type: 'boolean' as const,
          default: false
        },
        refunds: {
          name: 'Refunds',
          description: 'Refund processing and management',
          type: 'boolean' as const,
          default: false
        },
        apiRoutes: {
          name: 'API Routes',
          description: 'Next.js API routes for Stripe operations',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'stripe-nextjs-integration',
        name: 'Stripe Next.js Integration',
        description: 'Complete Next.js integration for Stripe',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(stripeNextjsIntegration);

    // Load Stripe Shadcn Integration
    const stripeShadcnIntegration = {
      id: 'stripe-shadcn-integration',
      name: 'Stripe Shadcn Integration',
      description: 'Complete Shadcn/ui integration for Stripe with payment forms, subscription cards, and admin interfaces',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['stripe', 'shadcn-ui']
      },
      requirements: {
        modules: ['stripe', 'shadcn-ui'],
        dependencies: []
      },
      provides: {
        files: [
          'src/components/stripe/payment-form.tsx',
          'src/components/stripe/subscription-card.tsx',
          'src/components/stripe/invoice-table.tsx',
          'src/components/stripe/payment-button.tsx',
          'src/components/stripe/admin-panel.tsx',
          'src/components/stripe/checkout-button.tsx',
          'src/components/stripe/pricing-card.tsx'
        ],
        components: [
          'payment-form',
          'subscription-card',
          'invoice-table',
          'payment-button',
          'admin-panel',
          'checkout-button',
          'pricing-card'
        ],
        pages: []
      },
      sub_features: {
        paymentForms: {
          name: 'Payment Forms',
          description: 'Payment form components with validation',
          type: 'boolean' as const,
          default: true
        },
        subscriptionCards: {
          name: 'Subscription Cards',
          description: 'Subscription management UI components',
          type: 'boolean' as const,
          default: false
        },
        invoiceTables: {
          name: 'Invoice Tables',
          description: 'Invoice display and management components',
          type: 'boolean' as const,
          default: false
        },
        paymentButtons: {
          name: 'Payment Buttons',
          description: 'Payment action buttons and CTAs',
          type: 'boolean' as const,
          default: true
        },
        adminPanels: {
          name: 'Admin Panels',
          description: 'Payment admin interfaces and dashboards',
          type: 'boolean' as const,
          default: false
        },
        pricingCards: {
          name: 'Pricing Cards',
          description: 'Pricing display and selection components',
          type: 'boolean' as const,
          default: false
        }
      },
      blueprint: {
        id: 'stripe-shadcn-integration',
        name: 'Stripe Shadcn Integration',
        description: 'Complete Shadcn/ui integration for Stripe',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(stripeShadcnIntegration);

    // Load Stripe Drizzle Integration
    const stripeDrizzleIntegration = {
      id: 'stripe-drizzle-integration',
      name: 'Stripe Drizzle Integration',
      description: 'Complete Drizzle ORM integration for Stripe with payment schema, webhook logging, and database management',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['stripe', 'drizzle']
      },
      requirements: {
        modules: ['stripe', 'drizzle'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/db/schema/stripe.ts',
          'src/lib/db/migrations/stripe.sql',
          'src/lib/stripe/drizzle-adapter.ts',
          'src/lib/stripe/webhook-logger.ts',
          'src/lib/stripe/payment-tracker.ts'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        paymentSchema: {
          name: 'Payment Schema',
          description: 'Database schema for payments, customers, and transactions',
          type: 'boolean' as const,
          default: true
        },
        subscriptionSchema: {
          name: 'Subscription Schema',
          description: 'Database schema for subscriptions and billing',
          type: 'boolean' as const,
          default: false
        },
        webhookLogs: {
          name: 'Webhook Logs',
          description: 'Webhook event logging and tracking',
          type: 'boolean' as const,
          default: true
        },
        migrations: {
          name: 'Database Migrations',
          description: 'SQL migrations for Stripe tables',
          type: 'boolean' as const,
          default: true
        },
        indexes: {
          name: 'Database Indexes',
          description: 'Performance indexes for Stripe queries',
          type: 'boolean' as const,
          default: true
        },
        paymentTracking: {
          name: 'Payment Tracking',
          description: 'Payment status tracking and analytics',
          type: 'boolean' as const,
          default: false
        }
      },
      blueprint: {
        id: 'stripe-drizzle-integration',
        name: 'Stripe Drizzle Integration',
        description: 'Complete Drizzle ORM integration for Stripe',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(stripeDrizzleIntegration);

    // Load Resend Next.js Integration
    const resendNextjsIntegration = {
      id: 'resend-nextjs-integration',
      name: 'Resend Next.js Integration',
      description: 'Complete Next.js integration for Resend with API routes, middleware, and email templates',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['resend']
      },
      requirements: {
        modules: ['resend', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/app/api/email/send/route.ts',
          'src/app/api/email/webhooks/route.ts',
          'src/app/api/email/templates/route.ts',
          'src/lib/email/server.ts',
          'src/lib/email/client.ts',
          'src/lib/email/templates.ts',
          'src/lib/email/webhooks.ts',
          'src/middleware.ts'
        ],
        components: [
          'EmailPreview',
          'EmailForm',
          'EmailAnalytics'
        ],
        pages: [
          'src/app/admin/emails/page.tsx',
          'src/app/admin/emails/templates/page.tsx',
          'src/app/admin/emails/analytics/page.tsx'
        ]
      },
      sub_features: {
        apiRoutes: {
          name: 'API Routes',
          description: 'Next.js API routes for email sending and management',
          type: 'boolean' as const,
          default: true
        },
        webhooks: {
          name: 'Webhooks',
          description: 'Resend webhook handlers for email events',
          type: 'boolean' as const,
          default: true
        },
        templates: {
          name: 'Email Templates',
          description: 'React-based email templates with preview',
          type: 'boolean' as const,
          default: true
        },
        analytics: {
          name: 'Analytics Dashboard',
          description: 'Email analytics and tracking dashboard',
          type: 'boolean' as const,
          default: false
        },
        batchSending: {
          name: 'Batch Sending',
          description: 'Bulk email sending and campaign management',
          type: 'boolean' as const,
          default: false
        },
        middleware: {
          name: 'Middleware',
          description: 'Email rate limiting and security middleware',
          type: 'boolean' as const,
          default: true
        },
        adminPanel: {
          name: 'Admin Panel',
          description: 'Email management admin interface',
          type: 'boolean' as const,
          default: false
        }
      },
      blueprint: {
        id: 'resend-nextjs-integration',
        name: 'Resend Next.js Integration',
        description: 'Complete email integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(resendNextjsIntegration);

    // Load Resend Shadcn Integration
    const resendShadcnIntegration = {
      id: 'resend-shadcn-integration',
      name: 'Resend Shadcn Integration',
      description: 'Beautiful email UI components using Shadcn/ui for Resend email management',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['resend', 'shadcn-ui']
      },
      requirements: {
        modules: ['resend', 'shadcn-ui'],
        dependencies: []
      },
      provides: {
        files: [
          'src/components/email/EmailForm.tsx',
          'src/components/email/EmailTemplates.tsx',
          'src/components/email/EmailCampaigns.tsx',
          'src/components/email/EmailList.tsx',
          'src/components/email/EmailComposer.tsx',
          'src/components/email/EmailSettings.tsx'
        ],
        components: [
          'EmailForm',
          'EmailTemplates',
          'EmailCampaigns',
          'EmailList',
          'EmailComposer',
          'EmailSettings'
        ],
        pages: []
      },
      sub_features: {
        emailForm: {
          name: 'Email Form',
          description: 'Beautiful email sending form with validation',
          type: 'boolean' as const,
          default: true
        },
        emailTemplates: {
          name: 'Email Templates',
          description: 'Template management and preview components',
          type: 'boolean' as const,
          default: true
        },
        emailCampaigns: {
          name: 'Email Campaigns',
          description: 'Campaign creation and management interface',
          type: 'boolean' as const,
          default: false
        },
        emailList: {
          name: 'Email List',
          description: 'Email list management and subscriber interface',
          type: 'boolean' as const,
          default: false
        },
        emailComposer: {
          name: 'Email Composer',
          description: 'Rich text email composer with template support',
          type: 'boolean' as const,
          default: true
        },
        emailSettings: {
          name: 'Email Settings',
          description: 'Email configuration and preferences interface',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'resend-shadcn-integration',
        name: 'Resend Shadcn Integration',
        description: 'Beautiful email UI components using Shadcn/ui',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(resendShadcnIntegration);

    // Load Sentry Next.js Integration
    const sentryNextjsIntegration = {
      id: 'sentry-nextjs-integration',
      name: 'Sentry Next.js Integration',
      description: 'Complete Sentry integration for Next.js applications with error tracking, performance monitoring, and middleware',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['sentry']
      },
      requirements: {
        modules: ['sentry', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/app/sentry.client.config.ts',
          'src/app/sentry.server.config.ts',
          'src/app/sentry.edge.config.ts',
          'src/middleware.ts',
          'src/lib/sentry/client.ts',
          'src/lib/sentry/server.ts',
          'src/lib/sentry/performance.ts',
          'src/lib/sentry/errors.ts',
          'src/lib/sentry/user-feedback.ts'
        ],
        components: [
          'ErrorBoundary',
          'UserFeedback',
          'PerformanceMonitor'
        ],
        pages: [
          'src/app/admin/sentry/page.tsx',
          'src/app/admin/sentry/errors/page.tsx',
          'src/app/admin/sentry/performance/page.tsx'
        ]
      },
      sub_features: {
        errorTracking: {
          name: 'Error Tracking',
          description: 'Comprehensive error tracking with breadcrumbs and context',
          type: 'boolean' as const,
          default: true
        },
        performanceMonitoring: {
          name: 'Performance Monitoring',
          description: 'Web vitals, transactions, and performance tracking',
          type: 'boolean' as const,
          default: true
        },
        userFeedback: {
          name: 'User Feedback',
          description: 'User feedback collection and error reporting',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Sentry middleware for automatic error capture',
          type: 'boolean' as const,
          default: true
        },
        profiling: {
          name: 'Profiling',
          description: 'Performance profiling and analysis',
          type: 'boolean' as const,
          default: false
        },
        alerts: {
          name: 'Alerts & Dashboard',
          description: 'Custom alerts and monitoring dashboard',
          type: 'boolean' as const,
          default: false
        },
        releaseTracking: {
          name: 'Release Tracking',
          description: 'Release tracking and deployment monitoring',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'sentry-nextjs-integration',
        name: 'Sentry Next.js Integration',
        description: 'Complete error monitoring and performance tracking for Next.js',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(sentryNextjsIntegration);

    // Load Sentry Drizzle Integration
    const sentryDrizzleIntegration = {
      id: 'sentry-drizzle-integration',
      name: 'Sentry Drizzle Integration',
      description: 'Complete Drizzle ORM integration for Sentry with error logging, performance tracking, and database monitoring',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['sentry', 'drizzle']
      },
      requirements: {
        modules: ['sentry', 'drizzle'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/db/schema/sentry.ts',
          'src/lib/db/migrations/sentry.sql',
          'src/lib/sentry/drizzle-adapter.ts',
          'src/lib/sentry/error-logger.ts',
          'src/lib/sentry/performance-tracker.ts',
          'src/lib/sentry/query-monitor.ts'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        errorLogging: {
          name: 'Error Logging',
          description: 'Database schema and logging for Sentry errors',
          type: 'boolean' as const,
          default: true
        },
        performanceTracking: {
          name: 'Performance Tracking',
          description: 'Database performance metrics and monitoring',
          type: 'boolean' as const,
          default: true
        },
        queryMonitoring: {
          name: 'Query Monitoring',
          description: 'Database query performance and error tracking',
          type: 'boolean' as const,
          default: true
        },
        userFeedback: {
          name: 'User Feedback Storage',
          description: 'Database storage for user feedback and reports',
          type: 'boolean' as const,
          default: false
        },
        migrations: {
          name: 'Database Migrations',
          description: 'SQL migrations for Sentry tables',
          type: 'boolean' as const,
          default: true
        },
        indexes: {
          name: 'Database Indexes',
          description: 'Performance indexes for Sentry queries',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'sentry-drizzle-integration',
        name: 'Sentry Drizzle Integration',
        description: 'Complete Drizzle ORM integration for Sentry',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(sentryDrizzleIntegration);

    // Load Zustand Next.js Integration
    const zustandNextjsIntegration = {
      id: 'zustand-nextjs-integration',
      name: 'Zustand Next.js Integration',
      description: 'Complete Zustand state management integration for Next.js with SSR support, hydration, and middleware',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['zustand']
      },
      requirements: {
        modules: ['zustand', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/stores/index.ts',
          'src/lib/stores/auth-store.ts',
          'src/lib/stores/ui-store.ts',
          'src/lib/stores/cart-store.ts',
          'src/lib/stores/user-store.ts',
          'src/lib/stores/theme-store.ts',
          'src/lib/stores/notification-store.ts',
          'src/lib/stores/hooks.ts',
          'src/lib/stores/middleware.ts',
          'src/lib/stores/persistence.ts',
          'src/lib/stores/ssr.ts'
        ],
        components: [
          'StoreProvider',
          'StoreDevtools',
          'StoreDebugger'
        ],
        pages: [
          'src/app/admin/stores/page.tsx',
          'src/app/admin/stores/debug/page.tsx'
        ]
      },
      sub_features: {
        authStore: {
          name: 'Auth Store',
          description: 'Authentication state management with user data and session handling',
          type: 'boolean' as const,
          default: true
        },
        uiStore: {
          name: 'UI Store',
          description: 'UI state management for modals, loading states, and UI preferences',
          type: 'boolean' as const,
          default: true
        },
        cartStore: {
          name: 'Cart Store',
          description: 'Shopping cart state management with persistence',
          type: 'boolean' as const,
          default: false
        },
        userStore: {
          name: 'User Store',
          description: 'User profile and preferences state management',
          type: 'boolean' as const,
          default: false
        },
        themeStore: {
          name: 'Theme Store',
          description: 'Theme and appearance state management with persistence',
          type: 'boolean' as const,
          default: true
        },
        notificationStore: {
          name: 'Notification Store',
          description: 'Notification and toast state management',
          type: 'boolean' as const,
          default: true
        },
        ssrSupport: {
          name: 'SSR Support',
          description: 'Server-side rendering support with hydration',
          type: 'boolean' as const,
          default: true
        },
        devtools: {
          name: 'DevTools',
          description: 'Redux DevTools integration for debugging',
          type: 'boolean' as const,
          default: true
        },
        persistence: {
          name: 'Persistence',
          description: 'State persistence to localStorage/sessionStorage',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Custom middleware for logging, analytics, and state management',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'zustand-nextjs-integration',
        name: 'Zustand Next.js Integration',
        description: 'Complete state management integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(zustandNextjsIntegration);

    // Load Shadcn Zustand Integration
    const shadcnZustandIntegrationV2 = {
      id: 'shadcn-zustand-integration',
      name: 'Shadcn Zustand Integration',
      description: 'Beautiful Zustand state management UI components using Shadcn/ui for debugging, monitoring, and store management',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['shadcn-ui', 'zustand']
      },
      requirements: {
        modules: ['shadcn-ui', 'zustand'],
        dependencies: []
      },
      provides: {
        files: [
          'src/components/stores/StoreDebugger.tsx',
          'src/components/stores/StoreMonitor.tsx',
          'src/components/stores/StoreInspector.tsx',
          'src/components/stores/StoreActions.tsx',
          'src/components/stores/StoreState.tsx',
          'src/components/stores/StoreTimeline.tsx',
          'src/components/stores/StoreSettings.tsx'
        ],
        components: [
          'StoreDebugger',
          'StoreMonitor',
          'StoreInspector',
          'StoreActions',
          'StoreState',
          'StoreTimeline',
          'StoreSettings'
        ],
        pages: []
      },
      sub_features: {
        storeDebugger: {
          name: 'Store Debugger',
          description: 'Interactive store debugging interface with state inspection',
          type: 'boolean' as const,
          default: true
        },
        storeMonitor: {
          name: 'Store Monitor',
          description: 'Real-time store state monitoring and visualization',
          type: 'boolean' as const,
          default: true
        },
        storeInspector: {
          name: 'Store Inspector',
          description: 'Deep inspection of store state and actions',
          type: 'boolean' as const,
          default: true
        },
        storeActions: {
          name: 'Store Actions',
          description: 'UI for triggering store actions and testing state changes',
          type: 'boolean' as const,
          default: false
        },
        storeState: {
          name: 'Store State',
          description: 'Visual representation of current store state',
          type: 'boolean' as const,
          default: true
        },
        storeTimeline: {
          name: 'Store Timeline',
          description: 'Timeline view of state changes and actions',
          type: 'boolean' as const,
          default: false
        },
        storeSettings: {
          name: 'Store Settings',
          description: 'Configuration interface for store settings and preferences',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'shadcn-zustand-integration',
        name: 'Shadcn Zustand Integration',
        description: 'Beautiful Zustand state management UI components using Shadcn/ui',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(shadcnZustandIntegrationV2);

    // Load Drizzle Next.js Integration
    const drizzleNextjsIntegration = {
      id: 'drizzle-nextjs-integration',
      name: 'Drizzle Next.js Integration',
      description: 'Complete Drizzle ORM integration for Next.js with API routes, middleware, and database utilities',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['drizzle']
      },
      requirements: {
        modules: ['drizzle', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/db/index.ts',
          'src/lib/db/schema.ts',
          'src/lib/db/migrations.ts',
          'src/lib/db/queries.ts',
          'src/lib/db/transactions.ts',
          'src/lib/db/connection.ts',
          'src/lib/db/seed.ts',
          'src/lib/db/types.ts',
          'src/lib/db/validators.ts',
          'src/lib/db/middleware.ts'
        ],
        components: [
          'DatabaseProvider',
          'QueryProvider',
          'DatabaseDebugger'
        ],
        pages: [
          'src/app/api/db/health/route.ts',
          'src/app/api/db/migrate/route.ts',
          'src/app/api/db/seed/route.ts',
          'src/app/admin/database/page.tsx',
          'src/app/admin/database/schema/page.tsx',
          'src/app/admin/database/queries/page.tsx'
        ]
      },
      sub_features: {
        apiRoutes: {
          name: 'API Routes',
          description: 'Database API routes for health checks, migrations, and seeding',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Database connection middleware and error handling',
          type: 'boolean' as const,
          default: true
        },
        queries: {
          name: 'Query Utilities',
          description: 'Pre-built query utilities and helpers',
          type: 'boolean' as const,
          default: true
        },
        transactions: {
          name: 'Transactions',
          description: 'Transaction management and utilities',
          type: 'boolean' as const,
          default: true
        },
        migrations: {
          name: 'Migrations',
          description: 'Database migration management and utilities',
          type: 'boolean' as const,
          default: true
        },
        seeding: {
          name: 'Seeding',
          description: 'Database seeding utilities and sample data',
          type: 'boolean' as const,
          default: false
        },
        validators: {
          name: 'Validators',
          description: 'Database schema validation utilities',
          type: 'boolean' as const,
          default: true
        },
        adminPanel: {
          name: 'Admin Panel',
          description: 'Database administration interface',
          type: 'boolean' as const,
          default: false
        },
        healthChecks: {
          name: 'Health Checks',
          description: 'Database health monitoring and status checks',
          type: 'boolean' as const,
          default: true
        },
        connectionPooling: {
          name: 'Connection Pooling',
          description: 'Database connection pooling and management',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'drizzle-nextjs-integration',
        name: 'Drizzle Next.js Integration',
        description: 'Complete Drizzle ORM integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(drizzleNextjsIntegration);

    // Load Prisma Next.js Integration
    const prismaNextjsIntegration = {
      id: 'prisma-nextjs-integration',
      name: 'Prisma Next.js Integration',
      description: 'Complete Prisma ORM integration for Next.js with API routes, middleware, and database utilities',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['prisma']
      },
      requirements: {
        modules: ['prisma', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/db/index.ts',
          'src/lib/db/client.ts',
          'src/lib/db/schema.prisma',
          'src/lib/db/migrations.ts',
          'src/lib/db/queries.ts',
          'src/lib/db/transactions.ts',
          'src/lib/db/seed.ts',
          'src/lib/db/types.ts',
          'src/lib/db/validators.ts',
          'src/lib/db/middleware.ts'
        ],
        components: [
          'DatabaseProvider',
          'QueryProvider',
          'DatabaseDebugger'
        ],
        pages: [
          'src/app/api/db/health/route.ts',
          'src/app/api/db/migrate/route.ts',
          'src/app/api/db/seed/route.ts',
          'src/app/admin/database/page.tsx',
          'src/app/admin/database/schema/page.tsx',
          'src/app/admin/database/queries/page.tsx'
        ]
      },
      sub_features: {
        apiRoutes: {
          name: 'API Routes',
          description: 'Database API routes for health checks, migrations, and seeding',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Database connection middleware and error handling',
          type: 'boolean' as const,
          default: true
        },
        queries: {
          name: 'Query Utilities',
          description: 'Pre-built query utilities and helpers',
          type: 'boolean' as const,
          default: true
        },
        transactions: {
          name: 'Transactions',
          description: 'Transaction management and utilities',
          type: 'boolean' as const,
          default: true
        },
        migrations: {
          name: 'Migrations',
          description: 'Database migration management and utilities',
          type: 'boolean' as const,
          default: true
        },
        seeding: {
          name: 'Seeding',
          description: 'Database seeding utilities and sample data',
          type: 'boolean' as const,
          default: false
        },
        validators: {
          name: 'Validators',
          description: 'Database schema validation utilities',
          type: 'boolean' as const,
          default: true
        },
        adminPanel: {
          name: 'Admin Panel',
          description: 'Database administration interface',
          type: 'boolean' as const,
          default: false
        },
        healthChecks: {
          name: 'Health Checks',
          description: 'Database health monitoring and status checks',
          type: 'boolean' as const,
          default: true
        },
        connectionPooling: {
          name: 'Connection Pooling',
          description: 'Database connection pooling and management',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'prisma-nextjs-integration',
        name: 'Prisma Next.js Integration',
        description: 'Complete Prisma ORM integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(prismaNextjsIntegration);

    // Load Shadcn Next.js Integration
    const shadcnNextjsIntegration = {
      id: 'shadcn-nextjs-integration',
      name: 'Shadcn Next.js Integration',
      description: 'Complete Shadcn/ui integration for Next.js with components, theming, and layout utilities',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['shadcn-ui']
      },
      requirements: {
        modules: ['shadcn-ui', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/utils.ts',
          'src/components/ui/button.tsx',
          'src/components/ui/input.tsx',
          'src/components/ui/card.tsx',
          'src/components/ui/dialog.tsx',
          'src/components/ui/form.tsx',
          'src/components/ui/table.tsx',
          'src/components/ui/badge.tsx',
          'src/components/ui/avatar.tsx',
          'src/components/ui/dropdown-menu.tsx',
          'src/components/ui/toast.tsx',
          'src/components/ui/sheet.tsx',
          'src/components/ui/tabs.tsx',
          'src/components/ui/accordion.tsx',
          'src/components/ui/carousel.tsx',
          'src/components/ui/calendar.tsx',
          'src/components/ui/date-picker.tsx',
          'src/components/layout/header.tsx',
          'src/components/layout/footer.tsx',
          'src/components/layout/sidebar.tsx',
          'src/components/layout/navigation.tsx',
          'src/components/theme/theme-provider.tsx',
          'src/components/theme/theme-toggle.tsx',
          'src/components/theme/theme-switcher.tsx',
          'src/styles/globals.css',
          'tailwind.config.js',
          'components.json'
        ],
        components: [
          'Button',
          'Input',
          'Card',
          'Dialog',
          'Form',
          'Table',
          'Badge',
          'Avatar',
          'DropdownMenu',
          'Toast',
          'Sheet',
          'Tabs',
          'Accordion',
          'Carousel',
          'Calendar',
          'DatePicker',
          'Header',
          'Footer',
          'Sidebar',
          'Navigation',
          'ThemeProvider',
          'ThemeToggle',
          'ThemeSwitcher'
        ],
        pages: [
          'src/app/components/page.tsx',
          'src/app/theme/page.tsx',
          'src/app/layout.tsx'
        ]
      },
      sub_features: {
        coreComponents: {
          name: 'Core Components',
          description: 'Essential UI components (Button, Input, Card, etc.)',
          type: 'boolean' as const,
          default: true
        },
        advancedComponents: {
          name: 'Advanced Components',
          description: 'Complex UI components (Table, Form, Dialog, etc.)',
          type: 'boolean' as const,
          default: true
        },
        layoutComponents: {
          name: 'Layout Components',
          description: 'Layout and navigation components (Header, Footer, Sidebar)',
          type: 'boolean' as const,
          default: true
        },
        themeSystem: {
          name: 'Theme System',
          description: 'Complete theming system with dark mode and custom themes',
          type: 'boolean' as const,
          default: true
        },
        accessibility: {
          name: 'Accessibility',
          description: 'WCAG compliance and accessibility features',
          type: 'boolean' as const,
          default: true
        },
        responsiveDesign: {
          name: 'Responsive Design',
          description: 'Mobile-first responsive design utilities',
          type: 'boolean' as const,
          default: true
        },
        animations: {
          name: 'Animations',
          description: 'Smooth animations and transitions',
          type: 'boolean' as const,
          default: true
        },
        icons: {
          name: 'Icons',
          description: 'Lucide React icons integration',
          type: 'boolean' as const,
          default: true
        },
        forms: {
          name: 'Forms',
          description: 'Form components with validation',
          type: 'boolean' as const,
          default: true
        },
        dataDisplay: {
          name: 'Data Display',
          description: 'Tables, lists, and data visualization components',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'shadcn-nextjs-integration',
        name: 'Shadcn Next.js Integration',
        description: 'Complete Shadcn/ui integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(shadcnNextjsIntegration);

    // Load Shadcn Zustand Integration
    const shadcnZustandIntegration = {
      id: 'shadcn-zustand-integration',
      name: 'Shadcn Zustand Integration',
      description: 'Beautiful Shadcn/ui components integrated with Zustand state management for forms, modals, and interactive UI',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['shadcn-ui', 'zustand']
      },
      requirements: {
        modules: ['shadcn-ui', 'zustand'],
        dependencies: []
      },
      provides: {
        files: [
          'src/components/forms/FormProvider.tsx',
          'src/components/forms/FormField.tsx',
          'src/components/forms/FormInput.tsx',
          'src/components/forms/FormSelect.tsx',
          'src/components/forms/FormTextarea.tsx',
          'src/components/forms/FormCheckbox.tsx',
          'src/components/forms/FormRadio.tsx',
          'src/components/modals/ModalProvider.tsx',
          'src/components/modals/Modal.tsx',
          'src/components/modals/ConfirmModal.tsx',
          'src/components/modals/AlertModal.tsx',
          'src/components/toasts/ToastProvider.tsx',
          'src/components/toasts/Toast.tsx',
          'src/components/toasts/useToast.tsx',
          'src/components/data/DataTable.tsx',
          'src/components/data/DataGrid.tsx',
          'src/components/data/DataList.tsx',
          'src/components/data/DataCard.tsx',
          'src/components/state/StateDebugger.tsx',
          'src/components/state/StateInspector.tsx',
          'src/components/state/StateMonitor.tsx',
          'src/hooks/useFormState.ts',
          'src/hooks/useModalState.ts',
          'src/hooks/useToastState.ts',
          'src/hooks/useTableState.ts',
          'src/stores/form-store.ts',
          'src/stores/modal-store.ts',
          'src/stores/toast-store.ts',
          'src/stores/table-store.ts'
        ],
        components: [
          'FormProvider',
          'FormField',
          'FormInput',
          'FormSelect',
          'FormTextarea',
          'FormCheckbox',
          'FormRadio',
          'ModalProvider',
          'Modal',
          'ConfirmModal',
          'AlertModal',
          'ToastProvider',
          'Toast',
          'DataTable',
          'DataGrid',
          'DataList',
          'DataCard',
          'StateDebugger',
          'StateInspector',
          'StateMonitor'
        ],
        pages: []
      },
      sub_features: {
        formComponents: {
          name: 'Form Components',
          description: 'Form components integrated with Zustand state management',
          type: 'boolean' as const,
          default: true
        },
        modalComponents: {
          name: 'Modal Components',
          description: 'Modal and dialog components with state management',
          type: 'boolean' as const,
          default: true
        },
        toastComponents: {
          name: 'Toast Components',
          description: 'Toast notification components with state management',
          type: 'boolean' as const,
          default: true
        },
        dataComponents: {
          name: 'Data Components',
          description: 'Data display components (tables, grids, lists) with state management',
          type: 'boolean' as const,
          default: true
        },
        stateDebugging: {
          name: 'State Debugging',
          description: 'State debugging and inspection components',
          type: 'boolean' as const,
          default: true
        },
        formValidation: {
          name: 'Form Validation',
          description: 'Form validation with error handling and state management',
          type: 'boolean' as const,
          default: true
        },
        modalManagement: {
          name: 'Modal Management',
          description: 'Modal state management and stacking',
          type: 'boolean' as const,
          default: true
        },
        toastManagement: {
          name: 'Toast Management',
          description: 'Toast state management and queuing',
          type: 'boolean' as const,
          default: true
        },
        tableState: {
          name: 'Table State',
          description: 'Table state management (sorting, filtering, pagination)',
          type: 'boolean' as const,
          default: true
        },
        responsiveDesign: {
          name: 'Responsive Design',
          description: 'Responsive design utilities and breakpoints',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'shadcn-zustand-integration',
        name: 'Shadcn Zustand Integration',
        description: 'Beautiful Shadcn/ui components integrated with Zustand state management',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(shadcnZustandIntegrationV2);

    // Load Docker Next.js Integration
    const dockerNextjsIntegration = {
      id: 'docker-nextjs-integration',
      name: 'Docker Next.js Integration',
      description: 'Complete Docker containerization for Next.js applications with multi-stage builds, optimization, and production-ready configuration',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['docker']
      },
      requirements: {
        modules: ['docker', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'Dockerfile',
          'Dockerfile.dev',
          'Dockerfile.prod',
          '.dockerignore',
          'docker-compose.yml',
          'docker-compose.dev.yml',
          'docker-compose.prod.yml',
          'docker-compose.override.yml',
          'scripts/docker-build.sh',
          'scripts/docker-run.sh',
          'scripts/docker-dev.sh',
          'scripts/docker-prod.sh',
          'scripts/docker-clean.sh',
          'scripts/docker-logs.sh',
          'scripts/docker-shell.sh',
          'scripts/docker-health.sh',
          'nginx/nginx.conf',
          'nginx/nextjs.conf',
          'nginx/ssl.conf',
          'scripts/entrypoint.sh',
          'scripts/healthcheck.sh',
          'scripts/init-db.sh',
          'scripts/backup.sh',
          'scripts/restore.sh',
          'monitoring/docker-compose.monitoring.yml',
          'monitoring/prometheus.yml',
          'monitoring/grafana/dashboards/nextjs.json',
          'monitoring/grafana/provisioning/dashboards/dashboard.yml',
          'monitoring/grafana/provisioning/datasources/prometheus.yml'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        multiStageBuild: {
          name: 'Multi-Stage Build',
          description: 'Optimized multi-stage Docker builds for production',
          type: 'boolean' as const,
          default: true
        },
        developmentMode: {
          name: 'Development Mode',
          description: 'Docker setup for development with hot reloading',
          type: 'boolean' as const,
          default: true
        },
        productionMode: {
          name: 'Production Mode',
          description: 'Production-ready Docker configuration with optimization',
          type: 'boolean' as const,
          default: true
        },
        nginxReverseProxy: {
          name: 'Nginx Reverse Proxy',
          description: 'Nginx configuration for reverse proxy and static file serving',
          type: 'boolean' as const,
          default: true
        },
        sslSupport: {
          name: 'SSL Support',
          description: 'SSL/TLS configuration and certificate management',
          type: 'boolean' as const,
          default: false
        },
        healthChecks: {
          name: 'Health Checks',
          description: 'Docker health checks and monitoring endpoints',
          type: 'boolean' as const,
          default: true
        },
        environmentConfig: {
          name: 'Environment Configuration',
          description: 'Environment-specific configuration management',
          type: 'boolean' as const,
          default: true
        },
        volumeManagement: {
          name: 'Volume Management',
          description: 'Docker volumes for persistent data and logs',
          type: 'boolean' as const,
          default: true
        },
        networking: {
          name: 'Networking',
          description: 'Docker networking configuration and service discovery',
          type: 'boolean' as const,
          default: true
        },
        monitoring: {
          name: 'Monitoring',
          description: 'Docker monitoring with Prometheus and Grafana',
          type: 'boolean' as const,
          default: false
        },
        backupRestore: {
          name: 'Backup & Restore',
          description: 'Backup and restore scripts for data persistence',
          type: 'boolean' as const,
          default: false
        },
        securityHardening: {
          name: 'Security Hardening',
          description: 'Security hardening and best practices',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'docker-nextjs-integration',
        name: 'Docker Next.js Integration',
        description: 'Complete Docker containerization for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(dockerNextjsIntegration);

    // Load Docker Drizzle Integration
    const dockerDrizzleIntegration = {
      id: 'docker-drizzle-integration',
      name: 'Docker Drizzle Integration',
      description: 'Complete Docker containerization for Drizzle ORM with database services, migrations, and production-ready configuration',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['docker', 'drizzle']
      },
      requirements: {
        modules: ['docker', 'drizzle'],
        dependencies: []
      },
      provides: {
        files: [
          'docker-compose.database.yml',
          'docker-compose.migration.yml',
          'docker-compose.backup.yml',
          'database/Dockerfile.postgres',
          'database/Dockerfile.migration',
          'database/init.sql',
          'database/seed.sql',
          'database/migrations/001_initial.sql',
          'database/migrations/002_add_indexes.sql',
          'database/migrations/003_add_constraints.sql',
          'scripts/db-setup.sh',
          'scripts/db-migrate.sh',
          'scripts/db-seed.sh',
          'scripts/db-backup.sh',
          'scripts/db-restore.sh',
          'scripts/db-reset.sh',
          'scripts/db-health.sh',
          'scripts/db-shell.sh',
          'scripts/db-logs.sh',
          'monitoring/database/prometheus.yml',
          'monitoring/database/grafana/dashboards/postgres.json',
          'monitoring/database/grafana/provisioning/dashboards/dashboard.yml',
          'monitoring/database/grafana/provisioning/datasources/postgres.yml',
          'backup/backup.sh',
          'backup/restore.sh',
          'backup/cleanup.sh'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        postgresService: {
          name: 'PostgreSQL Service',
          description: 'PostgreSQL database service with Docker',
          type: 'boolean' as const,
          default: true
        },
        migrationService: {
          name: 'Migration Service',
          description: 'Drizzle migration service with Docker',
          type: 'boolean' as const,
          default: true
        },
        backupService: {
          name: 'Backup Service',
          description: 'Database backup and restore service',
          type: 'boolean' as const,
          default: true
        },
        monitoringService: {
          name: 'Monitoring Service',
          description: 'Database monitoring with Prometheus and Grafana',
          type: 'boolean' as const,
          default: false
        },
        seedData: {
          name: 'Seed Data',
          description: 'Database seeding with sample data',
          type: 'boolean' as const,
          default: false
        },
        sslSupport: {
          name: 'SSL Support',
          description: 'SSL/TLS encryption for database connections',
          type: 'boolean' as const,
          default: false
        },
        replication: {
          name: 'Replication',
          description: 'Database replication setup',
          type: 'boolean' as const,
          default: false
        },
        clustering: {
          name: 'Clustering',
          description: 'Database clustering configuration',
          type: 'boolean' as const,
          default: false
        },
        performanceTuning: {
          name: 'Performance Tuning',
          description: 'Database performance optimization',
          type: 'boolean' as const,
          default: true
        },
        securityHardening: {
          name: 'Security Hardening',
          description: 'Database security hardening and best practices',
          type: 'boolean' as const,
          default: true
        },
        volumeManagement: {
          name: 'Volume Management',
          description: 'Docker volumes for database persistence',
          type: 'boolean' as const,
          default: true
        },
        networking: {
          name: 'Networking',
          description: 'Database networking and service discovery',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'docker-drizzle-integration',
        name: 'Docker Drizzle Integration',
        description: 'Complete Docker containerization for Drizzle ORM with database services',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(dockerDrizzleIntegration);

    // Load Vitest Next.js Integration
    const vitestNextjsIntegration = {
      id: 'vitest-nextjs-integration',
      name: 'Vitest Next.js Integration',
      description: 'Complete Vitest testing setup for Next.js applications with unit tests, integration tests, and coverage reporting',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['vitest']
      },
      requirements: {
        modules: ['vitest', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'vitest.config.ts',
          'vitest.config.unit.ts',
          'vitest.config.integration.ts',
          'vitest.config.e2e.ts',
          'vitest.setup.ts',
          'vitest.teardown.ts',
          'test-utils/test-utils.tsx',
          'test-utils/mock-next-router.ts',
          'test-utils/mock-next-auth.ts',
          'test-utils/mock-fetch.ts',
          'test-utils/test-db.ts',
          'test-utils/test-server.ts',
          'test-utils/test-client.ts',
          'test-utils/test-helpers.ts',
          'test-utils/test-fixtures.ts',
          'test-utils/test-mocks.ts',
          'test-utils/test-setup.ts',
          'test-utils/test-teardown.ts',
          'test-utils/test-constants.ts',
          'test-utils/test-types.ts',
          'tests/unit/components/Button.test.tsx',
          'tests/unit/components/Input.test.tsx',
          'tests/unit/hooks/useAuth.test.ts',
          'tests/unit/utils/formatDate.test.ts',
          'tests/unit/lib/api.test.ts',
          'tests/integration/pages/home.test.tsx',
          'tests/integration/pages/about.test.tsx',
          'tests/integration/api/auth.test.ts',
          'tests/integration/api/users.test.ts',
          'tests/e2e/auth.spec.ts',
          'tests/e2e/navigation.spec.ts',
          'tests/e2e/forms.spec.ts',
          'tests/e2e/api.spec.ts',
          'tests/fixtures/users.json',
          'tests/fixtures/posts.json',
          'tests/fixtures/comments.json',
          'tests/mocks/handlers.ts',
          'tests/mocks/server.ts',
          'tests/mocks/responses.ts',
          'coverage/.gitignore',
          'coverage/coverage-summary.json',
          'coverage/coverage-final.json',
          'coverage/lcov.info',
          'coverage/index.html'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        unitTesting: {
          name: 'Unit Testing',
          description: 'Unit tests for components, hooks, and utilities',
          type: 'boolean' as const,
          default: true
        },
        integrationTesting: {
          name: 'Integration Testing',
          description: 'Integration tests for pages and API routes',
          type: 'boolean' as const,
          default: true
        },
        e2eTesting: {
          name: 'E2E Testing',
          description: 'End-to-end tests with Playwright',
          type: 'boolean' as const,
          default: false
        },
        coverageReporting: {
          name: 'Coverage Reporting',
          description: 'Code coverage reporting with HTML and LCOV reports',
          type: 'boolean' as const,
          default: true
        },
        watchMode: {
          name: 'Watch Mode',
          description: 'Watch mode for development testing',
          type: 'boolean' as const,
          default: true
        },
        uiMode: {
          name: 'UI Mode',
          description: 'Vitest UI for interactive testing',
          type: 'boolean' as const,
          default: false
        },
        mocking: {
          name: 'Mocking',
          description: 'Mock utilities for Next.js, APIs, and external services',
          type: 'boolean' as const,
          default: true
        },
        snapshots: {
          name: 'Snapshots',
          description: 'Snapshot testing for components',
          type: 'boolean' as const,
          default: true
        },
        parallelTesting: {
          name: 'Parallel Testing',
          description: 'Parallel test execution for faster runs',
          type: 'boolean' as const,
          default: true
        },
        typescriptSupport: {
          name: 'TypeScript Support',
          description: 'Full TypeScript support for tests',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'vitest-nextjs-integration',
        name: 'Vitest Next.js Integration',
        description: 'Complete Vitest testing setup for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(vitestNextjsIntegration);

    // Load Vitest Zustand Integration
    const vitestZustandIntegration = {
      id: 'vitest-zustand-integration',
      name: 'Vitest Zustand Integration',
      description: 'Complete Vitest testing setup for Zustand state management with store testing, middleware testing, and persistence testing',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['vitest', 'zustand']
      },
      requirements: {
        modules: ['vitest', 'zustand'],
        dependencies: []
      },
      provides: {
        files: [
          'vitest.config.zustand.ts',
          'vitest.setup.zustand.ts',
          'test-utils/store-test-utils.ts',
          'test-utils/mock-storage.ts',
          'test-utils/mock-persistence.ts',
          'test-utils/mock-devtools.ts',
          'test-utils/mock-middleware.ts',
          'test-utils/store-helpers.ts',
          'test-utils/store-fixtures.ts',
          'test-utils/store-mocks.ts',
          'tests/stores/auth-store.test.ts',
          'tests/stores/user-store.test.ts',
          'tests/stores/cart-store.test.ts',
          'tests/stores/ui-store.test.ts',
          'tests/stores/theme-store.test.ts',
          'tests/stores/notification-store.test.ts',
          'tests/middleware/persist.test.ts',
          'tests/middleware/devtools.test.ts',
          'tests/middleware/subscribeWithSelector.test.ts',
          'tests/middleware/immer.test.ts',
          'tests/middleware/logger.test.ts',
          'tests/middleware/custom.test.ts',
          'tests/persistence/localStorage.test.ts',
          'tests/persistence/sessionStorage.test.ts',
          'tests/persistence/indexedDB.test.ts',
          'tests/persistence/custom.test.ts',
          'tests/integration/store-integration.test.ts',
          'tests/integration/middleware-integration.test.ts',
          'tests/integration/persistence-integration.test.ts',
          'tests/fixtures/store-states.json',
          'tests/fixtures/store-actions.json',
          'tests/fixtures/store-mutations.json',
          'tests/mocks/store-mocks.ts',
          'tests/mocks/middleware-mocks.ts',
          'tests/mocks/persistence-mocks.ts'
        ],
        components: [],
        pages: []
      },
      sub_features: {
        storeTesting: {
          name: 'Store Testing',
          description: 'Unit tests for Zustand stores and actions',
          type: 'boolean' as const,
          default: true
        },
        middlewareTesting: {
          name: 'Middleware Testing',
          description: 'Tests for Zustand middleware (persist, devtools, etc.)',
          type: 'boolean' as const,
          default: true
        },
        persistenceTesting: {
          name: 'Persistence Testing',
          description: 'Tests for state persistence across storage types',
          type: 'boolean' as const,
          default: true
        },
        integrationTesting: {
          name: 'Integration Testing',
          description: 'Integration tests for store interactions',
          type: 'boolean' as const,
          default: true
        },
        mocking: {
          name: 'Mocking',
          description: 'Mock utilities for stores, storage, and middleware',
          type: 'boolean' as const,
          default: true
        },
        fixtures: {
          name: 'Fixtures',
          description: 'Test fixtures and sample data for stores',
          type: 'boolean' as const,
          default: true
        },
        coverageReporting: {
          name: 'Coverage Reporting',
          description: 'Code coverage reporting for store logic',
          type: 'boolean' as const,
          default: true
        },
        watchMode: {
          name: 'Watch Mode',
          description: 'Watch mode for development testing',
          type: 'boolean' as const,
          default: true
        },
        parallelTesting: {
          name: 'Parallel Testing',
          description: 'Parallel test execution for faster runs',
          type: 'boolean' as const,
          default: true
        },
        typescriptSupport: {
          name: 'TypeScript Support',
          description: 'Full TypeScript support for store tests',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'vitest-zustand-integration',
        name: 'Vitest Zustand Integration',
        description: 'Complete Vitest testing setup for Zustand state management',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(vitestZustandIntegration);

    // Load Web3 Next.js Integration
    const web3NextjsIntegration = {
      id: 'web3-nextjs-integration',
      name: 'Web3 Next.js Integration',
      description: 'Complete Web3 integration for Next.js with wallet connection, smart contract interaction, and blockchain utilities',
      category: 'integration' as const,
      tech_stack: {
        framework: 'nextjs',
        adapters: ['web3']
      },
      requirements: {
        modules: ['web3', 'nextjs'],
        dependencies: []
      },
      provides: {
        files: [
          'src/lib/web3/wallet.ts',
          'src/lib/web3/contracts.ts',
          'src/lib/web3/transactions.ts',
          'src/lib/web3/network.ts',
          'src/lib/web3/events.ts',
          'src/lib/web3/utils.ts',
          'src/lib/web3/types.ts',
          'src/lib/web3/constants.ts',
          'src/hooks/useWallet.ts',
          'src/hooks/useContract.ts',
          'src/hooks/useTransaction.ts',
          'src/hooks/useNetwork.ts',
          'src/hooks/useWeb3.ts',
          'src/components/web3/WalletProvider.tsx',
          'src/components/web3/WalletButton.tsx',
          'src/components/web3/WalletModal.tsx',
          'src/components/web3/NetworkSwitcher.tsx',
          'src/components/web3/TransactionStatus.tsx',
          'src/components/web3/ContractInterface.tsx',
          'src/app/api/web3/balance/route.ts',
          'src/app/api/web3/transaction/route.ts',
          'src/app/api/web3/contract/route.ts',
          'src/middleware.ts'
        ],
        components: [
          'WalletProvider',
          'WalletButton',
          'WalletModal',
          'NetworkSwitcher',
          'TransactionStatus',
          'ContractInterface'
        ],
        pages: [
          'src/app/web3/page.tsx',
          'src/app/web3/wallet/page.tsx',
          'src/app/web3/contracts/page.tsx',
          'src/app/web3/transactions/page.tsx'
        ]
      },
      sub_features: {
        walletConnection: {
          name: 'Wallet Connection',
          description: 'Connect to various Web3 wallets (MetaMask, WalletConnect, etc.)',
          type: 'boolean' as const,
          default: true
        },
        smartContracts: {
          name: 'Smart Contracts',
          description: 'Smart contract interaction and deployment utilities',
          type: 'boolean' as const,
          default: true
        },
        transactions: {
          name: 'Transactions',
          description: 'Transaction management and status tracking',
          type: 'boolean' as const,
          default: true
        },
        networkSwitching: {
          name: 'Network Switching',
          description: 'Switch between different blockchain networks',
          type: 'boolean' as const,
          default: true
        },
        eventListening: {
          name: 'Event Listening',
          description: 'Listen to blockchain events and contract events',
          type: 'boolean' as const,
          default: true
        },
        apiRoutes: {
          name: 'API Routes',
          description: 'Next.js API routes for Web3 operations',
          type: 'boolean' as const,
          default: true
        },
        middleware: {
          name: 'Middleware',
          description: 'Web3 middleware for authentication and validation',
          type: 'boolean' as const,
          default: true
        },
        uiComponents: {
          name: 'UI Components',
          description: 'React components for Web3 interactions',
          type: 'boolean' as const,
          default: true
        },
        typeScript: {
          name: 'TypeScript Support',
          description: 'Full TypeScript support for Web3 operations',
          type: 'boolean' as const,
          default: true
        },
        errorHandling: {
          name: 'Error Handling',
          description: 'Comprehensive error handling for Web3 operations',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'web3-nextjs-integration',
        name: 'Web3 Next.js Integration',
        description: 'Complete Web3 integration for Next.js applications',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(web3NextjsIntegration);

    // Load Web3 Shadcn Integration
    const web3ShadcnIntegration = {
      id: 'web3-shadcn-integration',
      name: 'Web3 Shadcn Integration',
      description: 'Beautiful Web3 UI components using Shadcn/ui for wallet management, transaction display, and blockchain interactions',
      category: 'integration' as const,
      tech_stack: {
        framework: 'agnostic',
        adapters: ['web3', 'shadcn-ui']
      },
      requirements: {
        modules: ['web3', 'shadcn-ui'],
        dependencies: []
      },
      provides: {
        files: [
          'src/components/web3/WalletCard.tsx',
          'src/components/web3/TransactionCard.tsx',
          'src/components/web3/ContractCard.tsx',
          'src/components/web3/NetworkCard.tsx',
          'src/components/web3/BalanceCard.tsx',
          'src/components/web3/TokenCard.tsx',
          'src/components/web3/NFTCard.tsx',
          'src/components/web3/TransactionHistory.tsx',
          'src/components/web3/WalletModal.tsx',
          'src/components/web3/NetworkSwitcher.tsx',
          'src/components/web3/TransactionStatus.tsx',
          'src/components/web3/ContractInterface.tsx',
          'src/components/web3/TokenList.tsx',
          'src/components/web3/NFTCarousel.tsx',
          'src/components/web3/Web3Dashboard.tsx',
          'src/components/web3/Web3Stats.tsx',
          'src/components/web3/Web3Charts.tsx',
          'src/components/web3/Web3Alerts.tsx',
          'src/components/web3/Web3Settings.tsx',
          'src/components/web3/Web3Profile.tsx'
        ],
        components: [
          'WalletCard',
          'TransactionCard',
          'ContractCard',
          'NetworkCard',
          'BalanceCard',
          'TokenCard',
          'NFTCard',
          'TransactionHistory',
          'WalletModal',
          'NetworkSwitcher',
          'TransactionStatus',
          'ContractInterface',
          'TokenList',
          'NFTCarousel',
          'Web3Dashboard',
          'Web3Stats',
          'Web3Charts',
          'Web3Alerts',
          'Web3Settings',
          'Web3Profile'
        ],
        pages: []
      },
      sub_features: {
        walletComponents: {
          name: 'Wallet Components',
          description: 'Beautiful wallet management UI components',
          type: 'boolean' as const,
          default: true
        },
        transactionComponents: {
          name: 'Transaction Components',
          description: 'Transaction display and management components',
          type: 'boolean' as const,
          default: true
        },
        contractComponents: {
          name: 'Contract Components',
          description: 'Smart contract interaction components',
          type: 'boolean' as const,
          default: true
        },
        networkComponents: {
          name: 'Network Components',
          description: 'Network switching and display components',
          type: 'boolean' as const,
          default: true
        },
        tokenComponents: {
          name: 'Token Components',
          description: 'Token display and management components',
          type: 'boolean' as const,
          default: true
        },
        nftComponents: {
          name: 'NFT Components',
          description: 'NFT display and gallery components',
          type: 'boolean' as const,
          default: false
        },
        dashboardComponents: {
          name: 'Dashboard Components',
          description: 'Web3 dashboard and analytics components',
          type: 'boolean' as const,
          default: false
        },
        chartComponents: {
          name: 'Chart Components',
          description: 'Data visualization and chart components',
          type: 'boolean' as const,
          default: false
        },
        alertComponents: {
          name: 'Alert Components',
          description: 'Notification and alert components',
          type: 'boolean' as const,
          default: true
        },
        settingsComponents: {
          name: 'Settings Components',
          description: 'Configuration and settings components',
          type: 'boolean' as const,
          default: true
        }
      },
      blueprint: {
        id: 'web3-shadcn-integration',
        name: 'Web3 Shadcn Integration',
        description: 'Beautiful Web3 UI components using Shadcn/ui',
        version: '1.0.0',
        actions: [] // Will be loaded lazily
      }
    };

    this.register(web3ShadcnIntegration);
  }

  /**
   * Load blueprint from file
   */
  private async loadBlueprint(integrationId: string): Promise<any> {
    try {
      // Try to load from compiled dist directory first
      const distBlueprintPath = join(process.cwd(), 'dist', 'integrations', integrationId, 'blueprint.js');
      if (existsSync(distBlueprintPath)) {
        const blueprintModule = await import(distBlueprintPath);
        return blueprintModule.blueprint;
      }
      
      // Fallback to source directory (for development)
      const srcBlueprintPath = join(process.cwd(), 'src', 'integrations', integrationId, 'blueprint.ts');
      if (existsSync(srcBlueprintPath)) {
        // Convert .ts to .js for import
        const jsPath = srcBlueprintPath.replace('.ts', '.js');
        const blueprintModule = await import(jsPath);
        return blueprintModule.blueprint;
      }
      
      console.warn(`Blueprint not found for integration: ${integrationId}`);
      return {
        id: integrationId,
        name: integrationId,
        description: 'Integration blueprint',
        version: '1.0.0',
        actions: []
      };
    } catch (error) {
      console.error(`Failed to load blueprint for ${integrationId}:`, error);
      return {
        id: integrationId,
        name: integrationId,
        description: 'Integration blueprint',
        version: '1.0.0',
        actions: []
      };
    }
  }

  /**
   * Register an integration adapter
   */
  register(integration: IntegrationAdapter): void {
    this.integrations.set(integration.id, integration);
  }

  /**
   * Load integration features from directory
   */
  loadFromDirectory(directory: string): void {
    // This would scan the integrations directory and load all integration features
    // For now, we'll implement a simple version
    console.log(`Loading integration features from: ${directory}`);
  }

  /**
   * Get integration adapter by ID
   */
  async get(id: string): Promise<IntegrationAdapter | undefined> {
    const integration = this.integrations.get(id);
    if (integration && integration.blueprint.actions.length === 0) {
      // Load blueprint lazily
      const blueprint = await this.loadBlueprint(id);
      integration.blueprint = blueprint;
    }
    return integration;
  }

  /**
   * Get all integration adapters
   */
  getAll(): IntegrationAdapter[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Find integration adapters by tech stack
   */
  findMatching(techStack: string[]): IntegrationAdapter[] {
    return this.getAll().filter(integration => {
      const requiredModules = integration.requirements.modules;
      return requiredModules.every((module: string) => techStack.includes(module));
    });
  }

  /**
   * Find integration adapters by framework
   */
  findByFramework(framework: string): IntegrationAdapter[] {
    return this.getAll().filter(integration => 
      integration.tech_stack.framework === framework
    );
  }

  /**
   * Find integration adapters by adapter
   */
  findByAdapter(adapter: string): IntegrationAdapter[] {
    return this.getAll().filter(integration => 
      integration.tech_stack.adapters.includes(adapter)
    );
  }

  /**
   * Get integration adapters by tech stack with sub-features
   */
  getByTechStack(framework: string, adapters: string[]): IntegrationAdapter[] {
    return this.getAll().filter(integration => 
      integration.tech_stack.framework === framework &&
      integration.tech_stack.adapters.every((adapter: string) => adapters.includes(adapter))
    );
  }

  /**
   * Check if integration feature exists
   */
  has(id: string): boolean {
    return this.integrations.has(id);
  }

  /**
   * Get integration feature count
   */
  size(): number {
    return this.integrations.size;
  }
}

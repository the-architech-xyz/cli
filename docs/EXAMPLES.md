# 🧬 Working Examples

> **Real, tested genome examples that actually work**

## 📋 Table of Contents

1. [Simple App](#simple-app)
2. [Blog Application](#blog-application)
3. [SaaS Starter](#saas-starter)
4. [E-commerce Platform](#e-commerce-platform)
5. [Custom Genome](#custom-genome)
6. [Testing Examples](#testing-examples)

## 🚀 Simple App

**Perfect for**: Testing, learning, minimal projects  
**Complexity**: ⭐⭐ (Beginner)  
**Modules**: 16 (12 adapters + 4 integrators)

### Genome File

```typescript
// simple-app.genome.ts
import { Genome } from '@thearchitech.xyz/marketplace';

const simpleAppGenome: Genome = {
  version: '1.0.0',
  project: {
    name: 'simple-app',
    description: 'A minimal, production-ready application with essential features',
    version: '1.0.0',
    framework: 'nextjs'
  },
  modules: [
    // === CORE FRAMEWORK ===
    {
      id: 'framework/nextjs',
      parameters: {
        appRouter: true,
        typescript: true,
        tailwind: true,
        eslint: true,
        srcDir: true,
        importAlias: '@/'
      },
      features: {
        'api-routes': true,
        middleware: true,
        performance: true,
        security: true,
        seo: true,
        'server-actions': true
      }
    },
    
    // === UI FRAMEWORK ===
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: [
          'button', 'input', 'card', 'form', 'table', 'dialog', 'badge', 'avatar',
          'toast', 'sheet', 'tabs', 'accordion', 'alert-dialog', 'checkbox',
          'collapsible', 'context-menu', 'hover-card', 'menubar', 'navigation-menu',
          'popover', 'progress', 'radio-group', 'scroll-area', 'slider', 'toggle'
        ]
      },
      features: {
        accessibility: true,
        theming: true
      }
    },
    
    // === DATABASE ===
    {
      id: 'database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql',
        migrations: true,
        studio: true
      },
      features: {
        migrations: true,
        seeding: true,
        studio: true,
        relations: true
      }
    },
    
    // === AUTHENTICATION ===
    {
      id: 'auth/better-auth',
      parameters: {
        providers: ['email'],
        session: 'jwt',
        csrf: true,
        rateLimit: true
      },
      features: {
        'email-verification': true,
        'password-reset': true,
        'session-management': true
      }
    },
    
    // === GOLDEN CORE ADAPTERS ===
    {
      id: 'data-fetching/tanstack-query',
      parameters: {
        devtools: true,
        suspense: false,
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 3,
            refetchOnWindowFocus: false
          }
        }
      },
      features: {
        core: true,
        infinite: true,
        optimistic: true,
        offline: true
      }
    },
    
    {
      id: 'state/zustand',
      parameters: {
        persistence: true,
        devtools: true,
        immer: true,
        middleware: ['persist', 'devtools']
      },
      features: {
        persistence: true,
        devtools: true
      }
    },
    
    {
      id: 'core/forms',
      parameters: {
        zod: true,
        reactHookForm: true,
        resolvers: true,
        accessibility: true,
        devtools: true
      }
    },
    
    // === TESTING & QUALITY ===
    {
      id: 'testing/vitest',
      parameters: {
        jsx: true,
        environment: 'jsdom',
        coverage: true
      },
      features: {
        coverage: true,
        ui: true
      }
    },
    
    {
      id: 'quality/eslint',
      parameters: {
        typescript: true,
        react: true,
        accessibility: true
      }
    },
    
    {
      id: 'quality/prettier',
      parameters: {
        typescript: true,
        tailwind: true
      }
    },
    
    // === INTEGRATIONS ===
    {
      id: 'integrations/drizzle-nextjs-integration',
      parameters: {
        apiRoutes: true,
        middleware: true,
        queries: true,
        transactions: true,
        migrations: true,
        seeding: false,
        validators: true,
        adminPanel: false,
        healthChecks: true,
        connectionPooling: true
      }
    },
    
    {
      id: 'integrations/better-auth-nextjs-integration',
      parameters: {
        apiRoutes: true,
        middleware: true,
        uiComponents: 'shadcn',
        adminPanel: false,
        emailVerification: true,
        mfa: false,
        passwordReset: true
      }
    },
    
    {
      id: 'integrations/tanstack-query-nextjs-integration',
      parameters: {
        devtools: true,
        ssr: true,
        hydration: true,
        prefetching: true,
        errorBoundary: true
      }
    },
    
    {
      id: 'integrations/zustand-nextjs-integration',
      parameters: {
        persistence: true,
        devtools: true,
        ssr: true
      }
    },
    
    {
      id: 'integrations/rhf-zod-shadcn-integration',
      parameters: {
        formComponents: true,
        validation: true,
        accessibility: true
      }
    },
    
    {
      id: 'integrations/vitest-nextjs-integration',
      parameters: {
        testing: true,
        coverage: true,
        mocking: true
      }
    }
  ]
};

export default simpleAppGenome;
```

### Usage

```bash
# Test with dry run first
node dist/index.js new simple-app.genome.ts --dry-run

# Create the actual project
node dist/index.js new simple-app.genome.ts

# Navigate to project
cd simple-app

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📝 Blog Application

**Perfect for**: Content sites, personal blogs, company blogs  
**Complexity**: ⭐⭐⭐ (Intermediate)  
**Modules**: 15 (10 adapters + 5 integrators)

### Key Features

- Next.js with TypeScript and Tailwind
- Shadcn/UI components
- Drizzle database with PostgreSQL
- Better Auth authentication
- Content management with next-intl
- TanStack Query for data fetching
- Zustand for state management
- RHF + Zod for forms
- Vitest for testing

### Usage

```bash
# Use the pre-built genome
node dist/index.js new /path/to/marketplace/genomes/blog-app.genome.ts --dry-run

# Create the project
node dist/index.js new /path/to/marketplace/genomes/blog-app.genome.ts
```

## 🏢 SaaS Starter

**Perfect for**: Startups, Indie Hackers, SaaS applications  
**Complexity**: ⭐⭐⭐⭐ (Advanced)  
**Modules**: 30 (25 adapters + 5 integrators)

### Key Features

- Complete SaaS platform foundation
- Stripe payments integration
- Resend email management
- Sentry monitoring
- Teams management
- User profiles
- Payment management
- Email management
- All Golden Core adapters

### Usage

```bash
# Use the pre-built genome
node dist/index.js new /path/to/marketplace/genomes/saas-starter.genome.ts --dry-run

# Create the project
node dist/index.js new /path/to/marketplace/genomes/saas-starter.genome.ts
```

## 🛒 E-commerce Platform

**Perfect for**: Online stores, marketplaces  
**Complexity**: ⭐⭐⭐⭐ (Advanced)  
**Modules**: 20 (15 adapters + 5 integrators)

### Key Features

- Complete e-commerce platform
- Stripe payments
- Product management
- Shopping cart
- Order tracking
- User authentication
- Email notifications
- All Golden Core adapters

### Usage

```bash
# Use the pre-built genome
node dist/index.js new /path/to/marketplace/genomes/ecommerce-app.genome.ts --dry-run

# Create the project
node dist/index.js new /path/to/marketplace/genomes/ecommerce-app.genome.ts
```

## 🎨 Custom Genome

### Minimal Custom Genome

```typescript
// my-custom-app.genome.ts
import { Genome } from '@thearchitech.xyz/marketplace';

const myCustomGenome: Genome = {
  version: '1.0.0',
  project: {
    name: 'my-custom-app',
    description: 'My custom application',
    framework: 'nextjs',
    path: './my-custom-app'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true
      }
    },
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'card', 'input']
      }
    }
  ]
};

export default myCustomGenome;
```

### Advanced Custom Genome

```typescript
// advanced-app.genome.ts
import { Genome } from '@thearchitech.xyz/marketplace';

const advancedGenome: Genome = {
  version: '1.0.0',
  project: {
    name: 'advanced-app',
    description: 'Advanced application with custom configuration',
    framework: 'nextjs',
    path: './advanced-app'
  },
  modules: [
    // Framework with custom configuration
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true,
        srcDir: true,
        importAlias: '@/'
      },
      features: {
        performance: true,
        security: true,
        'api-routes': true,
        'server-actions': true
      }
    },
    
    // UI with specific components
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: [
          'button', 'input', 'card', 'dialog', 'form',
          'table', 'badge', 'avatar', 'toast', 'sheet'
        ]
      },
      features: {
        theming: true,
        accessibility: true
      }
    },
    
    // Database with specific provider
    {
      id: 'database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql',
        migrations: true,
        studio: true
      },
      features: {
        migrations: true,
        studio: true,
        relations: true
      }
    },
    
    // Authentication with multiple providers
    {
      id: 'auth/better-auth',
      parameters: {
        providers: ['email', 'google', 'github'],
        session: 'jwt',
        csrf: true,
        rateLimit: true
      },
      features: {
        'oauth-providers': true,
        'email-verification': true,
        'password-reset': true,
        'multi-factor': true,
        'session-management': true
      }
    },
    
    // Payment processing
    {
      id: 'payment/stripe',
      parameters: {
        currency: 'usd',
        mode: 'test',
        webhooks: true,
        dashboard: true
      },
      features: {
        subscriptions: true,
        'one-time-payments': true,
        marketplace: true,
        invoicing: true
      }
    },
    
    // Email management
    {
      id: 'email/resend',
      parameters: {
        apiKey: 're_...',
        fromEmail: 'noreply@yourdomain.com'
      },
      features: {
        templates: true,
        analytics: true,
        webhooks: true
      }
    },
    
    // Golden Core adapters
    {
      id: 'data-fetching/tanstack-query',
      parameters: {
        devtools: true,
        suspense: false,
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 3,
            refetchOnWindowFocus: false
          }
        }
      },
      features: {
        core: true,
        infinite: true,
        optimistic: true,
        offline: true
      }
    },
    
    {
      id: 'state/zustand',
      parameters: {
        persistence: true,
        devtools: true,
        immer: true,
        middleware: ['persist', 'devtools']
      },
      features: {
        persistence: true,
        devtools: true
      }
    },
    
    {
      id: 'core/forms',
      parameters: {
        zod: true,
        reactHookForm: true,
        resolvers: true,
        accessibility: true,
        devtools: true
      }
    },
    
    // Testing and quality
    {
      id: 'testing/vitest',
      parameters: {
        jsx: true,
        environment: 'jsdom',
        coverage: true
      },
      features: {
        coverage: true,
        ui: true
      }
    },
    
    {
      id: 'quality/eslint',
      parameters: {
        typescript: true,
        react: true,
        accessibility: true
      }
    },
    
    {
      id: 'quality/prettier',
      parameters: {
        typescript: true,
        tailwind: true
      }
    },
    
    // Observability
    {
      id: 'observability/sentry',
      parameters: {
        dsn: 'https://...@sentry.io/...',
        environment: 'development'
      },
      features: {
        errorTracking: true,
        performance: true,
        releases: true
      }
    },
    
    // Integrations
    {
      id: 'integrations/drizzle-nextjs-integration',
      parameters: {
        apiRoutes: true,
        middleware: true,
        queries: true,
        transactions: true,
        migrations: true,
        seeding: false,
        validators: true,
        adminPanel: false,
        healthChecks: true,
        connectionPooling: true
      }
    },
    
    {
      id: 'integrations/better-auth-nextjs-integration',
      parameters: {
        apiRoutes: true,
        middleware: true,
        uiComponents: 'shadcn',
        adminPanel: true,
        emailVerification: true,
        mfa: true,
        passwordReset: true
      }
    },
    
    {
      id: 'integrations/stripe-nextjs-integration',
      parameters: {
        webhooks: true,
        apiRoutes: true,
        customerManagement: true
      }
    },
    
    {
      id: 'integrations/stripe-shadcn-integration',
      parameters: {
        paymentForms: true,
        subscriptionCards: true,
        invoiceTables: true,
        pricingCards: true
      }
    },
    
    {
      id: 'integrations/resend-nextjs-integration',
      parameters: {
        apiRoutes: true,
        templates: true,
        analytics: true
      }
    },
    
    {
      id: 'integrations/resend-shadcn-integration',
      parameters: {
        composer: true,
        templates: true,
        analytics: true
      }
    },
    
    {
      id: 'integrations/tanstack-query-nextjs-integration',
      parameters: {
        devtools: true,
        ssr: true,
        hydration: true,
        prefetching: true,
        errorBoundary: true
      }
    },
    
    {
      id: 'integrations/zustand-nextjs-integration',
      parameters: {
        persistence: true,
        devtools: true,
        ssr: true
      }
    },
    
    {
      id: 'integrations/rhf-zod-shadcn-integration',
      parameters: {
        formComponents: true,
        validation: true,
        accessibility: true
      }
    },
    
    {
      id: 'integrations/sentry-nextjs-integration',
      parameters: {
        errorTracking: true,
        performance: true,
        releases: true
      }
    },
    
    {
      id: 'integrations/vitest-nextjs-integration',
      parameters: {
        testing: true,
        coverage: true,
        mocking: true
      }
    }
  ]
};

export default advancedGenome;
```

## 🧪 Testing Examples

### Test All Genomes

```bash
# Test simple app
node dist/index.js new simple-app.genome.ts --dry-run

# Test blog app
node dist/index.js new /path/to/marketplace/genomes/blog-app.genome.ts --dry-run

# Test SaaS starter
node dist/index.js new /path/to/marketplace/genomes/saas-starter.genome.ts --dry-run

# Test e-commerce app
node dist/index.js new /path/to/marketplace/genomes/ecommerce-app.genome.ts --dry-run
```

### Test Custom Genome

```bash
# Test your custom genome
node dist/index.js new my-custom-app.genome.ts --dry-run

# If successful, create the project
node dist/index.js new my-custom-app.genome.ts
```

### Verify Generated Project

```bash
# Navigate to generated project
cd my-custom-app

# Check if it's a valid Next.js project
ls -la
# Should see: package.json, src/, public/, etc.

# Install dependencies
npm install

# Check if it builds
npm run build

# Check if it runs
npm run dev
```

## 🎯 Best Practices

### 1. Always Test with Dry Run

```bash
# Always test first
node dist/index.js new my-genome.genome.ts --dry-run

# Only create if dry run succeeds
node dist/index.js new my-genome.genome.ts
```

### 2. Start Simple

```bash
# Start with simple app
node dist/index.js new /path/to/marketplace/genomes/simple-app.genome.ts

# Then try more complex ones
node dist/index.js new /path/to/marketplace/genomes/saas-starter.genome.ts
```

### 3. Use TypeScript

```typescript
// Always use TypeScript for type safety
import { Genome } from '@thearchitech.xyz/marketplace';

const myGenome: Genome = {
  // ... configuration
};
```

### 4. Validate Your Genome

```bash
# Check for TypeScript errors
npx tsc --noEmit my-genome.genome.ts

# Test with CLI
node dist/index.js new my-genome.genome.ts --dry-run
```

## 🎉 Success!

If you've followed these examples, you should now have:

- ✅ Working genome examples
- ✅ Understanding of different complexity levels
- ✅ Ability to create custom genomes
- ✅ Knowledge of testing procedures

You're ready to build amazing applications with The Architech! 🚀

---

**Need help?** Check out the [Quick Start Guide](QUICK_START.md) or [Genome Format Documentation](GENOME_FORMAT.md).

# 📚 Examples & Tutorials

> **Real-world examples using The Architech's Constitutional Architecture**

## 🎯 Overview

This guide provides comprehensive examples of how to use The Architech with Constitutional Architecture. Each example demonstrates different capabilities and use cases, from simple projects to complex enterprise applications.

## 🚀 Quick Start Examples

### Simple SaaS Application

A minimal SaaS application with authentication and basic features.

```typescript
// simple-saas.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'simple-saas',
    framework: 'nextjs',
    path: './simple-saas',
    description: 'A simple SaaS application with authentication'
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
      id: 'feature:auth-ui/shadcn',
      parameters: {
        mfa: true,  // ← Enable multi-factor authentication
        socialLogins: ['github', 'google']
        // passwordReset: true (already default)
        // profileManagement: true (already default)
      }
    }
  ]
});
```

**What this creates:**
- ✅ Next.js 14 with TypeScript and Tailwind
- ✅ Authentication UI with login/signup forms
- ✅ Password reset functionality
- ✅ Profile management
- ✅ Multi-factor authentication setup
- ✅ Social login with GitHub and Google
- ✅ Responsive design with Shadcn/UI components

### E-commerce Platform

A comprehensive e-commerce platform with payments, teams, and analytics.

```typescript
// ecommerce-platform.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'ecommerce-platform',
    framework: 'nextjs',
    path: './ecommerce-platform',
    description: 'Full-featured e-commerce platform'
  },
  modules: [
    // Core Framework
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true
      }
    },
    
    // Authentication with Enterprise Features
    {
      id: 'feature:auth-ui/shadcn',
      parameters: {
        mfa: true,
        socialLogins: ['github', 'google', 'microsoft'],
        accountSettingsPage: true
      }
    },
    
    // Payment Processing
    {
      id: 'feature:payments/frontend/shadcn',
      parameters: {
        subscriptions: true,  // ← Enable subscription management
        invoicing: true,      // ← Enable invoice generation
        analytics: true       // ← Enable payment analytics
      }
    },
    
    // Team Management
    {
      id: 'feature:teams-management/frontend/shadcn',
      parameters: {
        advanced: true,   // ← Advanced team features
        analytics: true,  // ← Team analytics
        billing: true     // ← Team billing integration
      }
    },
    
    // Database
    {
      id: 'adapter:database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql'
      }
    },
    
    // Monitoring
    {
      id: 'feature:monitoring/shadcn',
      parameters: {
        performance: true,  // ← Performance monitoring
        feedback: true,     // ← User feedback collection
        analytics: true     // ← Analytics dashboard
      }
    }
  ]
});
```

**What this creates:**
- ✅ Complete e-commerce platform
- ✅ Enterprise authentication with MFA
- ✅ Payment processing with subscriptions
- ✅ Team management with billing
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Performance monitoring and analytics
- ✅ User feedback collection system

## 🎨 Specialized Examples

### AI-Powered Chat Application

A modern AI chat application with voice, media, and advanced features.

```typescript
// ai-chat-app.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'ai-chat-app',
    framework: 'nextjs',
    path: './ai-chat-app',
    description: 'AI-powered chat application with advanced features'
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
    
    // AI Chat Frontend
    {
      id: 'feature:ai-chat/frontend/shadcn',
      parameters: {
        media: true,    // ← File upload and media support
        voice: true,    // ← Voice input/output
        advanced: true  // ← Advanced AI features
      }
    },
    
    // AI Backend
    {
      id: 'feature:ai-chat/backend/vercel-ai-nextjs',
      parameters: {
        streaming: true,  // ← Real-time streaming
        advanced: true,   // ← Advanced AI capabilities
        enterprise: true  // ← Enterprise features
      }
    },
    
    // Authentication
    {
      id: 'feature:auth-ui/shadcn',
      parameters: {
        socialLogins: ['github', 'google']
      }
    }
  ]
});
```

**What this creates:**
- ✅ AI chat interface with message history
- ✅ File upload and media support
- ✅ Voice input and output
- ✅ Real-time streaming responses
- ✅ Advanced AI capabilities
- ✅ User authentication
- ✅ Responsive design

### Blog with CMS

A content management system with internationalization and SEO.

```typescript
// blog-cms.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'blog-cms',
    framework: 'nextjs',
    path: './blog-cms',
    description: 'Blog platform with CMS and internationalization'
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
    
    // UI Components
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'card', 'badge', 'avatar', 'dialog']
      }
    },
    
    // Database
    {
      id: 'adapter:database/drizzle',
      parameters: {
        provider: 'sqlite',
        databaseType: 'sqlite'
      }
    },
    
    // Internationalization
    {
      id: 'adapter:content/next-intl',
      parameters: {
        locales: ['en', 'fr', 'es'],
        features: ['routing', 'pluralization']
      }
    },
    
    // Authentication
    {
      id: 'feature:auth-ui/shadcn',
      parameters: {
        profileManagement: true
      }
    }
  ]
});
```

**What this creates:**
- ✅ Blog platform with CMS
- ✅ Multi-language support (EN, FR, ES)
- ✅ SQLite database for content
- ✅ User authentication
- ✅ SEO-optimized pages
- ✅ Responsive design

## 🏢 Enterprise Examples

### Enterprise Dashboard

A comprehensive enterprise dashboard with advanced features.

```typescript
// enterprise-dashboard.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'enterprise-dashboard',
    framework: 'nextjs',
    path: './enterprise-dashboard',
    description: 'Enterprise dashboard with advanced features'
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
    
    // Authentication with Enterprise Features
    {
      id: 'feature:auth-ui/shadcn',
      parameters: {
        mfa: true,
        socialLogins: ['github', 'google', 'microsoft', 'linkedin'],
        accountSettingsPage: true
      }
    },
    
    // Team Management
    {
      id: 'feature:teams-management/frontend/shadcn',
      parameters: {
        advanced: true,
        analytics: true,
        billing: true
      }
    },
    
    // Payment Processing
    {
      id: 'feature:payments/frontend/shadcn',
      parameters: {
        subscriptions: true,
        invoicing: true,
        analytics: true,
        webhooks: true
      }
    },
    
    // Monitoring
    {
      id: 'feature:monitoring/shadcn',
      parameters: {
        performance: true,
        feedback: true,
        analytics: true
      }
    },
    
    // Database
    {
      id: 'adapter:database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql'
      }
    },
    
    // Email Service
    {
      id: 'adapter:email/resend',
      parameters: {
        templates: true,
        analytics: true,
        campaigns: true
      }
    },
    
    // Error Monitoring
    {
      id: 'adapter:observability/sentry',
      parameters: {
        performance: true,
        alerts: true,
        enterprise: true
      }
    }
  ]
});
```

**What this creates:**
- ✅ Enterprise-grade authentication
- ✅ Advanced team management
- ✅ Payment processing with webhooks
- ✅ Comprehensive monitoring
- ✅ PostgreSQL database
- ✅ Email service with templates
- ✅ Error monitoring and alerting

## 🔧 Development Examples

### Development Environment

A development-focused setup with testing and quality tools.

```typescript
// dev-environment.genome.ts
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'dev-environment',
    framework: 'nextjs',
    path: './dev-environment',
    description: 'Development environment with testing and quality tools'
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
    
    // Testing
    {
      id: 'adapter:testing/vitest',
      parameters: {
        coverage: true,
        ui: true,
        e2e: true
      }
    },
    
    // Code Quality
    {
      id: 'adapter:quality/eslint',
      parameters: {
        typescript: true,
        react: true,
        nextjs: true
      }
    },
    
    // State Management
    {
      id: 'adapter:state/zustand',
      parameters: {
        devtools: true,
        persistence: true
      }
    },
    
    // Forms
    {
      id: 'adapter:core/forms',
      parameters: {
        devtools: true,
        advancedValidation: true
      }
    }
  ]
});
```

**What this creates:**
- ✅ Next.js development environment
- ✅ Vitest testing with coverage and UI
- ✅ ESLint configuration
- ✅ Zustand state management
- ✅ Advanced form validation
- ✅ Development tools and debugging

## 🎯 Best Practices

### 1. Start Simple

Begin with minimal configuration and add features as needed:

```typescript
// Start with basics
{
  id: 'framework/nextjs',
  parameters: {
    typescript: true,
    tailwind: true
  }
}

// Add features incrementally
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true  // Only add what you need
  }
}
```

### 2. Use Capability-Based Thinking

Organize around business capabilities, not technical implementation:

```typescript
// ✅ Good - Business capability focused
{
  id: 'feature:payments/frontend/shadcn',
  parameters: {
    subscriptions: true,  // Business capability
    invoicing: true       // Business capability
  }
}

// ❌ Avoid - Technical implementation focused
{
  id: 'adapter:stripe',
  parameters: {
    webhooks: true,       // Technical detail
    apiVersion: '2023'    // Technical detail
  }
}
```

### 3. Leverage Intelligent Defaults

Only specify what you want to change:

```typescript
// ✅ Good - Minimal configuration
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true  // Only specify what you want to change
  }
}

// ❌ Avoid - Specifying everything
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    passwordReset: true,      // Already default
    profileManagement: true,  // Already default
    mfa: true                 // Only this is needed
  }
}
```

### 4. Use Type Safety

Leverage TypeScript for configuration validation:

```typescript
// ✅ Good - Type-safe configuration
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-app',
    framework: 'nextjs',  // ← TypeScript validates this
    path: './my-app'
  },
  modules: [
    {
      id: 'feature:auth-ui/shadcn',
      parameters: {
        socialLogins: ['github', 'google']  // ← TypeScript validates this
      }
    }
  ]
});
```

## 🚀 Getting Started

### 1. Choose Your Example

Select an example that matches your project needs:

- **Simple SaaS** - For basic applications
- **E-commerce Platform** - For online stores
- **AI Chat Application** - For AI-powered apps
- **Blog with CMS** - For content platforms
- **Enterprise Dashboard** - For complex business apps

### 2. Customize the Configuration

Modify the example to match your specific needs:

```typescript
// Copy an example and customize
export default defineGenome({
  project: {
    name: 'my-custom-app',  // ← Change project name
    framework: 'nextjs',
    path: './my-custom-app'  // ← Change output path
  },
  modules: [
    // Add or remove modules as needed
    // Modify parameters to match your requirements
  ]
});
```

### 3. Run the CLI

Execute your genome file:

```bash
# Create your project
architech new my-custom-app.genome.ts

# Or run in dry-run mode first
architech new my-custom-app.genome.ts --dry-run
```

### 4. Explore the Generated Code

The CLI will create a complete project with:

- ✅ All necessary files and configurations
- ✅ Type-safe code with full TypeScript support
- ✅ Responsive UI components
- ✅ Database schemas and migrations
- ✅ Authentication and authorization
- ✅ Testing setup
- ✅ Development tools

## 📚 Additional Resources

- **[Constitutional Architecture Guide](./CONSTITUTIONAL_ARCHITECTURE.md)** - Deep dive into the architecture
- **[Genome Format Reference](./GENOME_FORMAT.md)** - Complete genome format documentation
- **[CLI Reference](./CLI_REFERENCE.md)** - Complete CLI command reference
- **[Architecture Overview](./ARCHITECTURE.md)** - System architecture details

---

**Happy building! 🚀**

*For more examples and advanced use cases, check out the [marketplace documentation](../marketplace/docs/).*
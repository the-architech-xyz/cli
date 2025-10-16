# 🧬 Genome Format Documentation

> **Complete reference for TypeScript genome files in The Architech**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Basic Structure](#basic-structure)
3. [Project Configuration](#project-configuration)
4. [Module Configuration](#module-configuration)
5. [Type Safety & Autocomplete](#type-safety--autocomplete)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Migration from YAML](#migration-from-yaml)

## 🎯 Overview

The Architech uses **TypeScript genome files** with **Constitutional Architecture** as the primary interface for project generation. These files provide:

- **🧬 Type Safety**: Full compile-time validation of all configurations
- **🎯 IntelliSense**: Complete IDE support with autocomplete
- **⚡ Fast Feedback**: Immediate error detection and suggestions
- **🔧 Refactoring**: Safe renaming and restructuring with IDE support
- **🏛️ Constitutional Architecture**: Business capability-based module organization
- **🤖 Intelligent Defaults**: Sensible defaults with explicit overrides only

### Key Principles

- **📋 Declarative** - Describe what you want, not how to do it
- **🔧 Type-Safe** - Full TypeScript validation prevents configuration errors
- **⚡ IDE-First** - Leverages your IDE's autocomplete and error checking
- **🛡️ Compile-Time Safety** - Catch errors before execution

## 🏗️ Basic Structure

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-project',
    framework: 'nextjs',
    path: './my-project'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true
      },
      features: {
        performance: true,
        security: true
      }
    }
  ]
});
```

## 📁 Project Configuration

The `project` section defines the basic project information with full type safety:

```typescript
project: {
  name: 'my-saas',                    // ✅ Required: Project name (kebab-case)
  framework: 'nextjs',                // ✅ Required: Primary framework
  path: './my-saas',                  // ✅ Required: Output directory
  description: 'My awesome SaaS',     // ❌ Optional: Project description
  version: '1.0.0',                   // ❌ Optional: Project version
  author: 'John Doe',                 // ❌ Optional: Project author
  license: 'MIT'                      // ❌ Optional: Project license
}
```

### Project Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | `string` | ✅ | Project name (kebab-case) | `my-saas` |
| `framework` | `string` | ✅ | Primary framework | `nextjs` |
| `path` | `string` | ✅ | Output directory | `./my-saas` |
| `description` | `string` | ❌ | Project description | `My awesome SaaS` |
| `version` | `string` | ❌ | Project version | `1.0.0` |
| `author` | `string` | ❌ | Project author | `John Doe` |
| `license` | `string` | ❌ | Project license | `MIT` |

## 🔧 Module Configuration

The `modules` section defines which modules to install with full type safety:

```typescript
modules: [
  {
    id: 'framework/nextjs',           // ✅ Required: Module ID
    parameters: {                     // ❌ Optional: Module-specific config
      typescript: true,               // ← Full autocomplete
      tailwind: true,                 // ← Type-safe parameters
      appRouter: true                 // ← IntelliSense support
    },
    features: {                       // ❌ Optional: Feature flags
      performance: true,
      security: true
    }
  }
]
```

### Module Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | `string` | ✅ | Module identifier | `framework/nextjs` |
| `parameters` | `object` | ❌ | Module configuration | `{typescript: true}` |
| `features` | `object` | ❌ | Feature flags | `{performance: true}` |

### Supported Module Categories

| Category | Description | Example Modules |
|----------|-------------|-----------------|
| `framework` | Application frameworks | `nextjs`, `vite`, `express` |
| `database` | Database and ORM | `drizzle`, `prisma`, `mongodb` |
| `auth` | Authentication | `better-auth`, `next-auth`, `auth0` |
| `ui` | UI libraries | `shadcn-ui`, `chakra-ui`, `mui` |
| `testing` | Testing frameworks | `vitest`, `jest`, `playwright` |
| `deployment` | Deployment tools | `docker`, `vercel`, `aws` |
| `payment` | Payment processing | `stripe`, `paypal`, `square` |
| `email` | Email services | `resend`, `sendgrid`, `mailgun` |
| `observability` | Monitoring | `sentry`, `datadog`, `newrelic` |
| `state` | State management | `zustand`, `redux`, `jotai` |
| `content` | Content management | `next-intl`, `strapi`, `sanity` |
| `blockchain` | Blockchain integration | `web3`, `ethers`, `wagmi` |

## 🎯 Type Safety & Autocomplete

### IntelliSense Support

When you type in your IDE, you get:

```typescript
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: [  // ← Autocomplete shows: 'button', 'card', 'input', 'dialog', etc.
        'button',
        'card'
      ],
      style: 'new-york'  // ← Autocomplete shows: 'new-york', 'default'
    }
  }
]
```

### Compile-Time Validation

TypeScript catches errors before execution:

```typescript
// ❌ This will show a TypeScript error
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: ['invalid-component']  // ← TypeScript error: not assignable
    }
  }
]

// ✅ This is type-safe
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: ['button', 'card']  // ← Valid components
    }
  }
]
```

### Parameter Validation

Each module's parameters are fully typed:

```typescript
{
  id: 'database/drizzle',
  parameters: {
    provider: 'neon',           // ← Autocomplete: 'neon', 'postgres', 'mysql', etc.
    databaseType: 'postgresql', // ← Autocomplete: 'postgresql', 'mysql', 'sqlite'
    features: {                 // ← Nested object with full typing
      migrations: true,
      studio: true,
      relations: true
    }
  }
}
```

## 🏛️ Constitutional Architecture Examples

### Simple Authentication with Capabilities

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-saas',
    framework: 'nextjs',
    path: './my-saas'
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
        // Only specify what you want to change from defaults
        mfa: true,  // ← Enable multi-factor authentication
        socialLogins: ['github', 'google']  // ← Add social login providers
        // passwordReset: true (already default)
        // profileManagement: true (already default)
      }
    }
  ]
});
```

### Advanced E-commerce with Business Capabilities

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'ecommerce-platform',
    framework: 'nextjs',
    path: './ecommerce-platform'
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
    
    // Payment Processing with Advanced Features
    {
      id: 'feature:payments/frontend/shadcn',
      parameters: {
        subscriptions: true,  // ← Enable subscription management
        invoicing: true,      // ← Enable invoice generation
        analytics: true       // ← Enable payment analytics
        // webhooks: true (already default)
      }
    },
    
    // Team Management with Enterprise Features
    {
      id: 'feature:teams-management/frontend/shadcn',
      parameters: {
        advanced: true,   // ← Advanced team features
        analytics: true,  // ← Team analytics
        billing: true     // ← Team billing integration
      }
    }
  ]
});
```

### AI-Powered Application

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'ai-chat-app',
    framework: 'nextjs',
    path: './ai-chat-app'
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
    
    // AI Chat with Advanced Features
    {
      id: 'feature:ai-chat/frontend/shadcn',
      parameters: {
        media: true,    // ← File upload and media support
        voice: true,    // ← Voice input/output
        advanced: true  // ← Advanced AI features
      }
    },
    
    // AI Backend with Enterprise Features
    {
      id: 'feature:ai-chat/backend/vercel-ai-nextjs',
      parameters: {
        streaming: true,  // ← Real-time streaming
        advanced: true,   // ← Advanced AI capabilities
        enterprise: true  // ← Enterprise features
      }
    }
  ]
});
```

## 📚 Examples

### Minimal Next.js Project

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-app',
    framework: 'nextjs',
    path: './my-app'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true
      }
    }
  ]
});
```

### Full-Stack SaaS Application

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-saas',
    framework: 'nextjs',
    path: './my-saas',
    description: 'A complete SaaS application'
  },
  modules: [
    // Framework
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        appRouter: true,
        eslint: true
      },
      features: {
        performance: true,
        security: true,
        'api-routes': true
      }
    },

    // UI Components
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'input', 'card', 'dialog', 'form'],
        style: 'new-york'
      },
      features: {
        theming: true,
        accessibility: true
      }
    },

    // Database
    {
      id: 'database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql'
      },
      features: {
        migrations: true,
        studio: true,
        relations: true
      }
    },

    // Authentication
    {
      id: 'auth/better-auth',
      parameters: {
        providers: ['github', 'google'],
        emailPassword: true
      },
      features: {
        'email-verification': true,
        'password-reset': true,
        'multi-factor': true
      }
    },

    // Testing
    {
      id: 'testing/vitest',
      parameters: {
        coverage: true,
        ui: true
      }
    },

    // Payment
    {
      id: 'payment/stripe',
      parameters: {
        features: ['subscriptions', 'one-time'],
        products: ['basic', 'pro']
      }
    },

    // Email
    {
      id: 'email/resend',
      parameters: {
        features: ['transactions', 'templates']
      }
    },

    // Monitoring
    {
      id: 'observability/sentry',
      parameters: {
        features: ['errors', 'performance']
      }
    }
  ]
});
```

### Blog with CMS

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-blog',
    framework: 'nextjs',
    path: './my-blog'
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
        components: ['button', 'card', 'badge', 'avatar']
      }
    },
    {
      id: 'database/drizzle',
      parameters: {
        provider: 'sqlite',
        databaseType: 'sqlite'
      }
    },
    {
      id: 'content/next-intl',
      parameters: {
        locales: ['en', 'fr', 'es'],
        features: ['routing', 'pluralization']
      }
    }
  ]
});
```

### Blockchain dApp

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-dapp',
    framework: 'nextjs',
    path: './my-dapp'
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
        components: ['button', 'card', 'dialog', 'form']
      }
    },
    {
      id: 'blockchain/web3',
      parameters: {
        features: ['wallet-connection', 'contract-interaction'],
        networks: ['mainnet', 'polygon', 'arbitrum'],
        contracts: ['erc20', 'erc721']
      }
    },
    {
      id: 'auth/better-auth',
      parameters: {
        providers: ['github'],
        emailPassword: false
      }
    }
  ]
});
```

## 🎯 Best Practices

### 1. Use Type Safety

```typescript
// ✅ Good - Let TypeScript guide you
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: ['button', 'card'], // ← Autocomplete will show valid options
      style: 'new-york'               // ← TypeScript will validate this
    }
  }
]

// ❌ Avoid - Manual configuration without types
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: ['invalid-component'] // ← This will cause a TypeScript error
    }
  }
]
```

### 2. Leverage IntelliSense

```typescript
// ✅ Good - Use autocomplete for parameters
{
  id: 'database/drizzle',
  parameters: {
    provider: 'neon',           // ← IDE will show available providers
    databaseType: 'postgresql', // ← IDE will show available types
    features: {                 // ← IDE will show available features
      migrations: true,
      studio: true
    }
  }
}
```

### 3. Use Descriptive Names

```typescript
// ✅ Good - Descriptive and clear
project: {
  name: 'ecommerce-platform',
  description: 'Full-stack e-commerce platform with payments'
}

// ❌ Bad - Generic and unclear
project: {
  name: 'app',
  description: 'My app'
}
```

### 4. Group Related Modules

```typescript
// ✅ Good - Logical grouping with comments
modules: [
  // Core Framework
  {
    id: 'framework/nextjs',
    parameters: { /* ... */ }
  },
  
  // UI & Styling
  {
    id: 'ui/shadcn-ui',
    parameters: { /* ... */ }
  },
  {
    id: 'ui/tailwind',
    parameters: { /* ... */ }
  },
  
  // Backend Services
  {
    id: 'database/drizzle',
    parameters: { /* ... */ }
  },
  {
    id: 'auth/better-auth',
    parameters: { /* ... */ }
  }
]
```

### 5. Use Feature Flags

```typescript
// ✅ Good - Enable specific features
{
  id: 'framework/nextjs',
  parameters: {
    typescript: true,
    tailwind: true
  },
  features: {
    performance: true,  // ← Enable performance optimizations
    security: true,    // ← Enable security features
    'api-routes': true // ← Enable API routes
  }
}
```

## 🔄 Migration from YAML

If you have existing YAML recipes, here's how to migrate:

### Before (YAML)

```yaml
version: "1.0"
project:
  name: "my-saas"
  framework: "nextjs"
  path: "./my-saas"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
    parameters:
      typescript: true
      tailwind: true
```

### After (TypeScript)

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-saas',
    framework: 'nextjs',
    path: './my-saas'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true
      }
    }
  ]
});
```

### Migration Steps

1. **Install the marketplace package**:
   ```bash
   npm install @thearchitech.xyz/marketplace
   ```

2. **Create a new `.genome.ts` file**:
   ```bash
   touch my-project.genome.ts
   ```

3. **Convert YAML to TypeScript**:
   - Change `version` to `import` statement
   - Convert `project` section (same structure)
   - Convert `modules` array (remove `category` and `version`)
   - Add `export default defineGenome()`

4. **Test the genome**:
   ```bash
   architech new my-project.genome.ts --dry-run
   ```

## 🔍 Advanced Features

### Conditional Configuration

```typescript
const isProduction = process.env.NODE_ENV === 'production';

export default defineGenome({
  project: {
    name: 'my-app',
    framework: 'nextjs',
    path: './my-app'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true
      }
    },
    // Only include in production
    ...(isProduction ? [{
      id: 'observability/sentry',
      parameters: {
        features: ['errors', 'performance']
      }
    }] : [])
  ]
});
```

### Dynamic Configuration

```typescript
const getDatabaseConfig = () => {
  const provider = process.env.DATABASE_PROVIDER || 'neon';
  return {
    id: 'database/drizzle',
    parameters: {
      provider,
      databaseType: provider === 'sqlite' ? 'sqlite' : 'postgresql'
    }
  };
};

export default defineGenome({
  project: {
    name: 'my-app',
    framework: 'nextjs',
    path: './my-app'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true
      }
    },
    getDatabaseConfig()
  ]
});
```

## 📚 Additional Resources

- **[CLI Reference](./CLI_REFERENCE.md)** - Complete CLI command reference
- **[Modifier Cookbook](../marketplace/docs/MODIFIER_COOKBOOK.md)** - Advanced modifier usage
- **[Authoring Guide](../marketplace/docs/AUTHORING_GUIDE.md)** - Creating custom adapters
- **[Available Modules](../marketplace/adapters/)** - Browse all available modules

## 🤝 Getting Help

- **Documentation**: [https://the-architech.dev/docs](https://the-architech.dev/docs)
- **GitHub Issues**: [https://github.com/the-architech/cli/issues](https://github.com/the-architech/cli/issues)
- **Discord Community**: [https://discord.gg/the-architech](https://discord.gg/the-architech)

---

**Happy genome writing! 🧬**

# 📋 Recipe Format Documentation

> **Complete reference for architech.yaml recipe files**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Basic Structure](#basic-structure)
3. [Project Configuration](#project-configuration)
4. [Module Configuration](#module-configuration)
5. [Options](#options)
6. [Examples](#examples)
7. [Validation Rules](#validation-rules)
8. [Best Practices](#best-practices)

## 🎯 Overview

The `architech.yaml` recipe file is the single source of truth for project generation. It defines what modules to install, their configuration, and execution options.

### Key Principles

- **📋 Declarative** - Describe what you want, not how to do it
- **🔧 Modular** - Each module is independent and configurable
- **⚡ CLI-First** - Leverages existing tools and commands
- **🛡️ Type-Safe** - Full validation and error checking

## 🏗️ Basic Structure

```yaml
version: "1.0"
project:
  name: "my-project"
  framework: "nextjs"
  path: "./my-project"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
    parameters:
      typescript: true
      tailwind: true
integrations:
  - id: "stripe-nextjs-integration"
    sub_features:
      apiRoutes: true
      webhooks: true
options:
  skipInstall: false
  verbose: true
```

## 📁 Project Configuration

The `project` section defines the basic project information:

```yaml
project:
  name: "my-saas"                    # Project name (required)
  framework: "nextjs"                # Primary framework (required)
  path: "./my-saas"                  # Output directory (required)
  description: "My awesome SaaS"     # Project description (optional)
  version: "1.0.0"                   # Project version (optional)
  author: "John Doe"                 # Project author (optional)
  license: "MIT"                     # Project license (optional)
```

### Project Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | ✅ | Project name (kebab-case) | `my-saas` |
| `framework` | string | ✅ | Primary framework | `nextjs` |
| `path` | string | ✅ | Output directory | `./my-saas` |
| `description` | string | ❌ | Project description | `My awesome SaaS` |
| `version` | string | ❌ | Project version | `1.0.0` |
| `author` | string | ❌ | Project author | `John Doe` |
| `license` | string | ❌ | Project license | `MIT` |

## 🔧 Module Configuration

The `modules` section defines which modules to install:

```yaml
modules:
  - id: "nextjs"                     # Module ID (required)
    category: "framework"            # Module category (required)
    version: "latest"                # Module version (optional)
    parameters:                      # Module-specific config (optional)
      typescript: true
      tailwind: true
      appRouter: true
```

### Module Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Module identifier | `nextjs` |
| `category` | string | ✅ | Module category | `framework` |
| `version` | string | ❌ | Module version | `latest` |
| `parameters` | object | ❌ | Module configuration | `{typescript: true}` |

### Supported Categories

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

## 🔗 Integration Configuration

The `integrations` section defines cross-adapter integrations:

```yaml
integrations:
  - id: "stripe-nextjs-integration"    # Integration ID (required)
    sub_features:                      # Configurable features (optional)
      apiRoutes: true
      webhooks: true
      components: false
  - id: "web3-shadcn-integration"
    sub_features:
      walletButton: true
      transactionForm: true
```

### Integration Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ | Integration identifier | `stripe-nextjs-integration` |
| `sub_features` | object | ❌ | Configurable features | `{apiRoutes: true}` |

### Integration Naming Convention

Integrations follow the "Requester-Provider" pattern:
- **Format**: `{requester}-{provider}-integration`
- **Requester**: The adapter that needs integration (e.g., `stripe`, `web3`)
- **Provider**: The technology being integrated with (e.g., `nextjs`, `shadcn`)

### Examples

```yaml
# Stripe needs Next.js integration
stripe-nextjs-integration

# Web3 needs Shadcn UI integration
web3-shadcn-integration

# Drizzle needs Next.js integration
drizzle-nextjs-integration
```

## ⚙️ Options

The `options` section controls execution behavior:

```yaml
options:
  skipInstall: false                 # Skip npm install (optional)
  verbose: true                      # Enable verbose logging (optional)
  dryRun: false                      # Show what would be done (optional)
  force: false                       # Overwrite existing files (optional)
```

### Options Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `skipInstall` | boolean | `false` | Skip dependency installation |
| `verbose` | boolean | `false` | Enable verbose logging |
| `dryRun` | boolean | `false` | Show actions without executing |
| `force` | boolean | `false` | Overwrite existing files |

## 📚 Examples

### Minimal Next.js Project

```yaml
version: "1.0"
project:
  name: "my-app"
  framework: "nextjs"
  path: "./my-app"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
```

### Full-Stack SaaS Application

```yaml
version: "1.0"
project:
  name: "my-saas"
  framework: "nextjs"
  path: "./my-saas"
  description: "A complete SaaS application"
modules:
  # Framework
  - id: "nextjs"
    category: "framework"
    version: "latest"
    parameters:
      typescript: true
      tailwind: true
      appRouter: true

  # UI Components
  - id: "shadcn-ui"
    category: "ui"
    version: "latest"
    parameters:
      components: ["button", "input", "card", "dialog"]
      style: "new-york"

  # Database
  - id: "drizzle"
    category: "database"
    version: "latest"
    parameters:
      databaseType: "postgresql"
      features: ["migrations", "studio"]

  # Authentication
  - id: "better-auth"
    category: "auth"
    version: "latest"
    parameters:
      providers: ["github", "google"]
      emailPassword: true

  # Testing
  - id: "vitest"
    category: "testing"
    version: "latest"
    parameters:
      coverage: true
      ui: true

  # Payment
  - id: "stripe"
    category: "payment"
    version: "latest"
    parameters:
      features: ["subscriptions", "one-time"]
      products: ["basic", "pro"]

  # Email
  - id: "resend"
    category: "email"
    version: "latest"
    parameters:
      features: ["transactions", "templates"]

  # Monitoring
  - id: "sentry"
    category: "observability"
    version: "latest"
    parameters:
      features: ["errors", "performance"]

integrations:
  # Stripe + Next.js integration
  - id: "stripe-nextjs-integration"
    sub_features:
      apiRoutes: true
      webhooks: true
      components: true

  # Drizzle + Next.js integration
  - id: "drizzle-nextjs-integration"
    sub_features:
      apiRoutes: true
      middleware: true

  # Better Auth + Drizzle integration
  - id: "better-auth-drizzle-integration"
    sub_features:
      userSchema: true
      sessionSchema: true

  # Stripe + Shadcn UI integration
  - id: "stripe-shadcn-integration"
    sub_features:
      paymentButton: true
      pricingCard: true
      subscriptionForm: true

options:
  verbose: true
```

### Blog with CMS

```yaml
version: "1.0"
project:
  name: "my-blog"
  framework: "nextjs"
  path: "./my-blog"
modules:
  - id: "nextjs"
    category: "framework"
    parameters:
      typescript: true
      tailwind: true

  - id: "shadcn-ui"
    category: "ui"
    parameters:
      components: ["button", "card", "badge"]

  - id: "drizzle"
    category: "database"
    parameters:
      databaseType: "sqlite"

  - id: "next-intl"
    category: "content"
    parameters:
      locales: ["en", "fr", "es"]
      features: ["routing", "pluralization"]

  - id: "vitest"
    category: "testing"
```

### Blockchain dApp

```yaml
version: "1.0"
project:
  name: "my-dapp"
  framework: "nextjs"
  path: "./my-dapp"
modules:
  - id: "nextjs"
    category: "framework"
    parameters:
      typescript: true
      tailwind: true

  - id: "shadcn-ui"
    category: "ui"
    parameters:
      components: ["button", "card", "dialog"]

  - id: "web3"
    category: "blockchain"
    parameters:
      features: ["wallet-connection", "contract-interaction"]
      networks: ["mainnet", "polygon"]
      contracts: ["erc20", "erc721"]

  - id: "better-auth"
    category: "auth"
    parameters:
      providers: ["github"]
```

## ✅ Validation Rules

### Project Validation

- `name` must be kebab-case (lowercase, hyphens only)
- `framework` must be a supported framework
- `path` must be a valid directory path
- `version` must follow semantic versioning

### Module Validation

- `id` must be a supported module ID
- `category` must match the module's category
- `version` must be a valid version string
- `parameters` must match the module's schema

### Example Validation Errors

```yaml
# ❌ Invalid project name
project:
  name: "My Project"  # Should be "my-project"

# ❌ Invalid framework
project:
  framework: "react"  # Should be "nextjs"

# ❌ Invalid module ID
modules:
  - id: "invalid-module"  # Module doesn't exist

# ❌ Invalid parameters
modules:
  - id: "shadcn-ui"
    parameters:
      components: ["invalid-component"]  # Component not supported
```

## 🎯 Best Practices

### 1. Use Semantic Versioning

```yaml
# ✅ Good - Specific versions
modules:
  - id: "nextjs"
    version: "14.0.0"
  - id: "drizzle"
    version: "0.29.0"

# ❌ Avoid - Latest can break
modules:
  - id: "nextjs"
    version: "latest"
```

### 2. Group Related Modules

```yaml
# ✅ Good - Logical grouping
modules:
  # Core Framework
  - id: "nextjs"
    category: "framework"
  
  # UI & Styling
  - id: "shadcn-ui"
    category: "ui"
  - id: "tailwind"
    category: "ui"
  
  # Backend Services
  - id: "drizzle"
    category: "database"
  - id: "better-auth"
    category: "auth"
```

### 3. Use Descriptive Names

```yaml
# ✅ Good - Descriptive
project:
  name: "ecommerce-platform"
  description: "Full-stack e-commerce platform with payments"

# ❌ Bad - Generic
project:
  name: "app"
  description: "My app"
```

### 4. Document Complex Configurations

```yaml
# ✅ Good - Documented parameters
modules:
  - id: "stripe"
    category: "payment"
    parameters:
      # Enable subscription billing
      features: ["subscriptions", "one-time"]
      # Define pricing tiers
      products: ["basic", "pro", "enterprise"]
      # Configure webhooks
      webhooks: ["payment.succeeded", "customer.subscription.created"]
```

### 5. Use Environment-Specific Configurations

```yaml
# ✅ Good - Environment-aware
modules:
  - id: "sentry"
    category: "observability"
    parameters:
      # Only enable in production
      enabled: true
      # Different DSNs per environment
      dsn: "${SENTRY_DSN}"
      # Environment-specific settings
      environment: "${NODE_ENV}"
```

## 🔍 Advanced Features

### Conditional Modules

```yaml
modules:
  - id: "nextjs"
    category: "framework"
  
  # Only include in production
  - id: "sentry"
    category: "observability"
    condition: "${NODE_ENV} === 'production'"
```

### Module Dependencies

```yaml
modules:
  - id: "drizzle"
    category: "database"
  
  # This module depends on drizzle
  - id: "better-auth"
    category: "auth"
    dependsOn: ["drizzle"]
```

### Custom Parameters

```yaml
modules:
  - id: "custom-module"
    category: "custom"
    parameters:
      # Custom configuration
      customConfig:
        apiUrl: "https://api.example.com"
        timeout: 5000
        retries: 3
```

## 📚 Additional Resources

- [Adapter Development Guide](./ADAPTER_DEVELOPMENT_GUIDE.md)
- [Available Modules](../src/adapters/)
- [Example Recipes](../examples/)
- [CLI Reference](./CLI_REFERENCE.md)

---

**Happy recipe writing! 🚀**

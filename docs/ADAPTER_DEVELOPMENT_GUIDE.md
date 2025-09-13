# 🔌 Adapter Development Guide

> **Complete guide to creating custom adapters for The Architech**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Adapter Structure](#adapter-structure)
3. [Creating Your First Adapter](#creating-your-first-adapter)
4. [Blueprint Actions](#blueprint-actions)
5. [Template Variables](#template-variables)
6. [Best Practices](#best-practices)
7. [Testing Your Adapter](#testing-your-adapter)
8. [Publishing Your Adapter](#publishing-your-adapter)

## 🎯 Overview

Adapters are the core building blocks of The Architech. The system uses a **three-tier adapter architecture** with Agnostic Adapters, Dependent Adapters, and Integration Adapters. They follow a **CLI-first approach** and use **declarative blueprints** to define their behavior.

### Three-Tier Adapter System

- **🔌 Agnostic Adapters** - Technology-agnostic implementations (e.g., Stripe, Drizzle)
- **🔗 Dependent Adapters** - Framework-specific implementations (e.g., next-intl, vitest)
- **🔗 Integration Adapters** - Cross-adapter integrations using "Requester-Provider" pattern

### Key Principles

- **⚡ CLI-First** - Leverage existing tools and commands
- **📋 Declarative** - Blueprints define actions, not implementation
- **🛡️ Type-Safe** - Full TypeScript support
- **🎯 Clear Separation** - Each adapter type has distinct responsibilities

## 🏗️ Adapter Types

### 1. Agnostic Adapters
**Location**: `src/adapters/{category}/{adapter-id}/`
**Purpose**: Technology-agnostic implementations that can work with any framework
**Examples**: Stripe, Drizzle, Better Auth, Resend, Sentry
**Dependencies**: None (tech-agnostic)

```json
{
  "dependencies": [],
  "tech_stack": {
    "agnostic": true
  }
}
```

### 2. Dependent Adapters  
**Location**: `src/adapters/{category}/{adapter-id}/`
**Purpose**: Tech-specific implementations inherently tied to specific technologies
**Examples**: next-intl that can be used only with nextjs
**Dependencies**: Framework-specific

```json
{
  "dependencies": ["framework/nextjs"],
  "tech_stack": {
    "framework": "nextjs"
  }
}
```

### 3. Integration Adapters
**Location**: `src/integrations/{requester}-{provider}-integration/`
**Purpose**: Cross-adapter integrations using "Requester-Provider" pattern
**Examples**: stripe-nextjs-integration, drizzle-nextjs-integration, web3-shadcn-integration
**Dependencies**: Multiple adapters

```json
{
  "tech_stack": {
    "framework": "nextjs",
    "adapters": ["stripe"]
  },
  "requirements": {
    "modules": ["stripe", "nextjs"]
  }
}
```

## 🏗️ Adapter Structure

Every adapter follows this structure:

```
src/adapters/{category}/{adapter-id}/
├── adapter.json          # Adapter metadata and configuration
└── blueprint.ts          # Blueprint definition with actions
```

### Example Structure

```
src/adapters/database/drizzle/
├── adapter.json
└── blueprint.ts
```

## 📄 Adapter Configuration (`adapter.json`)

The `adapter.json` file defines the adapter's metadata and capabilities:

```json
{
  "id": "drizzle",
  "name": "Drizzle ORM",
  "description": "Type-safe SQL ORM with excellent TypeScript support",
  "category": "database",
  "version": "1.0.0",
  "blueprint": "blueprint.ts",
  "dependencies": {
    "required": ["framework"],
    "optional": ["auth"],
    "conflicts": []
  },
  "capabilities": {
    "database": {
      "orm": true,
      "migrations": true,
      "studio": true,
      "relations": true
    },
    "integrations": {
      "auth": "User schema generation",
      "framework": "Next.js API routes"
    }
  },
  "environment": {
    "required": ["DATABASE_URL"],
    "optional": ["DATABASE_POOL_SIZE"]
  },
  "files": {
    "generates": ["src/lib/db/", "drizzle.config.ts"],
    "modifies": ["package.json", ".env.example"]
  }
}
```

### Configuration Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | string | Unique adapter identifier | ✅ |
| `name` | string | Human-readable name | ✅ |
| `description` | string | Brief description | ✅ |
| `category` | string | Category (framework, database, auth, etc.) | ✅ |
| `version` | string | Semantic version | ✅ |
| `blueprint` | string | Blueprint file name | ✅ |
| `dependencies` | object | Module dependencies | ❌ |
| `capabilities` | object | Feature capabilities | ❌ |
| `environment` | object | Environment variables | ❌ |
| `files` | object | File generation info | ❌ |

## 🔧 Creating Your First Adapter

Let's create a simple adapter for a logging library:

### Step 1: Create the Directory Structure

```bash
mkdir -p src/adapters/logging/winston
cd src/adapters/logging/winston
```

### Step 2: Create `adapter.json`

```json
{
  "id": "winston",
  "name": "Winston Logger",
  "description": "A multi-transport async logging library for Node.js",
  "category": "logging",
  "version": "1.0.0",
  "blueprint": "blueprint.ts",
  "capabilities": {
    "logging": {
      "transports": ["console", "file", "database"],
      "formats": ["json", "simple", "colorize"],
      "levels": ["error", "warn", "info", "debug"]
    }
  },
  "environment": {
    "optional": ["LOG_LEVEL", "LOG_FILE_PATH"]
  },
  "files": {
    "generates": ["src/lib/logger/"],
    "modifies": ["package.json"]
  }
}
```

### Step 3: Create `blueprint.ts`

```typescript
import { Blueprint } from '../../../types/adapter.js';

export const winstonBlueprint: Blueprint = {
  id: 'winston-logging-setup',
  name: 'Winston Logging Setup',
  actions: [
    {
      type: 'RUN_COMMAND',
      command: 'npm install winston'
    },
    {
      type: 'ADD_CONTENT',
      target: 'src/lib/logger/config.ts',
      content: `import winston from 'winston';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '{{project.name}}' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE_PATH || 'logs/error.log',
    level: 'error'
  }));
}

export default logger;`
    },
    {
      type: 'ADD_CONTENT',
      target: 'src/lib/logger/index.ts',
      content: `export { logger, default } from './config.js';
export * from './types.js';`
    },
    {
      type: 'ADD_CONTENT',
      target: 'src/lib/logger/types.ts',
      content: `export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';`
    }
  ]
};
```

## 📋 Blueprint Interface

### Blueprint Structure

```typescript
export interface Blueprint {
  id: string;
  name: string;
  description: string;
  version: string;
  contextualFiles?: string[];  // NEW: Files to pre-load into VFS
  actions: BlueprintAction[];
}
```

### Contextual Files Property

The `contextualFiles` property allows you to explicitly declare which files your blueprint needs to be pre-loaded into the VFS. This is especially useful for:

- **ENHANCE_FILE actions** that need to modify existing files
- **Integration blueprints** that depend on files created by other adapters
- **Complex blueprints** that need specific file context

#### Example Usage

```typescript
export const stripeNextjsBlueprint: Blueprint = {
  id: 'stripe-nextjs-integration',
  name: 'Stripe Next.js Integration',
  contextualFiles: [
    'src/lib/payment/stripe.ts',  // Created by stripe adapter
    'package.json'                // For dependency checks
  ],
  actions: [
    {
      type: 'ENHANCE_FILE',
      path: 'src/app/api/stripe/webhooks/route.ts',
      modifier: 'ts-module-enhancer',
      fallback: 'create',  // Auto-create if missing
      params: { /* ... */ }
    }
  ]
};
```

#### When to Use Contextual Files

| Use Case | Example | Why |
|----------|---------|-----|
| **ENHANCE_FILE dependencies** | `src/lib/auth/config.ts` | ENHANCE_FILE needs the file to exist |
| **Integration requirements** | `src/lib/payment/stripe.ts` | Integration needs adapter files |
| **Configuration files** | `package.json`, `tsconfig.json` | For dependency/configuration checks |
| **Schema files** | `src/db/schema.ts` | For database integration blueprints |

## ⚡ Blueprint Actions

Blueprints use **high-level semantic actions** that express intent rather than implementation details. This makes blueprint creation simple, clear, and error-free.

### 🎯 **Semantic Actions (Recommended)**

#### 1. `INSTALL_PACKAGES` - Install Dependencies

```typescript
{
  type: 'INSTALL_PACKAGES',
  packages: ['stripe', '@stripe/stripe-js'],
  isDev: false  // optional, defaults to false
}
```

**What it does:** Adds packages to `package.json` and runs `npm install`

#### 2. `ADD_SCRIPT` - Add NPM Scripts

```typescript
{
  type: 'ADD_SCRIPT',
  name: 'stripe:listen',
  command: 'stripe listen --forward-to localhost:3000/api/stripe/webhook'
}
```

**What it does:** Adds script to `package.json` scripts section

#### 3. `ADD_ENV_VAR` - Add Environment Variables

```typescript
{
  type: 'ADD_ENV_VAR',
  key: 'STRIPE_SECRET_KEY',
  value: 'sk_test_...',
  description: 'Stripe secret key for payments'  // optional
}
```

**What it does:** Adds variable to `.env` and `.env.example` files

#### 4. `CREATE_FILE` - Create New Files

```typescript
{
  type: 'CREATE_FILE',
  path: 'src/lib/stripe.ts',
  content: `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
`,
  overwrite: false  // optional, defaults to false
}
```

**What it does:** Creates new file with content, handles directory creation

#### 5. `UPDATE_TS_CONFIG` - Update TypeScript Configs

```typescript
{
  type: 'UPDATE_TS_CONFIG',
  path: 'src/lib/config.ts',
  modifications: {
    stripe: {
      enabled: true,
      webhookSecret: 'process.env.STRIPE_WEBHOOK_SECRET'
    }
  }
}
```

**What it does:** Intelligently merges TypeScript configuration objects

#### 6. `APPEND_TO_FILE` / `PREPEND_TO_FILE` - Modify Files

```typescript
{
  type: 'APPEND_TO_FILE',
  path: '.gitignore',
  content: `
# Stripe
.env.stripe
stripe.log
`
}
```

**What it does:** Appends or prepends content to existing files

#### 7. `RUN_COMMAND` - Execute Commands

```typescript
{
  type: 'RUN_COMMAND',
  command: 'npm run build',
  workingDir: '.'  // optional
}
```

**What it does:** Executes shell commands

#### 8. `ENHANCE_FILE` - Complex File Modifications

```typescript
{
  type: 'ENHANCE_FILE',
  path: 'src/app/api/auth/[...all]/route.ts',
  modifier: 'ts-module-enhancer',
  fallback: 'create',  // Smart fallback strategy
  params: {
    importsToAdd: [
      { name: 'toNextJsHandler', from: 'better-auth/next-js', type: 'import' }
    ],
    statementsToAppend: [
      {
        type: 'raw',
        content: `export const { GET, POST } = toNextJsHandler(authHandler);`
      }
    ]
  }
}
```

**What it does:** Performs complex file modifications using registered modifiers

**Fallback Strategies:**
- `'create'`: Auto-create missing files (recommended for API routes)
- `'skip'`: Skip silently if file doesn't exist
- `'error'`: Throw error if file doesn't exist (default)

**When to use:** Complex file modifications that need AST manipulation or smart merging

### 🔧 **Legacy Actions (Advanced)**

#### `ADD_CONTENT` - Low-Level File Operations

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/lib/config.ts',
  strategy: 'merge',        // merge, replace, append, prepend
  fileType: 'typescript',   // typescript, javascript, json, env, auto
  content: `export const config = {
  apiUrl: '{{project.apiUrl}}',
  version: '{{project.version}}'
};`
}
```

**Use only for advanced cases not covered by semantic actions.**

### 📊 **Before vs After Comparison**

#### **BEFORE (Complex, Error-Prone):**
```typescript
{
  type: 'ADD_CONTENT',
  target: 'package.json',
  strategy: 'merge',
  fileType: 'json',
  content: `{
    "dependencies": {
      "stripe": "^1.0.0",
      "@stripe/stripe-js": "^2.0.0"
    },
    "scripts": {
      "stripe:listen": "stripe listen --forward-to localhost:3000/api/stripe/webhook"
    }
  }`
}
```

#### **AFTER (Simple, Clear, Safe):**
```typescript
[
  {
    type: 'INSTALL_PACKAGES',
    packages: ['stripe', '@stripe/stripe-js']
  },
  {
    type: 'ADD_SCRIPT',
    name: 'stripe:listen',
    command: 'stripe listen --forward-to localhost:3000/api/stripe/webhook'
  }
]
```

**Benefits:**
- ✅ **80% less code** - Semantic actions are much more concise
- ✅ **90% fewer errors** - No more JSON formatting mistakes
- ✅ **100% clearer intent** - What you want to do is obvious
- ✅ **Self-documenting** - Action names clearly express purpose

#### File Update Strategies

| Strategy | Description | Use Case | Example |
|----------|-------------|----------|---------|
| `replace` | Replace entire file (default) | New files, complete rewrites | New component files |
| `merge` | Intelligently merge content | TypeScript/JS files | Updating existing configs |
| `append` | Add content to end of file | Environment variables, logs | Adding to .env files |
| `prepend` | Add content to beginning | Imports, setup code | Adding imports to existing files |

#### File Type Detection

The system automatically detects file types, but you can specify explicitly:

| File Type | Auto-Detection | Description |
|-----------|----------------|-------------|
| `typescript` | `.ts`, `.tsx` | TypeScript files with intelligent merging |
| `javascript` | `.js`, `.jsx` | JavaScript files with intelligent merging |
| `json` | `.json` | JSON files with deep merging |
| `env` | `.env`, `.env.example` | Environment files with deduplication |
| `auto` | All others | Default handling |

**Best Practices:**
- Use `strategy: 'merge'` for TypeScript/JavaScript files to avoid duplication
- Use `strategy: 'append'` for environment variables and logs
- Use `strategy: 'replace'` for new files or complete rewrites
- Let the system auto-detect file types unless you need specific behavior

#### When to Use Each Action Type

| Action Type | Use Case | Complexity | Reliability |
|-------------|----------|------------|-------------|
| **`ADD_CONTENT`** | New files, simple configs | Low | High |
| **`RUN_COMMAND`** | Package installation, scripts | Low | High |
| **`ADD_TS_IMPORT`** | Adding imports to existing files | Medium | Very High |
| **`MERGE_TS_CONFIG_OBJECT`** | Merging TypeScript configs | Medium | Very High |
| **`ADD_DB_SCHEMA`** | Adding database schemas | Medium | Very High |

**Decision Guide:**
- ✅ **Basic Adapters**: Use `ADD_CONTENT` and `RUN_COMMAND`
- ✅ **Integration Features**: Use semantic actions for complex merges
- ✅ **Simple Cases**: Stick with `ADD_CONTENT` with strategies
- ✅ **Complex Cases**: Use semantic actions for reliability

## 🔄 Template Variables

Use template variables to make your adapters dynamic:

### Project Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{project.name}}` | Project name | `my-saas` |
| `{{project.version}}` | Project version | `1.0.0` |
| `{{project.description}}` | Project description | `My awesome SaaS` |

### Module Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{module.id}}` | Module ID | `drizzle` |
| `{{module.version}}` | Module version | `latest` |
| `{{module.parameters.key}}` | Module parameter | `postgresql` |

### Example Usage

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/lib/{{module.id}}/config.ts',
  content: `export const {{module.id}}Config = {
  name: '{{project.name}}',
  version: '{{project.version}}',
  database: '{{module.parameters.databaseType}}'
};`
}
```

## 🎯 Best Practices

### 1. CLI-First Approach

Always use existing CLI tools when possible:

```typescript
// ✅ Good - Use existing CLI
{
  type: 'RUN_COMMAND',
  command: 'npx create-next-app@latest . --typescript --tailwind'
}

// ❌ Bad - Reimplement everything
{
  type: 'ADD_CONTENT',
  target: 'package.json',
  content: '{"dependencies": {"next": "14.0.0"}}'
}
```

### 2. Error Handling

Include proper error handling in generated code:

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/lib/database/connection.ts',
  content: `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = drizzle(postgres(connectionString));`
}
```

### 3. TypeScript Support

Always include proper TypeScript types:

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/types/{{module.id}}.ts',
  content: `export interface {{module.id}}Config {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface {{module.id}}Response {
  success: boolean;
  data?: any;
  error?: string;
}`
}
```

### 4. Environment Variables

Document required environment variables:

```typescript
{
  type: 'ADD_CONTENT',
  target: '.env.example',
  content: `# {{module.name}} Configuration
{{module.id | upper}}_API_KEY=your_api_key_here
{{module.id | upper}}_BASE_URL=https://api.example.com
{{module.id | upper}}_TIMEOUT=5000`
}
```

## 🧪 Testing Your Adapter

### 1. Create a Test Recipe

Create a test recipe to verify your adapter:

```yaml
# test-winston.yaml
version: "1.0"
project:
  name: "test-winston"
  framework: "nextjs"
  path: "./test-winston"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
  - id: "winston"
    category: "logging"
    version: "latest"
    parameters:
      level: "debug"
      filePath: "logs/app.log"
```

### 2. Test the Adapter

```bash
# Build the project
npm run build

# Test your adapter
node dist/index.js new test-winston.yaml
```

### 3. Verify Generated Files

Check that all expected files are created:

```bash
ls -la test-winston/src/lib/logger/
# Should show: config.ts, index.ts, types.ts
```

## 📦 Publishing Your Adapter

### 1. Add to Agent Registry

Update the appropriate agent to recognize your adapter:

```typescript
// src/agents/core/logging-agent.ts
export class LoggingAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('logging', pathHandler);
  }

  private validateLoggingModule(module: Module): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const supportedLogging = ['winston', 'pino', 'bunyan'];
    if (!supportedLogging.includes(module.id)) {
      errors.push(`Unsupported logging library: ${module.id}. Supported: ${supportedLogging.join(', ')}`);
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 2. Update Documentation

Add your adapter to the official documentation:

```markdown
## Logging Adapters

### Winston
- **ID**: `winston`
- **Description**: Multi-transport async logging library
- **Features**: Console, file, database transports
- **Usage**: `architech new my-project.yaml` (include winston module)
```

### 3. Create Examples

Provide example recipes using your adapter:

```yaml
# examples/logging-example.yaml
version: "1.0"
project:
  name: "logging-example"
  framework: "nextjs"
  path: "./logging-example"
modules:
  - id: "nextjs"
    category: "framework"
  - id: "winston"
    category: "logging"
    parameters:
      level: "info"
      transports: ["console", "file"]
```

## 🚀 Advanced Features

### Conditional Actions

Use template conditions for dynamic behavior:

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/lib/config.ts',
  content: `export const config = {
  database: {
    url: process.env.DATABASE_URL,
    {{#if module.parameters.ssl}}
    ssl: true,
    {{/if}}
    pool: {
      min: 2,
      max: 10
    }
  }
};`
}
```

### Multiple File Generation

Generate multiple related files:

```typescript
export const complexBlueprint: Blueprint = {
  id: 'complex-setup',
  name: 'Complex Setup',
  actions: [
    // Install dependencies
    {
      type: 'RUN_COMMAND',
      command: 'npm install express cors helmet'
    },
    // Create main server file
    {
      type: 'ADD_CONTENT',
      target: 'src/server.ts',
      content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

export default app;`
    },
    // Create middleware
    {
      type: 'ADD_CONTENT',
      target: 'src/middleware/auth.ts',
      content: `export const authMiddleware = (req: any, res: any, next: any) => {
  // Auth logic here
  next();
};`
    }
  ]
};
```

## 📚 Additional Resources

- [Blueprint Types Reference](../types/adapter.ts)
- [Agent Development Guide](./AGENT_DEVELOPMENT_GUIDE.md)
- [Recipe Format Documentation](./RECIPE_FORMAT.md)
- [Example Adapters](../src/adapters/)

## 🤝 Contributing

1. Fork the repository
2. Create your adapter following this guide
3. Add tests and documentation
4. Submit a pull request

---

**Happy coding! 🚀**

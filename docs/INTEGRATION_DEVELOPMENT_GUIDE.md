# 🔗 Integration Development Guide

> **Complete guide to creating custom integration adapters for The Architech**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Integration Types](#integration-types)
3. [Naming Convention](#naming-convention)
4. [Creating Your First Integration](#creating-your-first-integration)
5. [Integration Configuration](#integration-configuration)
6. [Blueprint Actions](#blueprint-actions)
7. [Sub-Features System](#sub-features-system)
8. [Best Practices](#best-practices)
9. [Testing Your Integration](#testing-your-integration)
10. [Publishing Your Integration](#publishing-your-integration)

## 🎯 Overview

Integration Adapters are the glue that connects different adapters together. They handle the complex logic required to make agnostic adapters work seamlessly with specific frameworks, UI libraries, or databases.

### Key Principles

- **🔗 Cross-Adapter Logic** - Connect different adapters together
- **📋 Requester-Provider Pattern** - Clear naming convention for integrations
- **⚙️ Sub-Features** - Configurable integration features
- **🎯 Framework-Specific** - Handle non-agnostic parts of integrations
- **🛡️ Type-Safe** - Full TypeScript support

## 🔗 Integration Types

### 1. Framework Integrations
**Purpose**: Connect agnostic adapters to specific frameworks
**Examples**: `stripe-nextjs-integration`, `drizzle-nextjs-integration`
**Pattern**: `{adapter}-{framework}-integration`

### 2. UI Integrations  
**Purpose**: Connect adapters to UI component libraries
**Examples**: `web3-shadcn-integration`, `stripe-shadcn-integration`
**Pattern**: `{adapter}-{ui-library}-integration`

### 3. Database Integrations
**Purpose**: Connect adapters to specific database systems
**Examples**: `better-auth-drizzle-integration`, `sentry-drizzle-integration`
**Pattern**: `{adapter}-{database}-integration`

## 📝 Naming Convention

### Requester-Provider Pattern

The naming convention follows the pattern: `{requester}-{provider}-integration`

- **Requester**: The adapter that needs integration (e.g., `stripe`, `web3`)
- **Provider**: The technology being integrated with (e.g., `nextjs`, `shadcn`)
- **Integration**: Always ends with `-integration`

### Examples

```bash
# Stripe needs Next.js integration
stripe-nextjs-integration

# Web3 needs Shadcn UI integration  
web3-shadcn-integration

# Drizzle needs Next.js integration
drizzle-nextjs-integration

# Better Auth needs Drizzle integration
better-auth-drizzle-integration
```

### Why This Pattern?

1. **Clear Intent**: Immediately understand what the integration does
2. **Logical Grouping**: Related integrations are grouped together
3. **Discoverability**: Easy to find integrations for specific adapters
4. **Consistency**: Same pattern across all integrations

## 🏗️ Creating Your First Integration

Let's create a `stripe-shadcn-integration` to connect Stripe payments with Shadcn UI components.

### Step 1: Create the Directory Structure

```bash
mkdir -p src/integrations/stripe-shadcn-integration
cd src/integrations/stripe-shadcn-integration
```

### Step 2: Create `integration.json`

```json
{
  "id": "stripe-shadcn-integration",
  "name": "Stripe Shadcn Integration",
  "description": "Complete Stripe integration with Shadcn UI components for payment processing",
  "category": "integration",
  "version": "1.0.0",
  "blueprint": "blueprint.ts",
  "tech_stack": {
    "framework": "agnostic",
    "adapters": ["stripe", "shadcn-ui"]
  },
  "requirements": {
    "modules": ["stripe", "shadcn-ui"],
    "dependencies": []
  },
  "provides": {
    "files": [
      "src/components/ui/payment-button.tsx",
      "src/components/ui/pricing-card.tsx",
      "src/components/ui/subscription-form.tsx",
      "src/hooks/use-stripe.ts",
      "src/lib/stripe-ui.ts"
    ],
    "components": [
      "PaymentButton",
      "PricingCard", 
      "SubscriptionForm"
    ],
    "hooks": [
      "useStripe"
    ]
  },
  "sub_features": {
    "paymentButton": {
      "name": "Payment Button",
      "description": "Shadcn-styled payment button component",
      "type": "boolean",
      "default": true
    },
    "pricingCard": {
      "name": "Pricing Card",
      "description": "Pricing card component with Stripe integration",
      "type": "boolean", 
      "default": true
    },
    "subscriptionForm": {
      "name": "Subscription Form",
      "description": "Subscription management form",
      "type": "boolean",
      "default": false
    },
    "webhooks": {
      "name": "Webhook Handlers",
      "description": "API routes for Stripe webhooks",
      "type": "boolean",
      "default": true
    },
    "typescript": {
      "name": "TypeScript Support",
      "description": "Full TypeScript support for Stripe UI",
      "type": "boolean",
      "default": true
    }
  }
}
```

### Step 3: Create `blueprint.ts`

```typescript
import { Blueprint } from '../../types/adapter.js';

export const stripeShadcnIntegrationBlueprint: Blueprint = {
  id: 'stripe-shadcn-integration',
  name: 'Stripe Shadcn Integration',
  description: 'Complete Stripe integration with Shadcn UI components',
  version: '1.0.0',
  actions: [
    {
      type: 'ADD_CONTENT',
      target: 'src/components/ui/payment-button.tsx',
      content: `import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useStripe } from "@/hooks/use-stripe";

interface PaymentButtonProps {
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function PaymentButton({
  amount,
  currency = "usd",
  onSuccess,
  onError,
  className
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createCheckoutSession } = useStripe();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const { error } = await createCheckoutSession({
        amount,
        currency,
        successUrl: window.location.href,
        cancelUrl: window.location.href
      });

      if (error) {
        onError?.(error.message);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay $${(amount / 100).toFixed(2)}`
      )}
    </Button>
  );
}`
    },
    {
      type: 'ADD_CONTENT',
      target: 'src/hooks/use-stripe.ts',
      content: `import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useStripe() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = useCallback(async (params: {
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
  }) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      return { success: true };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createCheckoutSession,
    isLoading
  };
}`
    }
  ]
};
```

## 📄 Integration Configuration

### Integration Schema

```json
{
  "id": "string",                    // Unique integration ID
  "name": "string",                  // Human-readable name
  "description": "string",           // Brief description
  "category": "integration",         // Always "integration"
  "version": "string",               // Semantic version
  "blueprint": "string",             // Blueprint file name
  "tech_stack": {                    // Technology stack
    "framework": "string",           // Framework (agnostic, nextjs, etc.)
    "adapters": ["string"]           // Required adapters
  },
  "requirements": {                  // Requirements
    "modules": ["string"],           // Required modules
    "dependencies": ["string"]       // Additional dependencies
  },
  "provides": {                      // What this integration provides
    "files": ["string"],             // Files generated
    "components": ["string"],        // React components
    "hooks": ["string"],             // React hooks
    "pages": ["string"],             // Pages/routes
    "api": ["string"]                // API routes
  },
  "sub_features": {                  // Configurable features
    "featureName": {
      "name": "string",              // Feature name
      "description": "string",       // Feature description
      "type": "boolean|string|number", // Feature type
      "default": "any"               // Default value
    }
  }
}
```

## ⚡ Blueprint Actions

Integration blueprints use the same actions as regular adapters, with special focus on ENHANCE_FILE for API routes and framework-specific modifications:

### 1. `RUN_COMMAND` Actions

```typescript
{
  type: 'RUN_COMMAND',
  command: 'npm install @stripe/stripe-js'
}
```

### 2. `ADD_CONTENT` Actions

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/components/ui/payment-form.tsx',
  content: `// Component implementation`
}
```

### 3. `ENHANCE_FILE` Actions (Recommended for Integrations)

Integration blueprints often need to create API routes and modify existing files. Use ENHANCE_FILE with smart fallback:

#### API Route Creation

```typescript
{
  type: 'ENHANCE_FILE',
  path: 'src/app/api/stripe/webhooks/route.ts',
  modifier: 'ts-module-enhancer',
  fallback: 'create',  // Auto-create missing API routes
  params: {
    importsToAdd: [
      { name: 'NextRequest', from: 'next/server', type: 'import' },
      { name: 'stripe', from: '@/lib/payment/stripe', type: 'import' }
    ],
    statementsToAppend: [
      {
        type: 'raw',
        content: `export async function POST(request: NextRequest) {
  // Webhook handling logic
}`
      }
    ]
  }
}
```

#### Configuration Enhancement

```typescript
{
  type: 'ENHANCE_FILE',
  path: 'next.config.js',
  modifier: 'nextjs-config-wrapper',
  fallback: 'skip',  // Skip if config doesn't exist
  params: {
    withStripe: true,
    withWebhooks: true
  }
}
```

#### Critical File Modification

```typescript
{
  type: 'ENHANCE_FILE',
  path: 'src/lib/payment/stripe.ts',
  modifier: 'ts-module-enhancer',
  fallback: 'error',  // Fail if file doesn't exist
  params: {
    importsToAdd: [
      { name: 'NextRequest', from: 'next/server', type: 'import' }
    ]
  }
}
```

#### Fallback Strategy Guide

| Strategy | Use Case | Example |
|----------|----------|---------|
| `'create'` | API routes, new endpoints | Stripe webhooks, auth API routes |
| `'skip'` | Optional enhancements | Config file modifications |
| `'error'` | Critical dependencies | Core file modifications |

## 🎛️ Sub-Features System

Sub-features allow users to configure which parts of the integration to include:

### Feature Types

- **boolean**: Enable/disable features
- **string**: Text configuration
- **number**: Numeric configuration
- **array**: Multiple selections

### Example Configuration

```json
{
  "sub_features": {
    "paymentButton": {
      "name": "Payment Button",
      "description": "Shadcn-styled payment button component",
      "type": "boolean",
      "default": true
    },
    "theme": {
      "name": "Theme",
      "description": "Component theme",
      "type": "string",
      "default": "default",
      "options": ["default", "dark", "light"]
    },
    "features": {
      "name": "Features",
      "description": "Enabled features",
      "type": "array",
      "default": ["payments", "subscriptions"],
      "options": ["payments", "subscriptions", "webhooks", "analytics"]
    }
  }
}
```

### Using Sub-Features in Blueprints

```typescript
{
  type: 'ADD_CONTENT',
  target: 'src/components/ui/payment-button.tsx',
  content: `import { Button } from "@/components/ui/button";
{{#if sub_features.paymentButton}}
export function PaymentButton() {
  return <Button>Pay Now</Button>;
}
{{/if}}`
}
```

## 🎯 Best Practices

### 1. Follow Naming Convention

```bash
# ✅ Good - Clear requester-provider pattern
stripe-nextjs-integration
web3-shadcn-integration
drizzle-nextjs-integration

# ❌ Bad - Unclear or inconsistent
stripe-ui-integration
nextjs-stripe-integration
stripe-shadcn-ui-integration
```

### 2. Use Sub-Features Wisely

```json
// ✅ Good - Logical feature grouping
{
  "sub_features": {
    "components": {
      "name": "UI Components",
      "description": "Shadcn UI components for Stripe",
      "type": "boolean",
      "default": true
    },
    "apiRoutes": {
      "name": "API Routes", 
      "description": "Backend API routes for Stripe",
      "type": "boolean",
      "default": true
    }
  }
}
```

### 3. Provide Clear Documentation

```typescript
// ✅ Good - Well-documented component
/**
 * PaymentButton - Shadcn-styled payment button component
 * 
 * @param amount - Payment amount in cents
 * @param currency - Payment currency (default: 'usd')
 * @param onSuccess - Success callback
 * @param onError - Error callback
 */
export function PaymentButton({
  amount,
  currency = "usd",
  onSuccess,
  onError
}: PaymentButtonProps) {
  // Implementation
}
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Proper error handling
const handlePayment = async () => {
  try {
    setIsLoading(true);
    const result = await createCheckoutSession(params);
    
    if (result.error) {
      onError?.(result.error);
      return;
    }
    
    onSuccess?.();
  } catch (error) {
    onError?.(error instanceof Error ? error.message : 'Payment failed');
  } finally {
    setIsLoading(false);
  }
};
```

## 🧪 Testing Your Integration

### 1. Create a Test Recipe

```yaml
# test-stripe-shadcn.yaml
version: "1.0"
project:
  name: "test-stripe-shadcn"
  framework: "nextjs"
  path: "./test-stripe-shadcn"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
  - id: "shadcn-ui"
    category: "ui"
    version: "latest"
  - id: "stripe"
    category: "payment"
    version: "latest"
integrations:
  - id: "stripe-shadcn-integration"
    sub_features:
      paymentButton: true
      pricingCard: true
      webhooks: false
```

### 2. Test the Integration

```bash
# Build the project
npm run build

# Test your integration
node dist/bin/architech.js new test-stripe-shadcn.yaml
```

### 3. Verify Generated Files

```bash
# Check that integration files are created
ls -la test-stripe-shadcn/src/components/ui/
# Should show: payment-button.tsx, pricing-card.tsx

ls -la test-stripe-shadcn/src/hooks/
# Should show: use-stripe.ts
```

## 📦 Publishing Your Integration

### 1. Add to Integration Registry

Update `src/core/services/integration/integration-registry.ts`:

```typescript
// Load Stripe Shadcn Integration
const stripeShadcnIntegration = {
  id: 'stripe-shadcn-integration',
  name: 'Stripe Shadcn Integration',
  description: 'Complete Stripe integration with Shadcn UI components',
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
      'src/components/ui/payment-button.tsx',
      'src/hooks/use-stripe.ts'
    ],
    components: ['PaymentButton'],
    hooks: ['useStripe']
  },
  sub_features: {
    paymentButton: {
      name: 'Payment Button',
      description: 'Shadcn-styled payment button component',
      type: 'boolean' as const,
      default: true
    }
    // ... other sub-features
  },
  blueprint: {
    id: 'stripe-shadcn-integration',
    name: 'Stripe Shadcn Integration',
    description: 'Complete Stripe integration with Shadcn UI',
    version: '1.0.0',
    actions: [] // Will be loaded lazily
  }
};

this.register(stripeShadcnIntegration);
```

### 2. Update Documentation

Add your integration to the official documentation:

```markdown
## Integration Adapters

### Stripe Shadcn Integration
- **ID**: `stripe-shadcn-integration`
- **Description**: Complete Stripe integration with Shadcn UI components
- **Features**: Payment buttons, pricing cards, subscription forms
- **Usage**: Include in recipe with `stripe` and `shadcn-ui` modules
```

### 3. Create Examples

Provide example recipes using your integration:

```yaml
# examples/stripe-shadcn-example.yaml
version: "1.0"
project:
  name: "stripe-shadcn-example"
  framework: "nextjs"
  path: "./stripe-shadcn-example"
modules:
  - id: "nextjs"
    category: "framework"
  - id: "shadcn-ui"
    category: "ui"
  - id: "stripe"
    category: "payment"
integrations:
  - id: "stripe-shadcn-integration"
    sub_features:
      paymentButton: true
      pricingCard: true
```

## 📚 Additional Resources

- [Adapter Development Guide](./ADAPTER_DEVELOPMENT_GUIDE.md)
- [Recipe Format Documentation](./RECIPE_FORMAT.md)
- [Example Integrations](../src/integrations/)
- [Integration Types Reference](../src/types/integration.ts)

## 🤝 Contributing

1. Fork the repository
2. Create your integration following this guide
3. Add tests and documentation
4. Submit a pull request

---

**Happy integrating! 🔗**

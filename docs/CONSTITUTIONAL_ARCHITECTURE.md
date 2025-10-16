# 🏛️ Constitutional Architecture Guide

> **Complete guide to The Architech's revolutionary Constitutional Architecture**

## 🎯 Overview

The Constitutional Architecture is a revolutionary approach to code generation that organizes modules around **business capabilities** rather than technical implementation. This creates a more intuitive, maintainable, and powerful system that automatically handles dependencies and conflicts.

## 🎯 Core Principles

### 1. "Defaults are Implicit, Overrides are Explicit"

Users only specify what they want to change. Everything else uses sensible defaults defined by the module.

```typescript
// ✅ User only specifies overrides
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true,  // ← Only specify what you want to change
    socialLogins: ['github', 'google']  // ← Override defaults
  }
}

// ❌ Don't need to specify everything
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    passwordReset: true,  // ← Already default
    profileManagement: true,  // ← Already default
    mfa: true,  // ← Only this is needed
    socialLogins: ['github', 'google']
  }
}
```

### 2. Business Capability Hierarchy

Modules are organized around what they do, not how they do it.

```json
{
  "provides": ["authentication", "user-management", "security"],
  "internal_structure": {
    "core": ["loginForm", "signupForm"],
    "optional": {
      "passwordReset": {
        "prerequisites": ["core"],
        "provides": ["password-reset"]
      }
    }
  }
}
```

### 3. Intelligent Dependency Resolution

The system automatically resolves prerequisites and conflicts.

```typescript
// System automatically ensures:
// 1. 'core' capabilities are always available
// 2. 'passwordReset' requires 'core' to be available first
// 3. No conflicts between modules providing the same capability
```

## 🏗️ Module Structure

### Feature Configuration

Each module defines its capabilities through a structured configuration:

```json
{
  "id": "feature:auth-ui/shadcn",
  "name": "Authentication UI Components",
  "description": "Complete authentication UI with Shadcn/UI components",
  "version": "1.0.0",
  "provides": ["authentication", "user-management", "security"],
  "parameters": {
    "features": {
      "passwordReset": { 
        "default": true,
        "description": "Password reset functionality"
      },
      "mfa": { 
        "default": false,
        "description": "Multi-factor authentication"
      },
      "socialLogins": { 
        "default": false,
        "description": "Social login providers"
      },
      "profileManagement": { 
        "default": true,
        "description": "User profile management"
      },
      "accountSettingsPage": { 
        "default": false,
        "description": "Account settings page"
      }
    }
  },
  "internal_structure": {
    "core": ["loginForm", "signupForm", "profileManagement"],
    "optional": {
      "passwordReset": {
        "prerequisites": ["core"],
        "provides": ["password-reset"],
        "templates": ["password-reset-form.tpl", "password-reset-email.tpl"]
      },
      "mfa": {
        "prerequisites": ["core"],
        "provides": ["multi-factor-auth"],
        "templates": ["mfa-setup.tpl", "mfa-verify.tpl"]
      },
      "socialLogins": {
        "prerequisites": ["core"],
        "provides": ["social-auth"],
        "templates": ["social-login-buttons.tpl"]
      },
      "accountSettingsPage": {
        "prerequisites": ["core", "profileManagement"],
        "provides": ["account-settings"],
        "templates": ["account-settings-page.tpl"]
      }
    }
  }
}
```

### Capability Dependencies

The system automatically resolves:

- **Prerequisites**: What capabilities must be available before this one
- **Conflicts**: Multiple modules providing the same capability
- **Dependencies**: Required modules and their execution order
- **Validation**: Ensures all prerequisites are met

## 🧬 Dynamic Blueprint Functions

### Blueprint as TypeScript Function

Blueprints are now TypeScript functions that generate actions based on configuration:

```typescript
import { BlueprintAction, MergedConfiguration } from '@thearchitech.xyz/types';

export default function generateBlueprint(config: MergedConfiguration): BlueprintAction[] {
  const actions: BlueprintAction[] = [];
  
  // Always generate core actions
  actions.push(...generateCoreActions());
  
  // Conditionally generate capability-specific actions
  if (config.activeFeatures.includes('passwordReset')) {
    actions.push(...generatePasswordResetActions());
  }
  
  if (config.activeFeatures.includes('mfa')) {
    actions.push(...generateMFAActions());
  }
  
  if (config.activeFeatures.includes('socialLogins')) {
    actions.push(...generateSocialLoginActions());
  }
  
  if (config.activeFeatures.includes('accountSettingsPage')) {
    actions.push(...generateAccountSettingsActions());
  }
  
  return actions;
}

function generateCoreActions(): BlueprintAction[] {
  return [
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/LoginForm.tsx',
      template: 'templates/login-form.tsx.tpl',
      context: { features: ['core'] }
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/SignupForm.tsx',
      template: 'templates/signup-form.tsx.tpl',
      context: { features: ['core'] }
    }
  ];
}

function generatePasswordResetActions(): BlueprintAction[] {
  return [
    {
      type: 'CREATE_FILE',
      path: 'src/components/auth/PasswordResetForm.tsx',
      template: 'templates/password-reset-form.tsx.tpl',
      context: { 
        features: ['passwordReset'],
        hasPasswordReset: true 
      }
    }
  ];
}
```

### Configuration Merging

The system automatically merges user overrides with module defaults:

```typescript
// User genome
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true,
    socialLogins: ['github', 'google']
  }
}

// Merged configuration
{
  activeFeatures: ['core', 'passwordReset', 'mfa', 'socialLogins', 'profileManagement'],
  resolvedCapabilities: ['authentication', 'user-management', 'security', 'password-reset', 'multi-factor-auth', 'social-auth'],
  executionOrder: ['core', 'passwordReset', 'mfa', 'socialLogins', 'profileManagement'],
  conflicts: []
}
```

## 🎨 Intelligent Template Context

### Context-Aware Templates

Templates receive rich context about capabilities and configuration:

```handlebars
{{!-- templates/login-form.tsx.tpl --}}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  return (
    <form className="space-y-4">
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      
      {{#if context.hasPasswordReset}}
      <a href="/forgot-password" className="text-sm text-blue-600">
        Forgot password?
      </a>
      {{/if}}
      
      <Button type="submit">Login</Button>
      
      {{#if context.hasSocialLogins}}
      <div className="mt-4">
        <p className="text-sm text-gray-600">Or continue with</p>
        <div className="flex space-x-2 mt-2">
          {{#each context.socialProviders}}
          <Button variant="outline" onClick={() => signInWith('{{this}}')}>
            {{this}}
          </Button>
          {{/each}}
        </div>
      </div>
      {{/if}}
    </form>
  )
}
```

### Context Merging

The system merges global and action-specific context:

```typescript
// Global context (from genome)
{
  project: { name: 'my-app', framework: 'nextjs' },
  module: { id: 'feature:auth-ui/shadcn' },
  features: ['core', 'passwordReset', 'mfa']
}

// Action-specific context
{
  features: ['passwordReset'],
  hasPasswordReset: true,
  socialProviders: ['github', 'google']
}

// Merged context (sent to template)
{
  project: { name: 'my-app', framework: 'nextjs' },
  module: { id: 'feature:auth-ui/shadcn' },
  features: ['passwordReset'],
  hasPasswordReset: true,
  socialProviders: ['github', 'google']
}
```

## 🚀 Benefits

### For Users

1. **Simplified Configuration** - Only specify what you want to change
2. **Intelligent Defaults** - Sensible defaults for everything else
3. **Automatic Dependencies** - System handles prerequisites and conflicts
4. **Type Safety** - Full TypeScript support with autocomplete

### For Developers

1. **Capability-Based Design** - Organize around business value
2. **Dynamic Generation** - Blueprints adapt to configuration
3. **Rich Context** - Templates have access to full configuration
4. **Maintainable Code** - Clear separation of concerns

### For the System

1. **Intelligent Resolution** - Automatic dependency and conflict resolution
2. **Performance** - Only generate what's needed
3. **Extensibility** - Easy to add new capabilities
4. **Reliability** - Comprehensive validation and error handling

## 📚 Examples

### Simple Authentication

```typescript
// User genome - minimal configuration
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true  // Only specify what you want to change
  }
}

// System automatically includes:
// - Core login/signup forms (default: true)
// - Password reset (default: true)
// - Profile management (default: true)
// - MFA setup (user specified: true)
// - Social logins (default: false)
```

### Advanced Authentication

```typescript
// User genome - comprehensive configuration
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true,
    socialLogins: ['github', 'google', 'microsoft'],
    accountSettingsPage: true
  }
}

// System automatically includes:
// - All core features
// - MFA with setup and verification
// - Social login buttons for specified providers
// - Account settings page
// - All necessary prerequisites
```

### Enterprise Authentication

```typescript
// User genome - enterprise configuration
{
  id: 'feature:auth-ui/shadcn',
  parameters: {
    mfa: true,
    socialLogins: ['github', 'google', 'microsoft', 'linkedin'],
    accountSettingsPage: true,
    customBranding: true,
    auditLogging: true
  }
}

// System automatically includes:
// - All authentication features
// - Enterprise-grade security
// - Custom branding support
// - Audit logging
// - Complete user management suite
```

## 🔧 Implementation Details

### Configuration Merging Process

1. **Load Module Defaults** - Read `parameters.features` from `feature.json`
2. **Apply User Overrides** - Merge user parameters with defaults
3. **Validate Prerequisites** - Ensure all prerequisites are met
4. **Resolve Conflicts** - Handle capability conflicts
5. **Generate Execution Order** - Topological sort of capabilities

### Blueprint Execution Process

1. **Load Blueprint Function** - Import the TypeScript function
2. **Execute with Configuration** - Call function with merged config
3. **Generate Actions** - Get static action array
4. **Execute Actions** - Run actions with VFS
5. **Render Templates** - Use context-aware template rendering

### Template Rendering Process

1. **Merge Contexts** - Combine global and action-specific context
2. **Process Handlebars** - Render template with merged context
3. **Validate Output** - Ensure generated code is valid
4. **Write to VFS** - Store in virtual file system

## 🎯 Best Practices

### Module Design

1. **Clear Capabilities** - Define what your module provides
2. **Sensible Defaults** - Most users should be happy with defaults
3. **Logical Prerequisites** - Dependencies should make business sense
4. **Rich Context** - Provide useful context to templates

### Blueprint Development

1. **Capability-Based Functions** - Organize around business capabilities
2. **Clear Separation** - Separate core from optional features
3. **Rich Context** - Pass useful context to templates
4. **Error Handling** - Graceful handling of missing prerequisites

### Template Design

1. **Context-Aware** - Use available context effectively
2. **Conditional Rendering** - Show/hide based on capabilities
3. **Progressive Enhancement** - Core functionality always works
4. **Clean Code** - Generate maintainable code

## 🚀 Future Enhancements

### Planned Features

1. **AI-Powered Recommendations** - Suggest capabilities based on project type
2. **Visual Capability Editor** - GUI for capability configuration
3. **Capability Marketplace** - Share and discover capabilities
4. **Advanced Analytics** - Track capability usage and performance

### Extension Points

1. **Custom Capabilities** - Define your own business capabilities
2. **Capability Plugins** - Extend the system with plugins
3. **Template Libraries** - Share template collections
4. **Integration APIs** - Connect with external systems

---

**The Constitutional Architecture** - Transforming code generation from technical complexity to business clarity.

*For more information, see the [Architecture Guide](./ARCHITECTURE.md) and [Genome Format](./GENOME_FORMAT.md).*

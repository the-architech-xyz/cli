# Type-Safe Genomes and Blueprints

This document describes the type-safe genome and blueprint system for The Architech CLI.

## Overview

The type-safe system provides TypeScript type definitions for genomes and blueprints, enabling:

- Auto-completion for module IDs, parameters, and features
- Type checking for parameter values
- Documentation through type annotations
- Better developer experience

## Getting Started

### 1. Generate Type Definitions

First, generate the TypeScript type definitions from the JSON schemas:

```bash
npm run types:generate
```

This will create type definitions in the `types/generated` directory:

- `types/generated/genome.d.ts` - Master type definition for genomes
- `types/generated/adapters/*/types.d.ts` - Type definitions for adapters
- `types/generated/integrations/*/types.d.ts` - Type definitions for integrations

### 2. Create a Type-Safe Genome

Create a TypeScript file for your genome:

```typescript
// my-app.genome.ts
import { Genome } from './types/generated/genome';

const genome: Genome = {
  version: '1.0.0',
  project: {
    name: 'my-app',
    description: 'My awesome application',
    framework: 'nextjs',
    path: './my-app'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        eslint: true
      }
    },
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'card', 'input'],
        theme: 'dark'
      }
    }
  ]
};

export default genome;
```

### 3. Convert to YAML

Convert your TypeScript genome to YAML for use with the CLI:

```bash
npm run ts-to-yaml my-app.genome.ts
```

This will create `my-app.yaml` which you can use with the CLI:

```bash
architech new my-app.yaml
```

## Creating Type-Safe Blueprints

You can also create type-safe blueprints using the generated type definitions:

```typescript
// blueprint.ts
import { ShadcnUIParameters } from '../types/generated/adapters/ui/shadcn-ui/types';

export default function createBlueprint(params: ShadcnUIParameters) {
  return {
    id: 'shadcn-ui-installer',
    name: 'Shadcn/ui Component Installer',
    actions: [
      // Use typed parameters
      ...params.components.map(component => ({
        type: 'RUN_COMMAND',
        command: `npx shadcn@latest add ${component} --yes --overwrite`
      }))
    ]
  };
}
```

## How It Works

### JSON Schema as Source of Truth

The system uses the JSON schema in `adapter.json` files as the source of truth:

```json
{
  "parameters": {
    "components": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["button", "card", "input", ...]
      }
    }
  }
}
```

### Generated TypeScript Definitions

The type generator creates TypeScript interfaces from the JSON schema:

```typescript
export interface ShadcnUIParameters {
  components?: Array<'button' | 'card' | 'input' | ...>;
  theme?: 'default' | 'dark' | 'light';
}
```

### Runtime Validation

The CLI validates parameters at runtime using the JSON schema, ensuring that:

1. Parameters are of the correct type
2. Enum values are valid
3. Required parameters are provided
4. Default values are applied when needed

## Best Practices

1. **Always regenerate types** after modifying JSON schemas
2. **Use TypeScript for complex genomes** to benefit from type checking
3. **Keep JSON schema as the source of truth** for parameters
4. **Use function-based blueprints** for type safety

## Advanced Usage

### Custom Type Validation

You can add custom type validation in your TypeScript genomes:

```typescript
import { Genome } from './types/generated/genome';

// Custom type guard
function hasRequiredComponents(components: string[]): boolean {
  return components.includes('button') && components.includes('card');
}

const genome: Genome = {
  // ...
  modules: [
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'card', 'input'] // Type-checked and validated
      }
    }
  ]
};

// Custom validation
if (!hasRequiredComponents(genome.modules[1].parameters.components)) {
  throw new Error('Missing required components');
}

export default genome;
```

### Dynamic Parameter Generation

You can generate parameters dynamically while maintaining type safety:

```typescript
import { ShadcnUIParameters } from './types/generated/adapters/ui/shadcn-ui/types';

// Dynamic parameter generation
function generateComponents(): ShadcnUIParameters['components'] {
  const baseComponents = ['button', 'card', 'input'];
  const additionalComponents = process.env.ADVANCED ? ['dialog', 'form'] : [];
  return [...baseComponents, ...additionalComponents];
}

const genome: Genome = {
  // ...
  modules: [
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: generateComponents()
      }
    }
  ]
};
```

## Troubleshooting

### Types are not updating

If types are not updating after modifying JSON schemas:

1. Run `npm run types:generate` to regenerate types
2. Restart your TypeScript server in your editor
3. Check for errors in the type generation process

### Runtime validation errors

If you're seeing runtime validation errors:

1. Check that your TypeScript genome matches the JSON schema
2. Ensure that enum values are valid
3. Verify that required parameters are provided

## Conclusion

The type-safe genome and blueprint system provides a powerful developer experience while maintaining compatibility with the existing CLI. By leveraging TypeScript's type system, you can create more robust and maintainable genomes and blueprints.


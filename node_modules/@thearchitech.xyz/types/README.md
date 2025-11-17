# @the-architech-xyz/types

Shared TypeScript type definitions for The Architech CLI and Marketplace ecosystem.

## Overview

This package provides centralized type definitions that are used across:
- **The Architech CLI** - Core CLI engine
- **The Architech Marketplace** - Blueprint and adapter definitions
- **Third-party integrations** - External tools and plugins

## Installation

```bash
npm install @the-architech-xyz/types
```

## Usage

```typescript
import { Blueprint, AdapterConfig, BlueprintAction } from '@the-architech-xyz/types';

// Define a blueprint
const myBlueprint: Blueprint = {
  id: 'my-blueprint',
  name: 'My Blueprint',
  actions: [
    {
      type: BlueprintActionType.CREATE_FILE,
      path: 'src/index.ts',
      content: 'console.log("Hello World");'
    }
  ]
};

// Define an adapter config
const adapterConfig: AdapterConfig = {
  id: 'my-adapter',
  name: 'My Adapter',
  description: 'A sample adapter',
  category: 'framework',
  version: '1.0.0',
  blueprint: 'blueprint.ts'
};
```

## Available Types

### Core Types
- `Blueprint` - Blueprint definition structure
- `BlueprintAction` - Individual blueprint actions
- `Adapter` - Adapter with config and blueprint
- `AdapterConfig` - Adapter configuration
- `IntegrationAdapter` - Integration adapter structure

### Agent Types
- `Agent` - Base agent interface
- `AgentResult` - Agent execution result
- `ProjectContext` - Project execution context

### Recipe Types
- `Recipe` - Complete project recipe
- `RecipeModule` - Individual module in a recipe
- `Project` - Project configuration

### Utility Types
- `ParameterDefinition` - Parameter schema definition
- `FeatureDefinition` - Feature definition structure
- `VirtualFileSystem` - VFS interface

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

## Publishing

```bash
# Build and publish
npm run build
npm publish
```

## License

MIT


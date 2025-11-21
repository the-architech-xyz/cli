# Dependency Resolution System Implementation Report

## Executive Summary

This report documents the implementation of the **Dynamic Dependency Resolution System** and **Hybrid Defaults Architecture** as specified in the CTO Implementation Plan. The system enables modules to declare abstract capability dependencies (e.g., "database", "auth"), which the CLI resolves to concrete npm packages based on genome choices.

## Part 1: Dependency Resolution System

### 1.1 Type System Updates

**Location**: `types-package/src/v2/index.ts`

**Changes**:
- Added `DependencyCapability` type with 11 capability types:
  - `auth`, `database`, `ui`, `email`, `storage`, `data-fetching`, `state`, `api`, `jobs`, `monitoring`, `payment`
- Added `ModuleDependencies` interface with:
  - `required?: DependencyCapability[]` - Fails if not in genome
  - `optional?: DependencyCapability[]` - Warns if missing
  - `direct?: string[]` - Always installed (no resolution)
  - `framework?: { [framework: string]: string[] }` - Framework-specific packages
  - `dev?: string[]` - Dev dependencies
- Added `ResolvedDependency` interface
- Added `PackageDependencies` interface
- Updated `RecipeModule` to include `dependencies?: ModuleDependencies`
- Updated `LockFile` to include `dependencies?: Record<string, PackageDependencies>`

### 1.2 Capability Resolver Service

**Location**: `Architech/src/core/services/dependency/capability-resolver.ts`

**Purpose**: Maps abstract capability + provider → concrete npm package

**Capability Mappings**:
```typescript
'auth': {
  'better-auth': 'better-auth',
  'supabase': '@supabase/supabase-js',
  'clerk': '@clerk/nextjs'
},
'database': {
  'drizzle': 'drizzle-orm',
  'prisma': 'prisma',
  'typeorm': 'typeorm',
  'sequelize': 'sequelize'
},
// ... 9 more capabilities
```

**Key Methods**:
- `resolve(capability, genome)`: Resolves capability to npm package based on genome provider
- `getAvailableProviders(capability)`: Returns available providers for a capability

### 1.3 Dependency Resolver Service

**Location**: `Architech/src/core/services/dependency/dependency-resolver-service.ts`

**Purpose**: Resolves all module dependencies for the entire project

**Key Methods**:
- `resolveDependencies(modules, genome, marketplaceAdapters)`: Resolves all dependencies
- `validateDependencies(modules, genome, marketplaceAdapters)`: Early validation (fail fast)
- `loadModuleDependencies(module, marketplaceAdapters)`: Loads from metadata
- `resolveModuleDependencies(moduleDeps, genome)`: Resolves abstract to concrete

**Flow**:
1. Load module dependencies from metadata (module.config or adapter.json/connector.json/feature.json)
2. Resolve required capabilities → concrete packages
3. Resolve optional capabilities → concrete packages (warn if missing)
4. Add direct dependencies (no resolution)
5. Add framework-specific dependencies (if app uses framework)
6. Merge into target package/app dependency map

### 1.4 Integration Points

#### CompositionEngine
- **Location**: `Architech/src/core/services/composition/composition-engine.ts`
- **Changes**:
  - Added dependency resolution after module expansion
  - Early validation (fail fast) before execution
  - Stores dependency map in lock file

#### PackageJsonGenerator
- **Location**: `Architech/src/core/services/project/package-json-generator.ts`
- **Changes**:
  - Added `resolvedDependencies?: PackageDependencies` parameter
  - Merges static (recipe book) + dynamic (resolved) dependencies

#### StructureInitializationLayer
- **Location**: `Architech/src/core/services/project/structure-initialization-layer.ts`
- **Changes**:
  - Accepts `dependencyMap?: Map<string, PackageDependencies>` parameter
  - Passes resolved dependencies to PackageJsonGenerator when creating package.json

#### OrchestratorAgent
- **Location**: `Architech/src/agents/orchestrator-agent.ts`
- **Changes**:
  - Extracts dependency map from lock file metadata
  - Passes to StructureInitializationLayer

#### V2GenomeHandler
- **Location**: `Architech/src/core/services/composition/v2-genome-handler.ts`
- **Changes**:
  - Passes dependencies from lock file to ResolvedGenome metadata

## Part 2: Hybrid Defaults Architecture

### 2.1 CLI Defaults Generator

**Location**: `Architech/src/core/services/project/cli-defaults-generator.ts`

**Purpose**: Generates universal defaults that work for any project

**Generated Files**:
1. **`.gitignore`** - Universal ignore patterns (node_modules, .env, build outputs, etc.)
2. **`tsconfig.json`** - Universal TypeScript base config (strict mode, ES2022, etc.)
3. **`package.json` scripts** - Basic scripts (dev, build, lint) for monorepo or single-app

**Key Methods**:
- `generateDefaults(projectRoot, projectName, structure)`: Main entry point
- `generateGitignore(projectRoot)`: Creates .gitignore
- `generateRootTsconfig(projectRoot, structure)`: Creates tsconfig.json
- `generatePackageJsonScripts(projectRoot, structure)`: Updates package.json scripts

**Integration**: Called after structure initialization in `StructureInitializationLayer`

### 2.2 Marketplace Config Deprecation

**Location**: `Architech/src/marketplace.config.ts`

**Changes**:
- Marked `MARKETPLACE_DEFAULTS` as deprecated
- Golden-stack no longer auto-included by CLI
- Users must explicitly add to genome if desired

### 2.3 Composition Engine Changes

**Location**: `Architech/src/core/services/composition/composition-engine.ts`

**Changes**:
- Removed `autoIncludeDefaultModules()` method
- Removed auto-inclusion of `core/golden-stack`

## Part 3: Module Metadata Updates

### 3.1 Feature Modules Updated

#### Tech-Stack Features
All tech-stack features now use the new `dependencies` format:

**Updated Files**:
- `features/auth/tech-stack/feature.json`
- `features/payments/tech-stack/feature.json`
- `features/emailing/tech-stack/feature.json`
- `features/projects/tech-stack/feature.json`
- `features/waitlist/tech-stack/feature.json`
- `features/teams-management/tech-stack/feature.json`
- `features/ai-chat/tech-stack/feature.json`

**Dependencies Pattern**:
```json
{
  "dependencies": {
    "direct": [
      "zod",
      "@tanstack/react-query",
      "zustand",
      "immer",
      "sonner"
    ]
  }
}
```

#### Frontend Features

**Updated Files**:
- `features/auth/frontend/feature.json`
  - `required: ["auth"]`
  - `direct: ["better-auth", "react-hook-form", "@hookform/resolvers", "lucide-react", "class-variance-authority", "clsx", "tailwind-merge"]`

- `features/payments/frontend/feature.json`
  - `required: ["database", "auth"]`
  - `direct: ["@stripe/stripe-js", "@stripe/react-stripe-js", "react-hook-form", "@hookform/resolvers", "lucide-react", "date-fns", "framer-motion"]`

- `features/ai-chat/frontend/feature.json`
  - `direct: ["ai", "@ai-sdk/react", "@ai-sdk/openai", "@ai-sdk/anthropic", "react-markdown", "remark-gfm", "rehype-highlight", "rehype-raw", "react-syntax-highlighter", "lucide-react", "class-variance-authority", "clsx", "tailwind-merge"]`

#### Feature Overrides

**Updated Files**:
- `features/_shared/tech-stack/overrides/trpc/adapter.json`
  - `direct: ["@trpc/client", "@trpc/server", "@trpc/react-query"]`

### 3.2 Connector Modules Updated

**Updated Files**:
- `connectors/auth/better-auth-nextjs/connector.json`
  - `required: ["auth", "database"]`
  - `framework.nextjs: ["next", "react", "react-dom"]`

- `connectors/ui/tamagui-nextjs/connector.json`
  - `required: ["ui"]`
  - `framework.nextjs: ["next", "react", "react-dom"]`

- `connectors/infrastructure/tanstack-query-nextjs/connector.json`
  - `required: ["data-fetching"]`
  - `framework.nextjs: ["next", "react", "react-dom", "@tanstack/react-query"]`

- `connectors/infrastructure/zustand-nextjs/connector.json`
  - `required: ["state"]`
  - `framework.nextjs: ["next", "react", "react-dom", "zustand"]`

- `connectors/email/resend-nextjs/connector.json`
  - `required: ["email"]`
  - `framework.nextjs: ["next", "react", "react-dom"]`

### 3.3 Adapter Modules

**Updated Files**:
- `adapters/auth/better-auth/adapter.json`
  - `required: ["database"]`
  - `direct: ["better-auth"]`

## Part 4: New Flow Documentation

### 4.1 Default Technologies Installer Flow (CLI Defaults)

```
┌─────────────────────────────────────────┐
│ StructureInitializationLayer            │
│ initializeMonorepo() /                  │
│ initializeSingleApp()                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ CliDefaultsGenerator.generateDefaults() │
│                                         │
│ 1. generateGitignore()                  │
│    → Creates .gitignore                 │
│                                         │
│ 2. generateRootTsconfig()              │
│    → Creates tsconfig.json             │
│                                         │
│ 3. generatePackageJsonScripts()        │
│    → Updates package.json scripts       │
└─────────────────────────────────────────┘
```

**Key Points**:
- CLI generates **universal defaults** that work for any project
- No marketplace dependency
- Opinionated defaults (like golden-stack) are optional marketplace modules

### 4.2 Dynamic Package Creator Flow (Dependency Resolution)

```
┌─────────────────────────────────────────┐
│ CompositionEngine.resolve()             │
│                                         │
│ 1. Expand packages → modules            │
│ 2. Enrich with prerequisites            │
│ 3. Build dependency graph               │
│ 4. Topological sort                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ DependencyResolverService                │
│                                         │
│ 1. validateDependencies()               │
│    → Early validation (fail fast)       │
│                                         │
│ 2. resolveDependencies()               │
│    For each module:                     │
│    a. Load dependencies from metadata   │
│    b. Resolve required capabilities     │
│       → CapabilityResolver.resolve()    │
│    c. Resolve optional capabilities     │
│    d. Add direct dependencies           │
│    e. Add framework-specific deps       │
│    f. Merge into target package/app     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Lock File Generation                    │
│                                         │
│ Store dependency map in lock file        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ StructureInitializationLayer            │
│                                         │
│ For each package:                       │
│ 1. Get resolved dependencies            │
│    → dependencyMap.get(`packages/${name}`)│
│                                         │
│ 2. Generate package.json                │
│    → PackageJsonGenerator.generatePackageJson(
│        packageName,
│        packageStructure,
│        projectName,
│        genome,
│        packagePath,
│        resolvedDependencies  ← NEW
│      )                                  │
│                                         │
│ 3. Merge dependencies:                  │
│    - Static (recipe book)               │
│    - Dynamic (resolved capabilities)    │
│    - Workspace (workspace:*)            │
└─────────────────────────────────────────┘
```

**Key Points**:
- Modules declare **abstract capabilities** (e.g., "database")
- CLI resolves to **concrete packages** (e.g., "drizzle-orm") based on genome
- Early validation ensures all required capabilities exist
- Dependencies are merged: static (recipe book) + dynamic (resolved)

### 4.3 Example: Payment Module Needs Database

**Before (Hardcoded)**:
```typescript
// Payment module blueprint
{
  type: INSTALL_PACKAGES,
  packages: ['drizzle-orm']  // ❌ Hardcoded
}
```

**After (Dynamic)**:
```json
// Payment module feature.json
{
  "dependencies": {
    "required": ["database"],  // ✅ Abstract capability
    "direct": ["stripe"]
  }
}
```

**Resolution Flow**:
1. Module declares: `required: ["database"]`
2. Genome has: `packages: { database: { provider: "drizzle" } }`
3. CLI resolves: `CapabilityResolver.resolve("database", genome)` → `"drizzle-orm"`
4. Generated package.json: `{ "dependencies": { "stripe": "latest", "drizzle-orm": "latest" } }`

## Part 5: Benefits

### 5.1 For Module Authors
- ✅ No hardcoded dependencies in blueprints
- ✅ Modules work with any provider (Drizzle, Prisma, etc.)
- ✅ Framework-specific dependencies handled automatically

### 5.2 For Users
- ✅ Consistent dependency management
- ✅ Early validation (fail fast)
- ✅ No dependency conflicts
- ✅ Universal defaults (no marketplace required)

### 5.3 For System
- ✅ Type-safe dependency resolution
- ✅ Single source of truth (genome)
- ✅ Reproducible builds (lock file)
- ✅ Clear separation: CLI (universal) vs Marketplace (opinionated)

## Part 6: Testing Strategy

### 6.1 Unit Tests
- `CapabilityResolver`: Test capability → package resolution
- `DependencyResolverService`: Test dependency resolution and validation

### 6.2 Integration Tests
- End-to-end generation with dependency resolution
- Verify package.json has correct dependencies
- Verify early validation catches missing capabilities

### 6.3 Manual Testing
- Generate project with payment + database
- Verify payment package.json has `drizzle-orm` (if database=drizzle)
- Verify payment package.json has `stripe` (direct dependency)

## Part 7: Files Changed Summary

### Created Files
1. `Architech/src/core/services/dependency/capability-resolver.ts`
2. `Architech/src/core/services/dependency/dependency-resolver-service.ts`
3. `Architech/src/core/services/dependency/index.ts`
4. `Architech/src/core/services/project/cli-defaults-generator.ts`

### Updated Files
1. `types-package/src/v2/index.ts` - Added dependency types
2. `Architech/src/core/services/composition/composition-engine.ts` - Integrated dependency resolver
3. `Architech/src/core/services/composition/v2-genome-handler.ts` - Pass dependencies to metadata
4. `Architech/src/core/services/project/package-json-generator.ts` - Accept resolved dependencies
5. `Architech/src/core/services/project/structure-initialization-layer.ts` - Use resolved dependencies
6. `Architech/src/agents/orchestrator-agent.ts` - Extract and pass dependencies
7. `Architech/src/marketplace.config.ts` - Deprecated auto-include

### Updated Module Metadata
- 7 tech-stack feature.json files
- 3 frontend feature.json files
- 1 feature override adapter.json
- 5 connector.json files
- 1 adapter.json file

## Part 8: Next Steps

1. **Update Remaining Modules**: Continue updating feature.json files for remaining features
2. **Test End-to-End**: Generate a project and verify dependencies are correct
3. **Documentation**: Update user-facing documentation
4. **Migration Guide**: Create guide for module authors migrating to new system

---

**Implementation Date**: 2024
**Status**: ✅ Complete - Ready for Testing




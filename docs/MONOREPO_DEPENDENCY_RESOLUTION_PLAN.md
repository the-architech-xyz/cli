# Monorepo Dependency Resolution & Hybrid Defaults Implementation Plan

**Date:** November 19, 2024  
**Status:** Planning  
**Priority:** High

---

## Executive Summary

This plan addresses two critical issues:

1. **Monorepo Dependency Resolution**: Apps/packages need dependencies auto-generated, but we can't know concrete dependencies until genome resolution (e.g., "auth" → "better-auth" vs "supabase").

2. **Hybrid Defaults Approach**: Implement proper separation between CLI defaults (universal) and marketplace modules (opinionated).

---

## Part 1: Type-Safe Dependency Resolution System

### 1.1 Problem Statement

**Current Issue:**
- Modules hard-code dependencies in blueprints (e.g., `INSTALL_PACKAGES: ['better-auth']`)
- Can't know which auth provider until genome is resolved
- Apps/packages missing dependencies (e.g., `apps/web/package.json` empty)
- No validation if required dependencies aren't in genome

**Root Cause:**
- Dependencies are specified at blueprint execution time (too late)
- No abstraction layer between "capability dependency" and "concrete package"

### 1.2 Proposed Solution

**Type-Safe Dependency Declarations:**

1. **Enhance Module Metadata** with abstract dependency declarations
2. **CLI Transformation Layer** resolves abstract → concrete based on genome
3. **Early Validation** fails if required dependencies missing
4. **Auto-Generation** of package.json dependencies for apps/packages

### 1.3 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Module Metadata (adapter.json / manifest.json)               │
│                                                              │
│ dependencies: {                                             │
│   required: ['auth', 'database'],  // Abstract capabilities │
│   optional: ['ui', 'email']                                 │
│ }                                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ CLI Dependency Resolver                                     │
│                                                              │
│ 1. Load all module dependencies                             │
│ 2. Map abstract → concrete using genome                     │
│    - "auth" → "better-auth" (from genome.packages.auth)     │
│    - "database" → "drizzle" (from genome.packages.database)│
│ 3. Validate all required dependencies exist                │
│ 4. Generate dependency map per package/app                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ PackageJsonGenerator                                         │
│                                                              │
│ - Adds dependencies to package.json                         │
│ - Handles workspace:* protocol                             │
│ - Framework-specific dependencies (Next.js, React, etc.)   │
└──────────────────────────────────────────────────────────────┘
```

### 1.4 Type Definitions

**New Types (types-package/src/v2/index.ts):**

```typescript
/**
 * Abstract dependency capability
 * CLI will resolve to concrete package based on genome
 */
export type DependencyCapability = 
  | 'auth'           // Resolves to: better-auth, supabase, clerk, etc.
  | 'database'       // Resolves to: drizzle, prisma, typeorm, etc.
  | 'ui'             // Resolves to: tamagui, shadcn, etc.
  | 'email'          // Resolves to: resend, sendgrid, etc.
  | 'storage'        // Resolves to: s3, cloudflare-r2, etc.
  | 'data-fetching'  // Resolves to: tanstack-query, trpc, etc.
  | 'state'          // Resolves to: zustand, redux, etc.
  | 'testing'        // Resolves to: vitest, jest, etc.
  | 'framework';     // Resolves to: next, react, expo, etc.

/**
 * Module dependency declaration
 */
export interface ModuleDependencies {
  /**
   * Required capabilities (must be in genome)
   * CLI will fail if missing
   */
  required?: DependencyCapability[];
  
  /**
   * Optional capabilities (warn if missing, don't fail)
   */
  optional?: DependencyCapability[];
  
  /**
   * Direct npm packages (always installed, no resolution needed)
   * Use sparingly - prefer capabilities when possible
   */
  direct?: string[];
  
  /**
   * Framework-specific dependencies
   * Only installed if app uses that framework
   */
  framework?: {
    nextjs?: string[];
    expo?: string[];
    hono?: string[];
    [framework: string]: string[] | undefined;
  };
  
  /**
   * Dev dependencies
   */
  dev?: string[];
}

/**
 * Enhanced RecipeModule with dependencies
 */
export interface RecipeModule {
  // ... existing fields ...
  
  /**
   * NEW: Dependency declarations
   */
  dependencies?: ModuleDependencies;
}
```

**Enhanced Adapter Config (adapter.json):**

```json
{
  "id": "adapters/auth/better-auth",
  "dependencies": {
    "required": ["database"],
    "optional": ["email"],
    "direct": ["better-auth"],
    "dev": ["@types/node"]
  }
}
```

### 1.5 Implementation Steps

#### Phase 1: Type System (2 hours)

**Files to Modify:**
- `types-package/src/v2/index.ts` - Add `DependencyCapability`, `ModuleDependencies`
- `types-package/src/marketplace-manifest.ts` - Add dependencies to `MarketplaceManifestModule`

**Tasks:**
1. Define `DependencyCapability` enum/union type
2. Define `ModuleDependencies` interface
3. Add `dependencies` to `RecipeModule`
4. Add `dependencies` to `MarketplaceManifestModule`
5. Export types from `types-package/src/index.ts`

#### Phase 2: Dependency Resolver Service (4 hours)

**New File:** `src/core/services/dependency/dependency-resolver-service.ts`

**Responsibilities:**
1. Load dependencies from all modules
2. Map abstract capabilities → concrete packages using genome
3. Validate required dependencies exist
4. Generate dependency map per package/app

**Key Methods:**
```typescript
class DependencyResolverService {
  /**
   * Resolve abstract dependencies to concrete packages
   */
  resolveDependencies(
    modules: Module[],
    genome: V2Genome
  ): Map<string, ResolvedDependencies>;
  
  /**
   * Validate all required dependencies are in genome
   */
  validateDependencies(
    modules: Module[],
    genome: V2Genome
  ): ValidationResult;
  
  /**
   * Get dependencies for a specific package/app
   */
  getDependenciesForTarget(
    targetPackage: string,
    modules: Module[],
    genome: V2Genome
  ): PackageDependencies;
}
```

**Dependency Mapping Logic:**
```typescript
// Example mapping
const capabilityToPackage: Record<DependencyCapability, (genome: V2Genome) => string | null> = {
  'auth': (genome) => {
    const authPackage = genome.packages.auth;
    if (!authPackage) return null;
    // Map provider to package name
    if (authPackage.provider === 'better-auth') return 'better-auth';
    if (authPackage.provider === 'supabase') return '@supabase/supabase-js';
    // ...
  },
  'database': (genome) => {
    const dbPackage = genome.packages.database;
    if (!dbPackage) return null;
    if (dbPackage.provider === 'drizzle') return 'drizzle-orm';
    // ...
  },
  // ...
};
```

#### Phase 3: Update Module Metadata (3 hours)

**Files to Update:**
- `marketplace/adapters/auth/better-auth/adapter.json` - Add dependencies
- `marketplace/adapters/database/drizzle/adapter.json` - Add dependencies
- `marketplace/connectors/auth/better-auth-nextjs/adapter.json` - Add dependencies
- `marketplace/connectors/ui/tamagui-nextjs/adapter.json` - Add dependencies
- All other adapters/connectors that need dependencies

**Example:**
```json
{
  "id": "connectors/auth/better-auth-nextjs",
  "dependencies": {
    "required": ["auth"],
    "framework": {
      "nextjs": ["next", "react", "react-dom"]
    }
  }
}
```

#### Phase 4: PackageJsonGenerator Enhancement (3 hours)

**File:** `src/core/services/project/package-json-generator.ts`

**Enhancements:**
1. Accept `ResolvedDependencies` from `DependencyResolverService`
2. Add dependencies to package.json
3. Handle framework-specific dependencies
4. Add workspace:* dependencies for internal packages

**Key Changes:**
```typescript
static generatePackageJson(
  packageName: string,
  packageStructure: PackageStructure,
  projectName: string,
  genome?: Genome,
  packagePath?: string,
  dependencies?: ResolvedDependencies  // NEW
): PackageJson {
  // ... existing logic ...
  
  // Add resolved dependencies
  if (dependencies) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies.runtime
    };
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...dependencies.dev
    };
  }
  
  // ...
}
```

#### Phase 5: Integration (2 hours)

**Files to Modify:**
- `src/core/services/composition/composition-engine.ts` - Call dependency resolver
- `src/core/services/project/structure-initialization-layer.ts` - Use resolved dependencies
- `src/agents/orchestrator-agent.ts` - Pass dependencies to PackageJsonGenerator

**Flow:**
1. After module resolution, call `DependencyResolverService.resolveDependencies()`
2. Validate dependencies with `DependencyResolverService.validateDependencies()`
3. Pass resolved dependencies to `PackageJsonGenerator` when creating package.json files
4. Generate app package.json with framework + workspace dependencies

#### Phase 6: Early Validation (1 hour)

**Location:** `src/core/services/composition/composition-engine.ts`

**Add validation step:**
```typescript
// After module resolution, before execution
const validation = dependencyResolver.validateDependencies(enrichedModules, genome);
if (!validation.valid) {
  throw new Error(`Missing required dependencies: ${validation.missing.join(', ')}`);
}
```

---

## Part 2: Hybrid Defaults Implementation

### 2.1 Problem Statement

**Current Issue:**
- Golden-stack auto-included by CLI (wrong approach)
- No clear separation between CLI defaults and marketplace modules
- Missing universal defaults (.gitignore, root tsconfig.json)

### 2.2 Proposed Solution

**Hybrid Approach:**

1. **CLI Defaults** (always generated, no marketplace needed):
   - `.gitignore` - Universal
   - Root `tsconfig.json` - Base TypeScript config
   - Basic `package.json` scripts - Universal (dev, build, lint)

2. **Marketplace Modules** (optional, opinionated):
   - `core/golden-stack` - ESLint, Prettier, Zustand, Vitest, Zod
   - Framework-specific configs
   - Advanced tooling

### 2.3 Implementation Steps

#### Phase 1: Remove Auto-Include Code (30 minutes)

**File:** `src/core/services/composition/composition-engine.ts`

**Remove:**
- `autoIncludeDefaultModules()` method
- Call to `autoIncludeDefaultModules()` in `resolve()`
- Import of `MARKETPLACE_DEFAULTS`

#### Phase 2: CLI Defaults Generator (2 hours)

**New File:** `src/core/services/project/cli-defaults-generator.ts`

**Responsibilities:**
1. Generate `.gitignore`
2. Generate root `tsconfig.json`
3. Generate basic `package.json` scripts

**Key Methods:**
```typescript
class CliDefaultsGenerator {
  /**
   * Generate all CLI defaults
   */
  static async generateDefaults(
    projectRoot: string,
    projectName: string,
    structure: 'monorepo' | 'single-app'
  ): Promise<void> {
    await this.generateGitignore(projectRoot);
    await this.generateRootTsconfig(projectRoot, structure);
    await this.generatePackageJsonScripts(projectRoot, structure);
  }
  
  private static async generateGitignore(projectRoot: string): Promise<void> {
    // Generate universal .gitignore
  }
  
  private static async generateRootTsconfig(projectRoot: string, structure: string): Promise<void> {
    // Generate base tsconfig.json
  }
  
  private static async generatePackageJsonScripts(projectRoot: string, structure: string): Promise<void> {
    // Add basic scripts (dev, build, lint)
  }
}
```

#### Phase 3: Integration (1 hour)

**File:** `src/core/services/project/structure-initialization-layer.ts`

**Add call:**
```typescript
// After project structure is created
await CliDefaultsGenerator.generateDefaults(
  projectRoot,
  genome.project.name,
  genome.project.structure
);
```

#### Phase 4: Update Documentation (30 minutes)

**File:** `docs/MODULE_ISSUE_MAPPING_REPORT.md`

**Update:**
- Remove auto-include section
- Add CLI defaults section
- Document hybrid approach

---

## Part 3: Golden-Stack Marketplace Module

### 3.1 Current State

Golden-stack is a marketplace module that should be:
- **Optional** - User can choose to include it
- **Marketplace-based** - Not auto-included by CLI
- **Opinionated** - Provides ESLint, Prettier, Zustand, Vitest, Zod

### 3.2 No Changes Needed

Golden-stack is already correctly implemented as a marketplace module. No changes required.

**Optional Enhancement (Future):**
- Make Vitest optional (only install if testing is needed)
- But for now, keep it opinionated (simpler, best practices)

---

## Implementation Timeline

### Week 1: Dependency Resolution System

**Day 1-2: Type System & Resolver Service**
- Phase 1: Type System (2h)
- Phase 2: Dependency Resolver Service (4h)

**Day 3-4: Integration**
- Phase 3: Update Module Metadata (3h)
- Phase 4: PackageJsonGenerator Enhancement (3h)

**Day 5: Validation & Testing**
- Phase 5: Integration (2h)
- Phase 6: Early Validation (1h)
- Testing & bug fixes (4h)

### Week 2: Hybrid Defaults

**Day 1: CLI Defaults**
- Phase 1: Remove Auto-Include (30m)
- Phase 2: CLI Defaults Generator (2h)
- Phase 3: Integration (1h)

**Day 2: Testing & Documentation**
- Phase 4: Update Documentation (30m)
- Testing & bug fixes (4h)

---

## Success Criteria

### Dependency Resolution

✅ **Type Safety:**
- All dependencies declared in metadata
- TypeScript enforces correct capability names
- No hard-coded dependencies in blueprints

✅ **Correct Resolution:**
- Abstract dependencies resolve to concrete packages
- Framework-specific dependencies only added when needed
- Workspace dependencies correctly generated

✅ **Validation:**
- Early failure if required dependencies missing
- Clear error messages

✅ **Auto-Generation:**
- App package.json has all required dependencies
- Package package.json has workspace dependencies
- Framework dependencies correctly added

### Hybrid Defaults

✅ **CLI Defaults:**
- `.gitignore` generated for all projects
- Root `tsconfig.json` generated
- Basic scripts in root `package.json`

✅ **Marketplace Modules:**
- Golden-stack remains optional
- No auto-inclusion by CLI
- User explicitly includes if desired

---

## Risk Assessment

### Low Risk
- Type system changes (additive)
- CLI defaults (new feature, doesn't break existing)

### Medium Risk
- Dependency resolver (complex logic, needs thorough testing)
- PackageJsonGenerator changes (affects all package.json generation)

### Mitigation
- Comprehensive unit tests for dependency resolver
- Integration tests for package.json generation
- Backward compatibility checks

---

## Next Steps

1. **Review & Approve Plan**
2. **Start Phase 1: Type System**
3. **Iterate based on feedback**

---

**Plan Created:** November 19, 2024  
**Estimated Effort:** 2 weeks  
**Priority:** High




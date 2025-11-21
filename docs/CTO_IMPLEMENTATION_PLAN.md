# CTO Implementation Plan - Concrete File-by-File Guide

**Date:** November 19, 2024  
**Status:** Ready for Implementation  
**Based on:** CTO's theoretical plan + actual codebase structure

---

## Executive Summary

This document provides **exact file paths, code changes, and implementation steps** based on the CTO's plan, mapped to our actual codebase structure.

---

## PART 1: DEPENDENCY RESOLUTION SYSTEM

### Step 1: Update Types Package

**File:** `types-package/src/v2/index.ts`

**Location in file:** After `RecipeModule` interface (around line 105)

**Changes:**

```typescript
/**
 * Abstract capability dependencies
 * CLI resolves these to concrete npm packages based on genome
 */
export type DependencyCapability = 
  | 'auth'           // → better-auth, supabase, clerk
  | 'database'       // → drizzle-orm, prisma, typeorm
  | 'ui'             // → tamagui, shadcn
  | 'email'          // → resend, sendgrid
  | 'storage'        // → @aws-sdk/client-s3, etc.
  | 'data-fetching'  // → @tanstack/react-query, swr
  | 'state'          // → zustand, redux
  | 'api'            // → trpc, graphql
  | 'jobs'           // → inngest, bullmq
  | 'monitoring'     // → sentry, posthog
  | 'payment';       // → stripe, lemon-squeezy

/**
 * Module dependency declaration
 */
export interface ModuleDependencies {
  /**
   * Required capabilities - generation fails if not in genome
   */
  required?: DependencyCapability[];
  
  /**
   * Optional capabilities - warns if missing, doesn't fail
   */
  optional?: DependencyCapability[];
  
  /**
   * Direct npm packages - always installed (no resolution)
   */
  direct?: string[];
  
  /**
   * Framework-specific packages - only if app uses framework
   */
  framework?: {
    [framework: string]: string[];
  };
  
  /**
   * Dev dependencies
   */
  dev?: string[];
}

/**
 * Resolved dependency (after CLI resolution)
 */
export interface ResolvedDependency {
  capability: DependencyCapability;
  provider: string;              // From genome (e.g., 'drizzle')
  npmPackage: string;            // Resolved package (e.g., 'drizzle-orm')
  version: string;               // Version to install
}

/**
 * Package dependencies after resolution
 */
export interface PackageDependencies {
  runtime: Record<string, string>;    // dependencies
  dev: Record<string, string>;        // devDependencies
  workspace: Record<string, string>;  // workspace:* deps
}
```

**Update RecipeModule interface:**

```typescript
export interface RecipeModule {
  id: string;
  version: string;
  targetPackage?: string | null;
  targetApps?: string[];
  requiredFramework?: string;
  requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[];
  
  // NEW: Add dependencies field
  dependencies?: ModuleDependencies;
}
```

**Export from:** `types-package/src/index.ts`

Add:
```typescript
export type {
  DependencyCapability,
  ModuleDependencies,
  ResolvedDependency,
  PackageDependencies
} from './v2/index.js';
```

**Rebuild command:**
```bash
cd types-package && npm run build
```

---

### Step 2: Create Capability Resolver

**New File:** `Architech/src/core/services/dependency/capability-resolver.ts`

**Full Implementation:**

```typescript
/**
 * Capability Resolver
 * 
 * Maps abstract capability dependencies to concrete npm packages
 * based on genome provider choices.
 */

import type {
  DependencyCapability,
  ResolvedDependency,
  V2Genome
} from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';

export class CapabilityResolver {
  /**
   * Maps capability + provider → npm package name
   */
  private static readonly CAPABILITY_MAP: Record<
    DependencyCapability,
    Record<string, string>  // provider → npm package
  > = {
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
    'ui': {
      'tamagui': 'tamagui',
      'shadcn-ui': 'class-variance-authority',  // shadcn is not a package
      'tailwind': 'tailwindcss'
    },
    'email': {
      'resend': 'resend',
      'sendgrid': '@sendgrid/mail'
    },
    'storage': {
      's3-compatible': '@aws-sdk/client-s3',
      'cloudflare-r2': '@cloudflare/workers-types'
    },
    'data-fetching': {
      'tanstack-query': '@tanstack/react-query',
      'trpc': '@trpc/server'
    },
    'state': {
      'zustand': 'zustand',
      'redux': '@reduxjs/toolkit'
    },
    'api': {
      'trpc': '@trpc/server',
      'graphql': 'graphql'
    },
    'jobs': {
      'inngest': 'inngest',
      'bullmq': 'bullmq'
    },
    'monitoring': {
      'sentry': '@sentry/nextjs',
      'posthog': 'posthog-js'
    },
    'payment': {
      'stripe': 'stripe',
      'lemon-squeezy': '@lemonsqueezy/lemonsqueezy.js'
    }
  };

  /**
   * Resolve capability to npm package based on genome
   */
  static resolve(
    capability: DependencyCapability,
    genome: V2Genome
  ): ResolvedDependency | null {
    // Find package in genome for this capability
    const packageConfig = genome.packages[capability];
    if (!packageConfig) {
      return null;  // Capability not in genome
    }

    const provider = packageConfig.provider || 'default';
    const npmPackage = this.CAPABILITY_MAP[capability]?.[provider];

    if (!npmPackage) {
      throw new Error(
        `Unknown provider '${provider}' for capability '${capability}'. ` +
        `Available providers: ${Object.keys(this.CAPABILITY_MAP[capability] || {}).join(', ')}`
      );
    }

    return {
      capability,
      provider,
      npmPackage,
      version: 'latest'  // TODO: Get from recipe book or package.json
    };
  }

  /**
   * Get all available providers for a capability
   */
  static getAvailableProviders(capability: DependencyCapability): string[] {
    return Object.keys(this.CAPABILITY_MAP[capability] || {});
  }
}
```

**Export from:** `Architech/src/core/services/dependency/index.ts` (create if doesn't exist)

```typescript
export { CapabilityResolver } from './capability-resolver.js';
```

---

### Step 3: Create Dependency Resolver Service

**New File:** `Architech/src/core/services/dependency/dependency-resolver-service.ts`

**Full Implementation:**

```typescript
/**
 * Dependency Resolver Service
 * 
 * Resolves all module dependencies for the entire project.
 * Maps abstract capabilities to concrete npm packages based on genome.
 */

import type {
  Module,
  ModuleDependencies,
  PackageDependencies,
  ResolvedDependency,
  V2Genome
} from '@thearchitech.xyz/types';
import { CapabilityResolver } from './capability-resolver.js';
import { Logger } from '../infrastructure/logging/index.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';

export class DependencyResolverService {
  /**
   * Resolve dependencies for all modules in execution plan
   * Returns map of package/app → dependencies to install
   */
  static async resolveDependencies(
    modules: Module[],
    genome: V2Genome,
    marketplaceAdapters: Map<string, any>
  ): Promise<Map<string, PackageDependencies>> {
    const dependencyMap = new Map<string, PackageDependencies>();

    for (const module of modules) {
      // Load module dependencies from metadata
      const moduleDeps = await this.loadModuleDependencies(
        module,
        marketplaceAdapters
      );
      if (!moduleDeps) continue;

      // Resolve abstract capabilities to concrete packages
      const resolved = this.resolveModuleDependencies(moduleDeps, genome);

      // Determine target (package or app)
      const target = this.getTargetForModule(module);

      // Merge into target's dependencies
      this.mergeDependencies(dependencyMap, target, resolved);
    }

    return dependencyMap;
  }

  /**
   * Load module dependencies from metadata
   */
  private static async loadModuleDependencies(
    module: Module,
    marketplaceAdapters: Map<string, any>
  ): Promise<ModuleDependencies | null> {
    // Try to get from module.config first (if available)
    if (module.config?.dependencies) {
      return module.config.dependencies as ModuleDependencies;
    }

    // Load from adapter.json/connector.json/feature.json via marketplace adapter
    const adapter = marketplaceAdapters.get(module.source?.marketplace || '');
    if (!adapter) {
      Logger.warn(`Adapter not found for module ${module.id}, skipping dependencies`);
      return null;
    }

    try {
      const manifest = await adapter.loadManifest();
      
      // Find module in manifest
      let moduleMetadata: any = null;
      if (manifest.modules) {
        const allModules = Array.isArray(manifest.modules)
          ? manifest.modules
          : [
              ...(Array.isArray((manifest.modules as any).adapters) ? (manifest.modules as any).adapters : []),
              ...(Array.isArray((manifest.modules as any).connectors) ? (manifest.modules as any).connectors : []),
              ...(Array.isArray((manifest.modules as any).features) ? (manifest.modules as any).features : [])
            ];
        moduleMetadata = allModules.find((m: any) => m.id === module.id);
      }

      if (moduleMetadata?.dependencies) {
        return moduleMetadata.dependencies as ModuleDependencies;
      }
    } catch (error) {
      Logger.warn(`Failed to load dependencies for module ${module.id}: ${error}`);
    }

    return null;
  }

  /**
   * Resolve module dependencies using genome
   */
  private static resolveModuleDependencies(
    moduleDeps: ModuleDependencies,
    genome: V2Genome
  ): PackageDependencies {
    const resolved: PackageDependencies = {
      runtime: {},
      dev: {},
      workspace: {}
    };

    // Resolve required capabilities
    for (const capability of moduleDeps.required || []) {
      const dep = CapabilityResolver.resolve(capability, genome);
      if (!dep) {
        throw new Error(
          `Required capability '${capability}' not found in genome. ` +
          `Module requires this capability but it's not declared in genome.packages.`
        );
      }
      resolved.runtime[dep.npmPackage] = dep.version;
    }

    // Resolve optional capabilities (warn if missing)
    for (const capability of moduleDeps.optional || []) {
      const dep = CapabilityResolver.resolve(capability, genome);
      if (!dep) {
        Logger.warn(`Optional capability '${capability}' not in genome, skipping`);
        continue;
      }
      resolved.runtime[dep.npmPackage] = dep.version;
    }

    // Add direct dependencies (no resolution needed)
    for (const pkg of moduleDeps.direct || []) {
      resolved.runtime[pkg] = 'latest';
    }

    // Add dev dependencies
    for (const pkg of moduleDeps.dev || []) {
      resolved.dev[pkg] = 'latest';
    }

    // Handle framework-specific dependencies
    // TODO: This needs to check which apps use which frameworks
    // For now, we'll add framework deps to all apps (can be refined later)
    if (moduleDeps.framework) {
      for (const [framework, packages] of Object.entries(moduleDeps.framework)) {
        // Check if any app uses this framework
        const usesFramework = Object.values(genome.apps || {}).some(
          (app: any) => app.framework === framework
        );
        if (usesFramework) {
          for (const pkg of packages) {
            resolved.runtime[pkg] = 'latest';
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Determine target package/app for module
   */
  private static getTargetForModule(module: Module): string {
    // Check if module has targetPackage (from recipe book)
    if (module.config?.targetPackage) {
      return `packages/${module.config.targetPackage}`;
    }

    // Check if module targets specific apps
    if (module.config?.targetApps && module.config.targetApps.length > 0) {
      // For now, use first app (can be enhanced to support multiple)
      return `apps/${module.config.targetApps[0]}`;
    }

    // Default to root
    return 'root';
  }

  /**
   * Merge dependencies into target's dependency map
   */
  private static mergeDependencies(
    dependencyMap: Map<string, PackageDependencies>,
    target: string,
    resolved: PackageDependencies
  ): void {
    const existing = dependencyMap.get(target) || {
      runtime: {},
      dev: {},
      workspace: {}
    };

    dependencyMap.set(target, {
      runtime: { ...existing.runtime, ...resolved.runtime },
      dev: { ...existing.dev, ...resolved.dev },
      workspace: { ...existing.workspace, ...resolved.workspace }
    });
  }

  /**
   * Validate all required dependencies exist in genome
   * Call this early (before execution) to fail fast
   */
  static async validateDependencies(
    modules: Module[],
    genome: V2Genome,
    marketplaceAdapters: Map<string, any>
  ): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const module of modules) {
      const moduleDeps = await this.loadModuleDependencies(module, marketplaceAdapters);
      if (!moduleDeps?.required) continue;

      for (const capability of moduleDeps.required) {
        if (!genome.packages[capability]) {
          missing.push(`${module.id} requires '${capability}'`);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}
```

**Export from:** `Architech/src/core/services/dependency/index.ts`

```typescript
export { CapabilityResolver } from './capability-resolver.js';
export { DependencyResolverService } from './dependency-resolver-service.js';
```

---

### Step 4: Update Module Metadata

**Files to Update:** All adapter.json files that need dependencies

**Example 1:** `marketplace/adapters/payment/stripe/adapter.json`

**Add to existing file:**
```json
{
  "id": "adapters/payment/stripe",
  "name": "Stripe Payment Adapter",
  // ... existing fields ...
  
  "dependencies": {
    "required": ["database"],
    "direct": ["stripe"],
    "dev": ["@types/stripe"]
  }
}
```

**Example 2:** `marketplace/connectors/auth/better-auth-nextjs/adapter.json` (or connector.json)

**Add:**
```json
{
  "id": "connectors/auth/better-auth-nextjs",
  // ... existing fields ...
  
  "dependencies": {
    "required": ["auth"],
    "framework": {
      "nextjs": ["next", "react", "react-dom"]
    }
  }
}
```

**Example 3:** `marketplace/adapters/auth/better-auth/adapter.json`

**Add:**
```json
{
  "id": "adapters/auth/better-auth",
  // ... existing fields ...
  
  "dependencies": {
    "required": ["database"],
    "direct": ["better-auth"]
  }
}
```

**Example 4:** `marketplace/connectors/ui/tamagui-nextjs/adapter.json`

**Add:**
```json
{
  "id": "connectors/ui/tamagui-nextjs",
  // ... existing fields ...
  
  "dependencies": {
    "required": ["ui"],
    "framework": {
      "nextjs": ["next", "react", "react-dom"]
    }
  }
}
```

**Priority modules to update:**
1. `marketplace/adapters/payment/stripe/adapter.json`
2. `marketplace/adapters/auth/better-auth/adapter.json`
3. `marketplace/connectors/auth/better-auth-nextjs/adapter.json`
4. `marketplace/connectors/ui/tamagui-nextjs/adapter.json`
5. `marketplace/adapters/database/drizzle/adapter.json`
6. All other adapters/connectors that have dependencies

---

### Step 5: Integrate with PackageJsonGenerator

**File:** `Architech/src/core/services/project/package-json-generator.ts`

**Update method signature (around line 36):**

```typescript
static generatePackageJson(
  packageName: string,
  packageStructure: PackageStructure,
  projectName: string,
  genome?: Genome,
  packagePath?: string,
  resolvedDependencies?: PackageDependencies  // NEW parameter
): PackageJson {
```

**Update return object (around line 46):**

```typescript
return {
  name: `${packageScope}/${packageStructure.name}`,
  version: '1.0.0',
  private: true,
  main: 'src/index.ts',
  types: 'src/index.ts',
  scripts: packageStructure.scripts || {},
  dependencies: {
    ...(packageStructure.dependencies || {}),  // Static from recipe book
    ...(resolvedDependencies?.runtime || {}),   // NEW: Dynamic from modules
    ...(resolvedDependencies?.workspace || {})   // NEW: Workspace deps
  },
  devDependencies: {
    ...(packageStructure.devDependencies || {}),
    ...(resolvedDependencies?.dev || {})         // NEW: Dev deps from modules
  },
  exports: packageStructure.exports || {}
};
```

---

### Step 6: Integration into Composition Engine

**File:** `Architech/src/core/services/composition/composition-engine.ts`

**Add import (at top):**
```typescript
import { DependencyResolverService } from '../dependency/dependency-resolver-service.js';
```

**Update `resolve()` method (after Step 7, around line 116):**

```typescript
async resolve(
  genome: V2Genome,
  projectRoot?: string,
  forceRegenerate: boolean = false
): Promise<LockFile> {
  // ... existing resolution logic (Steps 1-7) ...

  // Step 7: Topological sort for execution order
  const executionPlan = this.dependencyResolver.topologicalSort(graph);

  // NEW: Step 8 - Resolve dependencies
  this.logger.info('🔍 Resolving module dependencies...');

  // Validate dependencies early (fail fast)
  const validation = await DependencyResolverService.validateDependencies(
    enrichedModules,
    genome,
    this.marketplaceAdapters
  );

  if (!validation.valid) {
    throw new Error(
      `Missing required dependencies:\n${validation.missing.join('\n')}\n\n` +
      `Please add the missing packages to your genome.packages configuration.`
    );
  }

  // Resolve dependencies for all modules
  const dependencyMap = await DependencyResolverService.resolveDependencies(
    enrichedModules,
    genome,
    this.marketplaceAdapters
  );

  this.logger.info('✅ Dependencies resolved', {
    targetsWithDeps: dependencyMap.size
  });

  // Step 8: Generate lock file (renumbered from Step 8)
  const lockFile = await this.generateLockFile(
    genome,
    enrichedModules,
    executionPlan,
    recipeBooks,
    dependencyMap  // NEW: Pass dependency map
  );

  // ... rest of method ...
}
```

**Update `generateLockFile()` signature (around line 279):**

```typescript
private async generateLockFile(
  genome: V2Genome,
  modules: ModuleWithPrerequisites[],
  executionPlan: string[],
  recipeBooks: Map<string, RecipeBook>,
  dependencyMap?: Map<string, PackageDependencies>  // NEW parameter
): Promise<LockFile> {
  // ... existing logic ...
  
  // Store dependency map in lock file metadata (optional, for debugging)
  // Or pass it through to execution phase
  
  return {
    version: '1.0.0',
    genomeHash,
    resolvedAt: new Date().toISOString(),
    marketplaces: resolvedMarketplaces,
    modules: lockFileModules,
    executionPlan,
    // NEW: Store dependency map (optional)
    metadata: {
      dependencies: dependencyMap ? Object.fromEntries(dependencyMap) : undefined
    }
  };
}
```

**Note:** You may need to update `LockFile` type to include metadata. Check `types-package/src/v2/index.ts` for `LockFile` interface.

---

### Step 7: Pass Dependencies to Structure Initialization

**File:** `Architech/src/agents/orchestrator-agent.ts`

**Find where `StructureInitializationLayer` is called (search for `initializeMonorepo`):**

**Update call:**
```typescript
// Get dependency map from lock file or execution context
const dependencyMap = lockFile.metadata?.dependencies 
  ? new Map(Object.entries(lockFile.metadata.dependencies))
  : undefined;

await this.structureInitializer.initializeMonorepo(
  resolvedGenome,
  dependencyMap  // NEW parameter
);
```

**File:** `Architech/src/core/services/project/structure-initialization-layer.ts`

**Update method signature (find `initializeMonorepo` method):**

```typescript
async initializeMonorepo(
  genome: Genome,
  dependencyMap?: Map<string, PackageDependencies>  // NEW parameter
): Promise<void> {
  // ... existing logic ...
  
  // When creating package.json (find where PackageJsonGenerator.generatePackageJson is called):
  const packageDeps = dependencyMap?.get(`packages/${packageName}`);
  
  const packageJson = PackageJsonGenerator.generatePackageJson(
    packageName,
    packageStructure,
    projectName,
    genome,
    packagePath,
    packageDeps  // NEW: Pass resolved dependencies
  );
  
  // ... rest of logic ...
}
```

**Also handle app dependencies:**

```typescript
// When creating app package.json:
for (const app of apps) {
  const appDeps = dependencyMap?.get(`apps/${app.id}`);
  
  const appPackageJson = PackageJsonGenerator.generatePackageJson(
    app.id,
    appPackageStructure,
    projectName,
    genome,
    `apps/${app.id}`,
    appDeps  // NEW: Pass resolved dependencies
  );
  
  // ... write package.json ...
}
```

---

## PART 2: HYBRID DEFAULTS IMPLEMENTATION

### Step 1: Create CliDefaultsGenerator

**New File:** `Architech/src/core/services/project/cli-defaults-generator.ts`

**Full Implementation:**

```typescript
/**
 * CLI Defaults Generator
 * 
 * Generates universal defaults that work for any project:
 * - .gitignore
 * - Root tsconfig.json
 * - Basic package.json scripts
 * 
 * These are CLI-generated (not marketplace modules) because they're universal.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../infrastructure/logging/index.js';

export class CliDefaultsGenerator {
  /**
   * Generate all universal CLI defaults
   */
  static async generateDefaults(
    projectRoot: string,
    projectName: string,
    structure: 'monorepo' | 'single-app'
  ): Promise<void> {
    Logger.info('📝 Generating CLI defaults...', {
      projectRoot,
      structure
    });

    await this.generateGitignore(projectRoot);
    await this.generateRootTsconfig(projectRoot, structure);
    await this.generatePackageJsonScripts(projectRoot, structure);

    Logger.success('✅ CLI defaults generated');
  }

  /**
   * Generate .gitignore (universal)
   */
  private static async generateGitignore(projectRoot: string): Promise<void> {
    const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.expo/
.turbo/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.temp/
`;

    const gitignorePath = path.join(projectRoot, '.gitignore');
    
    // Check if .gitignore already exists
    try {
      await fs.access(gitignorePath);
      Logger.debug('.gitignore already exists, skipping');
      return;
    } catch {
      // File doesn't exist, create it
    }

    await fs.writeFile(gitignorePath, gitignore);
    Logger.debug('✅ Generated .gitignore');
  }

  /**
   * Generate root tsconfig.json (universal base)
   */
  private static async generateRootTsconfig(
    projectRoot: string,
    structure: string
  ): Promise<void> {
    const tsconfig = {
      compilerOptions: {
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        isolatedModules: true,
        incremental: true,
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022']
      },
      exclude: ['node_modules', 'dist', 'build', '.turbo']
    };

    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    
    // Check if tsconfig.json already exists
    try {
      await fs.access(tsconfigPath);
      Logger.debug('tsconfig.json already exists, skipping');
      return;
    } catch {
      // File doesn't exist, create it
    }

    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    Logger.debug('✅ Generated tsconfig.json');
  }

  /**
   * Generate basic package.json scripts (universal)
   */
  private static async generatePackageJsonScripts(
    projectRoot: string,
    structure: string
  ): Promise<void> {
    const pkgPath = path.join(projectRoot, 'package.json');
    
    // Read existing package.json
    let pkg: any;
    try {
      const content = await fs.readFile(pkgPath, 'utf8');
      pkg = JSON.parse(content);
    } catch {
      // Package.json doesn't exist, create minimal one
      pkg = {
        name: path.basename(projectRoot),
        version: '1.0.0',
        private: true
      };
    }

    // Add basic scripts if not present
    pkg.scripts = pkg.scripts || {};

    if (structure === 'monorepo') {
      if (!pkg.scripts.dev) {
        pkg.scripts.dev = 'turbo run dev';
      }
      if (!pkg.scripts.build) {
        pkg.scripts.build = 'turbo run build';
      }
      if (!pkg.scripts.lint) {
        pkg.scripts.lint = 'turbo run lint';
      }
    } else {
      if (!pkg.scripts.dev) {
        pkg.scripts.dev = 'next dev';
      }
      if (!pkg.scripts.build) {
        pkg.scripts.build = 'next build';
      }
      if (!pkg.scripts.lint) {
        pkg.scripts.lint = 'next lint';
      }
    }

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
    Logger.debug('✅ Updated package.json scripts');
  }
}
```

**Export from:** `Architech/src/core/services/project/index.ts` (if exists) or add to imports where needed.

---

### Step 2: Remove Golden-Stack Auto-Include

**File:** `Architech/src/core/services/composition/composition-engine.ts`

**Already done!** ✅ (We removed `autoIncludeDefaultModules()` in previous step)

**File:** `Architech/src/marketplace.config.ts`

**Update (mark as deprecated):**

```typescript
/**
 * Marketplace Defaults Configuration
 * 
 * @deprecated No longer auto-included by CLI.
 * Users must explicitly add modules to their genome if desired.
 * 
 * CLI now generates universal defaults (.gitignore, tsconfig.json, scripts).
 * Opinionated modules (like golden-stack) remain optional marketplace modules.
 */
export const MARKETPLACE_DEFAULTS = {
  autoInclude: [
    'core/golden-stack' // DEPRECATED: No longer auto-included
  ]
} as const;
```

---

### Step 3: Integrate CLI Defaults

**File:** `Architech/src/core/services/project/structure-initialization-layer.ts`

**Add import (at top):**
```typescript
import { CliDefaultsGenerator } from './cli-defaults-generator.js';
```

**Find `initializeMonorepo()` method and add call at the end:**

```typescript
async initializeMonorepo(
  genome: Genome,
  dependencyMap?: Map<string, PackageDependencies>
): Promise<void> {
  // ... existing structure initialization logic ...
  
  // NEW: Generate CLI defaults after structure is created
  await CliDefaultsGenerator.generateDefaults(
    this.projectRoot,
    genome.project.name,
    genome.project.structure || 'monorepo'
  );
  
  Logger.success('✅ Project structure initialized with CLI defaults');
}
```

**Also handle single-app structure:**

```typescript
async initializeSingleApp(genome: Genome): Promise<void> {
  // ... existing logic ...
  
  // NEW: Generate CLI defaults
  await CliDefaultsGenerator.generateDefaults(
    this.projectRoot,
    genome.project.name,
    'single-app'
  );
}
```

---

## Testing Strategy

### Unit Tests

**New File:** `Architech/src/core/services/dependency/__tests__/capability-resolver.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CapabilityResolver } from '../capability-resolver.js';
import type { V2Genome } from '@thearchitech.xyz/types';

describe('CapabilityResolver', () => {
  it('should resolve auth capability to better-auth', () => {
    const genome: V2Genome = {
      workspace: { name: 'test' },
      marketplaces: {},
      packages: {
        auth: { from: 'official', provider: 'better-auth' }
      },
      apps: {}
    };
    
    const result = CapabilityResolver.resolve('auth', genome);
    expect(result?.npmPackage).toBe('better-auth');
    expect(result?.provider).toBe('better-auth');
  });

  it('should resolve database capability to drizzle-orm', () => {
    const genome: V2Genome = {
      workspace: { name: 'test' },
      marketplaces: {},
      packages: {
        database: { from: 'official', provider: 'drizzle' }
      },
      apps: {}
    };
    
    const result = CapabilityResolver.resolve('database', genome);
    expect(result?.npmPackage).toBe('drizzle-orm');
    expect(result?.provider).toBe('drizzle');
  });

  it('should return null if capability not in genome', () => {
    const genome: V2Genome = {
      workspace: { name: 'test' },
      marketplaces: {},
      packages: {},
      apps: {}
    };
    
    const result = CapabilityResolver.resolve('auth', genome);
    expect(result).toBeNull();
  });
});
```

**New File:** `Architech/src/core/services/dependency/__tests__/dependency-resolver-service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { DependencyResolverService } from '../dependency-resolver-service.js';
// ... test implementation ...
```

---

## Implementation Checklist

### Day 1: Dependency Resolution Foundation

- [ ] **Step 1:** Update types package (30 min)
  - [ ] Add `DependencyCapability` type
  - [ ] Add `ModuleDependencies` interface
  - [ ] Add `ResolvedDependency` interface
  - [ ] Add `PackageDependencies` interface
  - [ ] Update `RecipeModule` interface
  - [ ] Export from `types-package/src/index.ts`
  - [ ] Rebuild types package

- [ ] **Step 2:** Create CapabilityResolver (1 hour)
  - [ ] Create `capability-resolver.ts`
  - [ ] Implement capability mapping
  - [ ] Implement `resolve()` method
  - [ ] Export from dependency index

- [ ] **Step 3:** Create DependencyResolverService (2 hours)
  - [ ] Create `dependency-resolver-service.ts`
  - [ ] Implement `resolveDependencies()`
  - [ ] Implement `validateDependencies()`
  - [ ] Implement helper methods
  - [ ] Export from dependency index

- [ ] **Step 4:** Update module metadata (2 hours)
  - [ ] Update `adapters/payment/stripe/adapter.json`
  - [ ] Update `adapters/auth/better-auth/adapter.json`
  - [ ] Update `connectors/auth/better-auth-nextjs/adapter.json`
  - [ ] Update `connectors/ui/tamagui-nextjs/adapter.json`
  - [ ] Update other priority adapters/connectors

### Day 2: Integration & Testing

- [ ] **Step 5:** Integrate with PackageJsonGenerator (1 hour)
  - [ ] Update method signature
  - [ ] Update return object to include resolved deps

- [ ] **Step 6:** Integrate with CompositionEngine (1 hour)
  - [ ] Add import
  - [ ] Add dependency resolution step
  - [ ] Add validation step
  - [ ] Update `generateLockFile()` signature

- [ ] **Step 7:** Pass to StructureInitializationLayer (30 min)
  - [ ] Update `orchestrator-agent.ts`
  - [ ] Update `structure-initialization-layer.ts`
  - [ ] Pass dependencies to PackageJsonGenerator

- [ ] **Testing & Validation** (2 hours)
  - [ ] Write unit tests
  - [ ] Test end-to-end generation
  - [ ] Fix bugs

### Day 3: Hybrid Defaults

- [ ] **Step 1 (Hybrid):** Create CliDefaultsGenerator (2 hours)
  - [ ] Create `cli-defaults-generator.ts`
  - [ ] Implement `.gitignore` generation
  - [ ] Implement `tsconfig.json` generation
  - [ ] Implement `package.json` scripts

- [ ] **Step 2 (Hybrid):** Remove auto-include (30 min)
  - [ ] Update `marketplace.config.ts` (mark deprecated)
  - [ ] Verify `autoIncludeDefaultModules()` is removed

- [ ] **Step 3 (Hybrid):** Integrate (30 min)
  - [ ] Add import to `structure-initialization-layer.ts`
  - [ ] Call `generateDefaults()` in `initializeMonorepo()`
  - [ ] Call `generateDefaults()` in `initializeSingleApp()`

- [ ] **Testing & Validation** (1 hour)
  - [ ] Test CLI defaults generation
  - [ ] Verify golden-stack not auto-included
  - [ ] Fix bugs

### Day 4: Buffer & Documentation

- [ ] **Bug Fixes** (2 hours)
- [ ] **Documentation** (2 hours)
- [ ] **Final Validation** (1 hour)

---

## Files Summary

### Files to Create

1. `Architech/src/core/services/dependency/capability-resolver.ts`
2. `Architech/src/core/services/dependency/dependency-resolver-service.ts`
3. `Architech/src/core/services/dependency/index.ts`
4. `Architech/src/core/services/project/cli-defaults-generator.ts`
5. `Architech/src/core/services/dependency/__tests__/capability-resolver.test.ts`
6. `Architech/src/core/services/dependency/__tests__/dependency-resolver-service.test.ts`

### Files to Update

1. `types-package/src/v2/index.ts` - Add dependency types
2. `types-package/src/index.ts` - Export new types
3. `Architech/src/core/services/project/package-json-generator.ts` - Accept resolved deps
4. `Architech/src/core/services/composition/composition-engine.ts` - Call dependency resolver
5. `Architech/src/core/services/project/structure-initialization-layer.ts` - Use resolved deps, call CLI defaults
6. `Architech/src/agents/orchestrator-agent.ts` - Pass dependency map
7. `Architech/src/marketplace.config.ts` - Mark as deprecated
8. `marketplace/adapters/*/adapter.json` - Add dependencies metadata (priority modules)

### Files to Verify (No Changes Needed)

1. `Architech/src/core/services/composition/composition-engine.ts` - Verify `autoIncludeDefaultModules()` is removed ✅

---

**Plan Created:** November 19, 2024  
**Estimated Effort:** 19 hours (~2.5 days)  
**Status:** Ready for Implementation




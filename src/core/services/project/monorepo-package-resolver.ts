/**
 * Monorepo Package Resolver
 * 
 * Determines which package (apps/web, apps/api, packages/shared, etc.)
 * a module should be executed in.
 * 
 * NOW RECIPE BOOK DRIVEN:
 * - Uses RecipeBookResolver as primary source
 * - Recipe book targetPackage is PRIMARY source of truth
 * - Generic fallback only (no provider-specific logic)
 * - User overrides supported
 */

import { Genome, ResolvedGenome, Module, RecipeBook } from '@thearchitech.xyz/types';
import { getProjectApps } from '../../utils/genome-helpers.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { RecipeBookResolver } from './recipe-book-resolver.js';
import type { TargetPackageResolution } from './recipe-book-resolver.js';

// Re-export for use in OrchestratorAgent
export type { TargetPackageResolution };

export interface ModuleUsage {
  frontend: boolean;
  backend: boolean;
}

export type ModuleLayer = 'frontend' | 'backend' | 'tech-stack' | 'database' | null;

export class MonorepoPackageResolver {
  /**
   * Determine which package a module should be executed in
   * 
   * NEW PRIORITY ORDER (Recipe Book Driven):
   * 1. User override (genome.moduleOverrides) - HIGHEST
   * 2. Genome module targetPackage (explicit)
   * 3. Module metadata targetPackage (if preserved during conversion)
   * 4. Recipe book targetPackage (PRIMARY SOURCE) - NEW
   * 5. Generic fallback (no provider-specific logic) - FALLBACK ONLY
   * 
   * @param module - Module to resolve
   * @param genome - Genome with user overrides
   * @param recipeBooks - Optional recipe books map (if available)
   * @returns Target package path or null
   * @deprecated Use resolveExecutionContext() instead for full resolution including targetApps
   */
  static resolveTargetPackage(
    module: Module,
    genome: ResolvedGenome,
    recipeBooks?: Map<string, RecipeBook>
  ): string | null {
    console.log(`[MonorepoPackageResolver] resolveTargetPackage() called for: ${module.id}`);
    const resolution = this.resolveExecutionContext(module, genome, recipeBooks);
    console.log(`[MonorepoPackageResolver] resolveExecutionContext() returned:`, resolution);
    const result = resolution?.targetPackage || null;
    console.log(`[MonorepoPackageResolver] resolveTargetPackage() returning: ${result}`);
    return result;
  }

  /**
   * Resolve full execution context (package + apps)
   * 
   * Returns both targetPackage and targetApps for dual execution context support.
   * 
   * @param module - Module to resolve
   * @param genome - Genome with user overrides
   * @param recipeBooks - Optional recipe books map (if available)
   * @returns Full execution context resolution or null
   */
  static resolveExecutionContext(
    module: Module,
    genome: ResolvedGenome,
    recipeBooks?: Map<string, RecipeBook>
  ): TargetPackageResolution | null {
    // Check if genome defines monorepo structure
    // NOTE: During structure initialization, genome.project.monorepo may not be set yet,
    // but we can still resolve if structure === 'monorepo' (chicken-and-egg problem)
    const isMonorepo = genome.project.structure === 'monorepo';
    
    console.log(`[MonorepoPackageResolver] resolveExecutionContext() structure check:`, {
      structure: genome.project.structure,
      isMonorepo,
      hasMonorepo: !!genome.project.monorepo,
      monorepo: genome.project.monorepo
    });
    
    if (!isMonorepo) {
      console.log(`[MonorepoPackageResolver] Early return: not a monorepo (structure=${genome.project.structure})`);
      return null;
    }
    
    // If monorepo config is not set yet (during structure initialization), create a minimal one
    if (!genome.project.monorepo) {
      console.log(`[MonorepoPackageResolver] Monorepo config not set yet, creating minimal config for resolution`);
      // Create minimal monorepo config for resolution purposes
      // This will be properly set by StructureInitializationLayer after package creation
      (genome.project as any).monorepo = {
        tool: 'turborepo',
        packages: {}
      };
    }

    console.log(`[MonorepoPackageResolver] resolveExecutionContext() called for: ${module.id}`);
    console.log(`[MonorepoPackageResolver] hasRecipeBooks: ${!!recipeBooks && recipeBooks.size > 0}`);
    
    Logger.debug(`🔍 Resolving execution context for module: ${module.id}`, {
      operation: 'execution_context_resolution',
      moduleId: module.id,
      hasRecipeBooks: !!recipeBooks && recipeBooks.size > 0
    });

    // Use RecipeBookResolver as PRIMARY source (handles all priorities)
    console.log(`[MonorepoPackageResolver] Calling RecipeBookResolver.resolveTargetPackage()...`);
    const resolution = RecipeBookResolver.resolveTargetPackage(module, genome, recipeBooks);
    
    console.log(`[MonorepoPackageResolver] RecipeBookResolver.resolveTargetPackage() returned:`, resolution);
    console.log(`[MonorepoPackageResolver] Resolution type:`, typeof resolution);
    console.log(`[MonorepoPackageResolver] Resolution is null?:`, resolution === null);
    console.log(`[MonorepoPackageResolver] Resolution is undefined?:`, resolution === undefined);
    
    if (resolution) {
      console.log(`[MonorepoPackageResolver] Resolution found: targetPackage=${resolution.targetPackage}, targetApps=${resolution.targetApps}`);
      Logger.debug(`✅ Resolved execution context: ${JSON.stringify(resolution)}`, {
        operation: 'execution_context_resolution',
        moduleId: module.id,
        targetPackage: resolution.targetPackage,
        targetApps: resolution.targetApps,
        source: resolution.source
      });
      return resolution;
    } else {
      console.log(`[MonorepoPackageResolver] Resolution is null/undefined, returning null`);
    }

    // No resolution found
    Logger.warn(`⚠️ No execution context resolved for module: ${module.id}`, {
      operation: 'execution_context_resolution',
      moduleId: module.id
    });
    return null;
  }

  // NOTE: All inference logic has been moved to RecipeBookResolver
  // This class now acts as a thin wrapper that delegates to RecipeBookResolver
  // All provider-specific logic has been removed
}


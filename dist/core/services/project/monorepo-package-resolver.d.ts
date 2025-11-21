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
import { ResolvedGenome, Module, RecipeBook } from '@thearchitech.xyz/types';
import type { TargetPackageResolution } from './recipe-book-resolver.js';
export type { TargetPackageResolution };
export interface ModuleUsage {
    frontend: boolean;
    backend: boolean;
}
export type ModuleLayer = 'frontend' | 'backend' | 'tech-stack' | 'database' | null;
export declare class MonorepoPackageResolver {
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
    static resolveTargetPackage(module: Module, genome: ResolvedGenome, recipeBooks?: Map<string, RecipeBook>): string | null;
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
    static resolveExecutionContext(module: Module, genome: ResolvedGenome, recipeBooks?: Map<string, RecipeBook>): TargetPackageResolution | null;
}

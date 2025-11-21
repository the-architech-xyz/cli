/**
 * Recipe Book Resolver
 *
 * Resolves module targetPackage and targetApps from recipe books.
 * This is the PRIMARY source of truth for module placement.
 *
 * Priority Order:
 * 1. User override (genome.moduleOverrides) - HIGHEST
 * 2. Genome module definition (genome.modules[].targetPackage)
 * 3. Recipe book (recipeModule.targetPackage) - PRIMARY SOURCE
 * 4. Recipe book package structure (packageStructure.directory)
 * 5. Generic fallback (no provider-specific logic)
 */
import type { Module, ResolvedGenome, RecipeBook } from '@thearchitech.xyz/types';
export interface TargetPackageResolution {
    targetPackage: string | null;
    targetApps?: string[];
    requiredFramework?: string;
    requiredAppTypes?: ('web' | 'mobile' | 'api' | 'desktop' | 'worker')[];
    source: 'user_override' | 'genome_definition' | 'recipe_book' | 'package_structure' | 'generic_fallback';
}
export declare class RecipeBookResolver {
    /**
     * Resolve targetPackage for a module using recipe books
     *
     * @param module - Module to resolve
     * @param genome - Genome with user overrides
     * @param recipeBooks - Map of marketplace name to recipe book
     * @returns Target package resolution with source information
     */
    static resolveTargetPackage(module: Module, genome: ResolvedGenome, recipeBooks?: Map<string, RecipeBook>): TargetPackageResolution | null;
    /**
     * Check for user override in genome.moduleOverrides
     */
    private static getUserOverride;
    /**
     * Find module in genome.modules array
     */
    private static findGenomeModule;
    /**
     * Resolve from recipe book (PRIMARY SOURCE)
     *
     * Searches all recipe books for the module and uses targetPackage from recipe
     *
     * Returns:
     * - TargetPackageResolution if module found and has valid execution context
     * - null if module not found in recipe book (fallback to generic)
     * - { skip: true } if module found but all apps filtered out (skip entirely)
     */
    private static resolveFromRecipeBook;
    /**
     * Generic fallback (NO provider-specific logic)
     *
     * Only uses generic patterns like:
     * - Module ID structure (adapters/, connectors/, features/)
     * - Layer inference (frontend, backend, tech-stack, database)
     * - App type detection
     *
     * NO provider names (better-auth, drizzle, etc.)
     * NO package-specific logic (auth, db, ui)
     */
    private static genericFallback;
    /**
     * Get generic module type (no provider names)
     */
    private static getGenericModuleType;
    /**
     * Infer generic layer (no provider names)
     */
    private static inferGenericLayer;
    /**
     * Infer generic category (based on module ID structure only, no provider names)
     */
    private static inferGenericCategory;
}

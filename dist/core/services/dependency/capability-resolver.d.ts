/**
 * Capability Resolver
 *
 * Maps abstract capability dependencies to concrete npm packages
 * based on genome provider choices.
 *
 * V2 COMPLIANCE: Reads from recipe books instead of hardcoded mappings.
 */
import type { DependencyCapability, ResolvedDependency, V2Genome, RecipeBook } from '@thearchitech.xyz/types';
export declare class CapabilityResolver {
    /**
     * Fallback mappings for when recipe books are not available
     * These should only be used as a last resort during migration
     * @deprecated Use recipe books instead
     */
    private static readonly FALLBACK_CAPABILITY_MAP;
    /**
     * Resolve capability to npm package based on genome and recipe books
     *
     * V2 COMPLIANCE: Reads from recipe books instead of hardcoded mappings
     *
     * @param capability - Capability to resolve
     * @param genome - Genome with provider choices
     * @param recipeBooks - Optional recipe books map (if available)
     * @returns Resolved dependency or null
     */
    static resolve(capability: DependencyCapability, genome: V2Genome, recipeBooks?: Map<string, RecipeBook>): ResolvedDependency | null;
    /**
     * Resolve npm package from recipe book
     *
     * Extracts the primary npm package from packageStructure.dependencies
     * for the given capability and provider.
     */
    private static resolveFromRecipeBook;
    /**
     * Get all available providers for a capability from recipe books
     */
    static getAvailableProviders(capability: DependencyCapability, recipeBooks?: Map<string, RecipeBook>): string[];
    /**
     * Get available providers from recipe books
     */
    private static getAvailableProvidersFromRecipeBook;
}

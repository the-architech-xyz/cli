/**
 * Dependency Resolver Service
 *
 * Resolves all module dependencies for the entire project.
 * Maps abstract capabilities to concrete npm packages based on genome.
 */
import type { Module, PackageDependencies, V2Genome, MarketplaceAdapter, ModuleWithPrerequisites, RecipeBook } from '@thearchitech.xyz/types';
export declare class DependencyResolverService {
    /**
     * Resolve dependencies for all modules in execution plan
     * Returns map of package/app → dependencies to install
     *
     * V2 COMPLIANCE: Accepts recipe books for capability resolution
     */
    static resolveDependencies(modules: (Module | ModuleWithPrerequisites)[], genome: V2Genome, marketplaceAdapters: Map<string, MarketplaceAdapter>, recipeBooks?: Map<string, RecipeBook>): Promise<Map<string, PackageDependencies>>;
    /**
     * Load module dependencies from metadata
     */
    private static loadModuleDependencies;
    /**
     * Resolve module dependencies using genome and recipe books
     *
     * V2 COMPLIANCE: Passes recipe books to CapabilityResolver
     */
    private static resolveModuleDependencies;
    /**
     * Determine target package/app for module
     */
    private static getTargetForModule;
    /**
     * Merge dependencies into target's dependency map
     */
    private static mergeDependencies;
    /**
     * Validate all required dependencies exist in genome
     * Call this early (before execution) to fail fast
     */
    static validateDependencies(modules: (Module | ModuleWithPrerequisites)[], genome: V2Genome, marketplaceAdapters: Map<string, MarketplaceAdapter>): Promise<{
        valid: boolean;
        missing: string[];
    }>;
}

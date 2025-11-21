/**
 * Composition Engine
 *
 * The V2 Composition Engine is the "brain" of the CLI that:
 * 1. Loads recipe books from marketplaces
 * 2. Expands packages into modules using recipes
 * 3. Resolves dependencies using prerequisites
 * 4. Generates lock file for reproducible builds
 */
import type { V2Genome, LockFile, MarketplaceAdapter } from '@thearchitech.xyz/types';
export interface Logger {
    info: (msg: string, meta?: any) => void;
    debug: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
}
export declare class CompositionEngine {
    private recipeExpander;
    private dependencyResolver;
    private lockFileService;
    private logger;
    private marketplaceAdapters;
    constructor(marketplaceAdapters: Map<string, MarketplaceAdapter>, logger: Logger, projectRoot?: string);
    /**
     * Resolve a V2 genome into a lock file
     *
     * @param genome - V2 genome from user
     * @param projectRoot - Root directory for lock file operations (optional)
     * @param forceRegenerate - Force regeneration even if lock file exists (default: false)
     * @returns Lock file with resolved modules and execution plan
     */
    resolve(genome: V2Genome, projectRoot?: string, forceRegenerate?: boolean): Promise<LockFile>;
    /**
     * Load recipe books from all marketplaces
     */
    private loadRecipeBooks;
    /**
     * Collect all packages from all apps (deduplicated)
     */
    private collectPackagesFromApps;
    /**
     * Enrich modules with prerequisites from marketplace manifest
     */
    private enrichModulesWithPrerequisites;
    /**
     * Generate lock file from resolved modules
     */
    private generateLockFile;
    /**
     * Compute integrity hash for a module
     */
    private computeModuleIntegrity;
    /**
     * Compute integrity hash for arbitrary data
     */
    private computeIntegrity;
}

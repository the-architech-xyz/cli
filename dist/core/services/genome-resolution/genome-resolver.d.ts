/**
 * Genome Resolver Service
 *
 * Main service for resolving genome shorthands to actual file paths.
 * Supports multiple resolution strategies with fallback chain.
 *
 * Resolution order:
 * 1. Check if input is already a file path → use directly
 * 2. Try local marketplace (../marketplace/genomes/official/)
 * 3. Try NPM package (@architech/marketplace)
 * 4. Try custom sources (from config)
 * 5. Throw helpful error with suggestions
 */
import { ResolvedGenome, ResolutionOptions, IResolutionStrategy, ArchitechConfig } from './types.js';
export declare class GenomeResolver {
    private config?;
    private cache;
    private strategies;
    constructor(config?: ArchitechConfig | undefined);
    /**
     * Register a resolution strategy
     */
    registerStrategy(strategy: IResolutionStrategy): void;
    /**
     * Main resolution method
     * Tries all strategies in order until one succeeds
     */
    resolve(input: string, options?: ResolutionOptions): Promise<ResolvedGenome>;
    /**
     * Check if input looks like a file path
     */
    looksLikeFilePath(input: string): boolean;
    private createNotFoundError;
    /**
     * Clear resolution cache
     */
    clearCache(): void;
}
/**
 * Create a GenomeResolver with the default strategy chain (file path, local marketplace, npm, custom sources).
 * Keeps genome alias resolution decoupled from template marketplace handling.
 */
export declare function createGenomeResolver(config?: ArchitechConfig): GenomeResolver;
/**
 * Create a GenomeResolver using configuration loaded from disk.
 */
export declare function createGenomeResolverFromConfig(configPath?: string): Promise<GenomeResolver>;

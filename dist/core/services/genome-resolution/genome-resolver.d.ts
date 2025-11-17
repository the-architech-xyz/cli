/**
 * Genome Resolver Service
 *
 * Main service for resolving genome shorthands to actual file paths.
 * Simplified implementation without strategy pattern.
 *
 * Resolution order:
 * 1. Check if input is already a file path → use directly
 * 2. Try local marketplace (../marketplace/genomes/official/)
 * 3. Throw helpful error with suggestions
 */
import { ResolvedGenome, ResolutionOptions, ArchitechConfig } from './types.js';
export declare class GenomeResolver {
    private config?;
    private cache;
    constructor(config?: ArchitechConfig | undefined);
    /**
     * Main resolution method
     * Tries file path first, then local marketplace
     */
    resolve(input: string, options?: ResolutionOptions): Promise<ResolvedGenome>;
    /**
     * Check if input looks like a file path
     */
    looksLikeFilePath(input: string): boolean;
    /**
     * Resolve as file path
     * @private
     */
    private resolveFilePath;
    /**
     * Resolve from local marketplace
     * @private
     */
    private resolveLocalMarketplace;
    /**
     * List all available genomes in local marketplace
     */
    listAvailable(): Promise<string[]>;
    private createNotFoundError;
    /**
     * Clear resolution cache
     */
    clearCache(): void;
}
/**
 * Create a GenomeResolver with default configuration.
 * Simplified implementation without strategy pattern.
 */
export declare function createGenomeResolver(config?: ArchitechConfig): GenomeResolver;
/**
 * Create a GenomeResolver using configuration loaded from disk.
 */
export declare function createGenomeResolverFromConfig(configPath?: string): Promise<GenomeResolver>;

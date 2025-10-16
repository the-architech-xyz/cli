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
import { ResolvedGenome, GenomeMetadata, ResolutionOptions, IResolutionStrategy, ArchitechConfig } from './types.js';
export declare class GenomeResolver {
    private config?;
    private cache;
    private strategies;
    /**
     * Default aliases mapping user-friendly names to actual file names
     */
    private readonly DEFAULT_ALIASES;
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
    /**
     * Normalize genome name using aliases
     */
    normalizeGenomeName(name: string): string;
    /**
     * Extract metadata from genome file without executing it
     */
    extractMetadata(genomePath: string): Promise<GenomeMetadata>;
    /**
     * Estimate generation time based on module count
     */
    private estimateGenerationTime;
    /**
     * Find similar genome names for suggestions
     */
    findSimilarGenomes(input: string): Promise<string[]>;
    /**
     * Simple Levenshtein distance for fuzzy matching
     */
    private levenshteinDistance;
    /**
     * Get all available genomes from all sources
     */
    getAvailableGenomes(): Promise<string[]>;
    /**
     * Create helpful error when genome not found
     */
    private createNotFoundError;
    /**
     * Clear resolution cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        entries: string[];
    };
}

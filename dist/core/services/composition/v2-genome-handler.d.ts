/**
 * V2 Genome Handler
 *
 * Handles V2 genome resolution and conversion to execution format.
 * Bridges V2 Composition Engine with V1 OrchestratorAgent.
 */
import type { V2Genome, LockFile, MarketplaceAdapter, ResolvedGenome } from '@thearchitech.xyz/types';
export interface LoggerInterface {
    info: (msg: string, meta?: unknown) => void;
    debug: (msg: string, meta?: unknown) => void;
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, error?: Error, data?: unknown) => void;
}
export declare class V2GenomeHandler {
    private compositionEngine;
    private logger;
    constructor(marketplaceAdapters: Map<string, MarketplaceAdapter>, logger: LoggerInterface, projectRoot?: string);
    /**
     * Check if a genome is V2 format
     */
    static isV2Genome(genome: unknown): genome is V2Genome;
    /**
     * Resolve V2 genome to lock file
     */
    resolveGenome(genome: V2Genome, projectRoot?: string, forceRegenerate?: boolean): Promise<LockFile>;
    /**
     * Convert LockFile to ResolvedGenome format for OrchestratorAgent
     *
     * This is a bridge function to allow OrchestratorAgent to work with V2 lock files
     * while maintaining backward compatibility with V1 ResolvedGenome format.
     */
    convertLockFileToResolvedGenome(lockFile: LockFile, originalGenome: V2Genome): Promise<ResolvedGenome>;
    /**
     * Infer category from module ID (e.g., 'adapters/auth/better-auth' -> 'adapters')
     */
    private inferCategory;
    /**
     * Infer type from module ID
     */
    private inferType;
    /**
     * Find which package a module belongs to by searching recipe books
     */
    private findPackageForModule;
    /**
     * Infer project structure from V2 genome
     *
     * A monorepo is detected if:
     * - Multiple apps exist, OR
     * - Any app has a package path (e.g., 'apps/web', 'apps/api') indicating monorepo structure
     */
    private inferStructure;
    /**
     * Infer monorepo configuration
     */
    private inferMonorepo;
    /**
     * Build apps configuration from V2 genome
     *
     * Converts V2 genome apps (Record<string, AppConfig>) to FrameworkApp[] format
     * required by ResolvedGenome.
     */
    private buildApps;
    /**
     * Infer app type from framework or app ID
     */
    private inferAppType;
    /**
     * Build module index from lock file modules
     */
    private buildModuleIndex;
}

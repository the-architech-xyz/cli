/**
 * Path Initialization Service
 *
 * Centralized service for initializing all project paths before module execution.
 * This ensures paths are available during blueprint preprocessing and execution.
 *
 * Path initialization order:
 * 1. Framework paths (from adapter config)
 * 2. Monorepo paths (from genome structure)
 * 3. Smart paths (auth_config, payment_config, etc.)
 * 4. Marketplace paths
 */
import { PathService } from '../path/path-service.js';
import { ResolvedGenome } from '@thearchitech.xyz/types';
import type { AdapterConfig, GenomeMarketplace, MarketplaceAdapter } from '@thearchitech.xyz/types';
interface PathInitializationOptions {
    marketplaceAdapter?: MarketplaceAdapter;
    marketplaceInfo?: GenomeMarketplace;
    runtimeOverrides?: Record<string, string>;
}
export declare class PathInitializationService {
    /**
     * Initialize all paths for the project
     * This should be called ONCE before any module execution
     */
    static initializePaths(genome: ResolvedGenome, pathHandler: PathService, frameworkAdapter?: AdapterConfig, options?: PathInitializationOptions): Promise<void>;
    private static computeWorkspacePaths;
    private static computeSingleAppPaths;
    /**
     * Compute monorepo-specific paths
     */
    private static computeMonorepoPaths;
    private static applyPaths;
    private static cleanBasePath;
    private static joinPath;
    private static ensureTrailingSlash;
    private static normalizeMarketplaceKey;
    /**
     * Compute marketplace paths
     * SINGLE SOURCE OF TRUTH for marketplace UI framework detection
     */
    private static computeMarketplacePaths;
    private static determineActiveUIFramework;
    private static extractExplicitUIFramework;
    private static resolveUIRoot;
    /**
     * Validate paths (check for conflicts, normalize, etc.)
     */
    private static validatePaths;
}
export {};

/**
 * Path Initialization Service
 *
 * @deprecated This service is deprecated in favor of PathMappingGenerator.
 * Path generation is now handled by PathMappingGenerator.generateMappings() in OrchestratorAgent.
 *
 * This service is kept for backward compatibility and still handles:
 * - Framework path merging
 * - Marketplace path key loading
 * - User override validation
 * - Marketplace UI detection
 *
 * However, path defaults resolution is now redundant since PathMappingGenerator handles it.
 *
 * DOCTRINE: The CLI does NOT compute paths. All paths come from the marketplace adapter.
 *
 * Path initialization order:
 * 1. Framework paths (from adapter config)
 * 2. Marketplace path defaults (from adapter.resolvePathDefaults() - REQUIRED)
 * 3. Marketplace paths (UI marketplace detection)
 * 4. Runtime overrides (user-provided)
 *
 * The service will FAIL FAST if the marketplace adapter does not provide path defaults.
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
     *
     * @deprecated Path generation is now handled by PathMappingGenerator.generateMappings().
     * This method is kept for backward compatibility and still handles:
     * - Framework path merging
     * - Marketplace path key loading
     * - User override validation
     * - Marketplace UI detection
     *
     * However, the path defaults resolution part is redundant since PathMappingGenerator
     * already generates mappings from adapter.resolvePathDefaults().
     */
    static initializePaths(genome: ResolvedGenome, pathHandler: PathService, frameworkAdapter?: AdapterConfig, options?: PathInitializationOptions): Promise<void>;
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

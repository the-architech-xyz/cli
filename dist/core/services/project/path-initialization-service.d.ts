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
import { Genome } from '@thearchitech.xyz/types';
import { AdapterConfig } from '@thearchitech.xyz/types';
export declare class PathInitializationService {
    /**
     * Initialize all paths for the project
     * This should be called ONCE before any module execution
     */
    static initializePaths(genome: Genome, pathHandler: PathService, frameworkAdapter?: AdapterConfig): Promise<void>;
    /**
     * Compute monorepo-specific paths
     */
    private static computeMonorepoPaths;
    /**
     * Compute smart paths (auth_config, payment_config, etc.)
     * These paths are computed based on project structure (single-app vs monorepo)
     */
    private static computeSmartPaths;
    /**
     * Compute marketplace paths
     * SINGLE SOURCE OF TRUTH for marketplace UI framework detection
     */
    private static computeMarketplacePaths;
    /**
     * Detect UI framework from genome
     * PRIORITY: Modules (explicit) > Genome options > Framework inference > Package.json
     *
     * This is the SINGLE SOURCE OF TRUTH for UI framework detection.
     * All other layers should read from PathService, not detect independently.
     */
    private static detectUIFramework;
    /**
     * Validate paths (check for conflicts, normalize, etc.)
     */
    private static validatePaths;
}

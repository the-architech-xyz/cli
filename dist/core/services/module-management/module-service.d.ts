/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */
import { Module, Genome } from '@thearchitech.xyz/marketplace';
import { AdapterConfig, Blueprint } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { PathService } from '../path/path-service.js';
import { CacheManagerService } from '../infrastructure/cache/cache-manager.js';
export interface ModuleLoadResult {
    success: boolean;
    adapter?: {
        config: AdapterConfig;
        blueprint: Blueprint;
    };
    error?: string;
}
export interface FrameworkSetupResult {
    success: boolean;
    pathHandler?: PathService;
    error?: string;
}
export interface ProjectContextResult {
    success: boolean;
    context?: ProjectContext;
    error?: string;
}
export declare class ModuleService {
    private cacheManager;
    private cache;
    constructor(cacheManager: CacheManagerService);
    /**
     * Initialize the module service
     */
    initialize(): Promise<void>;
    /**
     * Setup framework and create decentralized path handler
     */
    setupFramework(genome: Genome, pathHandler: PathService): Promise<FrameworkSetupResult>;
    /**
     * Load module (adapter or integration) based on convention
     */
    loadModuleAdapter(module: Module): Promise<ModuleLoadResult>;
    /**
     * Create project context for module execution
     */
    createProjectContext(genome: Genome, pathHandler: PathService, module: Module): Promise<ProjectContextResult>;
    /**
     * Load integration from marketplace
     */
    private loadIntegration;
    /**
     * Load adapter from marketplace
     */
    private loadAdapter;
    /**
     * Load feature from marketplace
     * Handles both direct feature references and subdirectory structure
     */
    private loadFeature;
    /**
     * Get cached adapter
     */
    getCachedAdapter(category: string, adapterId: string): any;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}

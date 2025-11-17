/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management.
 *
 * NOTE: This service maintains a simple in-memory cache for adapters (config + blueprint)
 * during execution. This is an execution-time optimization, not redundant with MarketplaceService
 * which only caches UI manifests. The CacheManagerService is used for file system caching.
 */
import { ResolvedGenome } from '@thearchitech.xyz/types';
import { AdapterConfig, Blueprint, Module } from '@thearchitech.xyz/types';
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
     * Load module resources (config + blueprint) using module metadata
     */
    loadModuleAdapter(module: Module): Promise<ModuleLoadResult>;
    /**
     * Create project context for module execution
     */
    createProjectContext(genome: ResolvedGenome, pathHandler: PathService, module: Module): Promise<ProjectContextResult>;
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

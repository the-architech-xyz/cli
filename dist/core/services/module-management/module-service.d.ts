/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */
import { Genome } from '@thearchitech.xyz/marketplace';
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
    createProjectContext(genome: Genome, pathHandler: PathService, module: Module): Promise<ProjectContextResult>;
    private getModuleIndex;
    private resolveModuleDefinition;
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

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

import { Genome, ResolvedGenome } from '@thearchitech.xyz/types';
import { AdapterConfig, Blueprint, Module } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { CacheManagerService } from '../infrastructure/cache/cache-manager.js';
import { ErrorHandler } from '../infrastructure/error/index.js';
import { FrameworkContextService } from '../project/framework-context-service.js';
import { Logger } from '../infrastructure/logging/index.js';

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

export class ModuleService {
  private cacheManager: CacheManagerService;
  private cache: Map<string, any> = new Map();

  constructor(cacheManager: CacheManagerService) {
    this.cacheManager = cacheManager;
  }

  /**
   * Initialize the module service
   */
  async initialize(): Promise<void> {
    Logger.info('🔧 Initializing Module Service...', {
      operation: 'module_service_init'
    });
    
    // Initialize cache manager
    await this.cacheManager.initialize();
    
    Logger.info('✅ Module Service initialized', {
      operation: 'module_service_init'
    });
  }

  /**
   * Load module resources (config + blueprint) using module metadata
   */
  async loadModuleAdapter(module: Module): Promise<ModuleLoadResult> {
    try {
      const cacheKey = module.id;

      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        return {
          success: true,
          adapter: cached
        };
      }

      const config = await MarketplaceService.loadModuleConfig(module);
      const blueprint = await MarketplaceService.loadModuleBlueprint(module);

      const adapter = {
        config,
        blueprint
      };

      this.cache.set(cacheKey, adapter);

      return {
        success: true,
        adapter
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        module.category || 'unknown',
        'load_module'
      );
      return {
        success: false,
        error: errorResult.error
      };
    }
  }

  /**
   * Create project context for module execution
   */
  async createProjectContext(
    genome: ResolvedGenome,
    pathHandler: PathService,
    module: Module
  ): Promise<ProjectContextResult> {
    try {
      // ResolvedGenome guarantees modules is always an array
      const modules = genome.modules;
      const modulesRecord: Record<string, Module> = {};
      modules.forEach((mod) => {
        modulesRecord[mod.id] = mod;
      });

      const targetModule = modulesRecord[module.id] || module;

      const context: ProjectContext = await FrameworkContextService.createProjectContext(
        genome,
        targetModule,
        pathHandler,
        modulesRecord
      );

      return {
        success: true,
        context
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        module.category || 'unknown',
        'create_context'
      );
      return {
        success: false,
        error: errorResult.error
      };
    }
  }

  /**
   * Get cached adapter
   */
  getCachedAdapter(category: string, adapterId: string): any {
    const cacheKey = `${category}/${adapterId}`;
    return this.cache.get(cacheKey);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

}

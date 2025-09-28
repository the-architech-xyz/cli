/**
 * Unified Module Service
 * 
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */

import { Module, Recipe, ProjectContext, AdapterConfig, Blueprint } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { CacheManagerService } from '../infrastructure/cache/cache-manager.js';
import { ErrorHandler } from '../infrastructure/error/index.js';
import { ErrorCode } from '../infrastructure/error/error-types.js';
import { Logger } from '../infrastructure/logging/index.js';

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
   * Setup framework and create decentralized path handler
   */
  async setupFramework(
    recipe: Recipe,
    pathHandler: PathService
  ): Promise<FrameworkSetupResult> {
    try {
      // 1. Identify framework module
      const frameworkModule = recipe.modules.find(m => m.category === 'framework');
      if (!frameworkModule) {
        const error = ErrorHandler.createError(
          'No framework module found in recipe. Framework adapter is required.',
          { operation: 'framework_setup' },
          ErrorCode.CONFIG_VALIDATION_ERROR,
          false
        );
        return { success: false, error: error.error };
      }

      Logger.info(`🏗️ Loading framework adapter: ${frameworkModule.id}`, {
        operation: 'framework_setup'
      });

      // 2. Load framework adapter
      const adapterId = frameworkModule.id.split('/').pop() || frameworkModule.id;
      const frameworkAdapter = await this.loadAdapter(
        frameworkModule.category,
        adapterId
      );

      if (!frameworkAdapter) {
        return {
          success: false,
          error: `Failed to load framework adapter: ${frameworkModule.id}`
        };
      }

      // 3. Create path service with framework configuration
      const pathService = new PathService(
        pathHandler.getProjectRoot(),
        pathHandler.getProjectName(),
        frameworkAdapter.config
      );

      Logger.info('📁 Framework paths configured', {
        operation: 'framework_setup',
        availablePaths: pathService.getAvailablePaths()
      });

      return {
        success: true,
        pathHandler: pathService
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        'framework',
        'setup'
      );
      return {
        success: false,
        error: errorResult.error
      };
    }
  }

  /**
   * Load adapter for a specific module
   */
  async loadModuleAdapter(module: Module): Promise<ModuleLoadResult> {
    try {
      const adapterId = module.id.split('/').pop() || module.id;
      const adapter = await this.loadAdapter(module.category, adapterId);
      
      if (!adapter) {
        return {
          success: false,
          error: `Failed to load adapter: ${module.id}`
        };
      }

      return {
        success: true,
        adapter: {
          config: adapter.config,
          blueprint: adapter.blueprint
        }
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        module.category,
        'load_adapter'
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
  createProjectContext(
    recipe: Recipe,
    pathHandler: PathService,
    module: Module
  ): ProjectContextResult {
    try {
      // Convert modules array to Record<string, Module>
      const modulesRecord: Record<string, Module> = {};
      recipe.modules.forEach(mod => {
        modulesRecord[mod.id] = mod;
      });

      const context: ProjectContext = {
        project: recipe.project,
        modules: modulesRecord,
        pathHandler: pathHandler,
        module: module,
        framework: recipe.project.framework
      };

      return {
        success: true,
        context
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        module.category,
        'create_context'
      );
      return {
        success: false,
        error: errorResult.error
      };
    }
  }

  /**
   * Load adapter from marketplace
   */
  private async loadAdapter(category: string, adapterId: string): Promise<any> {
    const cacheKey = `${category}/${adapterId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use fs to read the adapter.json file
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      
      // Construct the path to the adapter.json file
      const adapterJsonPath = join(
        process.cwd(),
        'node_modules',
        '@thearchitech.xyz',
        'marketplace',
        'adapters',
        category,
        adapterId,
        'adapter.json'
      );
      
      const adapterJsonContent = readFileSync(adapterJsonPath, 'utf-8');
      const adapterJson = JSON.parse(adapterJsonContent);
      
      // Load the blueprint file using the full path since the package exports don't support TypeScript files
      const blueprintPath = `@thearchitech.xyz/marketplace/adapters/${category}/${adapterId}/${adapterJson.blueprint}`;
      
      // Try to import the blueprint file directly from the file system
      const blueprintFilePath = join(
        process.cwd(),
        'node_modules',
        '@thearchitech.xyz',
        'marketplace',
        'adapters',
        category,
        adapterId,
        adapterJson.blueprint
      );
      
      const blueprintModule = await import(blueprintFilePath);
      
      // Find the blueprint export (it might be a named export or default export)
      let blueprint = blueprintModule.default || blueprintModule.blueprint || blueprintModule[`${adapterId}Blueprint`];
      
      // If we still don't have a blueprint, look for any export that looks like a blueprint
      if (!blueprint) {
        const exports = Object.keys(blueprintModule);
        const blueprintKey = exports.find(key => 
          key.toLowerCase().includes('blueprint') || 
          key.toLowerCase().includes(adapterId)
        );
        if (blueprintKey) {
          blueprint = blueprintModule[blueprintKey];
        }
      }
      
      if (!blueprint) {
        throw new Error(`No blueprint found in ${blueprintPath}. Available exports: ${Object.keys(blueprintModule).join(', ')}`);
      }
      
      const adapter = {
        config: adapterJson,
        blueprint: blueprint
      };
      
      // Cache the result
      this.cache.set(cacheKey, adapter);
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to load adapter ${cacheKey}`, {
        operation: 'load_adapter',
        error: errorMessage,
        stack: errorStack,
        category,
        adapterId
      });
      console.error(`Detailed error for ${cacheKey}:`, error);
      return null;
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

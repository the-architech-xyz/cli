/**
 * Unified Module Service
 * 
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */

import { Module, Genome } from '@thearchitech.xyz/marketplace';
import { ProjectContext, AdapterConfig, Blueprint } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
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
    genome: Genome,
    pathHandler: PathService
  ): Promise<FrameworkSetupResult> {
    try {
      // 1. Identify framework module
      const frameworkModule = genome.modules.find(m => m.category === 'framework');
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
        frameworkModule.category || 'framework',
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
   * Load module (adapter or integration) based on convention
   */
  async loadModuleAdapter(module: Module): Promise<ModuleLoadResult> {
    try {
      // Detect module type from ID convention
      const isIntegration = module.id.startsWith('integrations/');
      const isFeature = module.id.startsWith('features/');
      
      let moduleData;
      
      if (isIntegration) {
        // Load as integration
        const integrationName = module.id.replace('integrations/', '');
        moduleData = await this.loadIntegration(integrationName);
      } else if (isFeature) {
        // Load as feature
        const featureName = module.id.replace('features/', '');
        moduleData = await this.loadFeature(featureName);
      } else {
        // Load as adapter
        const [category, adapterId] = module.id.split('/');
        if (!category || !adapterId) {
          return {
            success: false,
            error: `Invalid adapter ID format: ${module.id}. Expected format: category/name`
          };
        }
        moduleData = await this.loadAdapter(category, adapterId);
      }
      
      if (!moduleData) {
        return {
          success: false,
          error: `Failed to load module: ${module.id}`
        };
      }

      return {
        success: true,
        adapter: {
          config: moduleData.config,
          blueprint: moduleData.blueprint
        }
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
  createProjectContext(
    genome: Genome,
    pathHandler: PathService,
    module: Module
  ): ProjectContextResult {
    try {
      // Convert modules array to Record<string, Module>
      const modulesRecord: Record<string, Module> = {};
      genome.modules.forEach(mod => {
        modulesRecord[mod.id] = mod;
      });

      const context: ProjectContext = {
        project: genome.project,
        modules: modulesRecord,
        pathHandler: pathHandler,
        module: module,
        framework: genome.project.framework
      };

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
   * Load integration from marketplace
   */
  private async loadIntegration(integrationName: string): Promise<any> {
    const cacheKey = `integrations/${integrationName}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const moduleId = `integrations/${integrationName}`;
      
      // Load module config and blueprint using centralized services
      const integrationJson = await MarketplaceService.loadModuleConfig(moduleId);
      const blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
      
      const integration = {
        config: integrationJson,
        blueprint: blueprint
      };
      
      // Cache the result
      this.cache.set(cacheKey, integration);
      
      return integration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to load integration ${integrationName}`, {
        operation: 'load_integration',
        error: errorMessage,
        stack: errorStack,
        integrationName
      });
      console.error(`Detailed error for integration ${integrationName}:`, error);
      return null;
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
      const moduleId = `${category}/${adapterId}`;
      
      // Load module config and blueprint using centralized services
      const adapterJson = await MarketplaceService.loadModuleConfig(moduleId);
      const blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
      
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
   * Load feature from marketplace
   */
  private async loadFeature(featureName: string): Promise<any> {
    const cacheKey = `features/${featureName}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const moduleId = `features/${featureName}`;
      
      // Load feature config and blueprint using centralized services
      const featureJson = await MarketplaceService.loadModuleConfig(moduleId);
      const blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
      
      const feature = {
        config: featureJson,
        blueprint: blueprint
      };
      
      // Cache the result
      this.cache.set(cacheKey, feature);
      
      return feature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to load feature ${featureName}`, {
        operation: 'load_feature',
        error: errorMessage,
        stack: errorStack,
        featureName
      });
      console.error(`Detailed error for feature ${featureName}:`, error);
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

/**
 * Unified Module Service
 * 
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */

import { Module, Genome } from '@thearchitech.xyz/marketplace';
import { AdapterConfig, Blueprint, BaseProjectContext } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { convertGenomeModuleToModule, convertGenomeModulesToModules } from './genome-module-converter.js';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { CacheManagerService } from '../infrastructure/cache/cache-manager.js';
import { ErrorHandler } from '../infrastructure/error/index.js';
import { FrameworkContextService } from '../project/framework-context-service.js';
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
      // Read frameworks from project.apps (single source of truth)
      const apps = (genome.project as any)?.apps as Array<any> | undefined;
      const legacyFramework = (genome.project as any)?.framework as string | undefined;

      if ((!apps || apps.length === 0) && !legacyFramework) {
        const error = ErrorHandler.createError(
          'No apps or framework defined in project. At least one app/framework is required.',
          { operation: 'framework_setup' },
          ErrorCode.CONFIG_VALIDATION_ERROR,
          false
        );
        return { success: false, error: error.error };
      }

      // 1) Create path service once (framework config may be augmented by adapters later)
      const pathService = new PathService(
        pathHandler.getProjectRoot(),
        pathHandler.getProjectName(),
        {} as any
      );

      const { BlueprintExecutor } = await import('../execution/blueprint/blueprint-executor.js');
      const { VirtualFileSystem } = await import('../file-system/file-engine/virtual-file-system.js');

      const appsToSetup: Array<{ id: string; type: string; framework: string; package?: string; parameters?: Record<string, unknown> }> =
        (apps && apps.length > 0)
          ? apps.map(a => ({ id: a.id, type: a.type, framework: a.framework, package: a.package, parameters: a.parameters || {} }))
          : [{ id: 'app', type: 'web', framework: legacyFramework as string, package: undefined, parameters: {} }];

      // Determine primary app for central path keys (prefer web)
      const primaryApp = appsToSetup.find(a => a.type === 'web') || appsToSetup[0];

      for (const app of appsToSetup) {
        Logger.info(`🏗️ Loading framework adapter for app '${app.id}': ${app.framework}`, {
          operation: 'framework_setup'
        });

        const frameworkAdapter = await this.loadAdapter('adapters/framework', app.framework);
        if (!frameworkAdapter) {
          return {
            success: false,
            error: `Failed to load framework adapter: adapters/framework/${app.framework}`
          };
        }

        // Initialize centralized path handling from the PRIMARY app's framework config
        if (app === primaryApp && frameworkAdapter.config?.paths) {
          pathService.setFrameworkPaths(frameworkAdapter.config.paths);
        }

        Logger.info('🏗️ Executing framework blueprint to create initial project structure', {
          operation: 'framework_setup'
        });

        const projectContext: any = {
          project: genome.project,
          module: { id: `adapters/framework/${app.framework}`, category: 'framework', parameters: app.parameters || {} } as any,
          framework: app.framework,
          app,
          pathHandler: pathService
        };

        const frameworkVFS = new VirtualFileSystem(
          `framework-${app.id}-${frameworkAdapter.blueprint.id}`,
          pathService.getProjectRoot()
        );

        const blueprintExecutor = new BlueprintExecutor(pathService.getProjectRoot());
        const frameworkResult = await blueprintExecutor.executeBlueprint(
          frameworkAdapter.blueprint,
          projectContext,
          frameworkVFS
        );

        if (!frameworkResult.success) {
          return {
            success: false,
            error: `Framework blueprint execution failed for '${app.id}': ${frameworkResult.errors?.join(', ') || 'Unknown error'}`
          };
        }

        await frameworkVFS.flushToDisk();
      }

      Logger.info('✅ Framework setup completed for all apps', {
        operation: 'framework_setup'
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
      // Use dumb path translation - no intelligence needed
      const translatedPath = await PathService.resolveModuleId(module.id);
      
      // Try to load as any module type - completely dumb approach
      let moduleData = null;
      
      // Try loading based on path prefix first (more efficient)
      if (translatedPath.startsWith('features/')) {
        try {
          const featureName = translatedPath.replace('features/', '');
          moduleData = await this.loadFeature(featureName);
        } catch {
          // Fall through to try other types
        }
      }
      
      if (!moduleData) {
        // Try loading as integration (covers connectors)
        try {
          moduleData = await this.loadIntegration(translatedPath);
        } catch {
          // Try loading as adapter
          try {
            const adapterPath = translatedPath.replace('adapters/', '');
            const [category, adapterId] = adapterPath.split('/');
            if (category && adapterId) {
              moduleData = await this.loadAdapter(category, adapterId);
            }
          } catch {
            // All attempts failed
          }
        }
      }
      
      if (!moduleData) {
        return {
          success: false,
          error: `Failed to load module: ${module.id}. Tried all module types.`
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
  async createProjectContext(
    genome: Genome,
    pathHandler: PathService,
    module: Module
  ): Promise<ProjectContextResult> {
    try {
      // Convert modules array to Record<string, Module>
      const modulesRecord: Record<string, Module> = {};
      const convertedModules = convertGenomeModulesToModules(genome.modules);
      convertedModules.forEach(mod => {
        modulesRecord[mod.id] = mod;
      });

      const context: ProjectContext = await FrameworkContextService.createProjectContext(
        genome,
        module,
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
   * Load integration from marketplace
   */
  private async loadIntegration(integrationPath: string): Promise<any> {
    const cacheKey = integrationPath;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Load module config and blueprint using centralized services
      const integrationJson = await MarketplaceService.loadModuleConfig(integrationPath);
      const blueprint = await MarketplaceService.loadModuleBlueprint(integrationPath);
      
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
      Logger.error(`Failed to load integration ${integrationPath}`, {
        operation: 'load_integration',
        error: errorMessage,
        stack: errorStack,
        integrationPath
      });
      console.error(`Detailed error for integration ${integrationPath}:`, error);
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
   * Handles both direct feature references and subdirectory structure
   */
  private async loadFeature(featureName: string): Promise<any> {
    const cacheKey = `features/${featureName}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try different feature path patterns
      const possiblePaths = [
        `features/${featureName}`, // Direct feature reference (e.g., features/architech-welcome)
        `features/${featureName}/frontend/shadcn`, // Subdirectory structure (e.g., features/auth/frontend/shadcn)
        `features/${featureName}/shadcn`, // Alternative subdirectory structure
        `features/${featureName}/nextjs`, // Another alternative
      ];

      let featureJson: any = null;
      let blueprint: any = null;
      let successfulPath: string | null = null;

      // Try each possible path until one works
      for (const moduleId of possiblePaths) {
        try {
          featureJson = await MarketplaceService.loadModuleConfig(moduleId);
          blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
          successfulPath = moduleId;
          break;
        } catch {
          // Continue trying next path
          continue;
        }
      }

      if (!featureJson || !blueprint) {
        throw new Error(`Feature not found: ${featureName}. Tried paths: ${possiblePaths.join(', ')}`);
      }

      const feature = {
        config: featureJson,
        blueprint: blueprint,
        path: successfulPath
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

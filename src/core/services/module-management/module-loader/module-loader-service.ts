/**
 * Module Loader Service
 * 
 * Handles module loading, adapter resolution, and context creation.
 * Extracted from OrchestratorAgent to improve separation of concerns.
 */

import { Module, Recipe, ProjectContext, AdapterConfig, Adapter } from '@thearchitech.xyz/types';
import { AdapterLoader } from '../adapter/adapter-loader.js';
import { PathService } from '../../path/path-service.js';
import { ErrorHandler, ErrorCode } from '../../infrastructure/error/index.js';
import { ModuleFetcherService } from '../fetcher/module-fetcher.js';

export interface ModuleLoadResult {
  success: boolean;
  adapter?: Adapter;
  context?: ProjectContext;
  error?: string;
}

export interface FrameworkSetupResult {
  success: boolean;
  pathHandler?: PathService;
  error?: string;
}

export class ModuleLoaderService {
  private adapterLoader: AdapterLoader;
  private moduleFetcher: ModuleFetcherService;

  constructor(moduleFetcher: ModuleFetcherService) {
    this.moduleFetcher = moduleFetcher;
    this.adapterLoader = new AdapterLoader(moduleFetcher);
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

      console.log(`🏗️ Loading framework adapter: ${frameworkModule.id}`);

      // 2. Load framework adapter
      const adapterId = frameworkModule.id.split('/').pop() || frameworkModule.id;
      const frameworkAdapter = await this.adapterLoader.loadAdapter(
        frameworkModule.category,
        adapterId
      );

      // 3. Create path service with framework configuration
      const pathService = new PathService(
        pathHandler.getProjectRoot(),
        pathHandler.getProjectName(),
        frameworkAdapter.config
      );

      console.log(`📁 Framework paths configured:`, pathService.getAvailablePaths());

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
      const adapter = await this.adapterLoader.loadAdapter(module.category, adapterId);

      return {
        success: true,
        adapter: adapter
      };
    } catch (error) {
      const errorResult = ErrorHandler.createError(
        `Failed to load module ${module.id} (${module.category}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          operation: 'module_loading', 
          moduleId: module.id,
          agentCategory: module.category
        },
        ErrorCode.MODULE_LOADING_ERROR,
        true,
        `Check module configuration and dependencies`
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
    module: Module,
    adapter: AdapterConfig,
    pathHandler: PathService
  ): ProjectContext {
    // Create a context that includes all modules for template processing
    const allModules = recipe.modules.reduce((acc, mod) => {
      acc[mod.id] = mod;
      return acc;
    }, {} as Record<string, Module>);

    const context: ProjectContext = {
      project: {
        ...recipe.project,
        path: pathHandler.getProjectRoot()
      },
      module: module,
      pathHandler: pathHandler,
      adapter: adapter,
      framework: recipe.project.framework,
      // Add all modules to context for template processing
      modules: allModules
    };

    // Add specific module parameters for easy access
    const databaseModule = recipe.modules.find(m => m.category === 'database');
    if (databaseModule) context.databaseModule = databaseModule;

    const paymentModule = recipe.modules.find(m => m.category === 'payment');
    if (paymentModule) context.paymentModule = paymentModule;

    const authModule = recipe.modules.find(m => m.category === 'auth');
    if (authModule) context.authModule = authModule;

    const emailModule = recipe.modules.find(m => m.category === 'email');
    if (emailModule) context.emailModule = emailModule;

    const observabilityModule = recipe.modules.find(m => m.category === 'observability');
    if (observabilityModule) context.observabilityModule = observabilityModule;

    const stateModule = recipe.modules.find(m => m.category === 'state');
    if (stateModule) context.stateModule = stateModule;

    const uiModule = recipe.modules.find(m => m.category === 'ui');
    if (uiModule) context.uiModule = uiModule;

    const testingModule = recipe.modules.find(m => m.category === 'testing');
    if (testingModule) context.testingModule = testingModule;

    const deploymentModule = recipe.modules.find(m => m.category === 'deployment');
    if (deploymentModule) context.deploymentModule = deploymentModule;

    const contentModule = recipe.modules.find(m => m.category === 'content');
    if (contentModule) context.contentModule = contentModule;

    const blockchainModule = recipe.modules.find(m => m.category === 'blockchain');
    if (blockchainModule) context.blockchainModule = blockchainModule;

    return context;
  }

  /**
   * Validate module requirements
   */
  validateModule(module: Module): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!module.id) {
      errors.push('Module ID is required');
    }

    if (!module.category) {
      errors.push('Module category is required');
    }

    if (!module.version) {
      errors.push('Module version is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get module dependencies
   */
  getModuleDependencies(module: Module, allModules: Module[]): Module[] {
    // Simple dependency resolution - in a real implementation,
    // this would parse the adapter's dependencies and resolve them
    const dependencies: Module[] = [];

    // Framework modules should be executed first
    if (module.category !== 'framework') {
      const frameworkModule = allModules.find(m => m.category === 'framework');
      if (frameworkModule) {
        dependencies.push(frameworkModule);
      }
    }

    return dependencies;
  }

  /**
   * Sort modules by execution order
   */
  sortModulesByExecutionOrder(modules: Module[]): Module[] {
    const sorted: Module[] = [];
    const remaining = [...modules];
    const processed = new Set<string>();

    // First, add framework modules
    const frameworkModules = remaining.filter(m => m.category === 'framework');
    sorted.push(...frameworkModules);
    frameworkModules.forEach(m => processed.add(m.id));

    // Then add other modules
    while (remaining.length > 0) {
      const module = remaining.shift();
      if (!module) break;

      if (!processed.has(module.id)) {
        sorted.push(module);
        processed.add(module.id);
      }
    }

    return sorted;
  }
}


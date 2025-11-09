/**
 * Framework Context Service
 * 
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 * 
 * This service is framework-agnostic and relies entirely on marketplace data.
 */

import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Genome, Module } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { ImportPathResolver } from '../path/import-path-resolver.js';
import * as path from 'path';

export interface FrameworkContextConfig {
  pathResolution: {
    basePaths: Record<string, string>;
    parameterBased: Record<string, string>;
  };
  environment: {
    default: Record<string, string>;
    frameworkSpecific: Record<string, string>;
  };
  conventions: {
    fileExtensions: string[];
    importStyle: 'relative' | 'absolute' | 'alias';
    aliasPrefix: string;
    [key: string]: any;
  };
}

export class FrameworkContextService {
  /**
   * Create dynamic ProjectContext based on framework and parameters
   */
  static async createProjectContext(
    genome: Genome,
    module: Module,
    pathHandler: PathService,
    modulesRecord: Record<string, Module>
  ): Promise<ProjectContext> {
    try {
      // Support new multi-app project model
      let framework = (genome.project as any).framework as string | undefined;
      const apps = (genome.project as any).apps as Array<any> | undefined;
      if (apps && apps.length > 0) {
        const preferred = apps.find(a => a.type === 'web') || apps[0];
        framework = preferred.framework;
      }
      const frameworkModule = framework ? (modulesRecord[`adapters/framework/${framework}`] || modulesRecord[`framework/${framework}`]) : undefined;
      
      if (!frameworkModule) {
        Logger.warn(`Framework module not found: adapters/framework/${framework} or framework/${framework}, using fallback configuration`);
        return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
      }

      // Load framework configuration from marketplace
      const frameworkConfig = framework ? await this.loadFrameworkConfig(frameworkModule) : null;
      
      if (!frameworkConfig) {
        Logger.warn(`Framework configuration not found: ${framework}, using fallback configuration`);
        return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
      }

      // Create dynamic paths based on framework and parameters
      // NOTE: Path initialization is now handled centrally by PathInitializationService
      // before module execution, so we only need to resolve framework-specific paths
      // for the context object (not for pathHandler)
      const paths = framework ? await this.resolveFrameworkPaths(framework, frameworkModule?.parameters, frameworkConfig, genome) : {} as any;
      
      // Create environment context
      const env = await this.createEnvironmentContext(genome, frameworkModule.parameters, frameworkConfig);
      
      // Create project context
      // NOTE: paths are now read from pathHandler (already initialized by PathInitializationService)
      // We only need framework-specific paths for the context object
      const contextPaths: Record<string, string> = { ...paths };
      
      // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
      // Marketplace UI is initialized once by PathInitializationService and read-only after
      const marketplaceNamespaces = pathHandler.getMarketplaceNamespaces();
      const marketplaceUI = pathHandler.getMarketplaceUI();
      
      const context: ProjectContext = {
        project: {
          name: genome.project.name,
          framework: framework || (genome.project as any).framework || 'unknown',
          path: genome.project.path || './',
          description: (genome.project as any).description,
          author: (genome.project as any).author,
          version: (genome.project as any).version,
          license: (genome.project as any).license
        },
        module: module,
        framework: framework || 'unknown',
        paths: contextPaths,
        modules: modulesRecord,
        pathHandler: pathHandler,
        env: env,
        parameters: (genome as any).options || {},
        
        // Add import path helper function
        importPath: (filePath: string) => ImportPathResolver.resolveImportPath(filePath, context),
        
        // Add marketplace paths for template resolution
        // NOTE: Marketplace UI is initialized by PathInitializationService (single source of truth)
        marketplace: {
          core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : (marketplaceNamespaces['components.core'] || ''),
          ui: marketplaceUI,
          namespaces: marketplaceNamespaces
        } as any,
      };

      Logger.info(`✅ Created dynamic context for framework: ${framework}`, {
        operation: 'framework_context_creation',
        framework: framework,
        pathCount: Object.keys(paths).length,
        envCount: Object.keys(env).length
      });

      return context;
    } catch (error) {
      Logger.error(`❌ Failed to create framework context: ${error}`, {
        operation: 'framework_context_creation',
        framework: (genome.project as any).framework,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to basic context
      return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
    }
  }

  /**
   * Load framework configuration from marketplace
   */
  private static async loadFrameworkConfig(
    frameworkModule: Module | undefined
  ): Promise<FrameworkContextConfig | null> {
    try {
      if (!frameworkModule) {
        return null;
      }
      const adapterConfig = await MarketplaceService.loadModuleConfig(frameworkModule);
      
      if (!adapterConfig || !adapterConfig.context) {
        return null;
      }

      return adapterConfig.context as FrameworkContextConfig;
    } catch (error) {
      Logger.error(`Failed to load framework config for ${frameworkModule?.id || '<unknown framework>'}: ${error}`);
      return null;
    }
  }

  /**
   * Resolve framework-specific paths
   */
  private static async resolveFrameworkPaths(
    framework: string,
    params: Record<string, any>,
    config: FrameworkContextConfig,
    genome: Genome  // NOUVEAU: ajouter genome pour transformation
  ): Promise<any> {
    const basePaths = { ...config.pathResolution.basePaths };
    const resolvedPaths: Record<string, string> = {};

    // Process each path with parameter substitution
    for (const [key, pathTemplate] of Object.entries(basePaths)) {
      try {
        resolvedPaths[key] = await this.resolvePathTemplate(pathTemplate, params);
      } catch (error) {
        Logger.warn(`Failed to resolve path ${key}: ${error}`);
        resolvedPaths[key] = pathTemplate; // Fallback to original
      }
    }

    // Transform paths according to project structure (single-app vs monorepo)
    return this.transformPathsForStructure(resolvedPaths, genome);
  }

  /**
   * Transform framework adapter paths according to project structure
   * Single app: paths stay as-is
   * Monorepo: paths are moved to appropriate packages based on initialized structure
   */
  private static transformPathsForStructure(
    frameworkPaths: Record<string, string>,
    genome: Genome
  ): Record<string, string> {
    const isMonorepo = genome.project.structure === 'monorepo';
    
    if (!isMonorepo || !genome.project.monorepo) {
      // Single app: return paths as-is
      return frameworkPaths;
    }
    
    const pkgs = (genome.project.monorepo as any).packages || {};
    const sharedPkg = pkgs.shared || null;
    const webPkg = pkgs.web || null;
    const apiPkg = pkgs.api || null;
    
    const transformed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(frameworkPaths)) {
      // Determine target package based on path key and value
      const targetPackage = this.determineTargetPackageForPath(key, value, pkgs);
      
      if (targetPackage) {
        transformed[key] = this.transformPath(value, targetPackage);
      } else {
        // Keep path as-is (root-level paths like scripts/, public/, etc.)
        transformed[key] = value;
      }
    }
    
    return transformed;
  }

  /**
   * Determine which package a path should go to based on initialized structure
   */
  private static determineTargetPackageForPath(
    key: string,
    value: string,
    packages: Record<string, string>
  ): string | null {
    // Shared package paths (auth, database, payment, etc.)
    if (this.isSharedPath(key, value)) {
      return packages.shared || null;
    }
    
    // Web app paths (components, pages, app routes)
    if (this.isWebPath(key, value)) {
      return packages.web || null;
    }
    
    // API paths (api routes, handlers)
    if (this.isApiPath(key, value)) {
      return packages.api || null;
    }
    
    // Root-level paths (scripts, public, etc.)
    return null;
  }

  /**
   * Check if path should go to shared package
   */
  private static isSharedPath(key: string, value: string): boolean {
    // Path keys that indicate shared code
    const sharedKeys = [
      'auth_config', 'database_config', 'payment_config',
      'email_config', 'observability_config', 'state_config',
      'testing_config', 'blockchain_config', 'content_config',
      'shared_library'
    ];
    
    // Path patterns that indicate shared code
    const sharedPatterns = [
      'auth', 'database', 'db', 'payment', 'email',
      'observability', 'state', 'testing', 'blockchain', 'content'
    ];
    
    // Check key
    if (sharedKeys.some(k => key.includes(k))) {
      return true;
    }
    
    // Check value pattern
    if (value.includes('lib/') && sharedPatterns.some(p => value.includes(p))) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if path should go to web app
   */
  private static isWebPath(key: string, value: string): boolean {
    const webKeys = ['components', 'ui_components', 'layouts', 'providers', 'pages_root'];
    const webPatterns = ['components', 'app/', 'pages/'];
    
    if (webKeys.includes(key)) {
      return true;
    }
    
    if (webPatterns.some(p => value.includes(p))) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if path should go to API package
   */
  private static isApiPath(key: string, value: string): boolean {
    const apiKeys = ['api_routes', 'api_handlers'];
    const apiPatterns = ['api/'];
    
    if (apiKeys.includes(key)) {
      return true;
    }
    
    if (apiPatterns.some(p => value.includes(p))) {
      return true;
    }
    
    return false;
  }

  /**
   * Transform a path to target package
   */
  private static transformPath(path: string, targetPackage: string): string {
    // Remove leading './' if present
    const cleanPath = path.startsWith('./') ? path.slice(2) : path;
    
    // Handle src/lib/ paths (most common for shared code)
    if (cleanPath.startsWith('src/lib/')) {
      const rest = cleanPath.replace('src/lib/', '');
      return `${targetPackage}/src/${rest}`;
    }
    
    // Handle src/ paths (for components, etc.)
    if (cleanPath.startsWith('src/')) {
      return `${targetPackage}/${cleanPath}`;
    }
    
    // Handle app/ paths (for Next.js app router)
    if (cleanPath.startsWith('app/')) {
      return `${targetPackage}/${cleanPath}`;
    }
    
    // For other paths, prepend target package
    return `${targetPackage}/${cleanPath}`;
  }

  /**
   * Resolve path template with parameter substitution
   */
  private static async resolvePathTemplate(template: string, params: Record<string, any>): Promise<string> {
    // Simple template resolution for now
    // TODO: Implement more sophisticated template engine if needed
    let resolved = template;
    
    // Replace {{param}} with actual values
    const paramRegex = /\{\{([^}]+)\}\}/g;
    resolved = resolved.replace(paramRegex, (match, expression) => {
      try {
        // Handle simple expressions like "srcDir ? 'src/' : ''"
        if (expression.includes('?')) {
          return this.evaluateConditionalExpression(expression, params);
        }
        
        // Handle simple parameter substitution
        if (expression.includes('||')) {
          const [param, fallback] = expression.split('||').map((s: string) => s.trim());
          return params[param] || fallback.replace(/['"]/g, '');
        }
        
        // Direct parameter access
        return params[expression] || '';
      } catch (error) {
        Logger.warn(`Failed to resolve expression ${expression}: ${error}`);
        return match; // Return original if resolution fails
      }
    });

    return resolved;
  }

  /**
   * Evaluate conditional expressions like "srcDir ? 'src/' : ''"
   */
  private static evaluateConditionalExpression(expression: string, params: Record<string, any>): string {
    const parts = expression.split(/[?:]/).map((s: string) => s.trim());
    const condition = parts[0] || '';
    const trueValue = parts[1] || '';
    const falseValue = parts[2] || '';
    
    if (!condition) {
      return '';
    }
    
    const conditionValue = params[condition];
    const result = conditionValue ? trueValue : falseValue;
    
    // Remove quotes from result
    return result ? result.replace(/['"]/g, '') : '';
  }

  /**
   * Create environment context
   */
  private static async createEnvironmentContext(
    genome: Genome,
    frameworkParams: Record<string, any>,
    config: FrameworkContextConfig
  ): Promise<Record<string, string>> {
    const baseEnv = { ...config.environment.default };
    const frameworkEnv: Record<string, string> = {};

    // Process framework-specific environment variables
    for (const [key, valueTemplate] of Object.entries(config.environment.frameworkSpecific)) {
      try {
        frameworkEnv[key] = await this.resolvePathTemplate(valueTemplate, frameworkParams);
      } catch (error) {
        Logger.warn(`Failed to resolve environment variable ${key}: ${error}`);
        frameworkEnv[key] = valueTemplate;
      }
    }

    return { ...baseEnv, ...frameworkEnv };
  }

  // NOTE: addSmartPaths has been moved to PathInitializationService
  // This method is no longer needed as paths are initialized centrally before module execution

  /**
   * Create fallback context when framework config is not available
   */
  private static async createFallbackContext(
    genome: Genome,
    module: Module,
    pathHandler: PathService,
    modulesRecord: Record<string, Module>
  ): Promise<ProjectContext> {
    Logger.warn('Using fallback context configuration', {
      operation: 'framework_context_creation',
      framework: ((genome.project as any).apps && (genome.project as any).apps[0]?.framework) || (genome.project as any).framework || 'unknown'
    });

    const basePaths: Record<string, string> = {
      app_root: './',
      components: './src/components',
      shared_library: './src/lib',
      styles: './src/styles',
      scripts: './src/scripts',
      hooks: './src/hooks'
    };
    
    // Add monorepo-specific paths if monorepo structure detected (even in fallback)
    let paths: Record<string, string> = { ...basePaths };
    if (genome.project.structure === 'monorepo' && genome.project.monorepo) {
      const pkgs = (genome.project.monorepo as any).packages || {};
      const apps = (genome.project as any).apps || [];
      
      // Determine actual app and package locations
      const apiApp = apps.find((a: any) => a.type === 'api' || a.framework === 'hono');
      const webApp = apps.find((a: any) => a.type === 'web');
      
      // Resolve package paths with proper structure
      const apiPath = apiApp?.package || pkgs.api || './apps/api/';
      const webPath = webApp?.package || pkgs.web || './apps/web/';
      const sharedPath = pkgs.shared || './packages/shared/';
      const databasePath = pkgs.database || './packages/database/';
      const uiPath = pkgs.ui || './packages/ui/';
      
      // Ensure paths end with / for consistency
      const normalizePath = (p: string) => p.endsWith('/') ? p : `${p}/`;
      
      // Provide comprehensive path mapping for monorepo
      paths = {
        ...basePaths,
        // App paths
        api: normalizePath(apiPath),
        web: normalizePath(webPath),
        mobile: pkgs.mobile ? normalizePath(pkgs.mobile) : './apps/mobile/',
        
        // Package paths
        shared: normalizePath(sharedPath),
        database: normalizePath(databasePath),
        ui: normalizePath(uiPath),
        
        // Sub-paths (commonly used patterns)
        // NOTE: shared package does NOT use /src subfolder (cleaner structure)
        shared_library: `${normalizePath(sharedPath)}lib/`,
        api_src: `${normalizePath(apiPath)}src/`,
        api_routes: `${normalizePath(apiPath)}src/routes/`,
        web_src: `${normalizePath(webPath)}src/`,
        web_app: `${normalizePath(webPath)}src/app/`,
        
        // Legacy compatibility paths
        src: webApp ? `${normalizePath(webPath)}src/` : './src/',
        lib: `${normalizePath(sharedPath)}lib/`,  // packages/shared/lib/ (no src/ subfolder)
      };
      
      // Add all resolved paths to PathService.pathMap for variable resolution
      for (const [key, value] of Object.entries(paths)) {
        if (typeof value === 'string') {
          pathHandler.setPath(key, value);
        }
      }
    }
    
    // NOTE: Smart paths are now handled by PathInitializationService
    // We only need basic paths for fallback context
    
    // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
    // Marketplace UI is initialized once by PathInitializationService and read-only after
    const marketplaceNamespaces = pathHandler.getMarketplaceNamespaces();
    const marketplaceUI = pathHandler.getMarketplaceUI();
    
    const context: ProjectContext = {
      project: {
        name: genome.project.name,
        path: genome.project.path || './',
        framework: ((genome.project as any).apps && (genome.project as any).apps[0]?.framework) || (genome.project as any).framework || 'unknown',
        description: (genome.project as any).description,
        author: (genome.project as any).author,
        version: (genome.project as any).version,
        license: (genome.project as any).license
      },
      module: module,
      framework: ((genome.project as any).apps && (genome.project as any).apps[0]?.framework) || (genome.project as any).framework || 'unknown',
      paths: paths,
      modules: modulesRecord,
      pathHandler: pathHandler,
      env: {
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development'
      },
      marketplace: {
        core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : (marketplaceNamespaces['components.core'] || ''),
        ui: marketplaceUI,
        namespaces: marketplaceNamespaces
      } as any
    };
    
    // Add import path helper
    context.importPath = (filePath: string) => ImportPathResolver.resolveImportPath(filePath, context);
    
    // Add marketplace paths for template resolution
    context.marketplace = {
      core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : (marketplaceNamespaces['components.core'] || ''),
      ui: marketplaceUI,
      namespaces: marketplaceNamespaces
    } as any;
    
    return context;
  }
}


/**
 * Framework Context Service
 * 
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 * 
 * This service is framework-agnostic and relies entirely on marketplace data.
 */

import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Genome, ResolvedGenome, Module } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { getProjectFramework, getProjectApps, getProjectProperty } from '../../utils/genome-helpers.js';
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
    genome: ResolvedGenome,
    module: Module,
    pathHandler: PathService,
    modulesRecord: Record<string, Module>
  ): Promise<ProjectContext> {
    try {
      // Get framework using type-safe helper (handles both new and legacy structures)
      const framework = getProjectFramework(genome);
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
      // We need to convert flat dot-notation paths to nested structure for EJS templates
      // EJS templates expect: paths.packages.shared.src, not paths['packages.shared.src']
      const nestedPaths = this.buildNestedPathsObject(pathHandler);
      
      // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
      // Marketplace UI is initialized once by PathInitializationService and read-only after
      const marketplaceUI = pathHandler.getMarketplaceUI();
      const uiMarketplacePath = pathHandler.hasPath('ui.marketplace')
        ? pathHandler.getPath('ui.marketplace')
        : pathHandler.hasPath('ui.path')
          ? pathHandler.getPath('ui.path')
          : '';
      
      const context: ProjectContext = {
        project: {
          name: genome.project.name,
          framework: framework || 'unknown',
          path: genome.project.path || './',
          description: getProjectProperty(genome, 'description'),
          author: getProjectProperty(genome, 'author'),
          version: getProjectProperty(genome, 'version'),
          license: getProjectProperty(genome, 'license')
        },
        module: module,
        framework: framework || 'unknown',
        paths: nestedPaths,
        modules: modulesRecord,
        pathHandler: pathHandler,
        env: env,
        parameters: (genome as any).options || {},
        
        // Add import path helper function
        importPath: (filePath: string) => PathService.resolveImportPath(filePath, context),
        
        // Add marketplace paths for template resolution
        // NOTE: Marketplace UI is initialized by PathInitializationService (single source of truth)
        marketplace: {
          core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : '',
          ui: {
            ...marketplaceUI,
            default: marketplaceUI.default || uiMarketplacePath || '',
            root: uiMarketplacePath
          }
        },
        
        // Initialize enriched properties (will be populated by OrchestratorAgent)
        params: {},
        platforms: { web: false, mobile: false },
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
        framework: getProjectFramework(genome) || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to basic context
      return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
    }
  }

  /**
   * Convert flat dot-notation path keys to nested object structure
   * Example: { 'packages.shared.src': './packages/shared/src' }
   *       -> { packages: { shared: { src: './packages/shared/src' } } }
   * 
   * This is needed because EJS templates expect nested access like:
   * paths.packages.shared.src.payment.config
   */
  private static buildNestedPathsObject(pathHandler: PathService): Record<string, any> {
    const nested: Record<string, any> = {};
    const allPathKeys = pathHandler.getAvailablePaths();
    
    for (const key of allPathKeys) {
      try {
        const value = pathHandler.getPath(key);
        this.setNestedValue(nested, key, value);
      } catch (error) {
        // Skip paths that can't be retrieved
        continue;
      }
    }
    
    return nested;
  }

  /**
   * Set nested value in object using dot notation
   * Creates intermediate objects as needed
   * @private
   */
  private static setNestedValue(obj: Record<string, any>, path: string, value: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    // Navigate/create intermediate objects
    let current = obj;
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the final value
    current[lastKey] = value;
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
    genome: ResolvedGenome,
    module: Module,
    pathHandler: PathService,
    modulesRecord: Record<string, Module>
  ): Promise<ProjectContext> {
    Logger.warn('Using fallback context configuration', {
      operation: 'framework_context_creation',
      framework: getProjectFramework(genome) || 'unknown'
    });

    // NOTE: Paths should already be initialized by PathInitializationService
    // This fallback only provides minimal paths if initialization somehow failed
    // Use PathKey enum values for consistency
    const { PathKey } = await import('@thearchitech.xyz/types');
    
    const basePaths: Record<string, string> = {
      [PathKey.APPS_WEB_APP]: './src/app/',
      [PathKey.APPS_WEB_COMPONENTS]: './src/components/',
      [PathKey.PACKAGES_SHARED_SRC]: './src/lib/',
      [PathKey.WORKSPACE_SCRIPTS]: './scripts/',
      [PathKey.PACKAGES_SHARED_HOOKS]: './src/hooks/'
    };
    
    // Add monorepo-specific paths if monorepo structure detected (even in fallback)
    let paths: Record<string, string> = { ...basePaths };
    if (genome.project.structure === 'monorepo' && genome.project.monorepo) {
      const pkgs = (genome.project.monorepo as any).packages || {};
      const apps = getProjectApps(genome);
      
      const apiApp = apps.find((a: any) => a.type === 'api' || a.framework === 'hono');
      const webApp = apps.find((a: any) => a.type === 'web');
      
      const apiPath = apiApp?.package || pkgs.api || './apps/api/';
      const webPath = webApp?.package || pkgs.web || './apps/web/';
      const sharedPath = pkgs.shared || './packages/shared/';
      const databasePath = pkgs.database || './packages/database/';
      const uiPath = pkgs.ui || './packages/ui/';
      
      const normalizePath = (p: string) => p.endsWith('/') ? p : `${p}/`;
      
      paths = {
        ...basePaths,
        [PathKey.APPS_API_ROOT]: normalizePath(apiPath),
        [PathKey.APPS_API_SRC]: `${normalizePath(apiPath)}src/`,
        [PathKey.APPS_API_ROUTES]: `${normalizePath(apiPath)}src/routes/`,
        [PathKey.APPS_WEB_ROOT]: normalizePath(webPath),
        [PathKey.APPS_WEB_SRC]: `${normalizePath(webPath)}src/`,
        [PathKey.APPS_WEB_APP]: `${normalizePath(webPath)}src/app/`,
        [PathKey.APPS_WEB_COMPONENTS]: `${normalizePath(webPath)}src/components/`,
        [PathKey.PACKAGES_SHARED_ROOT]: normalizePath(sharedPath),
        [PathKey.PACKAGES_SHARED_SRC]: `${normalizePath(sharedPath)}src/`,
        [PathKey.PACKAGES_DATABASE_ROOT]: normalizePath(databasePath),
        [PathKey.PACKAGES_DATABASE_SRC]: `${normalizePath(databasePath)}src/`,
        [PathKey.PACKAGES_UI_ROOT]: normalizePath(uiPath),
        [PathKey.PACKAGES_UI_SRC]: `${normalizePath(uiPath)}src/`
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
    // Convert flat paths to nested structure for EJS templates
    const nestedPaths = this.buildNestedPathsObject(pathHandler);
    
    // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
    // Marketplace UI is initialized once by PathInitializationService and read-only after
    const marketplaceUI = pathHandler.getMarketplaceUI();
    const uiMarketplacePath = pathHandler.hasPath('ui.marketplace')
      ? pathHandler.getPath('ui.marketplace')
      : pathHandler.hasPath('ui.path')
        ? pathHandler.getPath('ui.path')
        : '';
    
    const context: ProjectContext = {
      project: {
        name: genome.project.name,
        path: genome.project.path || './',
        framework: getProjectFramework(genome) || 'unknown',
        description: getProjectProperty(genome, 'description'),
        author: getProjectProperty(genome, 'author'),
        version: getProjectProperty(genome, 'version'),
        license: getProjectProperty(genome, 'license')
      },
      module: module,
      framework: getProjectFramework(genome) || 'unknown',
      paths: nestedPaths,
      modules: modulesRecord,
      pathHandler: pathHandler,
      env: {
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development'
      },
      marketplace: {
        core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : '',
        ui: {
          ...marketplaceUI,
          default: marketplaceUI.default || uiMarketplacePath || '',
          root: uiMarketplacePath
        }
      },
      
      // Initialize enriched properties (will be populated by OrchestratorAgent)
      params: {},
      platforms: { web: false, mobile: false },
    };
    
    // Add import path helper
    context.importPath = (filePath: string) => PathService.resolveImportPath(filePath, context);
    
    return context;
  }
}


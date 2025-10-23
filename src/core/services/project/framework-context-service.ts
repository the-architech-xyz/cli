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
import { Logger } from '../infrastructure/logging/logger.js';

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
      const framework = genome.project.framework;
      const frameworkModule = modulesRecord[`framework/${framework}`];
      
      if (!frameworkModule) {
        Logger.warn(`Framework module not found: framework/${framework}, using fallback configuration`);
        return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
      }

      // Load framework configuration from marketplace
      const frameworkConfig = await this.loadFrameworkConfig(framework);
      
      if (!frameworkConfig) {
        Logger.warn(`Framework configuration not found: ${framework}, using fallback configuration`);
        return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
      }

      // Create dynamic paths based on framework and parameters
      const paths = await this.resolveFrameworkPaths(framework, frameworkModule.parameters, frameworkConfig);
      
      // Create environment context
      const env = await this.createEnvironmentContext(genome, frameworkModule.parameters, frameworkConfig);
      
      // Create project context
      const context: ProjectContext = {
        project: {
          ...genome.project,
          path: genome.project.path || './'
        },
        module: module,
        framework: framework,
        paths: paths,
        modules: modulesRecord,
        pathHandler: pathHandler,
        env: env
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
        framework: genome.project.framework,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to basic context
      return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
    }
  }

  /**
   * Load framework configuration from marketplace
   */
  private static async loadFrameworkConfig(framework: string): Promise<FrameworkContextConfig | null> {
    try {
      const adapterPath = `framework/${framework}`;
      const adapterConfig = await MarketplaceService.loadModuleConfig(adapterPath);
      
      if (!adapterConfig || !adapterConfig.context) {
        return null;
      }

      return adapterConfig.context as FrameworkContextConfig;
    } catch (error) {
      Logger.error(`Failed to load framework config for ${framework}: ${error}`);
      return null;
    }
  }

  /**
   * Resolve framework-specific paths
   */
  private static async resolveFrameworkPaths(
    framework: string,
    params: Record<string, any>,
    config: FrameworkContextConfig
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

    return resolvedPaths;
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

  /**
   * Create fallback context when framework config is not available
   */
  private static createFallbackContext(
    genome: Genome,
    module: Module,
    pathHandler: PathService,
    modulesRecord: Record<string, Module>
  ): ProjectContext {
    Logger.warn('Using fallback context configuration', {
      operation: 'framework_context_creation',
      framework: genome.project.framework
    });

    return {
      project: {
        ...genome.project,
        path: genome.project.path || './'
      },
      module: module,
      framework: genome.project.framework,
      paths: {
        app_root: './',
        components: './src/components',
        shared_library: './src/lib',
        styles: './src/styles',
        scripts: './src/scripts',
        hooks: './src/hooks'
      },
      modules: modulesRecord,
      pathHandler: pathHandler,
      env: {
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development'
      }
    };
  }
}


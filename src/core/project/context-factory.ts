/**
 * Context Factory
 * 
 * Creates and manages execution contexts for agents and plugins.
 * Provides a consistent interface for context creation across the system.
 */

import * as path from 'path';
import * as os from 'os';
import { AgentContext, ExecutionOptions, Logger, EnvironmentInfo } from '../../types/agents.js';
import { CommandRunner, PackageManager } from '../cli/command-runner.js';
import { structureService, StructureInfo } from './structure-service.js';

// Helper function to get environment info
function getEnvironmentInfo(): EnvironmentInfo {
  return {
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cwd: process.cwd(),
    env: Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined)
    ) as Record<string, string>
  };
}

export class ContextFactory {
  /**
   * Creates a context for agent execution
   */
  static createContext(
    projectName: string,
    options: Partial<ExecutionOptions> & { packageManager?: PackageManager } = {},
    config: Record<string, any> = {},
    dependencies: string[] = []
  ): AgentContext {
    const projectPath = path.resolve(process.cwd(), projectName);

    // Create command runner
    const runner = new CommandRunner(options.packageManager || 'auto', {
      verbose: options.verbose || false
    });

    // Create logger
    const logger: Logger = {
      info: (message: string) => console.log(`ℹ️  ${message}`),
      success: (message: string) => console.log(`✅ ${message}`),
      warn: (message: string) => console.log(`⚠️  ${message}`),
      error: (message: string, error?: Error) => {
        console.error(`❌ ${message}`);
        if (error && options.verbose) {
          console.error(error);
        }
      },
      debug: (message: string) => {
        if (options.verbose) {
          console.log(`🔍 ${message}`);
        }
      },
      log: (level: any, message: string, context?: any) => {
        console.log(`[${level.toUpperCase()}] ${message}`, context || '');
      }
    };

    // Create execution options
    const executionOptions: ExecutionOptions = {
      verbose: options.verbose || false,
      skipGit: options.skipGit || false,
      skipInstall: options.skipInstall || false,
      useDefaults: options.useDefaults || false,
      force: options.force || false
    };

    // Get environment info
    const environment = getEnvironmentInfo();

    // Create structure info using the centralized service
    const userPreference = config.projectType || 'quick-prototype';
    const structureInfo = structureService.createStructureInfo(userPreference, config.template || 'nextjs-14');

    // Create context
    const context: AgentContext = {
      projectName,
      projectPath,
      packageManager: runner.getPackageManager(),
      options: executionOptions,
      config,
      runner,
      logger,
      state: new Map(),
      dependencies,
      environment,
      // Use the centralized structure service
      projectStructure: structureInfo
    };

    return context;
  }

  /**
   * Creates a context for plugin execution
   */
  static createPluginContext(
    projectName: string,
    projectPath: string,
    pluginId: string,
    pluginConfig: Record<string, any>,
    structure: StructureInfo,
    options: Partial<ExecutionOptions> = {}
  ): any {
    const runner = new CommandRunner('auto', {
      verbose: options.verbose || false
    });
    
    const logger: Logger = {
      info: (message: string) => console.log(`[${pluginId}] ℹ️  ${message}`),
      success: (message: string) => console.log(`[${pluginId}] ✅ ${message}`),
      warn: (message: string) => console.log(`[${pluginId}] ⚠️  ${message}`),
      error: (message: string, error?: Error) => {
        console.error(`[${pluginId}] ❌ ${message}`);
        if (error && options.verbose) {
          console.error(error);
        }
      },
      debug: (message: string) => {
        if (options.verbose) {
          console.log(`[${pluginId}] 🔍 ${message}`);
        }
      },
      log: (level: any, message: string, context?: any) => {
        console.log(`[${pluginId}] [${level.toUpperCase()}] ${message}`, context || '');
      }
    };

    return {
      projectName,
      projectPath,
      packageManager: runner.getPackageManager(),
      options,
      config: pluginConfig,
      runner,
      logger,
      state: new Map(),
      dependencies: [],
      environment: getEnvironmentInfo(),
      pluginId,
      pluginConfig,
      installedPlugins: [],
      projectType: 'nextjs' as any,
      targetPlatform: ['web'] as any,
      // Use the centralized structure service
      projectStructure: structure
    };
  }

  /**
   * Creates a context for the traditional create workflow
   */
  static createTraditionalContext(
    projectName: string,
    template: string,
    modules: string[],
    options: Partial<ExecutionOptions> = {}
  ): AgentContext {
    const config = {
      template,
      modules,
      isMonorepo: false,
      structure: 'single-app'
    };

    return this.createContext(projectName, options, config, modules);
  }
} 
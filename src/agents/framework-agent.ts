/**
 * Framework Agent - Tech-Agnostic Framework Orchestrator
 * 
 * Pure orchestrator for framework setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates framework adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createFrameworkAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IFrameworkProvider } from '../core/interfaces/providers';
import { PluginContext, ProjectType, TargetPlatform, IPlugin, PluginCategory } from '../types/plugins.js';
import {
  AgentContext,
  AgentResult,
  AgentMetadata,
  AgentCapability,
  AgentCategory,
  CapabilityCategory,
  ValidationResult,
  Artifact,
  ValidationError
} from '../types/agents.js';
import { ProjectContext, TechRecommendation } from '../types/smart-questions.js';
import { structureService, StructureInfo } from '../core/project/structure-service.js';

interface FrameworkConfig {
  provider: 'nextjs' | 'react' | 'vue' | 'svelte' | 'angular' | 'nuxt';
  features: {
    typescript: boolean;
    routing: boolean;
    stateManagement: boolean;
    styling: boolean;
    testing: boolean;
  };
  typescript?: {
    strict: boolean;
    paths: Record<string, string>;
    target: string;
  };
  routing?: {
    type: 'file-based' | 'manual' | 'dynamic';
    middleware: boolean;
  };
  stateManagement?: {
    provider: 'zustand' | 'redux' | 'context' | 'none';
    devtools: boolean;
  };
  styling?: {
    provider: 'tailwind' | 'css-modules' | 'styled-components' | 'emotion';
    theme: boolean;
  };
  testing?: {
    provider: 'vitest' | 'jest' | 'playwright';
    coverage: boolean;
  };
}

export class FrameworkAgent extends AbstractAgent {
  private registry: AdapterRegistry;

  constructor() {
    super();
    this.registry = AdapterRegistry.getInstance();
  }

  // ============================================================================
  // AGENT METADATA
  // ============================================================================

  protected getAgentMetadata(): AgentMetadata {
    return {
      name: 'FrameworkAgent',
      version: '3.0.0',
      description: 'Orchestrates framework setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.FRAMEWORK,
      tags: [CoreCategory.FRAMEWORK, 'nextjs', 'react', 'tech-agnostic'],
      dependencies: ['base-project'],
      conflicts: [],
      requirements: [
        {
          type: 'package',
          name: 'fs-extra',
          description: 'File system utilities'
        }
      ],
      license: 'MIT',
      repository: 'https://github.com/the-architech/cli'
    };
  }

  protected getAgentCapabilities(): AgentCapability[] {
    return [
      {
        name: 'framework-setup',
        description: 'Setup framework with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Framework provider',
            required: false,
            defaultValue: 'nextjs'
          },
          {
            name: 'features',
            type: 'object',
            description: 'Framework features',
            required: false,
            defaultValue: {
              typescript: true,
              routing: true,
              stateManagement: false,
              styling: true,
              testing: false
            }
          },
          {
            name: 'typescript',
            type: 'object',
            description: 'TypeScript configuration',
            required: false,
            defaultValue: {
              strict: true,
              paths: {},
              target: 'ES2020'
            }
          },
          {
            name: 'routing',
            type: 'object',
            description: 'Routing configuration',
            required: false,
            defaultValue: {
              type: 'file-based',
              middleware: false
            }
          },
          {
            name: 'stateManagement',
            type: 'object',
            description: 'State management configuration',
            required: false,
            defaultValue: {
              provider: 'zustand',
              devtools: true
            }
          },
          {
            name: 'styling',
            type: 'object',
            description: 'Styling configuration',
            required: false,
            defaultValue: {
              provider: 'tailwind',
              theme: true
            }
          },
          {
            name: CoreCategory.TESTING,
            type: 'object',
            description: 'Testing configuration',
            required: false,
            defaultValue: {
              provider: 'vitest',
              coverage: false
            }
          }
        ],
        examples: [
          {
            name: 'Setup Next.js',
            description: 'Creates framework setup with Next.js using adapters',
            parameters: { provider: 'nextjs', features: { typescript: true, routing: true } },
            expectedResult: 'Complete framework setup with Next.js via adapter'
          },
          {
            name: 'Setup React',
            description: 'Creates framework setup with React using adapters',
            parameters: { provider: 'react', features: { typescript: true, styling: true } },
            expectedResult: 'Framework setup with React via adapter'
          }
        ]
      },
      {
        name: 'framework-validation',
        description: 'Validate framework setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate framework setup',
            description: 'Validates the framework setup using adapters',
            parameters: {},
            expectedResult: 'Framework setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available framework adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const frameworkAdapters = this.registry.getAdaptersForCategory(CoreCategory.FRAMEWORK);
    
    // Convert to IPlugin format for compatibility
    return frameworkAdapters.map(adapter => ({
      getMetadata: () => adapter,
      getRequirements: () => [],
      validate: async () => ({ valid: true, errors: [] }),
      install: async () => ({ success: true, artifacts: [], warnings: [] }),
      uninstall: async () => ({ success: true }),
      update: async () => ({ success: true }),
      getCapabilities: () => [],
      getConfig: () => ({}),
      setConfig: () => {},
      getCompatibility: () => ({ compatible: true, version: '1.0.0' }),
      getDependencies: () => [],
      getConflicts: () => [],
      getDefaultConfig: () => ({}),
      getConfigSchema: () => ({})
    } as unknown as IPlugin));
  }

  /**
   * Get adapter capabilities
   */
  async getPluginCapabilities(pluginId: string): Promise<AgentCapability[]> {
    const adapters = this.registry.listAdapters();
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.FRAMEWORK);
    
    if (!adapter) {
      throw new Error(`Framework adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Framework setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get framework technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.FRAMEWORK);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Framework adapter';

      if (adapter.name === 'nextjs') {
        confidence = 0.9;
        reason = 'Full-stack React framework with excellent developer experience';
      } else if (adapter.name === 'react') {
        confidence = 0.8;
        reason = 'Popular UI library with extensive ecosystem';
      }

      return {
        name: adapter.name,
        reason,
        confidence
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get the plugin categories this agent handles
   */
  getDomainCategories(): PluginCategory[] {
    return [PluginCategory.FRAMEWORK];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting framework orchestration with tech-agnostic adapters...');

      // For monorepo, install framework in the framework package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', CoreCategory.FRAMEWORK);
        context.logger.info(`Framework package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, CoreCategory.FRAMEWORK, packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for framework setup: ${packagePath}`);
      }

      // Select framework adapter
      const selectedAdapter = await this.selectFrameworkAdapter(context);

      // Get framework configuration
      const frameworkConfig = await this.getFrameworkConfig(context);

      // Execute selected framework adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeFrameworkAdapter(context, selectedAdapter, frameworkConfig, packagePath);

      // Validate the setup
      await this.validateFrameworkSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: frameworkConfig.provider,
          features: frameworkConfig.features,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Framework setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'FRAMEWORK_SETUP_FAILED',
        `Failed to setup framework: ${errorMessage}`,
        [],
        startTime,
        error
      );
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  async validate(context: AgentContext): Promise<ValidationResult> {
    const baseValidation = await super.validate(context);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if framework package exists
    const packagePath = this.getPackagePath(context, CoreCategory.FRAMEWORK);
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Framework package directory will be created at: ${packagePath}`);
    }

    // Check if framework adapters are available
    const frameworkAdapters = this.registry.getAdaptersForCategory(CoreCategory.FRAMEWORK);
    if (frameworkAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No framework adapters found in registry',
        code: 'NO_ADAPTERS_FOUND',
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // PRIVATE METHODS - Framework Setup
  // ============================================================================

  private getPackagePath(context: AgentContext, packageName: string): string {
    const structure = context.projectStructure!;
    return structureService.getModulePath(context.projectPath, structure, packageName);
  }

  private async ensurePackageDirectory(context: AgentContext, packageName: string, packagePath: string): Promise<void> {
    const structure = context.projectStructure!;
    
    if (structure.isMonorepo) {
      await fsExtra.ensureDir(packagePath);
      
      const packageJsonPath = path.join(packagePath, 'package.json');
      if (!await fsExtra.pathExists(packageJsonPath)) {
        const packageJson = {
          name: `@${context.projectName}/${packageName}`,
          version: "0.1.0",
          private: true,
          main: "./index.ts",
          types: "./index.ts",
          scripts: {
            "build": "tsc",
            "dev": "tsc --watch",
            "lint": "eslint . --ext .ts,.tsx"
          },
          dependencies: {},
          devDependencies: {
            "typescript": "^5.0.0"
          }
        };
        
        await fsExtra.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
      }
    }
  }

  private async getFrameworkConfig(context: AgentContext): Promise<FrameworkConfig> {
    const userConfig = context.config.framework || {};
    
    return {
      provider: userConfig.provider || 'nextjs',
      features: {
        typescript: userConfig.features?.typescript !== false,
        routing: userConfig.features?.routing !== false,
        stateManagement: userConfig.features?.stateManagement || false,
        styling: userConfig.features?.styling !== false,
        testing: userConfig.features?.testing || false,
      },
      typescript: userConfig.typescript,
      routing: userConfig.routing,
      stateManagement: userConfig.stateManagement,
      styling: userConfig.styling,
      testing: userConfig.testing,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeFrameworkAdapter(
    context: AgentContext,
    adapterName: string,
    frameworkConfig: FrameworkConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createFrameworkAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          frameworkConfig: frameworkConfig,
          provider: adapterName
        },
        env: process.env as Record<string, string>,
        runStep: async (stepId: string, cmd: string) => {
          context.logger.info(`[${stepId}] ${cmd}`);
          if ((context as any).runner) {
            await (context as any).runner.execCommand(cmd.split(' '), { cwd: packagePath });
          } else {
            const { exec } = await import('child_process');
            const util = await import('util');
            const execAsync = util.promisify(exec);
            await execAsync(cmd, { cwd: packagePath });
          }
        },
        log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
          context.logger[level](message);
        }
      };

      context.logger.info(`Executing ${adapterName} adapter...`);
      const result = await adapter.execute(adapterContext);

      // Transform result to expected format
      return {
        artifacts: result.filesGenerated?.map(file => ({ type: 'file', path: file })) || [],
        warnings: result.nextSteps || []
      };
      
    } catch (error) {
      context.logger.error(`Error in executeFrameworkAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateFrameworkSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} framework setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createFrameworkAdapter(adapterName);
      
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {},
        env: process.env as Record<string, string>,
        runStep: async (stepId: string, cmd: string) => {
          context.logger.info(`[VALIDATE:${stepId}] ${cmd}`);
        },
        log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
          context.logger[level](`[VALIDATE] ${message}`);
        }
      };

      // Validate using adapter if it has validation method
      if ('validate' in adapter && typeof adapter.validate === 'function') {
        await (adapter as any).validate(adapterContext);
      }
      
      context.logger.info(`${adapterName} framework setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Framework validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectFrameworkAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.FRAMEWORK_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment framework provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('frameworkTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for framework: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectFramework = context.config.framework?.technology;
    if (projectFramework) {
      context.logger.info(`Using project framework technology: ${projectFramework}`);
      return projectFramework;
    }

    // Default to Next.js
    context.logger.info('Using default framework technology: nextjs');
    return 'nextjs';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back framework changes...');
    
    try {
      const selectedProvider = process.env.FRAMEWORK_PROVIDER || 'nextjs';
      const adapter = await createFrameworkAdapter(selectedProvider);
      
      if (adapter.rollback) {
        const adapterContext: AdapterContext = {
          workspacePath: context.projectPath,
          answers: {},
          env: process.env as Record<string, string>,
          runStep: async (stepId: string, cmd: string) => {
            context.logger.info(`[ROLLBACK:${stepId}] ${cmd}`);
          },
          log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
            context.logger[level](`[ROLLBACK] ${message}`);
          }
        };
        
        await adapter.rollback(adapterContext);
      }
      
      // Cleanup monorepo structure
      const packagePath = this.getPackagePath(context, CoreCategory.FRAMEWORK);
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed framework package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Framework rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
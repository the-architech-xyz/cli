/**
 * Testing Agent - Tech-Agnostic Testing Orchestrator
 * 
 * Pure orchestrator for testing setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates testing adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createTestingAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { ITestingProvider } from '../core/interfaces/providers';
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

interface TestingConfig {
  provider: 'vitest' | 'jest' | 'playwright' | 'cypress' | 'testing-library';
  framework: 'unit' | 'integration' | 'e2e' | 'all';
  features: {
    coverage: boolean;
    watchMode: boolean;
    parallel: boolean;
    snapshots: boolean;
    mocking: boolean;
  };
  coverage?: {
    threshold: number;
    reporters: string[];
    exclude: string[];
  };
  watchMode?: {
    enabled: boolean;
    ignorePatterns: string[];
  };
  parallel?: {
    workers: number;
    maxConcurrency: number;
  };
  snapshots?: {
    updateOnChange: boolean;
    directory: string;
  };
  mocking?: {
    library: 'vitest' | 'jest' | 'msw';
    autoMock: boolean;
  };
}

export class TestingAgent extends AbstractAgent {
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
      name: 'TestingAgent',
      version: '3.0.0',
      description: 'Orchestrates testing setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.TESTING,
      tags: [CoreCategory.TESTING, 'unit-tests', 'e2e', 'tech-agnostic'],
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
        name: 'testing-setup',
        description: 'Setup testing with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Testing provider',
            required: false,
            defaultValue: 'vitest'
          },
          {
            name: CoreCategory.FRAMEWORK,
            type: 'string',
            description: 'Testing framework type',
            required: false,
            defaultValue: 'unit'
          },
          {
            name: 'features',
            type: 'object',
            description: 'Testing features',
            required: false,
            defaultValue: {
              coverage: true,
              watchMode: true,
              parallel: false,
              snapshots: false,
              mocking: true
            }
          },
          {
            name: 'coverage',
            type: 'object',
            description: 'Coverage configuration',
            required: false,
            defaultValue: {
              threshold: 80,
              reporters: ['text', 'html'],
              exclude: ['node_modules/**', 'dist/**']
            }
          },
          {
            name: 'watchMode',
            type: 'object',
            description: 'Watch mode configuration',
            required: false,
            defaultValue: {
              enabled: true,
              ignorePatterns: ['node_modules/**', 'dist/**']
            }
          },
          {
            name: 'parallel',
            type: 'object',
            description: 'Parallel testing configuration',
            required: false,
            defaultValue: {
              workers: 4,
              maxConcurrency: 2
            }
          },
          {
            name: 'snapshots',
            type: 'object',
            description: 'Snapshot testing configuration',
            required: false,
            defaultValue: {
              updateOnChange: false,
              directory: '__snapshots__'
            }
          },
          {
            name: 'mocking',
            type: 'object',
            description: 'Mocking configuration',
            required: false,
            defaultValue: {
              library: 'vitest',
              autoMock: false
            }
          }
        ],
        examples: [
          {
            name: 'Setup Vitest',
            description: 'Creates testing setup with Vitest using adapters',
            parameters: { provider: 'vitest', framework: 'unit' },
            expectedResult: 'Complete testing setup with Vitest via adapter'
          },
          {
            name: 'Setup Jest',
            description: 'Creates testing setup with Jest using adapters',
            parameters: { provider: 'jest', framework: 'unit' },
            expectedResult: 'Testing setup with Jest via adapter'
          }
        ]
      },
      {
        name: 'testing-validation',
        description: 'Validate testing setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate testing setup',
            description: 'Validates the testing setup using adapters',
            parameters: {},
            expectedResult: 'Testing setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available testing adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const testingAdapters = this.registry.getAdaptersForCategory(CoreCategory.TESTING);
    
    // Convert to IPlugin format for compatibility
    return testingAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.TESTING);
    
    if (!adapter) {
      throw new Error(`Testing adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Testing setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get testing technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.TESTING);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Testing adapter';

      if (adapter.name === 'vitest') {
        confidence = 0.9;
        reason = 'Fast unit testing framework with excellent Vite integration';
      } else if (adapter.name === 'jest') {
        confidence = 0.8;
        reason = 'Comprehensive testing framework with extensive features';
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
    return [PluginCategory.TESTING];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting testing orchestration with tech-agnostic adapters...');

      // For monorepo, install testing in the testing package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', CoreCategory.TESTING);
        context.logger.info(`Testing package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, CoreCategory.TESTING, packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for testing setup: ${packagePath}`);
      }

      // Select testing adapter
      const selectedAdapter = await this.selectTestingAdapter(context);

      // Get testing configuration
      const testingConfig = await this.getTestingConfig(context);

      // Execute selected testing adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeTestingAdapter(context, selectedAdapter, testingConfig, packagePath);

      // Validate the setup
      await this.validateTestingSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: testingConfig.provider,
          framework: testingConfig.framework,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Testing setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'TESTING_SETUP_FAILED',
        `Failed to setup testing: ${errorMessage}`,
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

    // Check if testing package exists
    const packagePath = this.getPackagePath(context, CoreCategory.TESTING);
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Testing package directory will be created at: ${packagePath}`);
    }

    // Check if testing adapters are available
    const testingAdapters = this.registry.getAdaptersForCategory(CoreCategory.TESTING);
    if (testingAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No testing adapters found in registry',
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
  // PRIVATE METHODS - Testing Setup
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

  private async getTestingConfig(context: AgentContext): Promise<TestingConfig> {
    const userConfig = context.config.testing || {};
    
    return {
      provider: userConfig.provider || 'vitest',
      framework: userConfig.framework || 'unit',
      features: {
        coverage: userConfig.features?.coverage !== false,
        watchMode: userConfig.features?.watchMode !== false,
        parallel: userConfig.features?.parallel || false,
        snapshots: userConfig.features?.snapshots || false,
        mocking: userConfig.features?.mocking !== false,
      },
      coverage: userConfig.coverage,
      watchMode: userConfig.watchMode,
      parallel: userConfig.parallel,
      snapshots: userConfig.snapshots,
      mocking: userConfig.mocking,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeTestingAdapter(
    context: AgentContext,
    adapterName: string,
    testingConfig: TestingConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createTestingAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          testingConfig: testingConfig,
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
      context.logger.error(`Error in executeTestingAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateTestingSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} testing setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createTestingAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} testing setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Testing validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectTestingAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.TESTING_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment testing provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('testingTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for testing: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectTesting = context.config.testing?.technology;
    if (projectTesting) {
      context.logger.info(`Using project testing technology: ${projectTesting}`);
      return projectTesting;
    }

    // Default to Vitest
    context.logger.info('Using default testing technology: vitest');
    return 'vitest';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back testing changes...');
    
    try {
      const selectedProvider = process.env.TESTING_PROVIDER || 'vitest';
      const adapter = await createTestingAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, CoreCategory.TESTING);
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed testing package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Testing rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
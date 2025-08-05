/**
 * Monitoring Agent - Tech-Agnostic Monitoring Orchestrator
 * 
 * Pure orchestrator for monitoring setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates monitoring adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createObservabilityAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IObservabilityProvider } from '../core/interfaces/providers';
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

interface MonitoringConfig {
  provider: 'google-analytics' | 'mixpanel' | 'amplitude' | 'posthog' | 'sentry' | 'datadog';
  features: {
    analytics: boolean;
    errorTracking: boolean;
    performance: boolean;
    userTracking: boolean;
    customEvents: boolean;
  };
  analytics?: {
    pageViews: boolean;
    userSessions: boolean;
    conversions: boolean;
    goals: string[];
  };
  errorTracking?: {
    captureErrors: boolean;
    captureUnhandled: boolean;
    sourceMaps: boolean;
    environment: string;
  };
  performance?: {
    pageLoad: boolean;
    apiCalls: boolean;
    database: boolean;
    customMetrics: string[];
  };
  userTracking?: {
    identify: boolean;
    properties: string[];
    segments: string[];
  };
  customEvents?: {
    events: string[];
    properties: Record<string, string>;
  };
}

export class MonitoringAgent extends AbstractAgent {
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
      name: 'MonitoringAgent',
      version: '3.0.0',
      description: 'Orchestrates monitoring setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.MONITORING,
      tags: ['monitoring', 'analytics', CoreCategory.OBSERVABILITY, 'tech-agnostic'],
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
        name: 'monitoring-setup',
        description: 'Setup monitoring with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Monitoring provider',
            required: false,
            defaultValue: 'google-analytics'
          },
          {
            name: 'features',
            type: 'object',
            description: 'Monitoring features',
            required: false,
            defaultValue: {
              analytics: true,
              errorTracking: false,
              performance: false,
              userTracking: false,
              customEvents: false
            }
          },
          {
            name: 'analytics',
            type: 'object',
            description: 'Analytics configuration',
            required: false,
            defaultValue: {
              pageViews: true,
              userSessions: true,
              conversions: false,
              goals: []
            }
          },
          {
            name: 'errorTracking',
            type: 'object',
            description: 'Error tracking configuration',
            required: false,
            defaultValue: {
              captureErrors: true,
              captureUnhandled: true,
              sourceMaps: false,
              environment: 'production'
            }
          },
          {
            name: 'performance',
            type: 'object',
            description: 'Performance monitoring configuration',
            required: false,
            defaultValue: {
              pageLoad: true,
              apiCalls: false,
              database: false,
              customMetrics: []
            }
          },
          {
            name: 'userTracking',
            type: 'object',
            description: 'User tracking configuration',
            required: false,
            defaultValue: {
              identify: false,
              properties: [],
              segments: []
            }
          },
          {
            name: 'customEvents',
            type: 'object',
            description: 'Custom events configuration',
            required: false,
            defaultValue: {
              events: [],
              properties: {}
            }
          }
        ],
        examples: [
          {
            name: 'Setup Google Analytics',
            description: 'Creates monitoring setup with Google Analytics using adapters',
            parameters: { provider: 'google-analytics', features: { analytics: true } },
            expectedResult: 'Complete monitoring setup with Google Analytics via adapter'
          },
          {
            name: 'Setup Sentry',
            description: 'Creates monitoring setup with Sentry using adapters',
            parameters: { provider: 'sentry', features: { errorTracking: true } },
            expectedResult: 'Monitoring setup with Sentry via adapter'
          }
        ]
      },
      {
        name: 'monitoring-validation',
        description: 'Validate monitoring setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate monitoring setup',
            description: 'Validates the monitoring setup using adapters',
            parameters: {},
            expectedResult: 'Monitoring setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available monitoring adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const monitoringAdapters = this.registry.getAdaptersForCategory(CoreCategory.OBSERVABILITY);
    
    // Convert to IPlugin format for compatibility
    return monitoringAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.OBSERVABILITY);
    
    if (!adapter) {
      throw new Error(`Monitoring adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Monitoring setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get monitoring technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.OBSERVABILITY);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Monitoring adapter';

      if (adapter.name === 'google-analytics') {
        confidence = 0.9;
        reason = 'Industry standard analytics with comprehensive reporting';
      } else if (adapter.name === 'sentry') {
        confidence = 0.8;
        reason = 'Excellent error tracking and performance monitoring';
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
    return [PluginCategory.MONITORING];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting monitoring orchestration with tech-agnostic adapters...');

      // For monorepo, install monitoring in the monitoring package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', 'monitoring');
        context.logger.info(`Monitoring package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, 'monitoring', packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for monitoring setup: ${packagePath}`);
      }

      // Select monitoring adapter
      const selectedAdapter = await this.selectMonitoringAdapter(context);

      // Get monitoring configuration
      const monitoringConfig = await this.getMonitoringConfig(context);

      // Execute selected monitoring adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeMonitoringAdapter(context, selectedAdapter, monitoringConfig, packagePath);

      // Validate the setup
      await this.validateMonitoringSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: monitoringConfig.provider,
          features: monitoringConfig.features,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Monitoring setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'MONITORING_SETUP_FAILED',
        `Failed to setup monitoring: ${errorMessage}`,
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

    // Check if monitoring package exists
    const packagePath = this.getPackagePath(context, 'monitoring');
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Monitoring package directory will be created at: ${packagePath}`);
    }

    // Check if monitoring adapters are available
    const monitoringAdapters = this.registry.getAdaptersForCategory(CoreCategory.OBSERVABILITY);
    if (monitoringAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No monitoring adapters found in registry',
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
  // PRIVATE METHODS - Monitoring Setup
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

  private async getMonitoringConfig(context: AgentContext): Promise<MonitoringConfig> {
    const userConfig = context.config.monitoring || {};
    
    return {
      provider: userConfig.provider || 'google-analytics',
      features: {
        analytics: userConfig.features?.analytics !== false,
        errorTracking: userConfig.features?.errorTracking || false,
        performance: userConfig.features?.performance || false,
        userTracking: userConfig.features?.userTracking || false,
        customEvents: userConfig.features?.customEvents || false,
      },
      analytics: userConfig.analytics,
      errorTracking: userConfig.errorTracking,
      performance: userConfig.performance,
      userTracking: userConfig.userTracking,
      customEvents: userConfig.customEvents,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeMonitoringAdapter(
    context: AgentContext,
    adapterName: string,
    monitoringConfig: MonitoringConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createObservabilityAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          monitoringConfig: monitoringConfig,
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
      context.logger.error(`Error in executeMonitoringAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateMonitoringSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} monitoring setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createObservabilityAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} monitoring setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Monitoring validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectMonitoringAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.MONITORING_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment monitoring provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('monitoringTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for monitoring: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectMonitoring = context.config.monitoring?.technology;
    if (projectMonitoring) {
      context.logger.info(`Using project monitoring technology: ${projectMonitoring}`);
      return projectMonitoring;
    }

    // Default to Google Analytics
    context.logger.info('Using default monitoring technology: google-analytics');
    return 'google-analytics';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back monitoring changes...');
    
    try {
      const selectedProvider = process.env.MONITORING_PROVIDER || 'google-analytics';
      const adapter = await createObservabilityAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, 'monitoring');
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed monitoring package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Monitoring rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
/**
 * Deployment Agent - Tech-Agnostic Deployment Orchestrator
 * 
 * Pure orchestrator for deployment setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates deployment adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createDeploymentAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IDeploymentProvider } from '../core/interfaces/providers';
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

interface DeploymentConfig {
  provider: 'vercel' | 'netlify' | 'railway' | 'render' | 'docker' | 'kubernetes';
  environment: 'development' | 'staging' | 'production';
  features: {
    autoDeploy: boolean;
    previewDeployments: boolean;
    customDomain: boolean;
    ssl: boolean;
    monitoring: boolean;
  };
  autoDeploy?: {
    branch: string;
    triggers: string[];
    conditions: string[];
  };
  previewDeployments?: {
    enabled: boolean;
    branchPattern: string;
    cleanupAfterDays: number;
  };
  customDomain?: {
    domain: string;
    ssl: boolean;
    redirects: Record<string, string>;
  };
  ssl?: {
    provider: 'letsencrypt' | 'cloudflare' | 'custom';
    autoRenew: boolean;
  };
  monitoring?: {
    uptime: boolean;
    performance: boolean;
    errorTracking: boolean;
  };
}

export class DeploymentAgent extends AbstractAgent {
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
      name: 'DeploymentAgent',
      version: '3.0.0',
      description: 'Orchestrates deployment setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.DEPLOYMENT,
      tags: [CoreCategory.DEPLOYMENT, 'devops', 'ci-cd', 'tech-agnostic'],
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
        name: 'deployment-setup',
        description: 'Setup deployment with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Deployment provider',
            required: false,
            defaultValue: 'vercel'
          },
          {
            name: 'environment',
            type: 'string',
            description: 'Deployment environment',
            required: false,
            defaultValue: 'production'
          },
          {
            name: 'features',
            type: 'object',
            description: 'Deployment features',
            required: false,
            defaultValue: {
              autoDeploy: true,
              previewDeployments: true,
              customDomain: false,
              ssl: true,
              monitoring: false
            }
          },
          {
            name: 'autoDeploy',
            type: 'object',
            description: 'Auto-deploy configuration',
            required: false,
            defaultValue: {
              branch: 'main',
              triggers: ['push', 'pr'],
              conditions: ['tests-pass']
            }
          },
          {
            name: 'previewDeployments',
            type: 'object',
            description: 'Preview deployments configuration',
            required: false,
            defaultValue: {
              enabled: true,
              branchPattern: 'feature/*',
              cleanupAfterDays: 7
            }
          },
          {
            name: 'customDomain',
            type: 'object',
            description: 'Custom domain configuration',
            required: false,
            defaultValue: {
              domain: '',
              ssl: true,
              redirects: {}
            }
          },
          {
            name: 'ssl',
            type: 'object',
            description: 'SSL configuration',
            required: false,
            defaultValue: {
              provider: 'letsencrypt',
              autoRenew: true
            }
          },
          {
            name: 'monitoring',
            type: 'object',
            description: 'Monitoring configuration',
            required: false,
            defaultValue: {
              uptime: true,
              performance: true,
              errorTracking: false
            }
          }
        ],
        examples: [
          {
            name: 'Setup Vercel',
            description: 'Creates deployment setup with Vercel using adapters',
            parameters: { provider: 'vercel', environment: 'production' },
            expectedResult: 'Complete deployment setup with Vercel via adapter'
          },
          {
            name: 'Setup Docker',
            description: 'Creates deployment setup with Docker using adapters',
            parameters: { provider: 'docker', environment: 'production' },
            expectedResult: 'Deployment setup with Docker via adapter'
          }
        ]
      },
      {
        name: 'deployment-validation',
        description: 'Validate deployment setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate deployment setup',
            description: 'Validates the deployment setup using adapters',
            parameters: {},
            expectedResult: 'Deployment setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available deployment adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const deploymentAdapters = this.registry.getAdaptersForCategory(CoreCategory.DEPLOYMENT);
    
    // Convert to IPlugin format for compatibility
    return deploymentAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.DEPLOYMENT);
    
    if (!adapter) {
      throw new Error(`Deployment adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Deployment setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get deployment technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.DEPLOYMENT);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Deployment adapter';

      if (adapter.name === 'vercel') {
        confidence = 0.9;
        reason = 'Excellent for Next.js applications with zero-config deployment';
      } else if (adapter.name === 'docker') {
        confidence = 0.8;
        reason = 'Universal containerization for any application type';
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
    return [PluginCategory.DEPLOYMENT];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting deployment orchestration with tech-agnostic adapters...');

      // For monorepo, install deployment in the deployment package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', CoreCategory.DEPLOYMENT);
        context.logger.info(`Deployment package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, CoreCategory.DEPLOYMENT, packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for deployment setup: ${packagePath}`);
      }

      // Select deployment adapter
      const selectedAdapter = await this.selectDeploymentAdapter(context);

      // Get deployment configuration
      const deploymentConfig = await this.getDeploymentConfig(context);

      // Execute selected deployment adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeDeploymentAdapter(context, selectedAdapter, deploymentConfig, packagePath);

      // Validate the setup
      await this.validateDeploymentSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: deploymentConfig.provider,
          environment: deploymentConfig.environment,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Deployment setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'DEPLOYMENT_SETUP_FAILED',
        `Failed to setup deployment: ${errorMessage}`,
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

    // Check if deployment package exists
    const packagePath = this.getPackagePath(context, CoreCategory.DEPLOYMENT);
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Deployment package directory will be created at: ${packagePath}`);
    }

    // Check if deployment adapters are available
    const deploymentAdapters = this.registry.getAdaptersForCategory(CoreCategory.DEPLOYMENT);
    if (deploymentAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No deployment adapters found in registry',
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
  // PRIVATE METHODS - Deployment Setup
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

  private async getDeploymentConfig(context: AgentContext): Promise<DeploymentConfig> {
    const userConfig = context.config.deployment || {};
    
    return {
      provider: userConfig.provider || 'vercel',
      environment: userConfig.environment || 'production',
      features: {
        autoDeploy: userConfig.features?.autoDeploy !== false,
        previewDeployments: userConfig.features?.previewDeployments !== false,
        customDomain: userConfig.features?.customDomain || false,
        ssl: userConfig.features?.ssl !== false,
        monitoring: userConfig.features?.monitoring || false,
      },
      autoDeploy: userConfig.autoDeploy,
      previewDeployments: userConfig.previewDeployments,
      customDomain: userConfig.customDomain,
      ssl: userConfig.ssl,
      monitoring: userConfig.monitoring,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeDeploymentAdapter(
    context: AgentContext,
    adapterName: string,
    deploymentConfig: DeploymentConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createDeploymentAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          deploymentConfig: deploymentConfig,
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
      context.logger.error(`Error in executeDeploymentAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateDeploymentSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} deployment setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createDeploymentAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} deployment setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Deployment validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectDeploymentAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.DEPLOYMENT_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment deployment provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('deploymentTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for deployment: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectDeployment = context.config.deployment?.technology;
    if (projectDeployment) {
      context.logger.info(`Using project deployment technology: ${projectDeployment}`);
      return projectDeployment;
    }

    // Default to Vercel
    context.logger.info('Using default deployment technology: vercel');
    return 'vercel';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back deployment changes...');
    
    try {
      const selectedProvider = process.env.DEPLOYMENT_PROVIDER || 'vercel';
      const adapter = await createDeploymentAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, CoreCategory.DEPLOYMENT);
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed deployment package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Deployment rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
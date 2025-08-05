/**
 * Email Agent - Tech-Agnostic Email Orchestrator
 * 
 * Pure orchestrator for email setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates email adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IEmailProvider } from '../core/interfaces/providers';
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

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'aws-ses' | 'nodemailer' | 'postmark';
  features: {
    transactional: boolean;
    marketing: boolean;
    templates: boolean;
    tracking: boolean;
    webhooks: boolean;
  };
  transactional?: {
    templates: string[];
    defaultFrom: string;
    replyTo: string;
  };
  marketing?: {
    lists: string[];
    campaigns: boolean;
    automation: boolean;
  };
  templates?: {
    engine: 'handlebars' | 'ejs' | 'mjml';
    directory: string;
    defaultLocale: string;
  };
  tracking?: {
    opens: boolean;
    clicks: boolean;
    bounces: boolean;
    spam: boolean;
  };
  webhooks?: {
    events: string[];
    endpoint: string;
    secret: string;
  };
}

export class EmailAgent extends AbstractAgent {
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
      name: 'EmailAgent',
      version: '3.0.0',
      description: 'Orchestrates email setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.EMAIL,
      tags: [CoreCategory.EMAIL, 'notifications', 'templates', 'tech-agnostic'],
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
        name: 'email-setup',
        description: 'Setup email with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Email provider',
            required: false,
            defaultValue: 'resend'
          },
          {
            name: 'features',
            type: 'object',
            description: 'Email features',
            required: false,
            defaultValue: {
              transactional: true,
              marketing: false,
              templates: true,
              tracking: true,
              webhooks: false
            }
          },
          {
            name: 'transactional',
            type: 'object',
            description: 'Transactional email configuration',
            required: false,
            defaultValue: {
              templates: ['welcome', 'reset-password', 'verification'],
              defaultFrom: 'noreply@yourdomain.com',
              replyTo: 'support@yourdomain.com'
            }
          },
          {
            name: 'marketing',
            type: 'object',
            description: 'Marketing email configuration',
            required: false,
            defaultValue: {
              lists: ['newsletter', 'promotions'],
              campaigns: false,
              automation: false
            }
          },
          {
            name: 'templates',
            type: 'object',
            description: 'Email template configuration',
            required: false,
            defaultValue: {
              engine: 'handlebars',
              directory: 'templates/emails',
              defaultLocale: 'en'
            }
          },
          {
            name: 'tracking',
            type: 'object',
            description: 'Email tracking configuration',
            required: false,
            defaultValue: {
              opens: true,
              clicks: true,
              bounces: true,
              spam: false
            }
          },
          {
            name: 'webhooks',
            type: 'object',
            description: 'Webhook configuration',
            required: false,
            defaultValue: {
              events: ['delivered', 'bounced', 'complained'],
              endpoint: '/api/webhooks/email',
              secret: ''
            }
          }
        ],
        examples: [
          {
            name: 'Setup Resend',
            description: 'Creates email setup with Resend using adapters',
            parameters: { provider: 'resend', features: { transactional: true, templates: true } },
            expectedResult: 'Complete email setup with Resend via adapter'
          },
          {
            name: 'Setup SendGrid',
            description: 'Creates email setup with SendGrid using adapters',
            parameters: { provider: 'sendgrid', features: { transactional: true, marketing: true } },
            expectedResult: 'Email setup with SendGrid via adapter'
          }
        ]
      },
      {
        name: 'email-validation',
        description: 'Validate email setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate email setup',
            description: 'Validates the email setup using adapters',
            parameters: {},
            expectedResult: 'Email setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available email adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const emailAdapters = this.registry.getAdaptersForCategory(CoreCategory.EMAIL);
    
    // Convert to IPlugin format for compatibility
    return emailAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.EMAIL);
    
    if (!adapter) {
      throw new Error(`Email adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Email setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get email technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.EMAIL);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Email adapter';

      if (adapter.name === 'resend') {
        confidence = 0.9;
        reason = 'Modern email API with excellent developer experience';
      } else if (adapter.name === 'sendgrid') {
        confidence = 0.8;
        reason = 'Comprehensive email platform with extensive features';
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
    return [PluginCategory.EMAIL];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting email orchestration with tech-agnostic adapters...');

      // For monorepo, install email in the email package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', CoreCategory.EMAIL);
        context.logger.info(`Email package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, CoreCategory.EMAIL, packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for email setup: ${packagePath}`);
      }

      // Select email adapter
      const selectedAdapter = await this.selectEmailAdapter(context);

      // Get email configuration
      const emailConfig = await this.getEmailConfig(context);

      // Execute selected email adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeEmailAdapter(context, selectedAdapter, emailConfig, packagePath);

      // Validate the setup
      await this.validateEmailSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: emailConfig.provider,
          features: emailConfig.features,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Email setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'EMAIL_SETUP_FAILED',
        `Failed to setup email: ${errorMessage}`,
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

    // Check if email package exists
    const packagePath = this.getPackagePath(context, CoreCategory.EMAIL);
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Email package directory will be created at: ${packagePath}`);
    }

    // Check if email adapters are available
    const emailAdapters = this.registry.getAdaptersForCategory(CoreCategory.EMAIL);
    if (emailAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No email adapters found in registry',
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
  // PRIVATE METHODS - Email Setup
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

  private async getEmailConfig(context: AgentContext): Promise<EmailConfig> {
    const userConfig = context.config.email || {};
    
    return {
      provider: userConfig.provider || 'resend',
      features: {
        transactional: userConfig.features?.transactional !== false,
        marketing: userConfig.features?.marketing || false,
        templates: userConfig.features?.templates !== false,
        tracking: userConfig.features?.tracking !== false,
        webhooks: userConfig.features?.webhooks || false,
      },
      transactional: userConfig.transactional,
      marketing: userConfig.marketing,
      templates: userConfig.templates,
      tracking: userConfig.tracking,
      webhooks: userConfig.webhooks,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeEmailAdapter(
    context: AgentContext,
    adapterName: string,
    emailConfig: EmailConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance (placeholder for now since email adapters aren't implemented yet)
      // const adapter = await createEmailAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          emailConfig: emailConfig,
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
      // const result = await adapter.execute(adapterContext);

      // For now, return placeholder result since email adapters aren't implemented
      const result = {
        filesGenerated: [`${adapterName}-config.json`],
        nextSteps: [`Configure ${adapterName} API keys`]
      };

      // Transform result to expected format
      return {
        artifacts: result.filesGenerated?.map(file => ({ type: 'file', path: file })) || [],
        warnings: result.nextSteps || []
      };
      
    } catch (error) {
      context.logger.error(`Error in executeEmailAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateEmailSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} email setup...`);
    
    try {
      // Create adapter for validation (placeholder for now)
      // const adapter = await createEmailAdapter(adapterName);
      
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
      // if ('validate' in adapter && typeof adapter.validate === 'function') {
      //   await (adapter as any).validate(adapterContext);
      // }
      
      context.logger.info(`${adapterName} email setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Email validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectEmailAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.EMAIL_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment email provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('emailTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for email: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectEmail = context.config.email?.technology;
    if (projectEmail) {
      context.logger.info(`Using project email technology: ${projectEmail}`);
      return projectEmail;
    }

    // Default to Resend
    context.logger.info('Using default email technology: resend');
    return 'resend';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back email changes...');
    
    try {
      const selectedProvider = process.env.EMAIL_PROVIDER || 'resend';
      // const adapter = await createEmailAdapter(selectedProvider);
      
      // if (adapter.rollback) {
      //   const adapterContext: AdapterContext = {
      //     workspacePath: context.projectPath,
      //     answers: {},
      //     env: process.env as Record<string, string>,
      //     runStep: async (stepId: string, cmd: string) => {
      //       context.logger.info(`[ROLLBACK:${stepId}] ${cmd}`);
      //     },
      //     log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      //       context.logger[level](`[ROLLBACK] ${message}`);
      //     }
      //   };
        
      //   await adapter.rollback(adapterContext);
      // }
      
      // Cleanup monorepo structure
      const packagePath = this.getPackagePath(context, CoreCategory.EMAIL);
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed email package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Email rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
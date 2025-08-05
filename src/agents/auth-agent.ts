/**
 * Auth Agent - Tech-Agnostic Authentication Orchestrator
 * 
 * Pure orchestrator for authentication setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates authentication adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createAuthAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IAuthProvider } from '../core/interfaces/providers';
import { PluginContext, ProjectType, TargetPlatform, IPlugin, PluginCategory } from '../types/plugins.js';
import { CommandRunner } from '../core/cli/command-runner.js';
import { Logger } from '../core/cli/logger.js';
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

interface AuthConfig {
  provider: 'better-auth' | 'nextauth' | 'supabase' | 'clerk' | 'auth0' | 'firebase';
  providers: string[];
  features: {
    emailVerification: boolean;
    passwordReset: boolean;
    socialLogin: boolean;
    mfa: boolean;
    sessionManagement: boolean;
  };
  emailVerification?: {
    template: string;
    autoVerify: boolean;
  };
  passwordReset?: {
    template: string;
    expiryHours: number;
  };
  socialLogin?: {
    providers: string[];
    callbackUrl: string;
  };
  mfa?: {
    methods: string[];
    backupCodes: boolean;
  };
  sessionManagement?: {
    strategy: 'jwt' | 'database';
    maxAge: number;
    updateAge: number;
  };
}

export class AuthAgent extends AbstractAgent {
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
      name: 'AuthAgent',
      version: '3.0.0',
      description: 'Orchestrates authentication setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.AUTHENTICATION,
      tags: ['authentication', 'auth', 'oauth', 'tech-agnostic'],
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
        name: 'auth-setup',
        description: 'Setup authentication with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Authentication provider',
            required: false,
            defaultValue: 'better-auth'
          },
          {
            name: 'providers',
            type: 'array',
            description: 'OAuth providers to enable',
            required: false,
            defaultValue: ['google', 'github']
          },
          {
            name: 'features',
            type: 'object',
            description: 'Authentication features',
            required: false,
            defaultValue: {
              emailVerification: true,
              passwordReset: true,
              socialLogin: true,
              mfa: false,
              sessionManagement: true
            }
          },
          {
            name: 'emailVerification',
            type: 'object',
            description: 'Email verification configuration',
            required: false,
            defaultValue: {
              template: 'default',
              autoVerify: false
            }
          },
          {
            name: 'passwordReset',
            type: 'object',
            description: 'Password reset configuration',
            required: false,
            defaultValue: {
              template: 'default',
              expiryHours: 24
            }
          },
          {
            name: 'socialLogin',
            type: 'object',
            description: 'Social login configuration',
            required: false,
            defaultValue: {
              providers: ['google', 'github'],
              callbackUrl: '/api/auth/callback'
            }
          },
          {
            name: 'mfa',
            type: 'object',
            description: 'Multi-factor authentication configuration',
            required: false,
            defaultValue: {
              methods: ['totp'],
              backupCodes: true
            }
          },
          {
            name: 'sessionManagement',
            type: 'object',
            description: 'Session management configuration',
            required: false,
            defaultValue: {
              strategy: 'jwt',
              maxAge: 30 * 24 * 60 * 60, // 30 days
              updateAge: 24 * 60 * 60 // 24 hours
            }
          }
        ],
        examples: [
          {
            name: 'Setup Better Auth',
            description: 'Creates authentication setup with Better Auth using adapters',
            parameters: { provider: 'better-auth', providers: ['google', 'github'] },
            expectedResult: 'Complete authentication setup with Better Auth via adapter'
          },
          {
            name: 'Setup NextAuth',
            description: 'Creates authentication setup with NextAuth using adapters',
            parameters: { provider: 'nextauth', providers: ['google', 'github'] },
            expectedResult: 'Authentication setup with NextAuth via adapter'
          }
        ]
      },
      {
        name: 'auth-validation',
        description: 'Validate authentication setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate authentication setup',
            description: 'Validates the authentication setup using adapters',
            parameters: {},
            expectedResult: 'Authentication setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available authentication adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const authAdapters = this.registry.getAdaptersForCategory(CoreCategory.AUTH);
    
    // Convert to IPlugin format for compatibility
    return authAdapters.map((adapter: any) => ({
      getMetadata: () => ({
        name: adapter.name,
        version: adapter.version,
        category: adapter.category,
        description: adapter.description,
        dependencies: adapter.dependencies
      }),
      getParameterSchema: () => ({ parameters: [] }),
      execute: async () => ({ success: true }),
      rollback: async () => {},
      validate: async () => ({ valid: true, errors: [], warnings: [] }),
      getConflicts: () => [],
      getDefaultConfig: () => ({}),
      getConfigSchema: () => ({})
    } as unknown as IPlugin));
  }

  /**
   * Get adapter capabilities
   */
  getPluginCapabilities(pluginId: string): AgentCapability[] {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.AUTH);
    const adapter = adapters.find((a: any) => a.name === pluginId && a.category === CoreCategory.AUTH);
    
    if (!adapter) {
      return [];
    }

    return [{
      name: `${adapter.name}-setup`,
      description: adapter.description || 'Authentication setup capability',
      category: CapabilityCategory.SETUP,
      parameters: []
    }];
  }

  /**
   * Get authentication technology recommendations
   */
  getRecommendations(context: ProjectContext): TechRecommendation[] {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.AUTH);
    return adapters.map((adapter: any) => {
      let reason = adapter.description || 'Authentication adapter';
      let confidence = 0.8;

      // Adjust confidence based on adapter characteristics
      if (adapter.name.toLowerCase().includes('better')) {
        confidence = 0.9;
        reason = 'Modern, type-safe authentication with excellent developer experience';
      } else if (adapter.name.toLowerCase().includes('nextauth')) {
        confidence = 0.85;
        reason = 'Mature, battle-tested authentication solution for Next.js';
      }

      return {
        name: adapter.name,
        reason: reason,
        confidence: confidence
      };
    }).sort((a: any, b: any) => b.confidence - a.confidence);
  }

  /**
   * Get the plugin categories this agent handles
   */
  getDomainCategories(): PluginCategory[] {
    return [PluginCategory.AUTHENTICATION];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const selectedAdapter = this.selectAuthAdapter(context);
    if (!selectedAdapter) {
      return {
        success: false,
        artifacts: [],
        errors: [{ 
          code: 'NO_ADAPTER', 
          message: 'No authentication adapter selected',
          recoverable: true,
          timestamp: new Date()
        }],
        warnings: [],
        duration: 0
      };
    }

    const adapter = await this.executeAuthAdapter(context, selectedAdapter, await this.getAuthConfig(context), context.projectPath);
    await this.validateAuthSetup(context, selectedAdapter, context.projectPath);

    return {
      success: true,
      artifacts: adapter.artifacts || [],
      warnings: adapter.warnings || [],
      errors: [],
      duration: 0
    };
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if we have any auth adapters available
    const authAdapters = this.registry.getAdaptersForCategory(CoreCategory.AUTH);
    if (authAdapters.length === 0) {
      errors.push({
        field: 'auth-adapters',
        message: 'No authentication adapters available',
        code: 'NO_ADAPTERS',
        severity: 'error'
      });
    }

    // Check project structure
    if (!context.projectStructure) {
      errors.push({
        field: 'project-structure',
        message: 'Project structure not defined',
        code: 'NO_STRUCTURE',
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
  // PRIVATE METHODS - Authentication Setup
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

  private async getAuthConfig(context: AgentContext): Promise<AuthConfig> {
    const userConfig = context.config.auth || {};
    
    return {
      provider: userConfig.provider || 'better-auth',
      providers: userConfig.providers || ['google', 'github'],
      features: {
        emailVerification: userConfig.features?.emailVerification !== false,
        passwordReset: userConfig.features?.passwordReset !== false,
        socialLogin: userConfig.features?.socialLogin !== false,
        mfa: userConfig.features?.mfa || false,
        sessionManagement: userConfig.features?.sessionManagement !== false,
      },
      emailVerification: userConfig.emailVerification,
      passwordReset: userConfig.passwordReset,
      socialLogin: userConfig.socialLogin,
      mfa: userConfig.mfa,
      sessionManagement: userConfig.sessionManagement,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeAuthAdapter(
    context: AgentContext,
    adapterName: string,
    authConfig: AuthConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createAuthAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          authConfig: authConfig,
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
      context.logger.error(`Error in executeAuthAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateAuthSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} authentication setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createAuthAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} authentication setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Authentication validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private selectAuthAdapter(context: AgentContext): string | null {
    const authAdapters = this.registry.getAdaptersForCategory(CoreCategory.AUTH);
    if (authAdapters.length === 0) {
      return null;
    }
    
    // For now, return the first available adapter
    // In the future, this could use AI to select the best adapter
    return authAdapters[0]?.name || null;
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back authentication changes...');
    
    try {
      const selectedProvider = process.env.AUTH_PROVIDER || 'better-auth';
      const adapter = await createAuthAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, 'auth');
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed auth package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Authentication rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
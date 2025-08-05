/**
 * DB Agent - Tech-Agnostic Database Orchestrator
 * 
 * Pure orchestrator for database setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates database adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createDatabaseAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IDatabaseProvider } from '../core/interfaces/providers';
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

interface DatabaseConfig {
  provider: 'neon' | 'supabase' | 'local' | 'planetscale' | 'vercel' | 'mongodb' | 'drizzle' | 'prisma';
  connectionString: string;
  schema: string[];
  migrations: boolean;
  features: {
    seeding: boolean;
    backup: boolean;
    connectionPooling: boolean;
    ssl: boolean;
    readReplicas: boolean;
  };
  seeding?: {
    fixtures: string[];
    autoSeed: boolean;
  };
  backup?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    autoBackup: boolean;
  };
  connectionPooling?: {
    min: number;
    max: number;
    idleTimeout: number;
  };
}

export class DBAgent extends AbstractAgent {
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
      name: 'DBAgent',
      version: '3.0.0',
      description: 'Orchestrates database setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.DATABASE,
      tags: [CoreCategory.DATABASE, 'orm', 'migrations', 'tech-agnostic'],
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
        name: 'db-setup',
        description: 'Setup database with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'Database provider',
            required: false,
            defaultValue: 'drizzle'
          },
          {
            name: 'connectionString',
            type: 'string',
            description: 'Database connection string',
            required: false,
            defaultValue: ''
          },
          {
            name: 'schema',
            type: 'array',
            description: 'Database schema tables',
            required: false,
            defaultValue: ['users', 'posts', 'comments']
          },
          {
            name: 'migrations',
            type: 'boolean',
            description: 'Enable migrations',
            required: false,
            defaultValue: true
          },
          {
            name: 'features',
            type: 'object',
            description: 'Advanced database features',
            required: false,
            defaultValue: {
              seeding: false,
              backup: false,
              connectionPooling: false,
              ssl: true,
              readReplicas: false
            }
          }
        ],
        examples: [
          {
            name: 'Setup Drizzle ORM',
            description: 'Creates database setup with Drizzle ORM using adapters',
            parameters: { provider: 'drizzle', migrations: true },
            expectedResult: 'Complete database setup with Drizzle ORM via adapter'
          },
          {
            name: 'Setup Prisma ORM',
            description: 'Creates database setup with Prisma ORM using adapters',
            parameters: { provider: 'prisma', migrations: true },
            expectedResult: 'Database setup with Prisma ORM via adapter'
          }
        ]
      },
      {
        name: 'db-validation',
        description: 'Validate database setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate database setup',
            description: 'Validates the database setup using adapters',
            parameters: {},
            expectedResult: 'Database setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available database adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const databaseAdapters = this.registry.getAdaptersForCategory(CoreCategory.DATABASE);
    
    // Convert to IPlugin format for compatibility
    return databaseAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.DATABASE);
    
    if (!adapter) {
      throw new Error(`Database adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'Database setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get database technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.DATABASE);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'Database adapter';

      if (adapter.name === 'drizzle') {
        confidence = 0.9;
        reason = 'TypeScript-first ORM with excellent performance and type safety';
      } else if (adapter.name === 'prisma') {
        confidence = 0.8;
        reason = 'Comprehensive ORM with excellent developer experience';
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
    return [PluginCategory.ORM, PluginCategory.DATABASE];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting database orchestration with tech-agnostic adapters...');

      // For monorepo, install database in the db package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', 'db');
        context.logger.info(`Database package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, 'db', packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for database setup: ${packagePath}`);
      }

      // Select database adapter
      const selectedAdapter = await this.selectDatabaseAdapter(context);

      // Get database configuration
      const dbConfig = await this.getDatabaseConfig(context);

      // Execute selected database adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeDatabaseAdapter(context, selectedAdapter, dbConfig, packagePath);

      // Validate the setup
      await this.validateDatabaseSetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: dbConfig.provider,
          migrations: dbConfig.migrations,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`Database setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'DB_SETUP_FAILED',
        `Failed to setup database: ${errorMessage}`,
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

    // Check if database package exists
    const packagePath = this.getPackagePath(context, 'db');
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`Database package directory will be created at: ${packagePath}`);
    }

    // Check if database adapters are available
    const databaseAdapters = this.registry.getAdaptersForCategory(CoreCategory.DATABASE);
    if (databaseAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No database adapters found in registry',
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
  // PRIVATE METHODS - Database Setup
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

  private async getDatabaseConfig(context: AgentContext): Promise<DatabaseConfig> {
    const userConfig = context.config.database || {};
    
    return {
      provider: userConfig.provider || 'drizzle',
      connectionString: userConfig.connectionString || userConfig.databaseUrl || '',
      schema: userConfig.schema || ['users', 'posts', 'comments'],
      migrations: userConfig.migrations !== false,
      features: {
        seeding: userConfig.features?.seeding || false,
        backup: userConfig.features?.backup || false,
        connectionPooling: userConfig.features?.connectionPooling || false,
        ssl: userConfig.features?.ssl || false,
        readReplicas: userConfig.features?.readReplicas || false,
      },
      seeding: userConfig.seeding,
      backup: userConfig.backup,
      connectionPooling: userConfig.connectionPooling,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeDatabaseAdapter(
    context: AgentContext,
    adapterName: string,
    dbConfig: DatabaseConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createDatabaseAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          databaseConfig: dbConfig,
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
      context.logger.error(`Error in executeDatabaseAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateDatabaseSetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} database setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createDatabaseAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} database setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`Database validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectDatabaseAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.DATABASE_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment database provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('dbTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for database: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectDB = context.config.database?.technology;
    if (projectDB) {
      context.logger.info(`Using project database technology: ${projectDB}`);
      return projectDB;
    }

    // Default to Drizzle
    context.logger.info('Using default database technology: drizzle');
    return 'drizzle';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back database changes...');
    
    try {
      const selectedProvider = process.env.DATABASE_PROVIDER || 'drizzle';
      const adapter = await createDatabaseAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, 'db');
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed database package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('Database rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
} 
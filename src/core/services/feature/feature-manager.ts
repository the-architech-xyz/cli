/**
 * Feature Manager - V2 Feature Addition System
 * 
 * Manages adding features to existing projects
 * Handles both adapter features and cross-adapter features
 */

import { PathHandler } from '../path/path-handler.js';
import { BlueprintExecutor } from '../blueprint/blueprint-executor.js';
import { AdapterLoader } from '../adapter/adapter-loader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { AgentLogger } from '../../cli/logger.js';
import { FeatureSpec } from '../../../types/feature.js';
import { ProjectContext } from '../../../types/agent.js';
import { readFile, writeFile } from 'fs/promises';

export interface AddFeatureResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  error?: string;
}

export interface AddFeatureOptions {
  force?: boolean;
  dryRun?: boolean;
}

export class FeatureManager {
  private pathHandler: PathHandler;
  private blueprintExecutor?: BlueprintExecutor;
  private adapterLoader: AdapterLoader;
  private logger: AgentLogger;

  constructor(pathHandler: PathHandler) {
    this.pathHandler = pathHandler;
    this.adapterLoader = new AdapterLoader();
    this.logger = new AgentLogger();
  }

  /**
   * Add a feature to the existing project
   */
  async addFeature(featureSpec: FeatureSpec, options: AddFeatureOptions = {}): Promise<AddFeatureResult> {
    try {
      this.logger.info(`🔧 Adding feature: ${featureSpec.fullSpec}`);

      // Load project configuration
      const projectConfig = await this.loadProjectConfig();
      if (!projectConfig) {
        return {
          success: false,
          filesCreated: [],
          filesModified: [],
          error: 'No architech.json found'
        };
      }

      // Check for conflicts
      if (!options.force) {
        const conflicts = await this.checkConflicts(featureSpec, projectConfig);
        if (conflicts.length > 0) {
          return {
            success: false,
            filesCreated: [],
            filesModified: [],
            error: `Conflicts detected: ${conflicts.join(', ')}. Use --force to override.`
          };
        }
      }

      // Load feature blueprint
      const featureBlueprint = await this.loadFeatureBlueprint(featureSpec);
      if (!featureBlueprint) {
        return {
          success: false,
          filesCreated: [],
          filesModified: [],
          error: `Feature blueprint not found: ${featureSpec.fullSpec}`
        };
      }

      // Create project context
      const context = await this.createProjectContext(featureSpec, projectConfig);

      // Initialize BlueprintExecutor with project root
      this.blueprintExecutor = new BlueprintExecutor(context.project.path || '.');

      // Execute feature blueprint
      const result = await this.blueprintExecutor!.executeBlueprint(featureBlueprint, context);

      if (result.success) {
        // Update project configuration
        await this.updateProjectConfig(featureSpec, projectConfig);

        return {
          success: true,
          filesCreated: result.files || [],
          filesModified: result.files || []
        };
      } else {
        return {
          success: false,
          filesCreated: [],
          filesModified: [],
          error: result.errors?.join(', ') || 'Unknown error'
        };
      }

    } catch (error) {
      return {
        success: false,
        filesCreated: [],
        filesModified: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Dry run - show what would be added
   */
  async dryRunAddFeature(featureSpec: FeatureSpec): Promise<void> {
    this.logger.info(`🔍 Analyzing feature: ${featureSpec.fullSpec}`);

    // Load project configuration
    const projectConfig = await this.loadProjectConfig();
    if (!projectConfig) {
      this.logger.error('❌ No architech.json found');
      return;
    }

    // Load feature blueprint
    const featureBlueprint = await this.loadFeatureBlueprint(featureSpec);
    if (!featureBlueprint) {
      this.logger.error(`❌ Feature blueprint not found: ${featureSpec.fullSpec}`);
      return;
    }

    // Show what would be added
    this.logger.info(`📋 Feature: ${featureBlueprint.name}`);
    this.logger.info(`📝 Actions to execute: ${featureBlueprint.actions.length}`);
    
    featureBlueprint.actions.forEach((action: any, index: number) => {
      if (action.type === 'ADD_CONTENT') {
        this.logger.info(`  ${index + 1}. Create file: ${action.target}`);
      } else if (action.type === 'RUN_COMMAND') {
        this.logger.info(`  ${index + 1}. Run command: ${action.command}`);
      }
    });

    // Check for conflicts
    const conflicts = await this.checkConflicts(featureSpec, projectConfig);
    if (conflicts.length > 0) {
      this.logger.warn(`⚠️  Potential conflicts: ${conflicts.join(', ')}`);
    } else {
      this.logger.info('✅ No conflicts detected');
    }
  }

  /**
   * Load project configuration from architech.json
   */
  private async loadProjectConfig(): Promise<any> {
    try {
      const configPath = join(this.pathHandler.getProjectRoot(), 'architech.json');
      const configContent = await readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Load feature blueprint
   */
  private async loadFeatureBlueprint(featureSpec: FeatureSpec): Promise<any> {
    if (featureSpec.type === 'adapter-feature') {
      // Load adapter feature from dist directory of the Architech tool
      const require = createRequire(import.meta.url);
      const currentDir = dirname(require.resolve('../../../../package.json'));
      const category = this.getAdapterCategory(featureSpec.adapterId!);
      const adapterPath = join(
        currentDir,
        'dist',
        'adapters',
        category,
        featureSpec.adapterId!,
        'features',
        `${featureSpec.featureId}.blueprint.js`
      );
      
      try {
        const { default: blueprint } = await import(adapterPath);
        return blueprint;
      } catch (error) {
        console.error('Failed to load adapter feature blueprint:', error);
        return null;
      }
    } else {
      // Load cross-adapter feature
      const require = createRequire(import.meta.url);
      const currentDir = dirname(require.resolve('../../../../package.json'));
      const featurePath = join(
        currentDir,
        'dist',
        'features',
        featureSpec.featureId,
        'blueprint.js'
      );
      
      try {
        const { default: blueprint } = await import(featurePath);
        return blueprint;
      } catch (error) {
        console.error('Failed to load cross-adapter feature blueprint:', error);
        return null;
      }
    }
  }

  /**
   * Get adapter category from adapter ID
   */
  private getAdapterCategory(adapterId: string): string {
    const categoryMap: Record<string, string> = {
      'stripe': 'payment',
      'better-auth': 'auth',
      'drizzle': 'database',
      'prisma': 'database',
      'typeorm': 'database',
      'sequelize': 'database',
      'nextjs': 'framework',
      'shadcn-ui': 'ui',
      'resend': 'email',
      'sentry': 'observability',
      'vitest': 'testing',
      'zustand': 'state',
      'docker': 'deployment',
      'next-intl': 'content',
      'web3': 'blockchain'
    };
    
    return categoryMap[adapterId] || 'unknown';
  }

  /**
   * Create project context for feature execution
   */
  private async createProjectContext(featureSpec: FeatureSpec, projectConfig: any): Promise<ProjectContext> {
    return {
      project: {
        name: projectConfig.project?.name || 'unknown',
        path: this.pathHandler.getProjectRoot(),
        framework: projectConfig.project?.framework || 'unknown',
        description: projectConfig.project?.description,
        author: projectConfig.project?.author,
        version: projectConfig.project?.version,
        license: projectConfig.project?.license
      },
      module: {
        id: featureSpec.featureId,
        category: featureSpec.type === 'adapter-feature' ? featureSpec.adapterId! : 'cross-adapter',
        version: 'latest',
        parameters: {} // Feature parameters would be loaded here
      },
      framework: projectConfig.project?.framework || 'unknown'
    };
  }

  /**
   * Check for conflicts with existing project
   */
  private async checkConflicts(featureSpec: FeatureSpec, projectConfig: any): Promise<string[]> {
    const conflicts: string[] = [];

    // Check if feature is already installed
    if (projectConfig.features) {
      const existingFeature = projectConfig.features.find((f: any) => 
        f.id === featureSpec.featureId || f.spec === featureSpec.fullSpec
      );
      
      if (existingFeature) {
        conflicts.push(`Feature ${featureSpec.fullSpec} is already installed`);
      }
    }

    // Check for file conflicts
    // This would be implemented by analyzing the blueprint actions
    // and checking if target files already exist

    return conflicts;
  }

  /**
   * Update project configuration with new feature
   */
  private async updateProjectConfig(featureSpec: FeatureSpec, projectConfig: any): Promise<void> {
    // Add feature to project configuration
    if (!projectConfig.features) {
      projectConfig.features = [];
    }

    projectConfig.features.push({
      id: featureSpec.featureId,
      spec: featureSpec.fullSpec,
      addedAt: new Date().toISOString(),
      type: featureSpec.type
    });

    // Write updated configuration
    const configPath = join(this.pathHandler.getProjectRoot(), 'architech.json');
    await writeFile(configPath, JSON.stringify(projectConfig, null, 2));
  }
}

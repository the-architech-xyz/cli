/**
 * UI Agent - Tech-Agnostic UI Orchestrator
 * 
 * Pure orchestrator for UI setup using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates UI adapters.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';
import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createUIAdapter } from '../core/registry/adapter-registry';
import { AgentContext as AdapterContext, PluginResult, CoreCategory } from '../core/interfaces/base';
import { IUIProvider } from '../core/interfaces/providers';
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

interface UIConfig {
  provider: 'shadcn-ui' | 'chakra-ui' | 'mui' | 'antd' | 'tailwind' | 'styled-components';
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  components: string[];
  features: {
    darkMode: boolean;
    responsive: boolean;
    animations: boolean;
    accessibility: boolean;
    internationalization: boolean;
  };
  darkMode?: {
    strategy: 'class' | 'media';
    storageKey: string;
  };
  responsive?: {
    breakpoints: Record<string, string>;
    mobileFirst: boolean;
  };
  animations?: {
    library: 'framer-motion' | 'react-spring' | 'auto';
    duration: number;
  };
  accessibility?: {
    ariaLabels: boolean;
    keyboardNavigation: boolean;
    screenReader: boolean;
  };
  internationalization?: {
    locales: string[];
    defaultLocale: string;
    fallback: string;
  };
}

export class UIAgent extends AbstractAgent {
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
      name: 'UIAgent',
      version: '3.0.0',
      description: 'Orchestrates UI setup using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.UI,
      tags: [CoreCategory.UI, 'components', 'styling', 'tech-agnostic'],
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
        name: 'ui-setup',
        description: 'Setup UI with tech-agnostic adapters',
        category: CapabilityCategory.SETUP,
        parameters: [
          {
            name: 'provider',
            type: 'string',
            description: 'UI provider',
            required: false,
            defaultValue: 'shadcn-ui'
          },
          {
            name: 'theme',
            type: 'object',
            description: 'Theme configuration',
            required: false,
            defaultValue: {
              primary: '#3b82f6',
              secondary: '#64748b',
              accent: '#f59e0b',
              background: '#ffffff',
              foreground: '#0f172a'
            }
          },
          {
            name: 'components',
            type: 'array',
            description: 'UI components to install',
            required: false,
            defaultValue: ['button', 'card', 'input', 'modal']
          },
          {
            name: 'features',
            type: 'object',
            description: 'UI features',
            required: false,
            defaultValue: {
              darkMode: true,
              responsive: true,
              animations: false,
              accessibility: true,
              internationalization: false
            }
          },
          {
            name: 'darkMode',
            type: 'object',
            description: 'Dark mode configuration',
            required: false,
            defaultValue: {
              strategy: 'class',
              storageKey: 'theme'
            }
          },
          {
            name: 'responsive',
            type: 'object',
            description: 'Responsive design configuration',
            required: false,
            defaultValue: {
              breakpoints: {
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px'
              },
              mobileFirst: true
            }
          },
          {
            name: 'animations',
            type: 'object',
            description: 'Animation configuration',
            required: false,
            defaultValue: {
              library: 'auto',
              duration: 300
            }
          },
          {
            name: 'accessibility',
            type: 'object',
            description: 'Accessibility configuration',
            required: false,
            defaultValue: {
              ariaLabels: true,
              keyboardNavigation: true,
              screenReader: true
            }
          },
          {
            name: 'internationalization',
            type: 'object',
            description: 'Internationalization configuration',
            required: false,
            defaultValue: {
              locales: ['en'],
              defaultLocale: 'en',
              fallback: 'en'
            }
          }
        ],
        examples: [
          {
            name: 'Setup Shadcn/ui',
            description: 'Creates UI setup with Shadcn/ui using adapters',
            parameters: { provider: 'shadcn-ui', components: ['button', 'card', 'input'] },
            expectedResult: 'Complete UI setup with Shadcn/ui via adapter'
          },
          {
            name: 'Setup Chakra UI',
            description: 'Creates UI setup with Chakra UI using adapters',
            parameters: { provider: 'chakra-ui', components: ['button', 'card', 'input'] },
            expectedResult: 'UI setup with Chakra UI via adapter'
          }
        ]
      },
      {
        name: 'ui-validation',
        description: 'Validate UI setup',
        category: CapabilityCategory.VALIDATION,
        parameters: [],
        examples: [
          {
            name: 'Validate UI setup',
            description: 'Validates the UI setup using adapters',
            parameters: {},
            expectedResult: 'UI setup validation report'
          }
        ]
      }
    ];
  }

  // ============================================================================
  // ADAPTER DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  /**
   * Get available UI adapters
   */
  async getAvailablePlugins(): Promise<IPlugin[]> {
    const uiAdapters = this.registry.getAdaptersForCategory(CoreCategory.UI);
    
    // Convert to IPlugin format for compatibility
    return uiAdapters.map(adapter => ({
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
    const adapter = adapters.find(a => a.name === pluginId && a.category === CoreCategory.UI);
    
    if (!adapter) {
      throw new Error(`UI adapter not found: ${pluginId}`);
    }

    return [
      {
        name: `${adapter.name}-setup`,
        description: adapter.description || 'UI setup capability',
        category: CapabilityCategory.SETUP,
        parameters: []
      }
    ];
  }

  /**
   * Get UI technology recommendations
   */
  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    const adapters = this.registry.getAdaptersForCategory(CoreCategory.UI);
    
    return adapters.map(adapter => {
      let confidence = 0.7;
      let reason = adapter.description || 'UI adapter';

      if (adapter.name === 'shadcn-ui') {
        confidence = 0.9;
        reason = 'Modern component library with excellent TypeScript support';
      } else if (adapter.name === 'chakra-ui') {
        confidence = 0.8;
        reason = 'Comprehensive UI library with excellent accessibility';
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
    return [PluginCategory.UI_LIBRARY];
  }

  // ============================================================================
  // CORE EXECUTION - Tech-Agnostic Adapter Orchestration
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.logger.info('Starting UI orchestration with tech-agnostic adapters...');

      // For monorepo, install UI in the ui package directory
      const isMonorepo = context.projectStructure?.type === 'monorepo';
      let packagePath: string;
      
      if (isMonorepo) {
        packagePath = path.join(context.projectPath, 'packages', CoreCategory.UI);
        context.logger.info(`UI package path: ${packagePath}`);
        await this.ensurePackageDirectory(context, CoreCategory.UI, packagePath);
      } else {
        packagePath = context.projectPath;
        context.logger.info(`Using project root for UI setup: ${packagePath}`);
      }

      // Select UI adapter
      const selectedAdapter = await this.selectUIAdapter(context);

      // Get UI configuration
      const uiConfig = await this.getUIConfig(context);

      // Execute selected UI adapter
      context.logger.info(`Executing ${selectedAdapter} adapter...`);
      const result = await this.executeUIAdapter(context, selectedAdapter, uiConfig, packagePath);

      // Validate the setup
      await this.validateUISetup(context, selectedAdapter, packagePath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          adapter: selectedAdapter,
          packagePath,
          provider: uiConfig.provider,
          components: uiConfig.components,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.logger.error(`UI setup failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'UI_SETUP_FAILED',
        `Failed to setup UI: ${errorMessage}`,
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

    // Check if UI package exists
    const packagePath = this.getPackagePath(context, CoreCategory.UI);
    if (!await fsExtra.pathExists(packagePath)) {
      warnings.push(`UI package directory will be created at: ${packagePath}`);
    }

    // Check if UI adapters are available
    const uiAdapters = this.registry.getAdaptersForCategory(CoreCategory.UI);
    if (uiAdapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No UI adapters found in registry',
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
  // PRIVATE METHODS - UI Setup
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

  private async getUIConfig(context: AgentContext): Promise<UIConfig> {
    const userConfig = context.config.ui || {};
    
    return {
      provider: userConfig.provider || 'shadcn-ui',
      theme: {
        primary: userConfig.theme?.primary || '#3b82f6',
        secondary: userConfig.theme?.secondary || '#64748b',
        accent: userConfig.theme?.accent || '#f59e0b',
        background: userConfig.theme?.background || '#ffffff',
        foreground: userConfig.theme?.foreground || '#0f172a'
      },
      components: userConfig.components || ['button', 'card', 'input', 'modal'],
      features: {
        darkMode: userConfig.features?.darkMode !== false,
        responsive: userConfig.features?.responsive !== false,
        animations: userConfig.features?.animations || false,
        accessibility: userConfig.features?.accessibility !== false,
        internationalization: userConfig.features?.internationalization || false,
      },
      darkMode: userConfig.darkMode,
      responsive: userConfig.responsive,
      animations: userConfig.animations,
      accessibility: userConfig.accessibility,
      internationalization: userConfig.internationalization,
    };
  }

  // ============================================================================
  // ADAPTER EXECUTION
  // ============================================================================

  private async executeUIAdapter(
    context: AgentContext,
    adapterName: string,
    uiConfig: UIConfig,
    packagePath: string
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    try {
      context.logger.info(`Creating ${adapterName} adapter instance...`);
      
      // Create adapter instance
      const adapter = await createUIAdapter(adapterName);
      
      context.logger.info(`Found ${adapterName} adapter`);

      // Create adapter context
      const adapterContext: AdapterContext = {
        workspacePath: packagePath,
        answers: {
          uiConfig: uiConfig,
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
      context.logger.error(`Error in executeUIAdapter for ${adapterName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async validateUISetup(
    context: AgentContext,
    adapterName: string,
    packagePath: string
  ): Promise<void> {
    context.logger.info(`Validating ${adapterName} UI setup...`);
    
    try {
      // Create adapter for validation
      const adapter = await createUIAdapter(adapterName);
      
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
      
      context.logger.info(`${adapterName} UI setup validation completed`);
      
    } catch (error) {
      context.logger.warn(`UI validation warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // ADAPTER SELECTION
  // ============================================================================

  private async selectUIAdapter(context: AgentContext): Promise<string> {
    // Check environment variable first
    const envProvider = process.env.UI_PROVIDER;
    if (envProvider) {
      context.logger.info(`Using environment UI provider: ${envProvider}`);
      return envProvider;
    }

    // Check user preference
    const userPreference = context.state.get('uiTechnology');
    if (userPreference) {
      context.logger.info(`Using user preference for UI: ${userPreference}`);
      return userPreference;
    }

    // Check project configuration
    const projectUI = context.config.ui?.technology;
    if (projectUI) {
      context.logger.info(`Using project UI technology: ${projectUI}`);
      return projectUI;
    }

    // Default to Shadcn/ui
    context.logger.info('Using default UI technology: shadcn-ui');
    return 'shadcn-ui';
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    context.logger.info('Rolling back UI changes...');
    
    try {
      const selectedProvider = process.env.UI_PROVIDER || 'shadcn-ui';
      const adapter = await createUIAdapter(selectedProvider);
      
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
      const packagePath = this.getPackagePath(context, CoreCategory.UI);
      if (existsSync(packagePath)) {
        await fsExtra.remove(packagePath);
        context.logger.info(`Removed UI package directory: ${packagePath}`);
      }
      
    } catch (error) {
      context.logger.error('UI rollback failed:', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}
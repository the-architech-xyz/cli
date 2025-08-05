/**
 * Orchestrator Agent - Tech-Agnostic Project Orchestrator
 * 
 * Pure orchestrator for project generation using tech-agnostic adapter interfaces.
 * Handles user interaction, decision making, and coordinates all domain agents.
 * Preserves all advanced configuration while enabling provider switching.
 */

import { AbstractAgent } from './base/abstract-agent.js';
import { AdapterRegistry, createDatabaseAdapter, createAuthAdapter, createUIAdapter, createFrameworkAdapter, createDeploymentAdapter, createTestingAdapter, createObservabilityAdapter } from '../core/registry/adapter-registry.js';
import { IPlugin, CoreCategory, AgentContext as AdapterContext, PluginResult } from '../core/interfaces/base.js';
import { IDatabaseProvider, IAuthProvider, IUIProvider, IFrameworkProvider, IDeploymentProvider, ITestingProvider, IObservabilityProvider } from '../core/interfaces/providers.js';
import { PluginContext, ProjectType, TargetPlatform, IPlugin as OldIPlugin, PluginCategory } from '../types/plugins.js';
import { TechRecommendation } from '../types/smart-questions.js';
import { structureService, StructureInfo } from '../core/project/structure-service.js';
import { ProjectContext, TechRecommendation as SmartTechRecommendation } from '../types/smart-questions.js';
import { AgentContext, AgentResult, AgentMetadata, AgentCapability, AgentCategory, CapabilityCategory, ValidationResult, Artifact, ValidationError } from '../types/agents.js';
import { CommandRunner } from '../core/cli/command-runner.js';
import { Logger } from '../core/cli/logger.js';
import { existsSync } from 'fs';
import * as path from 'path';
import fsExtra from 'fs-extra';

interface ProjectRequirements {
  name: string;
  type: ProjectType;
  platforms: TargetPlatform[];
  features: string[];
  complexity: 'simple' | 'medium' | 'complex';
  providers: {
    framework?: string;
    database?: string;
    auth?: string;
    ui?: string;
    deployment?: string;
    testing?: string;
    observability?: string;
  };
  customizations: Record<string, any>;
}

interface OrchestrationPlan {
  phases: OrchestrationPhase[];
  estimatedTime: string;
  dependencies: string[];
  conflicts: string[];
}

interface OrchestrationPhase {
  name: string;
  description: string;
  agent: string;
  dependencies: string[];
  estimatedTime: number;
  critical: boolean;
}

export class OrchestratorAgent extends AbstractAgent {
  private registry: AdapterRegistry;
  private logger: any;
  private runner: CommandRunner;

  constructor() {
    super();
    this.registry = AdapterRegistry.getInstance();
    this.logger = {
      info: (message: string) => console.log(`[INFO] ${message}`),
      warn: (message: string) => console.warn(`[WARN] ${message}`),
      error: (message: string) => console.error(`[ERROR] ${message}`),
      debug: (message: string) => console.log(`[DEBUG] ${message}`),
      success: (message: string) => console.log(`[SUCCESS] ${message}`)
    };
    this.runner = new CommandRunner();
  }

  // ============================================================================
  // AGENT METADATA
  // ============================================================================

  protected getAgentMetadata(): AgentMetadata {
    return {
      name: 'OrchestratorAgent',
      version: '3.0.0',
      description: 'Orchestrates project generation using tech-agnostic adapters',
      author: 'The Architech Team',
      category: AgentCategory.ADMIN,
      tags: ['orchestration', 'project-generation', 'tech-agnostic'],
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

  // ============================================================================
  // AGENT CAPABILITIES
  // ============================================================================

  getAgentCapabilities(): AgentCapability[] {
    return [
      {
        name: 'project-orchestration',
        description: 'Orchestrate complete project generation',
        category: CapabilityCategory.FOUNDATION,
        parameters: []
      },
      {
        name: 'tech-stack-selection',
        description: 'Select optimal technology stack',
        category: CapabilityCategory.CONFIGURATION,
        parameters: []
      },
      {
        name: 'project-generation',
        description: 'Generate complete project structure',
        category: CapabilityCategory.GENERATION,
        parameters: []
      }
    ];
  }

  // ============================================================================
  // ABSTRACT METHOD IMPLEMENTATION
  // ============================================================================

  protected async executeInternal(context: AgentContext): Promise<AgentResult> {
    return this.execute(context);
  }

  // ============================================================================
  // PLUGIN DISCOVERY & RECOMMENDATIONS
  // ============================================================================

  async getAvailablePlugins(): Promise<IPlugin[]> {
    const availableAdapters = this.registry.listAdapters();
    return availableAdapters.map((adapter: any) => ({
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

  getRecommendations(context: ProjectContext): TechRecommendation[] {
    const availableAdapters = this.registry.listAdapters();
    return availableAdapters.map((adapter: any) => {
      let reason = adapter.description || 'Modern technology adapter';
      let confidence = 0.8;

      // Adjust confidence based on adapter characteristics
      if (adapter.name.toLowerCase().includes('next')) {
        confidence = 0.9;
        reason = 'Production-ready React framework with excellent developer experience';
      } else if (adapter.name.toLowerCase().includes('drizzle')) {
        confidence = 0.85;
        reason = 'TypeScript-first ORM with excellent performance';
      }

      return {
        name: adapter.name,
        reason: reason,
        confidence: confidence
      };
    }).sort((a: any, b: any) => b.confidence - a.confidence);
  }

  getDomainCategories(): PluginCategory[] {
    const categories = this.registry.listAdapters()
      .map((a: any) => a.category)
      .filter((cat: any, index: any, arr: any) => arr.indexOf(cat) === index);
    
    return categories.map((cat: any) => {
      switch (cat) {
        case CoreCategory.FRAMEWORK: return PluginCategory.FRAMEWORK;
        case CoreCategory.DATABASE: return PluginCategory.DATABASE;
        case CoreCategory.AUTH: return PluginCategory.AUTHENTICATION;
        case CoreCategory.UI: return PluginCategory.DESIGN_SYSTEM;
        case CoreCategory.DEPLOYMENT: return PluginCategory.DEPLOYMENT;
        case CoreCategory.TESTING: return PluginCategory.TESTING;
        case CoreCategory.OBSERVABILITY: return PluginCategory.MONITORING;
        default: return PluginCategory.CUSTOM;
      }
    });
  }

  // ============================================================================
  // CORE EXECUTION
  // ============================================================================

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting project orchestration with tech-agnostic adapters...');

      // Convert user input to project requirements
      const requirements = this.convertConfigToRequirements(context.config, context);

      // Generate orchestration plan
      const plan = await this.generateTechAgnosticPlan(requirements, context);

      // Execute orchestration plan
      const result = await this.executeTechAgnosticPlan(plan, context);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        artifacts: result.artifacts || [],
        data: {
          requirements,
          plan,
          techAgnostic: true
        },
        errors: [],
        warnings: result.warnings || [],
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Project orchestration failed: ${errorMessage}`);
      
      return this.createErrorResult(
        'ORCHESTRATION_FAILED',
        `Failed to orchestrate project: ${errorMessage}`,
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
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check if we have any adapters available
    const adapters = this.registry.listAdapters();
    if (adapters.length === 0) {
      errors.push({
        field: 'adapters',
        message: 'No adapters available in registry',
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
  // PRIVATE HELPER METHODS
  // ============================================================================

  private convertConfigToRequirements(projectConfig: any, context: AgentContext): ProjectRequirements {
    return {
      name: context.projectName,
      type: projectConfig.projectType || 'custom',
      platforms: ['web' as TargetPlatform],
      features: projectConfig.features || [],
      complexity: projectConfig.complexity || 'medium',
      providers: {
        framework: 'nextjs',
        database: 'drizzle',
        auth: 'better-auth',
        ui: 'shadcn-ui',
        deployment: 'docker',
        testing: 'vitest',
        observability: 'google-analytics'
      },
      customizations: projectConfig.customizations || {}
    };
  }

  private async generateTechAgnosticPlan(requirements: ProjectRequirements, context: AgentContext): Promise<OrchestrationPlan> {
    const phases: OrchestrationPhase[] = [
      {
        name: 'Project Structure',
        description: 'Create base project structure',
        agent: 'base-project',
        dependencies: [],
        estimatedTime: 1000,
        critical: true
      },
      {
        name: 'Framework Setup',
        description: 'Setup Next.js framework',
        agent: 'framework',
        dependencies: ['base-project'],
        estimatedTime: 2000,
        critical: true
      },
      {
        name: 'Database Setup',
        description: 'Setup Drizzle database',
        agent: 'database',
        dependencies: ['framework'],
        estimatedTime: 1500,
        critical: true
      },
      {
        name: 'Authentication Setup',
        description: 'Setup Better Auth',
        agent: 'auth',
        dependencies: ['database'],
        estimatedTime: 1500,
        critical: true
      },
      {
        name: 'UI Setup',
        description: 'Setup Shadcn/UI',
        agent: 'ui',
        dependencies: ['framework'],
        estimatedTime: 1000,
        critical: false
      },
      {
        name: 'Testing Setup',
        description: 'Setup Vitest testing',
        agent: 'testing',
        dependencies: ['framework'],
        estimatedTime: 800,
        critical: false
      },
      {
        name: 'Deployment Setup',
        description: 'Setup Docker deployment',
        agent: 'deployment',
        dependencies: ['framework'],
        estimatedTime: 1200,
        critical: false
      }
    ];

    return {
      phases,
      estimatedTime: '5 minutes',
      dependencies: [],
      conflicts: []
    };
  }

  private async executeTechAgnosticPlan(
    plan: OrchestrationPlan,
    context: AgentContext
  ): Promise<{ artifacts: any[]; warnings: string[] }> {
    const artifacts: any[] = [];
    const warnings: string[] = [];

    for (const phase of plan.phases) {
      this.logger.info(`Executing phase: ${phase.name}`);
      
      try {
        const phaseResult = await this.executePhase(phase, context);
        artifacts.push(...phaseResult.artifacts);
        warnings.push(...phaseResult.warnings);
        
        this.logger.info(`Phase ${phase.name} completed successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Phase ${phase.name} failed: ${errorMessage}`);
        
        if (phase.critical) {
          throw error; // Re-throw critical phase failures
        } else {
          warnings.push(`Phase ${phase.name} failed: ${errorMessage}`);
        }
      }
    }

    return { artifacts, warnings };
  }

  private async executePhase(phase: OrchestrationPhase, context: AgentContext): Promise<{ artifacts: any[]; warnings: string[] }> {
    const artifacts: any[] = [];
    const warnings: string[] = [];

    // Convert AgentContext to AdapterContext
    const adapterContext: AdapterContext = {
      workspacePath: context.projectPath,
      answers: context.config,
      env: process.env as Record<string, string>,
      runStep: async (stepId: string, cmd: string) => {
        this.logger.info(`[${stepId}] ${cmd}`);
        await this.runner.execCommand(cmd.split(' '), { cwd: context.projectPath });
      },
      log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
        this.logger[level](message);
      }
    };

    switch (phase.agent) {
      case 'framework':
        const frameworkAdapter = await this.registry.createFrameworkAdapter('nextjs');
        const frameworkResult = await frameworkAdapter.execute(adapterContext);
        if (frameworkResult.success) {
          artifacts.push(...(frameworkResult.artifacts || []));
          warnings.push(...(frameworkResult.warnings || []));
        } else {
          throw new Error(`Framework setup failed: ${frameworkResult.errors?.join(', ')}`);
        }
        break;

      case 'database':
        const databaseAdapter = await this.registry.createDatabaseAdapter('drizzle');
        const databaseResult = await databaseAdapter.execute(adapterContext);
        if (databaseResult.success) {
          artifacts.push(...(databaseResult.artifacts || []));
          warnings.push(...(databaseResult.warnings || []));
        } else {
          throw new Error(`Database setup failed: ${databaseResult.errors?.join(', ')}`);
        }
        break;

      case 'auth':
        const authAdapter = await this.registry.createAuthAdapter('better-auth');
        const authResult = await authAdapter.execute(adapterContext);
        if (authResult.success) {
          artifacts.push(...(authResult.artifacts || []));
          warnings.push(...(authResult.warnings || []));
        } else {
          throw new Error(`Auth setup failed: ${authResult.errors?.join(', ')}`);
        }
        break;

      case 'ui':
        const uiAdapter = await this.registry.createUIAdapter('shadcn-ui');
        const uiResult = await uiAdapter.execute(adapterContext);
        if (uiResult.success) {
          artifacts.push(...(uiResult.artifacts || []));
          warnings.push(...(uiResult.warnings || []));
        } else {
          throw new Error(`UI setup failed: ${uiResult.errors?.join(', ')}`);
        }
        break;

      case 'testing':
        const testingAdapter = await this.registry.createTestingAdapter('vitest');
        const testingResult = await testingAdapter.execute(adapterContext);
        if (testingResult.success) {
          artifacts.push(...(testingResult.artifacts || []));
          warnings.push(...(testingResult.warnings || []));
        } else {
          throw new Error(`Testing setup failed: ${testingResult.errors?.join(', ')}`);
        }
        break;

      case 'deployment':
        const deploymentAdapter = await this.registry.createDeploymentAdapter('docker');
        const deploymentResult = await deploymentAdapter.execute(adapterContext);
        if (deploymentResult.success) {
          artifacts.push(...(deploymentResult.artifacts || []));
          warnings.push(...(deploymentResult.warnings || []));
        } else {
          throw new Error(`Deployment setup failed: ${deploymentResult.errors?.join(', ')}`);
        }
        break;

      case 'base-project':
        // Create basic project structure
        await this.createBaseProjectStructure(context);
        artifacts.push('package.json', 'README.md', '.gitignore');
        break;

      default:
        this.logger.warn(`Unknown phase agent: ${phase.agent}`);
        break;
    }

    return { artifacts, warnings };
  }

  private async createBaseProjectStructure(context: AgentContext): Promise<void> {
    // Ensure project directory exists
    await fsExtra.ensureDir(context.projectPath);
    
    // Create package.json
    const packageJson = {
      name: context.projectName || 'my-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {},
      devDependencies: {}
    };

    await fsExtra.writeJson(path.join(context.projectPath, 'package.json'), packageJson, { spaces: 2 });

    // Create README.md
    const readmeContent = `# ${context.projectName || 'My App'}

This project was generated with The Architech CLI.

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

This project uses:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Better Auth
- Shadcn/UI Components

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [The Architech Documentation](https://the-architech.dev)
`;

    await fsExtra.writeFile(path.join(context.projectPath, 'README.md'), readmeContent);

    // Create .gitignore
    const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`;

    await fsExtra.writeFile(path.join(context.projectPath, '.gitignore'), gitignoreContent);

    this.logger.info('Base project structure created successfully');
  }

  protected createErrorResult(
    code: string,
    message: string,
    errors: any[] = [],
    startTime: number = Date.now(),
    originalError?: any
  ): AgentResult {
    return {
      success: false,
      artifacts: [],
      errors: [
        {
          code,
          message,
          details: originalError,
          recoverable: false,
          timestamp: new Date()
        }
      ],
      warnings: [],
      duration: Date.now() - startTime
    };
  }

  // ============================================================================
  // ROLLBACK
  // ============================================================================

  async rollback(context: AgentContext): Promise<void> {
    this.logger.info('Rolling back project generation...');
    
    // Remove generated project directory
    if (await fsExtra.pathExists(context.projectPath)) {
      await fsExtra.remove(context.projectPath);
    }
  }
} 
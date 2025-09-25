/**
 * Orchestrator Agent
 * 
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Recipe, Module, ExecutionResult } from '@thearchitech.xyz/types';
import { ProjectManager } from '../core/services/project/project-manager.js';
import { PathService } from '../core/services/path/path-service.js';
import { BlueprintExecutor } from '../core/services/execution/blueprint/blueprint-executor.js';
import { VirtualFileSystem } from '../core/services/file-system/file-engine/virtual-file-system.js';
import { BlueprintAnalyzer } from '../core/services/project/blueprint-analyzer/index.js';
import { ModuleFetcherService } from '../core/services/module-management/fetcher/module-fetcher.js';
import { AdapterLoader } from '../core/services/module-management/adapter/adapter-loader.js';
import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import * as path from 'path';
import { FrameworkAgent } from './core/framework-agent.js';
import { DatabaseAgent } from './core/database-agent.js';
import { AuthAgent } from './core/auth-agent.js';
import { UIAgent } from './core/ui-agent.js';
import { TestingAgent } from './core/testing-agent.js';
import { DeploymentAgent } from './core/deployment-agent.js';
import { StateAgent } from './core/state-agent.js';
import { PaymentAgent } from './core/payment-agent.js';
import { EmailAgent } from './core/email-agent.js';
import { ObservabilityAgent } from './core/observability-agent.js';
import { ContentAgent } from './core/content-agent.js';
import { BlockchainAgent } from './core/blockchain-agent.js';
import { ModuleLoaderService } from '../core/services/module-management/module-loader/index.js';
import { Logger, ExecutionTracer, LogLevel } from '../core/services/infrastructure/logging/index.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';
import { DependencyGraph } from '../core/services/dependency/dependency-graph.js';
import { ExecutionPlanner } from '../core/services/dependency/execution-planner.js';
import { ParallelExecutionService } from '../core/services/execution/parallel-execution-service.js';

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathService;
  private moduleLoader: ModuleLoaderService;
  private agents: Map<string, unknown>;
  private blueprintAnalyzer: BlueprintAnalyzer;
  private moduleFetcher: ModuleFetcherService;
  private cacheManager: CacheManagerService;
  private dependencyGraph: DependencyGraph;
  private executionPlanner: ExecutionPlanner;
  private parallelExecutor: ParallelExecutionService;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.pathHandler = projectManager.getPathHandler();
    this.cacheManager = new CacheManagerService();
    this.moduleFetcher = new ModuleFetcherService(this.cacheManager);
    this.moduleLoader = new ModuleLoaderService(this.moduleFetcher);
    this.agents = new Map();
    
    // Initialize blueprint analyzer
    this.blueprintAnalyzer = new BlueprintAnalyzer();
    
    // Initialize dependency resolution services
    const adapterLoader = new AdapterLoader(this.moduleFetcher);
    this.dependencyGraph = new DependencyGraph(adapterLoader);
    this.executionPlanner = new ExecutionPlanner(this.dependencyGraph);
    this.parallelExecutor = new ParallelExecutionService(this);
    
    // Initialize agents (will be reconfigured with decentralized path handler)
    this.initializeAgents();
  }

  /**
   * Initialize all agents
   */
  private initializeAgents(): void {
    this.agents.set('framework', new FrameworkAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('database', new DatabaseAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('auth', new AuthAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('ui', new UIAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('testing', new TestingAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('deployment', new DeploymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('state', new StateAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('payment', new PaymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('email', new EmailAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('observability', new ObservabilityAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('content', new ContentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('blockchain', new BlockchainAgent(this.pathHandler, this.moduleFetcher));
  }

  /**
   * Reconfigure all agents with the decentralized path handler
   */
  private reconfigureAgents(): void {
    if (!this.pathHandler) {
      throw new Error('Path handler not initialized');
    }

    // Update all agents to use the path handler
    this.agents.set('framework', new FrameworkAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('database', new DatabaseAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('auth', new AuthAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('ui', new UIAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('testing', new TestingAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('deployment', new DeploymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('state', new StateAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('payment', new PaymentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('email', new EmailAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('observability', new ObservabilityAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('content', new ContentAgent(this.pathHandler, this.moduleFetcher));
    this.agents.set('blockchain', new BlockchainAgent(this.pathHandler, this.moduleFetcher));
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    await this.moduleFetcher.initialize();
  }

  /**
   * Execute a complete recipe using intelligent dependency resolution and parallel execution
   */
  async executeRecipe(recipe: Recipe, verbose: boolean = false): Promise<ExecutionResult> {
    // Initialize the orchestrator
    await this.initialize();
    
    // Start execution trace
    const traceId = ExecutionTracer.startTrace('intelligent_recipe_execution', {
      projectName: recipe.project.name,
      moduleCount: recipe.modules.length
    });

    Logger.info(`🧠 Intelligent Orchestrator executing recipe: ${recipe.project.name}`, {
      traceId,
      operation: 'intelligent_recipe_execution',
      moduleId: recipe.project.name
    });
    
    const results: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Setup framework and create path handler
      ExecutionTracer.logOperation(traceId, 'Setting up framework and path handler');
      const frameworkSetup = await this.moduleLoader.setupFramework(recipe, this.pathHandler);
      if (!frameworkSetup.success) {
        throw new Error(frameworkSetup.error);
      }
      
      this.pathHandler = frameworkSetup.pathHandler!;
      this.reconfigureAgents();
      
      // 2. Initialize project directory
      ExecutionTracer.logOperation(traceId, 'Initializing project directory');
      await this.projectManager.initializeProject();
      
      // 3. Build dependency graph
      ExecutionTracer.logOperation(traceId, 'Building dependency graph');
      const graphResult = await this.dependencyGraph.buildGraph(recipe.modules);
      if (!graphResult.success) {
        throw new Error(`Dependency graph build failed: ${graphResult.errors.join(', ')}`);
      }

      // 4. Create execution plan
      ExecutionTracer.logOperation(traceId, 'Creating execution plan');
      const executionPlan = this.executionPlanner.createExecutionPlan();
      if (!executionPlan.success) {
        throw new Error(`Execution plan creation failed: ${executionPlan.errors.join(', ')}`);
      }

      // 5. Log execution plan
      Logger.info(`📋 Execution plan created:`, {
        traceId,
        operation: 'execution_planning'
      });
      
      for (const batch of executionPlan.batches) {
        const moduleIds = batch.modules.map(m => m.id).join(', ');
        Logger.info(`  Batch ${batch.batchNumber}: [${moduleIds}] ${batch.canExecuteInParallel ? '(parallel)' : '(sequential)'}`, {
          traceId,
          operation: 'execution_planning'
        });
      }

      // 6. Execute batches using parallel execution service
      ExecutionTracer.logOperation(traceId, 'Executing batches');
      const executionResult = await this.parallelExecutor.executeAllBatches(executionPlan.batches);
      
      if (executionResult.success) {
        results.push(...executionResult.batchResults.flatMap(br => br.results.flatMap(r => r.executedModules)));
        Logger.info(`✅ All batches executed successfully`, {
            traceId,
          operation: 'batch_execution'
        });
      } else {
        // FAIL-FAST: Stop immediately on any batch failure
        errors.push(...executionResult.errors);
        Logger.error(`❌ Batch execution failed: ${executionResult.errors.join(', ')}`, {
              traceId,
          operation: 'batch_execution'
        });
        
        // Check for critical module failures (framework, database, etc.)
        const criticalFailures = this.identifyCriticalFailures(executionResult.batchResults);
        if (criticalFailures.length > 0) {
          const criticalErrorResult = ErrorHandler.handleCriticalError(
            `Critical modules failed: ${criticalFailures.join(', ')}. Generation cannot continue.`,
            traceId,
            'critical_failure',
            verbose
          );
          errors.push(ErrorHandler.formatUserError(criticalErrorResult, verbose));
          Logger.error(`💥 ${criticalErrorResult.error}`, {
            traceId,
            operation: 'critical_failure'
          });
          
          // Stop execution immediately - do not proceed to dependency installation
          ExecutionTracer.endTrace(traceId, false, new Error(criticalErrorResult.error));
          
          return {
            success: false,
            modulesExecuted: 0,
            errors,
            warnings
          };
        }
        
        // For non-critical failures, also stop execution
        ExecutionTracer.endTrace(traceId, false, new Error('Module execution failed'));
        
        return {
          success: false,
          modulesExecuted: 0,
          errors,
          warnings
        };
      }

      // 7. Install dependencies (only if all modules succeeded)
      ExecutionTracer.logOperation(traceId, 'Installing dependencies');
      try {
        await this.installDependencies();
        } catch (error) {
        const dependencyErrorResult = ErrorHandler.handleDependencyFailure(error, verbose);
        errors.push(ErrorHandler.formatUserError(dependencyErrorResult, verbose));
        Logger.error(`❌ ${dependencyErrorResult.error}`, {
            traceId,
          operation: 'dependency_installation'
        });
        
        ExecutionTracer.endTrace(traceId, false, new Error(dependencyErrorResult.error));
        
        return {
          success: false,
          modulesExecuted: 0,
          errors,
          warnings
        };
      }
      
      const success = errors.length === 0;
      
      ExecutionTracer.endTrace(traceId, success);

      Logger.info(`${success ? '✅' : '❌'} Intelligent recipe execution ${success ? 'completed' : 'failed'}`, {
          traceId,
        operation: 'intelligent_recipe_execution',
        executedModules: results.length,
        failedModules: executionResult.totalFailed
        });
      
      return {
        success,
        modulesExecuted: results.length,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Intelligent recipe execution failed: ${errorMessage}`, {
        traceId,
        operation: 'intelligent_recipe_execution'
      });
      
      ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : new Error(errorMessage));
      
      return {
        success: false,
        modulesExecuted: 0,
          errors: [...errors, errorMessage],
          warnings
        };
    }
  }



  /**
   * Get available agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent by category
   */
  getAgent(category: string): unknown {
    return this.agents.get(category);
  }

  /**
   * Create architech.json configuration file
   */
  private async createArchitechConfig(recipe: Recipe): Promise<void> {
    try {
      const config = {
        version: '1.0',
        project: {
          name: recipe.project.name,
          framework: recipe.project.framework,
          description: recipe.project.description,
          path: recipe.project.path
        },
        modules: recipe.modules.map(module => ({
          id: module.id,
          category: module.category,
          version: module.version,
          parameters: module.parameters,
          features: module.features || []
        })),
        options: recipe.options || {}
      };

      const configPath = path.join(this.pathHandler.getProjectRoot(), 'architech.json');
      const fs = await import('fs/promises');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log('📋 Created architech.json configuration file');
    } catch (error) {
      console.error('❌ Failed to create architech.json:', error);
    }
  }



  /**
   * Identify critical module failures that should stop execution
   */
  private identifyCriticalFailures(batchResults: any[]): string[] {
    const criticalFailures: string[] = [];
    const criticalCategories = ['framework', 'database'];
    
    for (const batchResult of batchResults) {
      if (!batchResult.success) {
        for (const result of batchResult.results) {
          if (!result.success) {
            for (const failedModule of result.failedModules) {
              // Extract category from module ID (e.g., 'framework/nextjs' -> 'framework')
              const category = failedModule.split('/')[0];
              if (criticalCategories.includes(category)) {
                criticalFailures.push(failedModule);
              }
            }
          }
        }
      }
    }
    
    return criticalFailures;
  }

  /**
   * Install dependencies (delegated to project manager)
   */
  private async installDependencies(): Promise<void> {
    try {
      console.log('📦 Installing dependencies...');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('npm install', { 
        cwd: this.pathHandler.getProjectRoot()
      });
      
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.warn('⚠️ Failed to install dependencies automatically. Please run "npm install" manually.');
      console.warn(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a single module (for ParallelExecutionService)
   */
  async executeModule(module: Module): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info(`🔧 Executing module: ${module.id}`, {
        operation: 'module_execution',
        moduleId: module.id
      });

      // Load adapter for this module
      const adapterResult = await this.moduleLoader.loadModuleAdapter(module);
      if (!adapterResult.success) {
        return { success: false, error: adapterResult.error || 'Unknown error' };
      }

      // Create project context
      const context = this.moduleLoader.createProjectContext(
        { project: { name: 'temp', path: this.pathHandler.getProjectRoot() }, modules: [module] } as Recipe,
        module,
        adapterResult.adapter!.config,
        this.pathHandler
      );

      // Execute blueprint
      const blueprint = adapterResult.adapter!.blueprint;
      const vfs = new VirtualFileSystem(`blueprint-${blueprint.id}`, this.pathHandler.getProjectRoot());
      
      const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot(), this.moduleFetcher);
      const blueprintContext = {
        vfs,
        projectRoot: this.pathHandler.getProjectRoot(),
        externalFiles: []
      };
      
      const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, blueprintContext);
      
      if (blueprintResult.success) {
        Logger.info(`✅ Module ${module.id} executed successfully`);
        return { success: true };
      } else {
        const errorMessage = blueprintResult.errors?.join(', ') || 'Unknown blueprint error';
        Logger.error(`❌ Module ${module.id} failed: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

}

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
import { BlueprintAnalyzer } from '../core/services/project/blueprint-analyzer/index.js';
import { ModuleService } from '../core/services/module-management/module-service.js';
import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import * as path from 'path';
import { Logger, ExecutionTracer, LogLevel } from '../core/services/infrastructure/logging/index.js';
import { ErrorHandler } from '../core/services/infrastructure/error/index.js';
import { DependencyGraph } from '../core/services/dependency/dependency-graph.js';
import { ExecutionPlanner } from '../core/services/dependency/execution-planner.js';
import { ParallelExecutionService } from '../core/services/execution/parallel-execution-service.js';
import { SuccessValidator } from '../core/services/validation/success-validator.js';

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathService;
  private moduleService: ModuleService;
  private blueprintAnalyzer: BlueprintAnalyzer;
  private cacheManager: CacheManagerService;
  private dependencyGraph: DependencyGraph;
  private executionPlanner: ExecutionPlanner;
  private parallelExecutor: ParallelExecutionService;
  private successValidator: SuccessValidator;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.pathHandler = projectManager.getPathHandler();
    this.cacheManager = new CacheManagerService();
    this.moduleService = new ModuleService(this.cacheManager);
    
    // Initialize blueprint analyzer
    this.blueprintAnalyzer = new BlueprintAnalyzer();
    
    // Initialize dependency resolution services
    this.dependencyGraph = new DependencyGraph(this.moduleService);
    this.executionPlanner = new ExecutionPlanner(this.dependencyGraph);
    this.parallelExecutor = new ParallelExecutionService(this);
    this.successValidator = new SuccessValidator();
  }


  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    await this.moduleService.initialize();
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
      const frameworkSetup = await this.moduleService.setupFramework(recipe, this.pathHandler);
      if (!frameworkSetup.success) {
        throw new Error(frameworkSetup.error);
      }
      
      this.pathHandler = frameworkSetup.pathHandler!;
      
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

      // 8. Success Validation - Final quality gate
      ExecutionTracer.logOperation(traceId, 'Validating generation success');
      try {
        // Get the list of files that should have been created
        const expectedFiles = this.getExpectedFilesFromExecution(executionResult);
        
        const validationResult = await this.successValidator.validate(
          this.pathHandler.getProjectRoot(),
          expectedFiles
        );

        if (!validationResult.isSuccess) {
          const validationErrorResult = ErrorHandler.handleCriticalError(
            `Success validation failed: ${validationResult.errors.join(', ')}`,
            traceId,
            'success_validation',
            verbose
          );
          errors.push(ErrorHandler.formatUserError(validationErrorResult, verbose));
          Logger.error(`❌ ${validationErrorResult.error}`, {
            traceId,
            operation: 'success_validation'
          });
          
          ExecutionTracer.endTrace(traceId, false, new Error(validationErrorResult.error));
          
          return {
            success: false,
            modulesExecuted: results.length,
            errors,
            warnings
          };
        }

        Logger.info('✅ Success validation passed - project is ready to use!', {
          traceId,
          operation: 'success_validation',
          filesValidated: validationResult.details.filesValidated,
          buildSuccess: validationResult.details.buildSuccess
        });

      } catch (error) {
        const validationErrorResult = ErrorHandler.handleCriticalError(
          error,
          traceId,
          'success_validation',
          verbose
        );
        errors.push(ErrorHandler.formatUserError(validationErrorResult, verbose));
        Logger.error(`❌ ${validationErrorResult.error}`, {
          traceId,
          operation: 'success_validation'
        });
        
        ExecutionTracer.endTrace(traceId, false, new Error(validationErrorResult.error));
        
        return {
          success: false,
          modulesExecuted: results.length,
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
   * Get expected files from execution result for validation
   */
  private getExpectedFilesFromExecution(executionResult: any): string[] {
    const expectedFiles: string[] = [];
    
    // Extract files from successful module executions
    for (const batchResult of executionResult.batchResults) {
      if (batchResult.success) {
        for (const result of batchResult.results) {
          if (result.success && result.executedModules) {
            // For now, we'll use a basic approach
            // In a real implementation, we'd track files created by each module
            expectedFiles.push('package.json'); // Always expect package.json
          }
        }
      }
    }
    
    return expectedFiles;
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
      const adapterResult = await this.moduleService.loadModuleAdapter(module);
      if (!adapterResult.success) {
        return { success: false, error: adapterResult.error || 'Unknown error' };
      }

      // Create project context
      const contextResult = this.moduleService.createProjectContext(
        { project: { name: 'temp', path: this.pathHandler.getProjectRoot() }, modules: [module] } as Recipe,
        this.pathHandler,
        module
      );
      
      if (!contextResult.success) {
        return { success: false, error: contextResult.error || 'Failed to create project context' };
      }
      
      const context = contextResult.context!;

      // Execute blueprint using the Intelligent Foreman
      const blueprint = adapterResult.adapter!.blueprint;
      const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot());
      const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context);
      
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

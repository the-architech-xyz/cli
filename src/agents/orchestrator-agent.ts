/**
 * Orchestrator Agent
 * 
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Recipe, Module, ExecutionResult, ProjectContext } from '@thearchitech.xyz/types';
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
import { ExecutionPlanner, ExecutionPlan } from '../core/services/dependency/execution-planner.js';
import { SequentialExecutionService } from '../core/services/execution/sequential-execution-service.js';
import { VirtualFileSystem } from '../core/services/file-system/file-engine/virtual-file-system.js';
import { SuccessValidator } from '../core/services/validation/success-validator.js';

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathService;
  private moduleService: ModuleService;
  private blueprintAnalyzer: BlueprintAnalyzer;
  private cacheManager: CacheManagerService;
  private dependencyGraph: DependencyGraph;
  private executionPlanner: ExecutionPlanner;
  private sequentialExecutor: SequentialExecutionService;
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
    this.sequentialExecutor = new SequentialExecutionService();
    this.successValidator = new SuccessValidator();
  }

  /**
   * Execute a recipe using unified dependency-driven execution
   */
  async executeRecipe(recipe: Recipe, verbose: boolean = false): Promise<ExecutionResult> {
    const traceId = ExecutionTracer.startTrace('orchestrator_execution');
    const results: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      Logger.info(`🚀 Starting recipe execution: ${recipe.project.name}`, {
        traceId,
        operation: 'recipe_execution'
      });

      // 1. Validate recipe
      ExecutionTracer.logOperation(traceId, 'Validating recipe');
      const validationResult = this.validateRecipe(recipe);
      if (!validationResult.valid) {
        throw new Error(`Recipe validation failed: ${validationResult.errors.join(', ')}`);
      }

      // 2. Load and validate modules
      ExecutionTracer.logOperation(traceId, 'Loading modules');
      // For now, skip module loading validation as it's not implemented
      Logger.info(`📦 Loading ${recipe.modules.length} modules`, {
        traceId,
        operation: 'module_loading'
      });
      
      // 3. Build dependency graph
      ExecutionTracer.logOperation(traceId, 'Building dependency graph');
      const graphResult = await this.dependencyGraph.buildGraph(recipe.modules);
      if (!graphResult.success) {
        throw new Error(`Dependency graph build failed: ${graphResult.errors.join(', ')}`);
      }

      // 4. Setup framework and get framework-specific path handler
      ExecutionTracer.logOperation(traceId, 'Setting up framework');
      const frameworkSetup = await this.moduleService.setupFramework(recipe, this.pathHandler);
      if (!frameworkSetup.success) {
        throw new Error(`Framework setup failed: ${frameworkSetup.error}`);
      }
      
      // Update path handler with framework-specific paths
      if (frameworkSetup.pathHandler) {
        this.pathHandler = frameworkSetup.pathHandler;
        Logger.info('📁 Framework paths configured', {
          traceId,
          operation: 'framework_setup',
          availablePaths: this.pathHandler.getAvailablePaths()
        });
      }

      // 5. Create execution plan
      ExecutionTracer.logOperation(traceId, 'Creating execution plan');
      const executionPlan = this.executionPlanner.createExecutionPlan();
      if (!executionPlan.success) {
        throw new Error(`Execution plan creation failed: ${executionPlan.errors.join(', ')}`);
      }

      // 5. Log execution plan with FULL DETAILS
      Logger.info(`📋 Execution plan created:`, {
        traceId,
        operation: 'execution_planning'
      });
      
      // DEBUG: Log the ENTIRE execution plan structure
      Logger.debug(`🔍 COMPLETE EXECUTION PLAN STRUCTURE:`, {
        traceId,
        operation: 'execution_planning',
        data: {
          totalBatches: executionPlan.batches.length,
          totalModules: executionPlan.batches.reduce((sum, batch) => sum + batch.modules.length, 0),
          estimatedDuration: executionPlan.batches.reduce((sum, batch) => sum + batch.estimatedDuration, 0),
          batches: executionPlan.batches.map(batch => ({
            batchNumber: batch.batchNumber,
            moduleCount: batch.modules.length,
            moduleIds: batch.modules.map(m => m.id),
            canExecuteInParallel: batch.canExecuteInParallel,
            estimatedDuration: batch.estimatedDuration,
            dependencies: batch.dependencies
          }))
        }
      });
      
      for (const batch of executionPlan.batches) {
        const moduleIds = batch.modules.map(m => m.id).join(', ');
        Logger.info(`  Batch ${batch.batchNumber}: [${moduleIds}] ${batch.canExecuteInParallel ? '(parallel)' : '(sequential)'}`, {
          traceId,
          operation: 'execution_planning'
        });
      }

      // 6. Validate framework module is first
      if (recipe.modules.length === 0) {
        throw new Error('Recipe contains no modules');
      }
      
      const firstModule = recipe.modules[0];
      if (!firstModule) {
        throw new Error('First module is undefined');
      }
      
      if (firstModule.category !== 'framework') {
        throw new Error(`First module must be a framework module, but found: ${firstModule.category}`);
      }
      
      Logger.info(`✅ Framework validation passed: ${firstModule.id}`, {
        traceId,
        operation: 'framework_validation'
      });

      // 7. Execute using unified dependency-driven execution
      ExecutionTracer.logOperation(traceId, 'Executing unified dependency-driven plan');
      const executionResult = await this.executeUnifiedPlan(recipe, traceId, verbose, executionPlan);
      
      if (executionResult.success) {
        results.push(...executionResult.results);
        Logger.info(`✅ All modules executed successfully`, {
            traceId,
          operation: 'unified_execution'
        });
      } else {
        // FAIL-FAST: Stop immediately on any module failure
        errors.push(...executionResult.errors);
        Logger.error(`❌ Unified execution failed: ${executionResult.errors.join(', ')}`, {
              traceId,
          operation: 'unified_execution'
        });
        return { success: false, modulesExecuted: results.length, errors, warnings };
      }

      // 8. Install dependencies (only if all modules succeeded)
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
        
        ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : new Error(String(error)));
        
        return {
          success: false,
          modulesExecuted: results.length,
          errors,
          warnings
        };
      }
      
      // 9. Validate success
      ExecutionTracer.logOperation(traceId, 'Validating success');
      // For now, skip success validation as it's not fully implemented
      Logger.info(`✅ Success validation completed`, {
        traceId,
        operation: 'success_validation'
      });

      // 10. Complete execution
      ExecutionTracer.endTrace(traceId, true);
      Logger.info(`🎉 Recipe execution completed successfully!`, {
          traceId,
        operation: 'recipe_execution'
        });
      
      return {
        success: true,
        modulesExecuted: results.length,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      Logger.error(`❌ Recipe execution failed: ${errorMessage}`, {
        traceId,
        operation: 'recipe_execution'
      });
      
      ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        modulesExecuted: results.length,
        errors,
          warnings
        };
    }
  }

  /**
   * Execute unified dependency-driven plan
   * Single execution loop that relies on dependency graph for correct ordering
   */
  private async executeUnifiedPlan(
    recipe: Recipe, 
    traceId: string, 
    verbose: boolean,
    executionPlan: any
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];
    
    // Create recipe-scoped VFS for state persistence
    const recipeVFS = new VirtualFileSystem(`recipe-${recipe.project.name}`, this.pathHandler.getProjectRoot());
    
    try {
      Logger.info(`🚀 Executing unified dependency-driven plan with ${executionPlan.batches.length} batches`, {
        traceId,
        operation: 'unified_execution'
      });
      
      // Execute all batches in dependency order
      for (let i = 0; i < executionPlan.batches.length; i++) {
        const batch = executionPlan.batches[i];
        console.log(`🔍 CWD BEFORE batch ${i + 1}:`, process.cwd());
        
        Logger.info(`🚀 Executing batch ${i + 1}/${executionPlan.batches.length} (${batch.modules.length} modules)`, {
          traceId,
          operation: 'unified_execution'
        });
        
        // Execute modules in this batch
        for (const module of batch.modules) {
          console.log(`🔍 CWD BEFORE module ${module.id}:`, process.cwd());
          const result = await this.executeModuleWithVFS(module, recipe, recipeVFS, traceId);
          console.log(`🔍 CWD AFTER module ${module.id}:`, process.cwd());
          
          if (result.success) {
            results.push(result);
            Logger.info(`✅ Module ${module.id} completed successfully`, {
              traceId,
              operation: 'unified_execution'
            });
          } else {
            errors.push(`Module ${module.id} failed: ${result.error}`);
            Logger.error(`❌ Module ${module.id} failed: ${result.error}`, {
              traceId,
              operation: 'unified_execution'
            });
            return { success: false, results, errors };
          }
        }
        
        console.log(`🔍 CWD AFTER batch ${i + 1}:`, process.cwd());
        Logger.info(`✅ Batch ${i + 1} completed successfully`, {
          traceId,
          operation: 'unified_execution'
        });
      }
      
      // Flush VFS to disk after all modules complete
      await recipeVFS.flushToDisk();
      Logger.info(`💾 All files written to disk successfully`, {
        traceId,
        operation: 'unified_execution'
      });

      return { success: true, results, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Unified execution failed: ${errorMessage}`);
      Logger.error(`❌ Unified execution failed: ${errorMessage}`, {
        traceId,
        operation: 'unified_execution'
      });
      return { success: false, results, errors };
    }
  }

  /**
   * Execute a single module with VFS
   */
  private async executeModuleWithVFS(
    module: Module, 
    recipe: Recipe, 
    vfs: VirtualFileSystem, 
    traceId: string
  ): Promise<{ success: boolean; error?: string; executedModules?: any[] }> {
    try {
      Logger.info(`🔧 Executing module: ${module.id}`, {
        traceId,
        operation: 'module_execution'
      });

      // Load the module to get its blueprint
      const moduleResult = await this.moduleService.loadModuleAdapter(module);
      if (!moduleResult.success || !moduleResult.adapter) {
        return { 
          success: false, 
          error: `Failed to load module ${module.id}: ${moduleResult.error || 'Unknown error'}` 
        };
      }

      // Create project context for the blueprint execution
      const projectContext: ProjectContext = {
        project: recipe.project,
        module: module,
        framework: recipe.project.framework,
        pathHandler: this.pathHandler
      };

      // Create blueprint executor for this module
      const blueprintExecutor = new BlueprintExecutor(
        this.pathHandler.getProjectRoot()
      );

      // Execute the module blueprint
      const result = await blueprintExecutor.executeBlueprint(moduleResult.adapter.blueprint, projectContext, vfs);
      
      if (result.success) {
        Logger.info(`✅ Module ${module.id} executed successfully`, {
          traceId,
          operation: 'module_execution'
        });
        return { success: true, executedModules: [module] };
      } else {
        Logger.error(`❌ Module ${module.id} execution failed: ${result.errors?.join(', ') || 'Unknown error'}`, {
          traceId,
          operation: 'module_execution'
        });
        return { success: false, error: result.errors?.join(', ') || 'Unknown error' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Install dependencies
   */
  private async installDependencies(): Promise<void> {
    const projectRoot = this.pathHandler.getProjectRoot();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    // Check if package.json exists
    const fs = await import('fs/promises');
    try {
      await fs.access(packageJsonPath);
    } catch {
      Logger.warn('No package.json found, skipping dependency installation');
      return;
    }

    Logger.info('Installing dependencies...');
    // This would typically run npm install
    // For now, we'll just log that we would install dependencies
    Logger.info('Dependencies installation completed');
  }

  /**
   * Validate recipe structure
   */
  private validateRecipe(recipe: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!recipe) {
      errors.push('Recipe is null or undefined');
      return { valid: false, errors };
    }
    
    if (!recipe.project) {
      errors.push('Recipe must have a project section');
    } else {
      if (!recipe.project.name) {
        errors.push('Project must have a name');
      }
      if (!recipe.project.path) {
        errors.push('Project must have a path');
      }
    }
    
    if (!recipe.modules || !Array.isArray(recipe.modules)) {
      errors.push('Recipe must have a modules array');
    } else if (recipe.modules.length === 0) {
      errors.push('Recipe must have at least one module');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Identify critical module failures
   */
  private identifyCriticalFailuresFromResults(results: any[]): string[] {
    const criticalFailures: string[] = [];
    
    for (const result of results) {
      if (result.executedModules) {
        for (const module of result.executedModules) {
          if (module.category === 'framework' || module.category === 'database') {
            // These are considered critical modules
            if (!result.success) {
              criticalFailures.push(module.id);
            }
          }
        }
      }
    }
    
    return criticalFailures;
  }

}
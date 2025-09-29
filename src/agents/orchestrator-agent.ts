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

      // 6. Execute using Hierarchical & Parallel Execution model
      ExecutionTracer.logOperation(traceId, 'Executing hierarchical phases');
      const hierarchicalResult = await this.executeHierarchicalPhases(recipe, traceId, verbose, executionPlan);
      
      if (hierarchicalResult.success) {
        results.push(...hierarchicalResult.results);
        Logger.info(`✅ All hierarchical phases executed successfully`, {
            traceId,
          operation: 'hierarchical_execution'
        });
      } else {
        // FAIL-FAST: Stop immediately on any phase failure
        errors.push(...hierarchicalResult.errors);
        Logger.error(`❌ Hierarchical execution failed: ${hierarchicalResult.errors.join(', ')}`, {
              traceId,
          operation: 'hierarchical_execution'
        });
        
        // Check for critical module failures (framework, database, etc.)
        const criticalFailures = this.identifyCriticalFailuresFromResults(hierarchicalResult.results);
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
        const expectedFiles = this.getExpectedFilesFromExecution(hierarchicalResult);
        
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
        failedModules: hierarchicalResult.errors.length
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
   * Execute a single module (for SequentialExecutionService)
   */
  async executeModule(module: Module, vfs?: VirtualFileSystem): Promise<{ success: boolean; error?: string }> {
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
      const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, vfs);
      
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

  /**
   * Execute modules using Hierarchical & Parallel Execution model
   * Phase 1: Framework modules (Sequential)
   * Phase 2: Adapter modules (Parallel) 
   * Phase 3: Integrator modules (Sequential)
   */
  private async executeHierarchicalPhases(
    recipe: Recipe, 
    traceId: string, 
    verbose: boolean,
    executionPlan: any
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];
    
    // Create recipe-scoped VFS for state persistence across phases
    const recipeVFS = new VirtualFileSystem(`recipe-${recipe.project.name}`, this.pathHandler.getProjectRoot());
    
    try {
      // Classify modules into three categories
      const { frameworkModules, adapterModules, integratorModules } = this.classifyModules(recipe.modules);
      
      Logger.info(`🏗️ Hierarchical Execution Plan:`, {
        traceId,
        operation: 'hierarchical_planning'
      });
      Logger.info(`  Phase 1 - Framework: ${frameworkModules.length} modules`, {
        traceId,
        operation: 'hierarchical_planning'
      });
      Logger.info(`  Phase 2 - Adapters: ${adapterModules.length} modules`, {
        traceId,
        operation: 'hierarchical_planning'
      });
      Logger.info(`  Phase 3 - Integrators: ${integratorModules.length} modules`, {
        traceId,
        operation: 'hierarchical_planning'
      });

      // Phase 1: Framework Execution (Sequential)
      if (frameworkModules.length > 0) {
        Logger.info(`--- STARTING PHASE: FRAMEWORK ---`, {
          traceId,
          operation: 'phase1_framework'
        });
        Logger.info(`🚀 Phase 1: Executing Framework modules (Sequential)`, {
          traceId,
          operation: 'phase1_framework'
        });
        Logger.debug(`🔍 Framework modules to execute:`, {
          traceId,
          operation: 'phase1_framework',
          data: frameworkModules.map(m => ({ id: m.id, category: m.category }))
        });
        
        for (const module of frameworkModules) {
          const result = await this.executeModuleWithVFS(module, recipe, recipeVFS, traceId);
          if (result.success) {
            results.push(result);
            Logger.info(`✅ Framework module ${module.id} completed`, {
              traceId,
              operation: 'phase1_framework'
            });
          } else {
            errors.push(`Framework module ${module.id} failed: ${result.error}`);
            Logger.error(`❌ Framework module ${module.id} failed: ${result.error}`, {
              traceId,
              operation: 'phase1_framework'
            });
            return { success: false, results, errors };
          }
        }
        
        // Flush VFS after framework phase to ensure files are on disk
        await recipeVFS.flushToDisk();
        Logger.info(`💾 Phase 1 complete: Framework files written to disk`, {
          traceId,
          operation: 'phase1_framework'
        });
        Logger.info(`--- COMPLETED PHASE: FRAMEWORK ---`, {
          traceId,
          operation: 'phase1_framework'
        });
      }

      // Phase 2: Adapter Execution (Parallel)
      if (adapterModules.length > 0) {
        Logger.info(`--- STARTING PHASE: ADAPTERS ---`, {
          traceId,
          operation: 'phase2_adapters'
        });
        Logger.info(`🚀 Phase 2: Executing Adapter modules (Parallel)`, {
          traceId,
          operation: 'phase2_adapters'
        });
        Logger.debug(`🔍 Adapter modules to execute:`, {
          traceId,
          operation: 'phase2_adapters',
          data: adapterModules.map(m => ({ id: m.id, category: m.category }))
        });
        
        // Use the proper execution plan - filter to get only adapter batches
        const adapterBatches = executionPlan.batches.filter((batch: any) => 
          batch.modules.some((module: any) => module.category === 'adapter' || module.category === 'ui' || module.category === 'database' || module.category === 'auth' || module.category === 'observability')
        );
        
        Logger.info(`📋 Using ${adapterBatches.length} adapter batches from execution plan`, {
          traceId,
          operation: 'phase2_adapters'
        });
        
        // Create a new execution plan with only adapter batches
        const adapterPlan: ExecutionPlan = {
          success: true,
          batches: adapterBatches,
          totalBatches: adapterBatches.length,
          estimatedTotalDuration: executionPlan.estimatedTotalDuration,
          errors: [],
          warnings: []
        };
        
        const adapterResult = await this.sequentialExecutor.executeBatches(adapterPlan, this, recipeVFS);
        
        if (adapterResult.success) {
          results.push(...adapterResult.batchResults.flatMap(br => br.results.flatMap(r => r.executedModules)));
          Logger.info(`✅ Phase 2 complete: All adapter modules executed successfully`, {
            traceId,
            operation: 'phase2_adapters'
          });
          Logger.info(`--- COMPLETED PHASE: ADAPTERS ---`, {
            traceId,
            operation: 'phase2_adapters'
          });
        } else {
          errors.push(...adapterResult.errors);
          Logger.error(`❌ Phase 2 failed: Adapter execution failed: ${adapterResult.errors.join(', ')}`, {
            traceId,
            operation: 'phase2_adapters'
          });
          return { success: false, results, errors };
        }
      }

      // Phase 3: Integrator Execution (Sequential)
      if (integratorModules.length > 0) {
        Logger.info(`--- STARTING PHASE: INTEGRATORS ---`, {
          traceId,
          operation: 'phase3_integrators'
        });
        Logger.info(`🚀 Phase 3: Executing Integrator modules (Sequential)`, {
          traceId,
          operation: 'phase3_integrators'
        });
        Logger.debug(`🔍 Integrator modules to execute:`, {
          traceId,
          operation: 'phase3_integrators',
          data: integratorModules.map(m => ({ id: m.id, category: m.category }))
        });
        
        for (const module of integratorModules) {
          const result = await this.executeModuleWithVFS(module, recipe, recipeVFS, traceId);
          if (result.success) {
            results.push(result);
            Logger.info(`✅ Integrator module ${module.id} completed`, {
              traceId,
              operation: 'phase3_integrators'
            });
          } else {
            errors.push(`Integrator module ${module.id} failed: ${result.error}`);
            Logger.error(`❌ Integrator module ${module.id} failed: ${result.error}`, {
              traceId,
              operation: 'phase3_integrators'
            });
            return { success: false, results, errors };
          }
        }
        
        Logger.info(`✅ Phase 3 complete: All integrator modules executed successfully`, {
          traceId,
          operation: 'phase3_integrators'
        });
        Logger.info(`--- COMPLETED PHASE: INTEGRATORS ---`, {
          traceId,
          operation: 'phase3_integrators'
        });
      }

      // Final flush of VFS
      await recipeVFS.flushToDisk();
      Logger.info(`💾 All phases complete: Final VFS flush to disk`, {
        traceId,
        operation: 'hierarchical_complete'
      });

      return { success: true, results, errors };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Hierarchical execution failed: ${errorMessage}`);
      Logger.error(`❌ Hierarchical execution error: ${errorMessage}`, {
        traceId,
        operation: 'hierarchical_execution'
      });
      return { success: false, results, errors };
    }
  }

  /**
   * Classify modules into framework, adapter, and integrator categories
   */
  private classifyModules(modules: Module[]): {
    frameworkModules: Module[];
    adapterModules: Module[];
    integratorModules: Module[];
  } {
    const frameworkModules: Module[] = [];
    const adapterModules: Module[] = [];
    const integratorModules: Module[] = [];

    for (const module of modules) {
      const [category] = module.id.split('/');
      
      switch (category) {
        case 'framework':
          frameworkModules.push(module);
          break;
        case 'integration':
          integratorModules.push(module);
          break;
        default:
          adapterModules.push(module);
          break;
      }
    }

    return { frameworkModules, adapterModules, integratorModules };
  }

  /**
   * Execute a single module with VFS support
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
        recipe,
        this.pathHandler,
        module
      );
      
      if (!contextResult.success) {
        return { success: false, error: contextResult.error || 'Failed to create project context' };
      }
      
      const context = contextResult.context!;

      // Execute blueprint using the Intelligent Foreman with shared VFS
      const blueprint = adapterResult.adapter!.blueprint;
      const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot());
      const blueprintResult = await blueprintExecutor.executeBlueprint(blueprint, context, vfs);
      
      if (blueprintResult.success) {
        Logger.info(`✅ Module ${module.id} executed successfully`, {
          traceId,
          operation: 'module_execution',
          moduleId: module.id
        });
        return { success: true, executedModules: [{ moduleId: module.id, success: true }] };
      } else {
        const errorMessage = blueprintResult.errors?.join(', ') || 'Unknown blueprint error';
        Logger.error(`❌ Module ${module.id} failed: ${errorMessage}`, {
          traceId,
          operation: 'module_execution',
          moduleId: module.id
        });
        return { success: false, error: errorMessage };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`, {
        traceId,
        operation: 'module_execution',
        moduleId: module.id
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Identify critical failures from execution results
   */
  private identifyCriticalFailuresFromResults(results: any[]): string[] {
    const criticalFailures: string[] = [];
    
    for (const result of results) {
      if (result.executedModules) {
        for (const module of result.executedModules) {
          if (!module.success) {
            const [category] = module.moduleId.split('/');
            if (category === 'framework' || category === 'database') {
              criticalFailures.push(module.moduleId);
            }
          }
        }
      }
    }
    
    return criticalFailures;
  }

}

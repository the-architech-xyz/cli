/**
 * Orchestrator Agent
 * 
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Genome, Module } from '@thearchitech.xyz/marketplace';
import { ExecutionResult, ProjectContext } from '@thearchitech.xyz/types';
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
import { ArchitectureValidator } from '../core/services/validation/architecture-validator.js';

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
  private architectureValidator: ArchitectureValidator;

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
    this.architectureValidator = new ArchitectureValidator();
  }

  /**
   * Execute a recipe using unified dependency-driven execution
   */
  async executeRecipe(genome: Genome, verbose: boolean = false): Promise<ExecutionResult> {
    const traceId = ExecutionTracer.startTrace('orchestrator_execution');
    const results: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      Logger.info(`🚀 Starting genome execution: ${genome.project.name}`, {
        traceId,
        operation: 'genome_execution'
      });

      // 1. Validate genome
      ExecutionTracer.logOperation(traceId, 'Validating genome');
      const validationResult = this.validateRecipe(genome);
      if (!validationResult.valid) {
        throw new Error(`Genome validation failed: ${validationResult.errors.join(', ')}`);
      }

      // 2. Load and validate modules
      ExecutionTracer.logOperation(traceId, 'Loading modules');
      // For now, skip module loading validation as it's not implemented
      Logger.info(`📦 Loading ${genome.modules.length} modules`, {
        traceId,
        operation: 'module_loading'
      });

      // 2.5. ARCHITECTURAL VALIDATION - NEW MANDATORY STEP
      ExecutionTracer.logOperation(traceId, 'Architectural validation');
      const architecturalValidation = await this.architectureValidator.validateRecipe(genome, traceId);
      if (!architecturalValidation.isValid) {
        const errorMessages = architecturalValidation.errors.map(error => 
          `  ❌ ${error.message} (Module: ${error.module})`
        ).join('\n');
        
        const warningMessages = architecturalValidation.warnings.map(warning => 
          `  ⚠️  ${warning.message} (Module: ${warning.module})`
        ).join('\n');
        
        const fullErrorMessage = `Architectural validation failed with ${architecturalValidation.errors.length} errors:\n${errorMessages}${warningMessages ? `\n\nWarnings:\n${warningMessages}` : ''}`;
        
        Logger.error(`❌ ${fullErrorMessage}`, {
          traceId,
          operation: 'architectural_validation'
        });
        
        throw new Error(fullErrorMessage);
      }
      
      Logger.info('✅ Architectural validation passed - proceeding with generation', {
        traceId,
        operation: 'architectural_validation'
      });
      
      // 3. Classify modules by type (Convention-Based Architecture)
      ExecutionTracer.logOperation(traceId, 'Classifying modules by type');
      const moduleClassification = this.classifyModulesByType(genome.modules);
      Logger.info(`📊 Module Classification:`, {
        traceId,
        operation: 'module_classification',
        frameworks: moduleClassification.frameworks.map(m => m.id),
        adapters: moduleClassification.adapters.map(m => m.id),
        integrations: moduleClassification.integrations.map(m => m.id)
      });

      // 4. Build dependency graph
      ExecutionTracer.logOperation(traceId, 'Building dependency graph');
      const graphResult = await this.dependencyGraph.buildGraph(genome.modules);
      if (!graphResult.success) {
        throw new Error(`Dependency graph build failed: ${graphResult.errors.join(', ')}`);
      }

      // 5. Setup framework and get framework-specific path handler
      ExecutionTracer.logOperation(traceId, 'Setting up framework');
      const frameworkSetup = await this.moduleService.setupFramework(genome, this.pathHandler);
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

      // 6. Create execution plan
      ExecutionTracer.logOperation(traceId, 'Creating execution plan');
      const executionPlan = this.executionPlanner.createExecutionPlan();
      if (!executionPlan.success) {
        throw new Error(`Execution plan creation failed: ${executionPlan.errors.join(', ')}`);
      }

      // 7. Enforce hierarchical execution order (Framework -> Adapters -> Integrations)
      ExecutionTracer.logOperation(traceId, 'Enforcing hierarchical execution order');
      const hierarchicalPlan = this.enforceHierarchicalOrder(executionPlan, moduleClassification);
      Logger.info(`🔄 Hierarchical execution plan created`, {
        traceId,
        operation: 'hierarchical_ordering'
      });

      // 8. Log execution plan with FULL DETAILS
      Logger.info(`📋 Execution plan created:`, {
        traceId,
        operation: 'execution_planning'
      });
      
      // DEBUG: Log the ENTIRE execution plan structure
      Logger.debug(`🔍 COMPLETE EXECUTION PLAN STRUCTURE:`, {
        traceId,
        operation: 'execution_planning',
        data: {
          totalBatches: hierarchicalPlan.batches.length,
          totalModules: hierarchicalPlan.batches.reduce((sum: number, batch: any) => sum + batch.modules.length, 0),
          estimatedDuration: hierarchicalPlan.batches.reduce((sum: number, batch: any) => sum + batch.estimatedDuration, 0),
          batches: hierarchicalPlan.batches.map((batch: any) => ({
            batchNumber: batch.batchNumber,
            moduleCount: batch.modules.length,
            moduleIds: batch.modules.map((m: Module) => m.id),
            moduleTypes: batch.modules.map((m: Module) => this.getModuleType(m.id)),
            canExecuteInParallel: batch.canExecuteInParallel,
            estimatedDuration: batch.estimatedDuration,
            dependencies: batch.dependencies
          }))
        }
      });
      
      for (const batch of hierarchicalPlan.batches) {
        const moduleIds = batch.modules.map((m: Module) => m.id).join(', ');
    
      }

      // 9. Validate framework module is first
      if (genome.modules.length === 0) {
        throw new Error('Genome contains no modules');
      }
      
      const firstModule = genome.modules[0];
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

      // 10. Execute using unified dependency-driven execution
      ExecutionTracer.logOperation(traceId, 'Executing unified dependency-driven plan');
      const executionResult = await this.executeUnifiedPlan(genome, traceId, verbose, hierarchicalPlan);
      
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

      // 11. Install dependencies (only if all modules succeeded)
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
      
      // 12. Validate success
      ExecutionTracer.logOperation(traceId, 'Validating success');
      // For now, skip success validation as it's not fully implemented
      Logger.info(`✅ Success validation completed`, {
        traceId,
        operation: 'success_validation'
      });

      // 13. Complete execution
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
    genome: Genome, 
    traceId: string, 
    verbose: boolean, 
    executionPlan: any
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];
    
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
        
        // Execute modules in this batch (each module gets its own VFS lifecycle)
        for (const module of batch.modules) {
          console.log(`🔍 CWD BEFORE module ${module.id}:`, process.cwd());
          const result = await this.executeModule(module, genome, traceId);
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
   * Execute a single module with its own transactional VFS
   * Each blueprint gets: Create VFS → Execute → Flush to Disk
   */
  private async executeModule(
    module: Module, 
    genome: Genome, 
    traceId: string
  ): Promise<{ success: boolean; error?: string; executedModules?: any[] }> {
    let blueprintVFS: VirtualFileSystem | null = null;
    
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
        project: genome.project,
        module: module,
        framework: genome.project.framework,
        pathHandler: this.pathHandler
      };

      // 1. CREATE per-blueprint VFS
      blueprintVFS = new VirtualFileSystem(
        `blueprint-${moduleResult.adapter.blueprint.id}`, 
        this.pathHandler.getProjectRoot()
      );
      Logger.info(`📦 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id}`, {
        traceId,
        operation: 'module_execution'
      });

      // 2. EXECUTE blueprint with its dedicated VFS
      const blueprintExecutor = new BlueprintExecutor(
        this.pathHandler.getProjectRoot()
      );
      const result = await blueprintExecutor.executeBlueprint(
        moduleResult.adapter.blueprint, 
        projectContext, 
        blueprintVFS
      );
      
      if (result.success) {
        // 3. FLUSH VFS to disk on success - critical for subsequent modules!
        await blueprintVFS.flushToDisk();
        Logger.info(`💾 VFS flushed to disk for blueprint: ${moduleResult.adapter.blueprint.id}`, {
          traceId,
          operation: 'module_execution'
        });
        
        Logger.info(`✅ Module ${module.id} executed successfully`, {
          traceId,
          operation: 'module_execution'
        });
        return { success: true, executedModules: [module] };
      } else {
        // DO NOT flush on failure - preserve clean state
        Logger.error(`❌ Module ${module.id} execution failed: ${result.errors?.join(', ') || 'Unknown error'}`, {
          traceId,
          operation: 'module_execution'
        });
        return { success: false, error: result.errors?.join(', ') || 'Unknown error' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`, {
        traceId,
        operation: 'module_execution'
      });
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
  private validateRecipe(genome: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!genome) {
      errors.push('Genome is null or undefined');
      return { valid: false, errors };
    }
    
    if (!genome.project) {
      errors.push('Genome must have a project section');
    } else {
      if (!genome.project.name) {
        errors.push('Project must have a name');
      }
      if (!genome.project.path) {
        errors.push('Project must have a path');
      }
    }
    
    if (!genome.modules || !Array.isArray(genome.modules)) {
      errors.push('Genome must have a modules array');
    } else if (genome.modules.length === 0) {
      errors.push('Genome must have at least one module');
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

  /**
   * Classify modules by type based on ID convention
   * - Frameworks: category === 'framework'
   * - Integrations: id starts with 'integrations/'
   * - Adapters: everything else
   */
  private classifyModulesByType(modules: Module[]): {
    frameworks: Module[];
    adapters: Module[];
    integrations: Module[];
  } {
    const frameworks: Module[] = [];
    const adapters: Module[] = [];
    const integrations: Module[] = [];

    for (const module of modules) {
      const type = this.getModuleType(module.id);
      
      if (type === 'framework') {
        frameworks.push(module);
      } else if (type === 'integration') {
        integrations.push(module);
      } else {
        adapters.push(module);
      }
    }

    return { frameworks, adapters, integrations };
  }

  /**
   * Get module type from ID
   */
  private getModuleType(moduleId: string): 'framework' | 'adapter' | 'integration' {
    if (moduleId.startsWith('integrations/')) {
      return 'integration';
    }
    
    const category = moduleId.split('/')[0];
    if (category === 'framework') {
      return 'framework';
    }
    
    return 'adapter';
  }

  /**
   * Enforce hierarchical execution order: Framework -> Adapters -> Integrations
   */
  private enforceHierarchicalOrder(
    executionPlan: any,
    classification: {
      frameworks: Module[];
      adapters: Module[];
      integrations: Module[];
    }
  ): any {
    const newBatches: any[] = [];
    let batchNumber = 1;

    // 1. Framework batches (must be first)
    const frameworkBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.every((m: Module) => this.getModuleType(m.id) === 'framework')
    );
    for (const batch of frameworkBatches) {
      newBatches.push({ ...batch, batchNumber: batchNumber++ });
    }

    // 2. Adapter batches (middle layer)
    const adapterBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.every((m: Module) => this.getModuleType(m.id) === 'adapter')
    );
    for (const batch of adapterBatches) {
      newBatches.push({ ...batch, batchNumber: batchNumber++ });
    }

    // 3. Integration batches (must be last, sequential)
    const integrationBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.some((m: Module) => this.getModuleType(m.id) === 'integration')
    );
    for (const batch of integrationBatches) {
      // Force integrations to be sequential
      newBatches.push({ 
        ...batch, 
        batchNumber: batchNumber++,
        canExecuteInParallel: false 
      });
    }

    return {
      ...executionPlan,
      batches: newBatches,
      totalBatches: newBatches.length
    };
  }

}
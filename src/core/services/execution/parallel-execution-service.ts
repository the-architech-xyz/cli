/**
 * Parallel Execution Service
 * 
 * Executes batches of modules in parallel when possible, with proper error handling
 * and progress reporting.
 */

import { Module } from '@thearchitech.xyz/types';
import { ExecutionBatch } from '../dependency/execution-planner';
import { OrchestratorAgent } from '../../agents/orchestrator-agent';

export interface ExecutionResult {
  success: boolean;
  executedModules: string[];
  failedModules: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface BatchExecutionResult {
  batchNumber: number;
  success: boolean;
  results: ExecutionResult[];
  totalDuration: number;
  errors: string[];
}

export class ParallelExecutionService {
  constructor(private orchestrator: OrchestratorAgent) {}

  /**
   * Execute a single batch of modules
   */
  async executeBatch(batch: ExecutionBatch): Promise<BatchExecutionResult> {
    console.log(`🚀 Executing batch ${batch.batchNumber} (${batch.modules.length} modules)`);
    
    const startTime = Date.now();
    const results: ExecutionResult[] = [];
    const errors: string[] = [];
    const failedModules: string[] = [];

    try {
      if (batch.canExecuteInParallel && batch.modules.length > 1) {
        console.log(`  🔄 Executing ${batch.modules.length} modules in parallel`);
        const parallelResults = await this.executeModulesInParallel(batch.modules);
        results.push(...parallelResults);
      } else {
        console.log(`  📝 Executing ${batch.modules.length} modules sequentially`);
        const sequentialResults = await this.executeModulesSequentially(batch.modules);
        results.push(...sequentialResults);
      }

      // Collect results
      for (const result of results) {
        if (!result.success) {
          failedModules.push(...result.failedModules);
          errors.push(...result.errors);
        }
      }

      const totalDuration = Date.now() - startTime;
      const success = failedModules.length === 0;

      console.log(`  ${success ? '✅' : '❌'} Batch ${batch.batchNumber} completed in ${totalDuration}ms`);
      if (failedModules.length > 0) {
        console.log(`  ❌ Failed modules: ${failedModules.join(', ')}`);
      }

      return {
        batchNumber: batch.batchNumber,
        success,
        results,
        totalDuration,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Batch ${batch.batchNumber} execution failed: ${errorMessage}`);
      
      return {
        batchNumber: batch.batchNumber,
        success: false,
        results,
        totalDuration: Date.now() - startTime,
        errors: [`Batch execution failed: ${errorMessage}`]
      };
    }
  }

  /**
   * Execute modules in parallel
   */
  private async executeModulesInParallel(modules: Module[]): Promise<ExecutionResult[]> {
    const promises = modules.map(module => this.executeSingleModule(module));
    return Promise.all(promises);
  }

  /**
   * Execute modules sequentially
   */
  private async executeModulesSequentially(modules: Module[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    for (const module of modules) {
      const result = await this.executeSingleModule(module);
      results.push(result);
      
      // Stop on first failure for sequential execution
      if (!result.success) {
        console.log(`  ⚠️ Stopping sequential execution due to failure in ${module.id}`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Execute a single module
   */
  private async executeSingleModule(module: Module): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executedModules: string[] = [];
    const failedModules: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log(`    🔧 Executing module: ${module.id}`);
      
      // Use the orchestrator to execute the module
      // This is a simplified version - in practice, you'd want to call the specific agent
      const result = await this.orchestrator.executeModule(module);
      
      if (result.success) {
        executedModules.push(module.id);
        console.log(`    ✅ Module ${module.id} executed successfully`);
      } else {
        failedModules.push(module.id);
        errors.push(`Module ${module.id} failed: ${result.error}`);
        console.log(`    ❌ Module ${module.id} failed: ${result.error}`);
      }

      return {
        success: result.success,
        executedModules,
        failedModules,
        errors,
        warnings,
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failedModules.push(module.id);
      errors.push(`Module ${module.id} execution error: ${errorMessage}`);
      
      console.error(`    ❌ Module ${module.id} execution error: ${errorMessage}`);
      
      return {
        success: false,
        executedModules,
        failedModules,
        errors,
        warnings,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute all batches in sequence
   */
  async executeAllBatches(batches: ExecutionBatch[]): Promise<{
    success: boolean;
    batchResults: BatchExecutionResult[];
    totalDuration: number;
    totalExecuted: number;
    totalFailed: number;
    errors: string[];
  }> {
    console.log(`🚀 Executing ${batches.length} batches`);
    
    const startTime = Date.now();
    const batchResults: BatchExecutionResult[] = [];
    const allErrors: string[] = [];
    let totalExecuted = 0;
    let totalFailed = 0;

    for (const batch of batches) {
      const batchResult = await this.executeBatch(batch);
      batchResults.push(batchResult);
      
      // Collect statistics
      for (const result of batchResult.results) {
        totalExecuted += result.executedModules.length;
        totalFailed += result.failedModules.length;
      }
      
      allErrors.push(...batchResult.errors);
      
      // Stop on first batch failure (fail-fast)
      if (!batchResult.success) {
        console.log(`❌ Stopping execution due to batch ${batch.batchNumber} failure`);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    const success = totalFailed === 0;

    console.log(`🏁 Execution completed in ${totalDuration}ms`);
    console.log(`  ✅ Executed: ${totalExecuted} modules`);
    console.log(`  ❌ Failed: ${totalFailed} modules`);

    return {
      success,
      batchResults,
      totalDuration,
      totalExecuted,
      totalFailed,
      errors: allErrors
    };
  }

  /**
   * Get execution progress
   */
  getExecutionProgress(batchResults: BatchExecutionResult[]): {
    completedBatches: number;
    totalBatches: number;
    progressPercentage: number;
    executedModules: number;
    failedModules: number;
  } {
    const completedBatches = batchResults.length;
    const totalBatches = batchResults.length; // This would be the total planned batches
    
    let executedModules = 0;
    let failedModules = 0;
    
    for (const batchResult of batchResults) {
      for (const result of batchResult.results) {
        executedModules += result.executedModules.length;
        failedModules += result.failedModules.length;
      }
    }

    return {
      completedBatches,
      totalBatches,
      progressPercentage: totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0,
      executedModules,
      failedModules
    };
  }
}

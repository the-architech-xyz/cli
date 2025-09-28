/**
 * Sequential Execution Service
 * 
 * Replaces parallel execution with reliable sequential execution.
 * Executes modules one by one in a predictable order while preserving
 * all analysis and planning intelligence.
 */

import { ExecutionPlan, ExecutionBatch, Module } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../file-system/file-engine/virtual-file-system.js';
import { OrchestratorAgent } from '../../../agents/orchestrator-agent.js';

export interface SequentialExecutionResult {
  success: boolean;
  batchResults: BatchExecutionResult[];
  errors: string[];
}

export interface BatchExecutionResult {
  batchId: string;
  success: boolean;
  results: ModuleExecutionResult[];
  errors: string[];
}

export interface ModuleExecutionResult {
  moduleId: string;
  success: boolean;
  error?: string;
  executedModules: Module[];
}

export class SequentialExecutionService {
  constructor(private orchestrator: OrchestratorAgent) {}

  /**
   * Execute all batches sequentially
   */
  async executeBatches(plan: ExecutionPlan, vfs?: VirtualFileSystem): Promise<SequentialExecutionResult> {
    const batchResults: BatchExecutionResult[] = [];
    const errors: string[] = [];

    console.log(`🚀 Executing ${plan.batches.length} batches sequentially`);

    for (let i = 0; i < plan.batches.length; i++) {
      const batch = plan.batches[i];
      console.log(`🚀 Executing batch ${i + 1}/${plan.batches.length} (${batch.modules.length} modules)`);
      
      const batchResult = await this.executeBatch(batch, vfs);
      batchResults.push(batchResult);
      
      if (!batchResult.success) {
        errors.push(...batchResult.errors);
        console.error(`❌ Batch ${i + 1} failed: ${batchResult.errors.join(', ')}`);
        return { success: false, batchResults, errors };
      }
      
      console.log(`✅ Batch ${i + 1} completed successfully`);
    }

    console.log(`🎉 All batches executed successfully`);
    return { success: true, batchResults, errors };
  }

  /**
   * Execute a single batch sequentially
   */
  private async executeBatch(batch: ExecutionBatch, vfs?: VirtualFileSystem): Promise<BatchExecutionResult> {
    const results: ModuleExecutionResult[] = [];
    const errors: string[] = [];

    console.log(`  🔄 Executing ${batch.modules.length} modules sequentially`);

    for (let i = 0; i < batch.modules.length; i++) {
      const module = batch.modules[i];
      console.log(`    🔧 Executing module ${i + 1}/${batch.modules.length}: ${module.id}`);
      
      try {
        const result = await this.orchestrator.executeModule(module, vfs);
        results.push({
          moduleId: module.id,
          success: result.success,
          error: result.error,
          executedModules: [module]
        });
        
        if (!result.success) {
          errors.push(`Module ${module.id} failed: ${result.error}`);
          console.error(`    ❌ Module ${module.id} failed: ${result.error}`);
          return { success: false, results, errors };
        }
        
        console.log(`    ✅ Module ${module.id} completed successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Module ${module.id} failed: ${errorMessage}`);
        console.error(`    ❌ Module ${module.id} failed: ${errorMessage}`);
        return { success: false, results, errors };
      }
    }

    console.log(`  ✅ Batch completed successfully`);
    return { success: true, results, errors };
  }
}

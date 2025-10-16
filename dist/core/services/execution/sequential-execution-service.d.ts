/**
 * Sequential Execution Service
 *
 * Executes modules one by one in a predictable order while preserving
 * all analysis and planning intelligence.
 */
import { Module } from '@thearchitech.xyz/types';
import { ExecutionPlan } from '../dependency/execution-planner.js';
import { VirtualFileSystem } from '../file-system/file-engine/virtual-file-system.js';
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
export declare class SequentialExecutionService {
    constructor();
    /**
     * Execute all batches sequentially
     */
    executeBatches(plan: ExecutionPlan, orchestrator: any, vfs?: VirtualFileSystem): Promise<SequentialExecutionResult>;
    /**
     * Execute a single batch sequentially
     */
    private executeBatch;
}

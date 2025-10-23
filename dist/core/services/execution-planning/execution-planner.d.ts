/**
 * Execution Planner Service
 *
 * Creates optimized execution plans using topological sort on dependency graphs.
 * Generates batches of modules that can be executed in parallel.
 */
import { Module } from '@thearchitech.xyz/types';
import { DependencyGraph } from './dependency-graph';
export interface ExecutionBatch {
    batchNumber: number;
    modules: Module[];
    canExecuteInParallel: boolean;
    estimatedDuration: number;
    dependencies: string[];
}
export interface ExecutionPlan {
    success: boolean;
    batches: ExecutionBatch[];
    totalBatches: number;
    estimatedTotalDuration: number;
    errors: string[];
    warnings: string[];
}
export declare class ExecutionPlanner {
    private dependencyGraph;
    constructor(dependencyGraph: DependencyGraph);
    /**
     * Create execution plan from dependency graph
     */
    createExecutionPlan(): ExecutionPlan;
    /**
     * Perform topological sort to create execution batches
     */
    private topologicalSort;
    /**
     * Estimate duration for a batch of modules
     */
    private estimateBatchDuration;
    /**
     * Get dependencies for a batch of modules
     */
    private getBatchDependencies;
    /**
     * Get execution plan summary
     */
    getExecutionSummary(plan: ExecutionPlan): {
        totalModules: number;
        parallelBatches: number;
        sequentialBatches: number;
        estimatedDuration: string;
        efficiency: number;
    };
    /**
     * Validate execution plan
     */
    validateExecutionPlan(plan: ExecutionPlan): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
}

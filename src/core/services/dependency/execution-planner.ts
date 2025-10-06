/**
 * Execution Planner Service
 * 
 * Creates optimized execution plans using topological sort on dependency graphs.
 * Generates batches of modules that can be executed in parallel.
 */

import { Module } from '@thearchitech.xyz/types';
import { DependencyGraph, DependencyNode } from './dependency-graph';

export interface ExecutionBatch {
  batchNumber: number;
  modules: Module[];
  canExecuteInParallel: boolean;
  estimatedDuration: number; // in milliseconds
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

export class ExecutionPlanner {
  constructor(private dependencyGraph: DependencyGraph) {}

  /**
   * Create execution plan from dependency graph
   */
  createExecutionPlan(): ExecutionPlan {
    console.log(`📋 Creating execution plan from dependency graph`);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const batches: ExecutionBatch[] = [];

    try {
      const graph = this.dependencyGraph.getGraph();
      if (graph.size === 0) {
        return {
          success: true,
          batches: [],
          totalBatches: 0,
          estimatedTotalDuration: 0,
          errors,
          warnings
        };
      }

      // Perform topological sort to create execution batches
      const sortedBatches = this.topologicalSort(graph);
      
      // Convert to ExecutionBatch format
      for (let i = 0; i < sortedBatches.length; i++) {
        const batchModules = sortedBatches[i];
        if (!batchModules) continue;
        
        const batch: ExecutionBatch = {
          batchNumber: i + 1,
          modules: batchModules,
          canExecuteInParallel: batchModules.length > 1,
          estimatedDuration: this.estimateBatchDuration(batchModules),
          dependencies: this.getBatchDependencies(batchModules, graph)
        };
        batches.push(batch);
      }

      const totalDuration = batches.reduce((sum, batch) => sum + batch.estimatedDuration, 0);


      return {
        success: true,
        batches,
        totalBatches: batches.length,
        estimatedTotalDuration: totalDuration,
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create execution plan: ${errorMessage}`);
      
      return {
        success: false,
        batches: [],
        totalBatches: 0,
        estimatedTotalDuration: 0,
        errors: [`Execution plan creation failed: ${errorMessage}`],
        warnings
      };
    }
  }

  /**
   * Perform topological sort to create execution batches
   */
  private topologicalSort(graph: Map<string, DependencyNode>): Module[][] {
    const batches: Module[][] = [];
    const remainingNodes = new Map(graph);
    const inDegreeCounts = new Map<string, number>();

    // Initialize in-degree counts
    for (const [moduleId, node] of remainingNodes.entries()) {
      inDegreeCounts.set(moduleId, node.dependencies.length);
    }

    while (remainingNodes.size > 0) {
      // Find all nodes with no remaining dependencies (in-degree = 0)
      const currentBatch: Module[] = [];
      
      for (const [moduleId, inDegree] of inDegreeCounts.entries()) {
        if (inDegree === 0 && remainingNodes.has(moduleId)) {
          const node = remainingNodes.get(moduleId);
          if (node) {
            currentBatch.push(node.module);
            remainingNodes.delete(moduleId);
            inDegreeCounts.delete(moduleId);
          }
        }
      }

      if (currentBatch.length === 0) {
        // This should not happen if the graph is acyclic
        console.warn(`⚠️ No nodes with in-degree 0 found, but ${remainingNodes.size} nodes remain`);
        break;
      }

      batches.push(currentBatch);

      // Update in-degree counts for dependents
      for (const module of currentBatch) {
        const node = graph.get(module.id);
        if (node) {
          for (const dependentId of node.dependents) {
            const currentInDegree = inDegreeCounts.get(dependentId) || 0;
            inDegreeCounts.set(dependentId, Math.max(0, currentInDegree - 1));
          }
        }
      }
    }

    return batches;
  }

  /**
   * Estimate duration for a batch of modules
   */
  private estimateBatchDuration(modules: Module[]): number {
    // Base duration estimates by category
    const categoryDurations: Record<string, number> = {
      framework: 30000,  // 30 seconds
      database: 15000,   // 15 seconds
      auth: 10000,       // 10 seconds
      ui: 8000,          // 8 seconds
      payment: 12000,    // 12 seconds
      email: 5000,       // 5 seconds
      content: 6000,     // 6 seconds
      testing: 4000,     // 4 seconds
      observability: 7000, // 7 seconds
      state: 3000,       // 3 seconds
      deployment: 20000, // 20 seconds
      blockchain: 15000, // 15 seconds
      tooling: 2000,     // 2 seconds
      integrator: 5000   // 5 seconds
    };

    // Calculate total duration for the batch
    let totalDuration = 0;
    for (const module of modules) {
      const categoryDuration = categoryDurations[module.category || 'unknown'] || 5000;
      totalDuration += categoryDuration;
    }

    // If modules can run in parallel, take the maximum duration
    if (modules.length > 1) {
      const maxCategoryDuration = Math.max(
        ...modules.map(m => categoryDurations[m.category || 'unknown'] || 5000)
      );
      totalDuration = maxCategoryDuration;
    }

    return totalDuration;
  }

  /**
   * Get dependencies for a batch of modules
   */
  private getBatchDependencies(modules: Module[], graph: Map<string, DependencyNode>): string[] {
    const dependencies = new Set<string>();
    
    for (const module of modules) {
      const node = graph.get(module.id);
      if (node) {
        for (const dep of node.dependencies) {
          dependencies.add(dep);
        }
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Get execution plan summary
   */
  getExecutionSummary(plan: ExecutionPlan): {
    totalModules: number;
    parallelBatches: number;
    sequentialBatches: number;
    estimatedDuration: string;
    efficiency: number; // percentage of modules that can run in parallel
  } {
    if (!plan.success) {
      return {
        totalModules: 0,
        parallelBatches: 0,
        sequentialBatches: 0,
        estimatedDuration: '0ms',
        efficiency: 0
      };
    }

    const totalModules = plan.batches.reduce((sum, batch) => sum + batch.modules.length, 0);
    const parallelBatches = plan.batches.filter(batch => batch.canExecuteInParallel).length;
    const sequentialBatches = plan.batches.length - parallelBatches;
    const efficiency = totalModules > 0 ? (parallelBatches / plan.batches.length) * 100 : 0;

    const formatDuration = (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${(ms / 60000).toFixed(1)}m`;
    };

    return {
      totalModules,
      parallelBatches,
      sequentialBatches,
      estimatedDuration: formatDuration(plan.estimatedTotalDuration),
      efficiency: Math.round(efficiency)
    };
  }

  /**
   * Validate execution plan
   */
  validateExecutionPlan(plan: ExecutionPlan): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!plan.success) {
      errors.push('Execution plan creation failed');
      return { valid: false, errors, warnings };
    }

    if (plan.batches.length === 0) {
      warnings.push('Empty execution plan');
      return { valid: true, errors, warnings };
    }

    // Check for empty batches
    const emptyBatches = plan.batches.filter(batch => batch.modules.length === 0);
    if (emptyBatches.length > 0) {
      errors.push(`Found ${emptyBatches.length} empty batches`);
    }

    // Check for very long estimated durations
    const longBatches = plan.batches.filter(batch => batch.estimatedDuration > 60000); // 1 minute
    if (longBatches.length > 0) {
      warnings.push(`${longBatches.length} batches have estimated duration > 1 minute`);
    }

    // Check for very large parallel batches
    const largeBatches = plan.batches.filter(batch => batch.modules.length > 10);
    if (largeBatches.length > 0) {
      warnings.push(`${largeBatches.length} batches have > 10 modules (may impact performance)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

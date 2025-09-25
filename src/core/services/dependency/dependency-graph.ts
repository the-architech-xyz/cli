/**
 * Dependency Graph Service
 * 
 * Builds and manages a Directed Acyclic Graph (DAG) representing module dependencies.
 * Handles circular dependency detection and provides graph traversal capabilities.
 */

import { Module } from '@thearchitech.xyz/types';
import { AdapterLoader } from '../module-management/adapter/adapter-loader';

export interface DependencyNode {
  module: Module;
  dependencies: string[];
  dependents: string[];
  inDegree: number;
  outDegree: number;
}

export interface DependencyGraphResult {
  success: boolean;
  graph: Map<string, DependencyNode>;
  errors: string[];
  warnings: string[];
}

export class DependencyGraph {
  private graph: Map<string, DependencyNode> = new Map();
  private circularDependencies: string[] = [];

  constructor(private adapterLoader: AdapterLoader) {}

  /**
   * Build dependency graph from validated modules
   */
  async buildGraph(modules: Module[]): Promise<DependencyGraphResult> {
    console.log(`🔍 Building dependency graph for ${modules.length} modules`);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Initialize graph nodes
      for (const module of modules) {
        this.graph.set(module.id, {
          module,
          dependencies: [],
          dependents: [],
          inDegree: 0,
          outDegree: 0
        });
      }

      // Build dependency relationships
      for (const module of modules) {
        const dependencies = await this.getModuleDependencies(module);
        const node = this.graph.get(module.id);
        
        if (!node) {
          errors.push(`Module ${module.id} not found in graph`);
          continue;
        }

        node.dependencies = dependencies;
        
        // Update dependent relationships
        for (const depId of dependencies) {
          const depNode = this.graph.get(depId);
          if (depNode) {
            depNode.dependents.push(module.id);
          } else {
            warnings.push(`Dependency ${depId} not found in module list for ${module.id}`);
          }
        }
      }

      // Calculate degrees
      this.calculateDegrees();

      // Detect circular dependencies
      const circularDeps = this.detectCircularDependencies();
      if (circularDeps.length > 0) {
        errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
        return { success: false, graph: this.graph, errors, warnings };
      }

      // Validate all dependencies exist
      const missingDeps = this.validateDependencies(modules);
      if (missingDeps.length > 0) {
        errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
        return { success: false, graph: this.graph, errors, warnings };
      }

      console.log(`✅ Dependency graph built successfully`);
      console.log(`  📊 Nodes: ${this.graph.size}`);
      console.log(`  🔗 Total dependencies: ${Array.from(this.graph.values()).reduce((sum, node) => sum + node.dependencies.length, 0)}`);

      return {
        success: true,
        graph: this.graph,
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to build dependency graph: ${errorMessage}`);
      
      return {
        success: false,
        graph: this.graph,
        errors: [`Dependency graph build failed: ${errorMessage}`],
        warnings
      };
    }
  }

  /**
   * Get dependencies for a module (implicit + explicit)
   */
  private async getModuleDependencies(module: Module): Promise<string[]> {
    const dependencies: string[] = [];

    // Implicit dependencies (category-based hierarchy)
    const implicitDeps = this.getImplicitDependencies(module);
    dependencies.push(...implicitDeps);

    // Explicit dependencies (from adapter.json)
    try {
      const adapterId = module.id.split('/').pop() || module.id;
      const adapter = await this.adapterLoader.loadAdapter(module.category, adapterId);
      
      if (adapter?.config?.prerequisites) {
        const explicitDeps = adapter.config.prerequisites.modules || [];
        dependencies.push(...explicitDeps);
      }
    } catch (error) {
      console.warn(`  ⚠️ Could not load dependencies for ${module.id}: ${error}`);
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Get implicit dependencies based on category hierarchy
   */
  private getImplicitDependencies(module: Module): string[] {
    const dependencies: string[] = [];

    // Framework modules have no implicit dependencies
    if (module.category === 'framework') {
      return dependencies;
    }

    // All other modules implicitly depend on framework
    // This will be resolved by finding framework modules in the execution plan

    return dependencies;
  }

  /**
   * Calculate in-degree and out-degree for each node
   */
  private calculateDegrees(): void {
    for (const [moduleId, node] of this.graph.entries()) {
      node.inDegree = node.dependents.length;
      node.outDegree = node.dependencies.length;
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): string[] {
    const circularDeps: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (moduleId: string, path: string[]): void => {
      if (recursionStack.has(moduleId)) {
        const cycleStart = path.indexOf(moduleId);
        const cycle = path.slice(cycleStart).concat(moduleId);
        circularDeps.push(cycle.join(' → '));
        return;
      }

      if (visited.has(moduleId)) {
        return;
      }

      visited.add(moduleId);
      recursionStack.add(moduleId);

      const node = this.graph.get(moduleId);
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep, [...path, moduleId]);
        }
      }

      recursionStack.delete(moduleId);
    };

    for (const moduleId of this.graph.keys()) {
      if (!visited.has(moduleId)) {
        dfs(moduleId, []);
      }
    }

    return circularDeps;
  }

  /**
   * Validate that all dependencies exist in the module list
   */
  private validateDependencies(modules: Module[]): string[] {
    const missingDeps: string[] = [];
    const moduleIds = new Set(modules.map(m => m.id));

    for (const [moduleId, node] of this.graph.entries()) {
      for (const dep of node.dependencies) {
        if (!moduleIds.has(dep)) {
          missingDeps.push(`${moduleId} requires ${dep}`);
        }
      }
    }

    return missingDeps;
  }

  /**
   * Get all nodes with no dependencies (root nodes)
   */
  getRootNodes(): DependencyNode[] {
    return Array.from(this.graph.values()).filter(node => node.dependencies.length === 0);
  }

  /**
   * Get all nodes with no dependents (leaf nodes)
   */
  getLeafNodes(): DependencyNode[] {
    return Array.from(this.graph.values()).filter(node => node.dependents.length === 0);
  }

  /**
   * Get direct dependencies of a module
   */
  getDependencies(moduleId: string): string[] {
    const node = this.graph.get(moduleId);
    return node ? node.dependencies : [];
  }

  /**
   * Get direct dependents of a module
   */
  getDependents(moduleId: string): string[] {
    const node = this.graph.get(moduleId);
    return node ? node.dependents : [];
  }

  /**
   * Get the entire graph
   */
  getGraph(): Map<string, DependencyNode> {
    return this.graph;
  }

  /**
   * Get graph statistics
   */
  getStatistics(): {
    totalNodes: number;
    totalDependencies: number;
    rootNodes: number;
    leafNodes: number;
    maxDepth: number;
  } {
    const nodes = Array.from(this.graph.values());
    const totalDependencies = nodes.reduce((sum, node) => sum + node.dependencies.length, 0);
    const rootNodes = nodes.filter(node => node.dependencies.length === 0).length;
    const leafNodes = nodes.filter(node => node.dependents.length === 0).length;
    
    // Calculate max depth using BFS
    let maxDepth = 0;
    const visited = new Set<string>();
    const queue: { moduleId: string; depth: number }[] = [];
    
    // Start from root nodes
    for (const node of nodes) {
      if (node.dependencies.length === 0) {
        queue.push({ moduleId: node.module.id, depth: 0 });
      }
    }
    
    while (queue.length > 0) {
      const { moduleId, depth } = queue.shift()!;
      if (visited.has(moduleId)) continue;
      
      visited.add(moduleId);
      maxDepth = Math.max(maxDepth, depth);
      
      const node = this.graph.get(moduleId);
      if (node) {
        for (const dependent of node.dependents) {
          queue.push({ moduleId: dependent, depth: depth + 1 });
        }
      }
    }

    return {
      totalNodes: this.graph.size,
      totalDependencies,
      rootNodes,
      leafNodes,
      maxDepth
    };
  }
}

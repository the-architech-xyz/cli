/**
 * Dependency Resolver
 * 
 * Builds dependency graphs from module prerequisites and performs
 * topological sorting for execution order.
 */

import type {
  ModuleWithPrerequisites,
} from '@thearchitech.xyz/types';

export interface Logger {
  info: (msg: string, meta?: any) => void;
  debug: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
}

export class DependencyResolver {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Build dependency graph from modules
   * 
   * @param modules - Modules with prerequisites
   * @returns Dependency graph (module ID -> set of prerequisite IDs)
   */
  buildGraph(modules: ModuleWithPrerequisites[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    this.logger.debug('Building dependency graph', { moduleCount: modules.length });

    for (const module of modules) {
      const deps = new Set<string>();

      // Add prerequisites as dependencies
      for (const prereq of module.prerequisites || []) {
        // Normalize prerequisite ID (handle both short and full format)
        const normalizedPrereq = this.normalizeModuleId(prereq, modules);
        if (normalizedPrereq) {
          deps.add(normalizedPrereq);
        }
      }

      graph.set(module.id, deps);
    }

    this.logger.debug('Dependency graph built', {
      nodes: graph.size,
      totalEdges: Array.from(graph.values()).reduce((sum, deps) => sum + deps.size, 0)
    });

    return graph;
  }

  /**
   * Normalize module ID to match existing modules
   * Handles both short format (auth/better-auth) and full format (adapters/auth/better-auth)
   */
  private normalizeModuleId(
    moduleId: string,
    modules: ModuleWithPrerequisites[]
  ): string | null {
    // Check exact match first
    if (modules.some(m => m.id === moduleId)) {
      return moduleId;
    }

    // Try to find by short format
    const shortId = moduleId.replace(/^(adapters|connectors|features)\//, '');
    const matching = modules.find(m => 
      m.id === moduleId || 
      m.id === shortId ||
      m.id.endsWith(`/${shortId}`)
    );

    return matching?.id || null;
  }

  /**
   * Detect circular dependencies in the graph
   * 
   * @param graph - Dependency graph
   * @throws Error if circular dependency detected
   */
  detectCycles(graph: Map<string, Set<string>>): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycle = [...path, node].join(' -> ');
        throw new Error(
          `Circular dependency detected: ${cycle}`
        );
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const deps = graph.get(node);
      if (!deps) {
        recursionStack.delete(node);
        return;
      }
      for (const dep of Array.from(deps)) {
        visit(dep, [...path, node]);
      }

      recursionStack.delete(node);
    };

    for (const node of Array.from(graph.keys())) {
      if (!visited.has(node)) {
        visit(node, []);
      }
    }

    this.logger.debug('Cycle detection complete - no cycles found');
  }

  /**
   * Perform topological sort on dependency graph
   * 
   * @param graph - Dependency graph
   * @returns Array of module IDs in execution order
   */
  topologicalSort(graph: Map<string, Set<string>>): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize in-degree for all nodes
    for (const node of Array.from(graph.keys())) {
      inDegree.set(node, 0);
    }

    // Calculate in-degrees
    for (const [node, deps] of Array.from(graph.entries())) {
      for (const dep of Array.from(deps)) {
        const current = inDegree.get(dep) || 0;
        inDegree.set(dep, current + 1);
      }
    }

    // Find all nodes with in-degree 0 (no dependencies)
    for (const node of Array.from(inDegree.keys())) {
      const degree = inDegree.get(node) || 0;
      if (degree === 0) {
        queue.push(node);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      const deps = graph.get(node);
      if (!deps) continue;
      for (const dep of Array.from(deps)) {
        const current = inDegree.get(dep) || 0;
        inDegree.set(dep, current - 1);

        if (inDegree.get(dep) === 0) {
          queue.push(dep);
        }
      }
    }

    // Check for cycles (if result length < graph size, there's a cycle)
    if (result.length < graph.size) {
      const allNodes = Array.from(graph.keys());
      const missing = allNodes.filter(n => !result.includes(n));
      throw new Error(
        `Topological sort failed: possible circular dependency. Missing nodes: ${missing.join(', ')}`
      );
    }

    this.logger.info('Topological sort complete', {
      sortedCount: result.length,
      totalNodes: graph.size
    });

    return result;
  }
}


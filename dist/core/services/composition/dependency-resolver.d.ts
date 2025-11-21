/**
 * Dependency Resolver
 *
 * Builds dependency graphs from module prerequisites and performs
 * topological sorting for execution order.
 */
import type { ModuleWithPrerequisites } from '@thearchitech.xyz/types';
export interface Logger {
    info: (msg: string, meta?: any) => void;
    debug: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
}
export declare class DependencyResolver {
    private logger;
    constructor(logger: Logger);
    /**
     * Build dependency graph from modules
     *
     * @param modules - Modules with prerequisites
     * @returns Dependency graph (module ID -> set of prerequisite IDs)
     */
    buildGraph(modules: ModuleWithPrerequisites[]): Map<string, Set<string>>;
    /**
     * Normalize module ID to match existing modules
     * Handles both short format (auth/better-auth) and full format (adapters/auth/better-auth)
     */
    private normalizeModuleId;
    /**
     * Detect circular dependencies in the graph
     *
     * @param graph - Dependency graph
     * @throws Error if circular dependency detected
     */
    detectCycles(graph: Map<string, Set<string>>): void;
    /**
     * Perform topological sort on dependency graph
     *
     * @param graph - Dependency graph
     * @returns Array of module IDs in execution order
     */
    topologicalSort(graph: Map<string, Set<string>>): string[];
}

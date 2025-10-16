/**
 * Dependency Graph Service
 *
 * Builds and manages a Directed Acyclic Graph (DAG) representing module dependencies.
 * Handles circular dependency detection and provides graph traversal capabilities.
 */
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
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
export declare class DependencyGraph {
    private moduleService;
    private graph;
    private circularDependencies;
    constructor(moduleService: ModuleService);
    /**
     * Build dependency graph from validated modules
     */
    buildGraph(modules: Module[]): Promise<DependencyGraphResult>;
    /**
     * Get dependencies for a module (implicit + explicit)
     */
    private getModuleDependencies;
    /**
     * Get implicit dependencies based on category hierarchy
     */
    private getImplicitDependencies;
    /**
     * Calculate in-degree and out-degree for each node
     */
    private calculateDegrees;
    /**
     * Detect circular dependencies using DFS
     */
    private detectCircularDependencies;
    /**
     * Validate that all dependencies exist in the module list
     */
    private validateDependencies;
    /**
     * Map short dependency names to full module IDs
     */
    private mapShortNameToModuleId;
    /**
     * Get all nodes with no dependencies (root nodes)
     */
    getRootNodes(): DependencyNode[];
    /**
     * Get all nodes with no dependents (leaf nodes)
     */
    getLeafNodes(): DependencyNode[];
    /**
     * Get direct dependencies of a module
     */
    getDependencies(moduleId: string): string[];
    /**
     * Get direct dependents of a module
     */
    getDependents(moduleId: string): string[];
    /**
     * Get the entire graph
     */
    getGraph(): Map<string, DependencyNode>;
    /**
     * Get graph statistics
     */
    getStatistics(): {
        totalNodes: number;
        totalDependencies: number;
        rootNodes: number;
        leafNodes: number;
        maxDepth: number;
    };
}

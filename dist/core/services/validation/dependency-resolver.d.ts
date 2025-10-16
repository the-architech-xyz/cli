/**
 * Dependency Resolver Service
 *
 * Resolves module dependencies and creates execution order:
 * - Implicit dependencies (category-based hierarchy)
 * - Explicit dependencies (prerequisites in adapter.json)
 * - Conflict detection between modules
 * - Execution order optimization
 */
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface DependencyResolutionResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    executionOrder: Module[];
    dependencyGraph: Map<string, string[]>;
}
export declare class DependencyResolver {
    private moduleService;
    constructor(moduleService: ModuleService);
    /**
     * Resolve dependencies and create execution order
     */
    resolveDependencies(modules: Module[]): Promise<DependencyResolutionResult>;
    /**
     * Get dependencies for a module (implicit + explicit)
     */
    private getModuleDependencies;
    /**
     * Get implicit dependencies based on category hierarchy
     */
    private getImplicitDependencies;
    /**
     * Detect circular dependencies
     */
    private detectCircularDependencies;
    /**
     * Detect missing dependencies
     */
    private detectMissingDependencies;
    /**
     * Detect potential conflicts between modules
     */
    private detectConflicts;
    /**
     * Create execution order using topological sort
     */
    private createExecutionOrder;
}

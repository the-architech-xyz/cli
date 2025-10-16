/**
 * High-Level Dependency Resolver
 *
 * Intelligent dependency resolution system that can:
 * - Resolve capabilities to modules
 * - Handle transitive dependencies
 * - Detect conflicts and circular dependencies
 * - Generate optimal execution order
 */
import { ResolutionResult, ResolutionOptions } from '@thearchitech.xyz/types';
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export declare class HighLevelDependencyResolver {
    private moduleService;
    private capabilityRegistry;
    private moduleRegistry;
    private dependencyGraph;
    private resolvedModules;
    private options;
    constructor(moduleService: ModuleService, options?: Partial<ResolutionOptions>);
    /**
     * Main resolution method - resolves a genome to a complete execution plan
     */
    resolveGenome(genome: Module[]): Promise<ResolutionResult>;
    /**
     * Initialize capability and module registries
     */
    private initializeRegistries;
    /**
     * Recursively expand modules to include all prerequisites
     */
    private recursiveExpansion;
    /**
     * Resolve capabilities to their providing modules
     */
    private resolveCapabilities;
    /**
     * Build dependency graph from resolved modules
     */
    private buildDependencyGraph;
    /**
     * Detect circular dependencies
     */
    private detectCycles;
    /**
     * Topological sort for execution order
     */
    private topologicalSort;
    /**
     * Detect conflicts between modules
     */
    private detectConflicts;
    /**
     * Generate warnings for resolved modules
     */
    private generateWarnings;
    /**
     * Load module configuration
     */
    private loadModuleConfig;
    /**
     * Resolve prerequisites for a module
     */
    private resolvePrerequisites;
    /**
     * Resolve capability requirements
     */
    private resolveCapabilityRequirements;
    /**
     * Extract capabilities from module config
     */
    private extractCapabilities;
    /**
     * Extract prerequisites from module config
     */
    private extractPrerequisites;
    /**
     * Get module category from ID
     */
    private getModuleCategory;
    /**
     * Validate module ID format and reject invalid types
     */
    private validateModuleId;
    /**
     * Get module type from module
     */
    private getModuleType;
    /**
     * Find resolved module by ID
     */
    private findResolvedModule;
}

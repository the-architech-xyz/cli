/**
 * Module Configuration Service
 *
 * Unified service for module configuration merging, parameter defaults, and template context building.
 * Combines functionality of ParameterMerger and ModuleEnhancer.
 *
 * DOCTRINE DECISION: This service remains in the CLI because it handles EXECUTION-TIME concerns:
 * - Merging user-provided parameters with adapter defaults at execution time
 * - Building template context for blueprint execution
 * - This is NOT transformation logic (which belongs in marketplace)
 * - This is runtime parameter merging for blueprint execution
 *
 * The marketplace transformer handles transformation-time concerns (capability resolution, module expansion).
 * This service handles execution-time concerns (parameter merging, context building).
 */
import { Module, ResolvedGenome, MergedConfiguration } from '@thearchitech.xyz/types';
export declare class ModuleConfigurationService {
    /**
     * Merge module configuration with user overrides
     */
    mergeModuleConfiguration(module: Module, adapter: any, genome: ResolvedGenome): MergedConfiguration;
    /**
     * Merge parameter defaults with user overrides
     */
    mergeParametersWithDefaults(parameterSchema: any, userOverrides: Record<string, any>): Record<string, any>;
    /**
     * Check if a value is a parameter schema object
     */
    private isParameterSchema;
}

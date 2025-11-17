/**
 * Module Configuration Service
 *
 * Unified service for module configuration merging, parameter defaults, and template context building.
 * Combines functionality of ParameterMerger and ModuleEnhancer.
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

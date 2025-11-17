/**
 * Constitutional Architecture Types
 *
 * Types for the "Defaults are Implicit, Overrides are Explicit" system
 */
export interface InternalStructure {
    [capabilityName: string]: CapabilityDefinition;
}
export interface CapabilityDefinition {
    provides: string[];
    prerequisites?: string[];
    templates: string[];
    dependencies?: string[];
}
export interface ConstitutionalModule {
    id: string;
    name: string;
    description: string;
    version: string;
    provides: string[];
    parameters: {
        features: {
            [featureName: string]: {
                description: string;
                default: boolean;
                type?: 'boolean' | 'string' | 'number' | 'array';
                options?: any[];
                required?: boolean;
            };
        };
    };
    internal_structure: InternalStructure;
    constraints?: Record<string, string>;
}
export interface MergedConfiguration {
    activeFeatures: string[];
    resolvedCapabilities: string[];
    executionOrder: string[];
    conflicts: ConfigurationConflict[];
    templateContext?: Record<string, any>;
}
export interface ConfigurationConflict {
    type: 'missing_prerequisite' | 'circular_dependency' | 'version_mismatch';
    message: string;
    affectedCapabilities: string[];
    resolution?: string;
}
export interface ConstitutionalExecutionContext {
    activeFeatures: Map<string, string[]>;
    mergedConfigurations: Map<string, MergedConfiguration>;
    capabilityRegistry: Map<string, CapabilityDefinition>;
}
export interface BlueprintTemplateContext {
    features: string[];
    [key: string]: any;
}
export interface ActionTemplateContext extends BlueprintTemplateContext {
    actionContext?: Record<string, any>;
    globalContext?: Record<string, any>;
}

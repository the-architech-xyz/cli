/**
 * Feature Types - V1 Enhanced with Capability Resolution
 *
 * Feature configuration for intelligent dependency resolution
 */
import type { BlueprintAction, Blueprint, ParameterDefinition } from './adapter.js';
export interface InternalFeatureStructure {
    core?: {
        provides: string[];
        templates: string[];
    };
    optional?: Record<string, {
        prerequisites?: string[];
        requires_capabilities?: string[];
        requires_features?: string[];
        provides: string[];
        templates: string[];
    }>;
}
export interface FeatureConfig {
    id: string;
    name: string;
    description: string;
    version: string;
    category: 'feature';
    blueprint: string;
    prerequisites: {
        capabilities: string[];
        adapters?: string[];
        integrators?: string[];
        modules?: string[];
    };
    provides: {
        capabilities: string[];
    };
    internal_structure?: InternalFeatureStructure;
    parameters?: Record<string, ParameterDefinition>;
    constraints?: {
        [key: string]: string;
    };
    contract?: {
        hooks: Record<string, string>;
        api?: {
            endpoints: string[];
            methods: string[];
        };
        types?: string[];
    };
}
export interface Feature {
    config: FeatureConfig;
    blueprint: Blueprint;
}
export type { BlueprintAction, Blueprint, ParameterDefinition };

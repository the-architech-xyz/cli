/**
 * Dependency Resolver Types - V1 High-Level Resolution
 *
 * Types for the High-Level Dependency Resolver system
 */
export interface CapabilityRegistry {
    [capabilityName: string]: {
        providers: ModuleProvider[];
        consumers: ModuleConsumer[];
        conflicts: CapabilityConflict[];
    };
}
export interface ModuleProvider {
    moduleId: string;
    capabilityVersion: string;
    confidence: number;
    metadata: {
        description?: string;
        provides?: string[];
        requires?: string[];
    };
}
export interface ModuleConsumer {
    moduleId: string;
    requiredVersion: string;
    metadata: {
        description?: string;
        context?: string;
    };
}
export interface CapabilityConflict {
    capability: string;
    providers: ModuleProvider[];
    severity: 'error' | 'warning';
    message: string;
}
export interface ResolutionResult {
    success: boolean;
    modules: ResolvedModule[];
    executionOrder: ResolvedModule[];
    conflicts: ResolutionError[];
    warnings: ResolutionWarning[];
    capabilityRegistry: CapabilityRegistry;
}
export interface ResolvedModule {
    id: string;
    category: 'framework' | 'adapter' | 'integrator' | 'feature';
    version?: string;
    parameters: Record<string, any>;
    features?: Record<string, boolean | string | string[]>;
    externalFiles?: string[];
    resolutionPath: string[];
    capabilities: string[];
    prerequisites: string[];
    confidence: number;
}
export interface ResolutionError {
    type: 'MISSING_CAPABILITY' | 'CONFLICTING_PROVIDERS' | 'CIRCULAR_DEPENDENCY' | 'MISSING_MODULE';
    module: string;
    capability?: string;
    message: string;
    suggestions: string[];
    severity: 'error' | 'warning';
}
export interface ResolutionWarning {
    type: 'LOW_CONFIDENCE' | 'POTENTIAL_CONFLICT' | 'DEPRECATED_CAPABILITY';
    module: string;
    capability?: string;
    message: string;
    suggestions: string[];
}
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    edges: Map<string, string[]>;
    cycles: string[][];
}
export interface DependencyNode {
    id: string;
    category: 'framework' | 'adapter' | 'integrator' | 'feature';
    dependencies: string[];
    dependents: string[];
    level: number;
    visited: boolean;
    inProgress: boolean;
}
export interface CapabilityResolution {
    capability: string;
    provider: ModuleProvider;
    alternatives: ModuleProvider[];
    confidence: number;
    conflicts: CapabilityConflict[];
}
export interface ModuleConfig {
    id: string;
    category: 'framework' | 'adapter' | 'integrator' | 'feature';
    version: string;
    capabilities: {
        [capabilityName: string]: {
            version?: string;
            description?: string;
            provides?: string[];
            requires?: string[];
        };
    };
    prerequisites: {
        modules?: string[];
        capabilities?: string[];
        adapters?: string[];
        integrators?: string[];
    };
    parameters: Record<string, any>;
    features?: Record<string, boolean | string | string[]>;
    provides?: {
        capabilities?: string[];
        files?: string[];
        components?: string[];
        pages?: string[];
    };
}
export interface ResolutionOptions {
    failFast: boolean;
    maxDepth: number;
    allowConflicts: boolean;
    strictMode: boolean;
    verbose: boolean;
}

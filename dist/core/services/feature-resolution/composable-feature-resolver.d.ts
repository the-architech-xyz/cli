import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface FeatureMasterSchema {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    provides: {
        hooks: Record<string, string>;
        types: string[];
        api: string[];
    };
    sub_features?: Record<string, {
        name: string;
        description: string;
        provides: {
            hooks: Record<string, string>;
            types: string[];
            api: string[];
        };
    }>;
    requirements: {
        backend: {
            database: string[];
            framework: string[];
            capabilities: string[];
        };
        frontend: {
            ui: string[];
            framework: string[];
            capabilities: string[];
        };
    };
}
export interface FeatureImplementation {
    id: string;
    name: string;
    description: string;
    version: string;
    type: 'backend-implementation' | 'frontend-implementation';
    implements: string;
    tech_stack: Record<string, string>;
    prerequisites: {
        modules: string[];
        capabilities: string[];
    };
    provides: {
        capabilities?: string[];
        hooks?: string[];
        types?: string[];
        api?: string[];
        components?: string[];
        pages?: string[];
    };
    blueprint: string;
}
export interface ResolvedFeature {
    featureId: string;
    masterSchema: FeatureMasterSchema;
    backendImplementation?: FeatureImplementation;
    frontendImplementation?: FeatureImplementation;
    subFeatures: string[];
}
export declare class ComposableFeatureResolver {
    private moduleService;
    private marketplacePath;
    constructor(moduleService: ModuleService, marketplacePath: string);
    resolveFeature(featureId: string, projectStack: {
        backend: {
            database: string;
            framework: string;
        };
        frontend: {
            ui: string;
            framework: string;
        };
    }): Promise<ResolvedFeature>;
    convertToModules(resolvedFeature: ResolvedFeature): Promise<Module[]>;
    private readMasterSchema;
    private findBackendImplementation;
    private findFrontendImplementation;
    private matchesBackendStack;
    private matchesFrontendStack;
    private convertImplementationToModule;
}

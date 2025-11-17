import type { ParameterDefinition } from './parameter-schema.js';
export interface MarketplaceManifestModule {
    id: string;
    type: 'framework' | 'capability' | 'feature' | string;
    category?: string;
    name?: string;
    description?: string;
    version?: string;
    tags?: string[];
    provides?: string[];
    dependencies?: string[];
    parameters?: Record<string, ParameterDefinition | Record<string, unknown>>;
    parameterDefaults?: Record<string, unknown>;
    marketplace?: {
        name: string;
        root?: string;
    };
    source?: {
        root: string;
        marketplace?: string;
    };
    manifest?: {
        file: string;
    };
    blueprint?: {
        file: string;
        runtime?: 'source' | 'compiled';
    };
    templates?: string[];
    [key: string]: unknown;
}
export interface MarketplaceManifest {
    version?: string;
    generatedAt?: string;
    modules: MarketplaceManifestModule[];
    metadata?: Record<string, unknown>;
}

/**
 * Adapter Types - V1 Enhanced with Intelligence
 *
 * Enhanced adapter structure for intelligent blueprint execution
 */
export interface Adapter {
    config: AdapterConfig;
    blueprint: Blueprint;
}
export interface AdapterConfig {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    blueprint: string;
    dependencies?: string[];
    prerequisites?: {
        modules?: string[];
        capabilities?: string[];
        adapters?: string[];
        integrators?: string[];
    };
    capabilities?: {
        [capabilityName: string]: {
            version?: string;
            description?: string;
            provides?: string[];
            requires?: string[];
        };
    };
    limitations?: string;
    parameters?: Record<string, ParameterDefinition>;
    features?: Record<string, FeatureDefinition>;
    paths?: Record<string, string>;
    tags?: string[];
    engine?: {
        cliVersion: string;
    };
}
export interface ParameterDefinition {
    type: 'string' | 'boolean' | 'number' | 'select' | 'array' | 'object';
    required: boolean;
    default?: any;
    choices?: string[];
    description: string;
    validation?: (value: any) => boolean;
}
export interface FeatureDefinition {
    id: string;
    name: string;
    description: string;
    blueprint: string;
    dependencies?: string[];
    parameters?: Record<string, ParameterDefinition>;
    category?: 'core' | 'premium' | 'integration' | 'cross-adapter';
    compatibility?: string[];
}
export interface Blueprint {
    id: string;
    name: string;
    description?: string;
    version?: string;
    contextualFiles?: string[];
    actions: BlueprintAction[];
}
import { BlueprintAction } from './blueprint-actions.js';
export { BlueprintAction } from './blueprint-actions.js';
export type { InstallPackagesAction, AddScriptAction, AddEnvVarAction, CreateFileAction, AppendToFileAction, PrependToFileAction, RunCommandAction, MergeJsonAction, AddTsImportAction, EnhanceFileAction, MergeConfigAction, WrapConfigAction, ExtendSchemaAction, AddDependencyAction, AddDevDependencyAction, SchemaColumn } from './blueprint-actions.js';
import { ConflictResolutionStrategy, ConflictMergeStrategy } from './conflict-resolution.js';
export interface ConflictResolution {
    strategy: ConflictResolutionStrategy;
    mergeStrategy?: ConflictMergeStrategy;
    priority?: number;
}
export interface MergeInstructions {
    modifier?: import('./modifiers.js').ModifierType;
    params?: Record<string, any>;
    strategy?: 'deep-merge' | 'shallow-merge' | 'replace';
}
export interface SchemaTable {
    name: string;
    definition: string;
}
export interface ImportDefinition {
    moduleSpecifier: string;
    namedImports?: string[];
    defaultImport?: string;
    namespaceImport?: string;
}
export interface ModifierDefinition {
    handler: (filePath: string, params: any, context: any) => Promise<any>;
    paramsSchema: any;
    description: string;
    supportedFileTypes: string[];
}
export interface ModifierRegistry {
    [key: string]: ModifierDefinition;
}
export interface BlueprintExecutionResult {
    success: boolean;
    files: string[];
    errors: string[];
    warnings: string[];
}

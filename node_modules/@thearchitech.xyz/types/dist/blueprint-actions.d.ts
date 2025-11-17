/**
 * Type-Safe Blueprint Actions
 *
 * Discriminated union types for all blueprint actions with strict type safety.
 * Each action type has its own interface with required properties.
 */
import { ImportDefinition, SchemaTable, ConflictResolution, MergeInstructions } from './adapter.js';
import { BlueprintActionType } from './blueprint-action-types.js';
import { ModifierType } from './modifier-types.js';
import { EnhanceFileFallbackStrategy } from './fallback-strategies.js';
export interface BaseAction {
    condition?: string;
    forEach?: string;
    context?: Record<string, any>;
}
export interface InstallPackagesAction extends BaseAction {
    type: BlueprintActionType.INSTALL_PACKAGES;
    packages: string[];
    isDev?: boolean;
}
export interface AddScriptAction extends BaseAction {
    type: BlueprintActionType.ADD_SCRIPT;
    name: string;
    command: string;
}
export interface AddEnvVarAction extends BaseAction {
    type: BlueprintActionType.ADD_ENV_VAR;
    key: string;
    value: string;
    path?: string;
    description?: string;
}
export interface CreateFileAction extends BaseAction {
    type: BlueprintActionType.CREATE_FILE;
    path: string;
    content?: string;
    template?: string;
    overwrite?: boolean;
    conflictResolution?: ConflictResolution;
    mergeInstructions?: MergeInstructions;
    sharedRoutes?: {
        enabled?: boolean;
        apps?: ('web' | 'mobile')[];
        routePath?: string;
        componentName?: string;
    };
}
export interface AppendToFileAction extends BaseAction {
    type: BlueprintActionType.APPEND_TO_FILE;
    path: string;
    content: string;
}
export interface PrependToFileAction extends BaseAction {
    type: BlueprintActionType.PREPEND_TO_FILE;
    path: string;
    content: string;
}
export interface RunCommandAction extends BaseAction {
    type: BlueprintActionType.RUN_COMMAND;
    command: string;
    workingDir?: string;
}
export interface MergeJsonAction extends BaseAction {
    type: BlueprintActionType.MERGE_JSON;
    path: string;
    content: Record<string, any>;
}
export interface AddTsImportAction extends BaseAction {
    type: BlueprintActionType.ADD_TS_IMPORT;
    path: string;
    imports: ImportDefinition[];
}
export interface EnhanceFileAction extends BaseAction {
    type: BlueprintActionType.ENHANCE_FILE;
    path: string;
    modifier: ModifierType;
    params?: Record<string, any>;
    fallback?: EnhanceFileFallbackStrategy;
}
export interface MergeConfigAction extends BaseAction {
    type: BlueprintActionType.MERGE_CONFIG;
    path: string;
    strategy: 'deep-merge' | 'shallow-merge' | 'replace';
    config: Record<string, any>;
}
export interface WrapConfigAction extends BaseAction {
    type: BlueprintActionType.WRAP_CONFIG;
    path: string;
    wrapper: string;
    options?: Record<string, any>;
}
export interface ExtendSchemaAction extends BaseAction {
    type: BlueprintActionType.EXTEND_SCHEMA;
    path: string;
    tables: SchemaTable[];
    additionalImports?: string[];
}
export interface AddDependencyAction extends BaseAction {
    type: BlueprintActionType.ADD_DEPENDENCY;
    packages: string[];
    isDev?: boolean;
}
export interface AddDevDependencyAction extends BaseAction {
    type: BlueprintActionType.ADD_DEV_DEPENDENCY;
    packages: string[];
}
export interface SchemaColumn {
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
    defaultValue?: any;
}
export type BlueprintAction = InstallPackagesAction | AddScriptAction | AddEnvVarAction | CreateFileAction | AppendToFileAction | PrependToFileAction | RunCommandAction | MergeJsonAction | AddTsImportAction | EnhanceFileAction | MergeConfigAction | WrapConfigAction | ExtendSchemaAction | AddDependencyAction | AddDevDependencyAction;

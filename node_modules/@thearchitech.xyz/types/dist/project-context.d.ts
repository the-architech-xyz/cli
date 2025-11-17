/**
 * Base Project Context Types
 *
 * Framework-agnostic base types for project context.
 * These types are extended by framework-specific implementations.
 */
export interface BaseProjectInfo {
    name: string;
    framework: string;
    description?: string;
    version?: string;
    author?: string;
    license?: string;
    path?: string;
}
export interface BaseModuleInfo {
    id: string;
    parameters: Record<string, any>;
}
export interface BaseEnvironmentContext {
    APP_URL?: string;
    NODE_ENV?: string;
    [key: string]: any;
}
/**
 * Base Project Context - Framework Agnostic
 *
 * This is the core interface that all framework-specific contexts extend.
 * It contains only the essential, framework-agnostic properties.
 */
export interface BaseProjectContext {
    project: BaseProjectInfo;
    module: BaseModuleInfo;
    framework: string;
    env?: BaseEnvironmentContext;
}
/**
 * Path Handler Interface
 *
 * Generic interface for path resolution services.
 * Framework-specific implementations provide concrete path structures.
 */
export interface BasePathHandler {
    resolveTemplate?: (template: string) => string;
    validatePathVariables?: (template: string, strict?: boolean) => {
        valid: boolean;
        missingPaths: string[];
    };
    getAvailablePaths?: () => string[];
}
/**
 * Module Registry Interface
 *
 * Generic interface for module collections.
 * Framework-specific implementations provide typed module structures.
 */
export interface BaseModuleRegistry {
    [moduleId: string]: any;
}

/**
 * Path Service
 *
 * Centralized path management for The Architech.
 * Handles both basic path operations and decentralized path resolution.
 */
import { AdapterConfig } from '@thearchitech.xyz/types';
export declare class PathService {
    private projectRoot;
    private projectName;
    private pathMap;
    private frameworkProjectRoot;
    private static cliRoot;
    private static marketplaceRoot;
    constructor(projectRoot: string, projectName?: string, frameworkAdapter?: AdapterConfig);
    /**
     * Get project root path
     */
    getProjectRoot(): string;
    /**
     * Get project name
     */
    getProjectName(): string;
    /**
     * Get a specific path from the framework's path map (decentralized)
     */
    getPath(key: string): string;
    /**
     * Check if a path key exists in the framework's path map
     */
    hasPath(key: string): boolean;
    /**
     * Resolve a path relative to project root
     */
    resolvePath(relativePath: string): string;
    /**
     * Join paths
     */
    join(...paths: string[]): string;
    /**
     * Get relative path from project root
     */
    getRelativePath(targetPath: string): string;
    /**
     * Check if path exists
     */
    exists(targetPath: string): boolean;
    /**
     * Create directory path
     */
    createDirPath(dirPath: string): string;
    /**
     * Ensure directory exists
     */
    ensureDir(dirPath: string): Promise<void>;
    /**
     * Get source path
     */
    getSrcPath(): string;
    /**
     * Get lib path
     */
    getLibPath(): string;
    /**
     * Get components path
     */
    getComponentsPath(): string;
    /**
     * Get UI components path
     */
    getUIComponentsPath(): string;
    /**
     * Get utils path
     */
    getUtilsPath(): string;
    /**
     * Get test path
     */
    getTestPath(): string;
    /**
     * Get database path
     */
    getDatabasePath(): string;
    /**
     * Get auth path
     */
    getAuthPath(): string;
    /**
     * Get package.json path
     */
    getPackageJsonPath(): string;
    /**
     * Get tsconfig.json path
     */
    getTsConfigPath(): string;
    /**
     * Get .env.example path
     */
    getEnvExamplePath(): string;
    /**
     * Get all available path keys
     */
    getAvailablePaths(): string[];
    /**
     * Resolve template variables in a string (for ${paths.key} patterns)
     * CHANGED: Now uses ${} syntax to avoid conflicts with template {{}} syntax
     */
    resolveTemplate(template: string): string;
    /**
     * Get fallback path for common keys
     */
    private getFallbackPath;
    /**
     * Validate that all ${paths.key} variables in a template exist in the framework paths
     * Also supports legacy {{paths.key}} syntax
     * @param template The template string to validate
     * @param strict If true, throws an error for missing paths. If false, returns validation result
     * @returns Validation result with missing paths
     */
    validatePathVariables(template: string, strict?: boolean): {
        valid: boolean;
        missingPaths: string[];
    };
    /**
     * Get all path variables used in a template
     * Supports both ${paths.key} and legacy {{paths.key}} syntax
     * @param template The template string to analyze
     * @returns Array of path keys found in the template
     */
    getPathVariablesInTemplate(template: string): string[];
    /**
     * Initialize CLI root path (call this once at CLI startup)
     */
    static initializeCliRoot(): void;
    /**
     * Get the CLI root directory
     */
    static getCliRoot(): string;
    /**
     * Get the marketplace root directory (development or production)
     */
    static getMarketplaceRoot(): Promise<string>;
    /**
     * Resolve module ID to full module path using dumb translation
     *
     * The CLI knows nothing about module types. It just performs simple string transformations.
     * This is the only "intelligence" in the CLI.
     */
    static resolveModuleId(moduleId: string): Promise<string>;
    /**
     * Calculate CLI root directory by finding the package.json with the-architech
     */
    private static calculateCliRoot;
}

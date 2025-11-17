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
    constructor(projectRoot: string, projectName?: string, frameworkAdapter?: AdapterConfig);
    /**
     * Replace entire framework path map
     */
    setFrameworkPaths(paths: Record<string, string>): void;
    /**
     * Merge additional framework paths (later keys overwrite)
     */
    mergeFrameworkPaths(paths: Record<string, string>): void;
    /**
     * Set a single path in the path map
     */
    setPath(key: string, value: string): void;
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
     * Get marketplace UI configuration from stored paths
     *
     * Constructs the marketplace.ui object from paths stored by PathInitializationService.
     * This is the SINGLE SOURCE OF TRUTH - marketplace UI is initialized once and read-only after.
     *
     * @returns Marketplace UI configuration with default framework and paths
     *
     * @example
     * ```typescript
     * const marketplaceUI = pathHandler.getMarketplaceUI();
     * // Returns: { default: 'tamagui', tamagui: '/path/to/marketplace-tamagui' }
     * ```
     */
    getMarketplaceUI(): {
        [framework: string]: string;
        default: string;
    };
    resolveTemplate(template: string): string;
    /**
     * Validate that all ${paths.key} variables in a template exist in the framework paths
     * Also validates against marketplace path key definitions if marketplace is provided
     * @param template The template string to validate
     * @param strict If true, throws an error for missing paths. If false, returns validation result
     * @param marketplaceName Optional marketplace name for path key validation
     * @param projectStructure Optional project structure for path key validation
     * @returns Validation result with missing paths
     */
    validatePathVariables(template: string, strict?: boolean, marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<{
        valid: boolean;
        missingPaths: string[];
        errors?: Array<{
            key: string;
            message: string;
        }>;
    }>;
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
     * @deprecated Use MarketplaceRegistry.getCoreMarketplacePath() instead
     * This method has been removed to consolidate marketplace path resolution.
     */
    /**
     * Resolve module ID to full module path using dumb translation
     *
     * The CLI knows nothing about module types. It just performs simple string transformations.
     * This is the only "intelligence" in the CLI.
     */
    static resolveModuleId(moduleId: string): Promise<string>;
    /**
     * Calculate CLI root directory by finding the package.json with @thearchitech.xyz/cli
     */
    private static calculateCliRoot;
}

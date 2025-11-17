/**
 * Path Service
 *
 * Centralized path management for The Architech.
 * Handles both basic path operations and decentralized path resolution.
 *
 * CONSOLIDATED: This service now includes:
 * - Path storage and resolution (core functionality)
 * - Module ID translation (from DumbPathTranslator)
 * - Import path resolution (from ImportPathResolver)
 * - Path key validation (from PathKeyRegistry)
 */
import { AdapterConfig, MarketplacePathKeys } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class PathService {
    private projectRoot;
    private projectName;
    private pathMap;
    private userOverrides;
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
     * Set user-defined path overrides from genome.project.paths
     * These overrides take precedence over marketplace adapter paths
     */
    setUserOverrides(overrides: Record<string, string>): void;
    /**
     * Get user-defined path overrides
     */
    getUserOverrides(): Record<string, string>;
    /**
     * Clear user overrides
     */
    clearUserOverrides(): void;
    /**
     * Get project root path
     */
    getProjectRoot(): string;
    /**
     * Get project name
     */
    getProjectName(): string;
    /**
     * Get a specific path with contextual resolution
     *
     * Resolution order:
     * 1. User override (from genome.project.paths) - HIGHEST PRIORITY
     * 2. Marketplace adapter path (from adapter.resolvePathDefaults)
     * 3. Error if not found
     *
     * This implements the "Reference Structure with Explicit Overrides" doctrine.
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
     *
     * Rules:
     * 1. Take the part before the ':', add an 's', use as first folder
     * 2. Take the part after the ':', use as the rest of the path
     *
     * Examples:
     * - connector:docker-drizzle -> connectors/docker-drizzle
     * - feature:teams/backend/nextjs-drizzle -> features/teams/backend/nextjs-drizzle
     * - adapter:database/drizzle -> adapters/database/drizzle
     */
    static resolveModuleId(moduleId: string): Promise<string>;
    /**
     * Translate module ID to marketplace path
     * @private
     */
    private static translateModuleId;
    /**
     * Get the full file system path for a module
     */
    static getModulePath(moduleId: string): Promise<string>;
    /**
     * Check if a module exists
     */
    static moduleExists(moduleId: string): Promise<boolean>;
    /**
     * Convert file path to import path based on project structure
     *
     * @param filePath - File path to convert (e.g., './src/server/trpc/router')
     * @param context - Project context with structure information
     * @returns Import path (e.g., '@/server/trpc/router' or '@repo/api/router')
     */
    static resolveImportPath(filePath: string, context: ProjectContext): string;
    /**
     * Convert packages/ path to workspace protocol
     * @private
     */
    private static convertToWorkspacePath;
    /**
     * Convert src/ path to @/ alias
     * @private
     */
    private static convertToAliasPath;
    /**
     * Remove file extensions from import paths
     * @private
     */
    private static removeFileExtension;
    /**
     * Pre-compute import paths from file paths (optional optimization)
     *
     * @param filePaths - Record of path keys to file paths
     * @param context - Project context
     * @returns Record of path keys to import paths
     */
    static computeImportPaths(filePaths: Record<string, string>, context: ProjectContext): Record<string, string>;
    private static pathKeyCache;
    private static defaultPathKeys;
    /**
     * Load path keys from marketplace
     * Falls back to default PathKey enum if marketplace doesn't define path-keys.json
     */
    static loadPathKeys(marketplaceName?: string): Promise<MarketplacePathKeys>;
    /**
     * Get default path keys (from PathKey enum)
     * Used as fallback when marketplace doesn't define path-keys.json
     */
    private static getDefaultPathKeys;
    /**
     * Validate path key definition structure
     */
    private static validatePathKeys;
    /**
     * Check if a path key is valid for the marketplace
     */
    static isValidPathKey(key: string, marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<boolean>;
    /**
     * Get all valid path keys for a marketplace and structure
     */
    static getValidPathKeys(marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<string[]>;
    /**
     * Validate path key usage in a template string
     * Returns validation result with errors and suggestions
     */
    static validatePathKeyUsage(template: string, marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<{
        valid: boolean;
        errors: Array<{
            key: string;
            message: string;
        }>;
        suggestions: string[];
    }>;
    /**
     * Get suggestions for a misspelled path key
     */
    private static getSuggestions;
    /**
     * Calculate string similarity (simple implementation)
     */
    private static similarity;
    /**
     * Calculate Levenshtein distance
     */
    private static levenshteinDistance;
    /**
     * Clear path key cache (useful for testing or reloading)
     */
    static clearPathKeyCache(): void;
    /**
     * Calculate CLI root directory by finding the package.json with @thearchitech.xyz/cli
     */
    private static calculateCliRoot;
}
/**
 * @deprecated Use PathService.resolveImportPath() instead
 */
export declare const ImportPathResolver: {
    resolveImportPath: typeof PathService.resolveImportPath;
    computeImportPaths: typeof PathService.computeImportPaths;
};
/**
 * @deprecated Use PathService methods directly instead
 */
export declare const PathKeyRegistry: {
    loadPathKeys: typeof PathService.loadPathKeys;
    isValidPathKey: typeof PathService.isValidPathKey;
    getValidPathKeys: typeof PathService.getValidPathKeys;
    validatePathKeyUsage: typeof PathService.validatePathKeyUsage;
    clearCache: typeof PathService.clearPathKeyCache;
};

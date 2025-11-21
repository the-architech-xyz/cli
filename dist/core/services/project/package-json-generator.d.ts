/**
 * Package JSON Generator
 *
 * Generates package.json files for packages based on recipe book metadata.
 * This service replaces inline package.json generation with a centralized,
 * recipe-driven approach that supports granular packages and workspace dependencies.
 */
import type { PackageStructure, PackageDependencies, Genome, RecipeBook } from '@thearchitech.xyz/types';
export interface PackageJson {
    name: string;
    version: string;
    private: boolean;
    main?: string;
    types?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    exports?: Record<string, string>;
    [key: string]: unknown;
}
export declare class PackageJsonGenerator {
    /**
     * Generate package.json for a package based on recipe book metadata
     *
     * @param packageName - Package name (e.g., "auth", "db", "ui")
     * @param packageStructure - Package structure metadata from recipe book
     * @param projectName - Project name (for scoped package names)
     * @param genome - Genome for additional context (optional)
     * @param packagePath - Package path (e.g., "packages/auth") for relative path calculation
     * @param resolvedDependencies - Resolved dependencies from DependencyResolverService (optional)
     * @returns Generated package.json object
     */
    static generatePackageJson(packageName: string, packageStructure: PackageStructure, projectName: string, genome?: Genome, packagePath?: string, resolvedDependencies?: PackageDependencies): PackageJson;
    /**
     * Resolve dependencies, replacing {projectName} placeholder with actual project name
     * and converting workspace dependencies based on package manager
     *
     * @param deps - Dependencies from packageStructure
     * @param projectName - Project name for placeholder replacement
     * @param genome - Genome for workspace dependency detection
     * @param packagePath - Package path (e.g., "packages/auth") for relative path calculation
     * @returns Resolved dependencies
     */
    private static resolveDependencies;
    /**
     * Detect package manager from genome
     */
    private static detectPackageManager;
    /**
     * Find package path from package name in monorepo config
     */
    private static findPackagePath;
    /**
     * Get relative path for npm file: protocol
     *
     * @param fromPath - Source path (e.g., "packages/auth")
     * @param toPath - Target path (e.g., "packages/db")
     * @returns Relative path (e.g., "file:../db")
     */
    private static getRelativePathForNpm;
    /**
     * Get framework-specific scripts for package
     * Combines packageStructure scripts with package-specific defaults
     *
     * @param packageName - Package name
     * @param packageStructure - Package structure metadata
     * @returns Scripts object
     */
    private static getPackageScripts;
    /**
     * Generate package.json for an app (web, mobile, api)
     * Apps have different structure than packages
     *
     * V2 COMPLIANCE: Accepts recipe books and framework adapter for metadata-driven scripts
     *
     * @param appName - App name (e.g., "web", "mobile", "api")
     * @param appFramework - Framework (e.g., "nextjs", "expo", "hono")
     * @param projectName - Project name
     * @param workspaceDependencies - Workspace dependencies to add
     * @param recipeBooks - Optional recipe books for framework scripts
     * @param frameworkAdapter - Optional framework adapter config for scripts
     * @returns Generated package.json object
     */
    static generateAppPackageJson(appName: string, appFramework: string, projectName: string, workspaceDependencies?: Record<string, string>, recipeBooks?: Map<string, RecipeBook>, frameworkAdapter?: {
        config?: {
            scripts?: Record<string, string>;
        };
    }): PackageJson;
    /**
     * Get framework-specific scripts for apps
     *
     * V2 COMPLIANCE: Reads from recipe books or adapter metadata instead of hardcoding
     *
     * @param appName - App name
     * @param framework - Framework name
     * @param recipeBooks - Optional recipe books for framework scripts
     * @param frameworkAdapter - Optional framework adapter config
     * @returns Scripts object
     */
    private static getAppScripts;
    /**
     * Get scripts from recipe book
     *
     * V2 COMPLIANCE: Reads framework scripts from recipe book metadata
     */
    private static getScriptsFromRecipeBook;
    /**
     * Fallback scripts (deprecated, for migration period)
     *
     * @deprecated Scripts should come from recipe book or adapter metadata
     */
    private static getFallbackScripts;
}

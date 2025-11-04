/**
 * Import Path Resolver Service
 *
 * Converts file paths to import paths based on project structure.
 * Handles both single-app and monorepo structures automatically.
 */
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class ImportPathResolver {
    /**
     * Convert file path to import path based on project structure
     *
     * @param filePath - File path to convert (e.g., './src/server/trpc/router')
     * @param context - Project context with structure information
     * @returns Import path (e.g., '@/server/trpc/router' or '@repo/api/router')
     *
     * @example
     * // Single app
     * resolveImportPath('./src/lib/utils', context)
     * // Returns: '@/lib/utils'
     *
     * @example
     * // Monorepo
     * resolveImportPath('./packages/api/src/router', context)
     * // Returns: '@repo/api/router'
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
}

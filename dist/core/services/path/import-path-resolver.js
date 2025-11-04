/**
 * Import Path Resolver Service
 *
 * Converts file paths to import paths based on project structure.
 * Handles both single-app and monorepo structures automatically.
 */
import { Logger } from '../infrastructure/logging/logger.js';
export class ImportPathResolver {
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
    static resolveImportPath(filePath, context) {
        // Skip if not a string
        if (typeof filePath !== 'string') {
            return filePath;
        }
        // Skip if already an import path (starts with @ or is a package name)
        if (filePath.startsWith('@')) {
            return filePath;
        }
        // Skip if it's a relative import (../ or ./)
        if (filePath.startsWith('../') || filePath === '.') {
            return filePath;
        }
        const isMonorepo = context.project?.structure === 'monorepo';
        // Monorepo: Convert to workspace protocol
        if (isMonorepo && filePath.startsWith('./packages/')) {
            return this.convertToWorkspacePath(filePath);
        }
        // Monorepo: Convert apps/ paths
        if (isMonorepo && filePath.startsWith('./apps/')) {
            return this.convertToWorkspacePath(filePath.replace('./apps/', './packages/'));
        }
        // Single app or monorepo app-internal: Convert to @/ alias
        if (filePath.startsWith('./src/')) {
            return this.convertToAliasPath(filePath);
        }
        // Fallback: return as-is with warning
        Logger.warn(`Import path not converted: ${filePath}. Add conversion rule if needed.`);
        return filePath;
    }
    /**
     * Convert packages/ path to workspace protocol
     * @private
     */
    static convertToWorkspacePath(filePath) {
        // Remove './packages/' prefix
        const packagePath = filePath.slice('./packages/'.length);
        // Split into package name and rest
        const [packageName, ...rest] = packagePath.split('/');
        // Handle src/ directory removal for cleaner imports
        let cleanPath = rest.join('/');
        if (cleanPath.startsWith('src/')) {
            cleanPath = cleanPath.slice('src/'.length);
        }
        // Remove file extensions for imports
        cleanPath = this.removeFileExtension(cleanPath);
        // Return workspace protocol path
        return cleanPath ? `@repo/${packageName}/${cleanPath}` : `@repo/${packageName}`;
    }
    /**
     * Convert src/ path to @/ alias
     * @private
     */
    static convertToAliasPath(filePath) {
        // Remove './src/' prefix
        let cleanPath = filePath.slice('./src/'.length);
        // Remove file extensions for imports
        cleanPath = this.removeFileExtension(cleanPath);
        return '@/' + cleanPath;
    }
    /**
     * Remove file extensions from import paths
     * @private
     */
    static removeFileExtension(path) {
        // Remove common file extensions
        return path
            .replace(/\.tsx?$/, '')
            .replace(/\.jsx?$/, '')
            .replace(/\.mjs$/, '')
            .replace(/\.cjs$/, '');
    }
    /**
     * Pre-compute import paths from file paths (optional optimization)
     *
     * @param filePaths - Record of path keys to file paths
     * @param context - Project context
     * @returns Record of path keys to import paths
     */
    static computeImportPaths(filePaths, context) {
        const importPaths = {};
        for (const [key, filePath] of Object.entries(filePaths)) {
            importPaths[key] = this.resolveImportPath(filePath, context);
        }
        return importPaths;
    }
}
//# sourceMappingURL=import-path-resolver.js.map
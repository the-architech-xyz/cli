/**
 * Dumb Path Translator
 *
 * The CLI knows nothing about module types. It just performs simple string transformations
 * to convert semantic IDs to file system paths. This is the only "intelligence" in the CLI.
 */
import * as path from 'path';
import * as fs from 'fs';
export class DumbPathTranslator {
    static marketplaceRoot = null;
    /**
     * The ONLY intelligence in the CLI: dumb string transformation
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
    static async translateModuleId(moduleId) {
        const marketplaceRoot = await this.getMarketplaceRoot();
        // Check if it's already a full path (starts with known prefixes)
        if (moduleId.startsWith('adapters/') ||
            moduleId.startsWith('connectors/') ||
            moduleId.startsWith('features/')) {
            return moduleId; // Already a full path
        }
        // Apply the dumb transformation rule
        if (moduleId.includes(':')) {
            const [prefix, suffix] = moduleId.split(':', 2);
            const translatedPath = `${prefix}s/${suffix}`;
            // Verify the path exists
            const fullPath = path.join(marketplaceRoot, translatedPath);
            try {
                await fs.promises.access(fullPath);
                return translatedPath;
            }
            catch {
                throw new Error(`Module not found: ${moduleId}. Translated to: ${translatedPath}. Checked path: ${fullPath}`);
            }
        }
        // Handle adapter category/name format (e.g., framework/nextjs -> adapters/framework/nextjs)
        if (moduleId.includes('/') && !moduleId.startsWith('adapters/') && !moduleId.startsWith('connectors/') && !moduleId.startsWith('features/')) {
            const translatedPath = `adapters/${moduleId}`;
            // Verify the path exists
            const fullPath = path.join(marketplaceRoot, translatedPath);
            try {
                await fs.promises.access(fullPath);
                return translatedPath;
            }
            catch {
                // Fall through to legacy detection
            }
        }
        // If no ':' found, it's likely a legacy format - try to auto-detect
        // This is a fallback for backward compatibility
        const possiblePaths = [
            `adapters/${moduleId}`,
            `connectors/${moduleId}`,
            `features/${moduleId}`
        ];
        for (const possiblePath of possiblePaths) {
            const fullPath = path.join(marketplaceRoot, possiblePath);
            try {
                await fs.promises.access(fullPath);
                return possiblePath;
            }
            catch {
                // Continue trying
            }
        }
        throw new Error(`Module not found: ${moduleId}. No valid path found.`);
    }
    /**
     * Get the full file system path for a module
     */
    static async getModulePath(moduleId) {
        const marketplaceRoot = await this.getMarketplaceRoot();
        const translatedPath = await this.translateModuleId(moduleId);
        return path.join(marketplaceRoot, translatedPath);
    }
    /**
     * Check if a module exists
     */
    static async moduleExists(moduleId) {
        try {
            await this.translateModuleId(moduleId);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get marketplace root directory
     */
    static async getMarketplaceRoot() {
        if (this.marketplaceRoot) {
            return this.marketplaceRoot;
        }
        // Find marketplace root by looking for package.json with @thearchitech.xyz/marketplace
        let currentDir = process.cwd();
        const maxDepth = 10;
        let depth = 0;
        while (depth < maxDepth) {
            const packageJsonPath = path.join(currentDir, 'package.json');
            try {
                const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
                if (packageJson.name === '@thearchitech.xyz/marketplace') {
                    this.marketplaceRoot = currentDir;
                    return this.marketplaceRoot;
                }
            }
            catch {
                // Continue searching
            }
            // Also check for marketplace directory
            const marketplaceDir = path.join(currentDir, 'marketplace');
            const marketplacePackageJson = path.join(marketplaceDir, 'package.json');
            try {
                const packageJson = JSON.parse(await fs.promises.readFile(marketplacePackageJson, 'utf-8'));
                if (packageJson.name === '@thearchitech.xyz/marketplace') {
                    this.marketplaceRoot = marketplaceDir;
                    return this.marketplaceRoot;
                }
            }
            catch {
                // Continue searching
            }
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir)
                break; // Reached root
            currentDir = parentDir;
            depth++;
        }
        throw new Error('Marketplace root not found. Please run from within the architech workspace.');
    }
}
//# sourceMappingURL=dumb-path-translator.js.map
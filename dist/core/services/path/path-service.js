/**
 * Path Service
 *
 * Centralized path management for The Architech.
 * Handles both basic path operations and decentralized path resolution.
 */
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
export class PathService {
    projectRoot;
    projectName;
    pathMap = {};
    frameworkProjectRoot;
    // Static CLI root management
    static cliRoot = null;
    constructor(projectRoot, projectName, frameworkAdapter) {
        this.projectRoot = path.resolve(projectRoot);
        this.projectName = projectName || projectRoot.split('/').pop() || 'project';
        this.frameworkProjectRoot = projectRoot;
        if (frameworkAdapter?.paths) {
            this.pathMap = frameworkAdapter.paths;
        }
    }
    /**
     * Replace entire framework path map
     */
    setFrameworkPaths(paths) {
        this.pathMap = paths || {};
    }
    /**
     * Merge additional framework paths (later keys overwrite)
     */
    mergeFrameworkPaths(paths) {
        this.pathMap = { ...this.pathMap, ...(paths || {}) };
    }
    /**
     * Set a single path in the path map
     */
    setPath(key, value) {
        this.pathMap[key] = value;
    }
    /**
     * Get project root path
     */
    getProjectRoot() {
        return this.projectRoot;
    }
    /**
     * Get project name
     */
    getProjectName() {
        return this.projectName;
    }
    /**
     * Get a specific path from the framework's path map (decentralized)
     */
    getPath(key) {
        const pathValue = this.pathMap[key];
        if (!pathValue) {
            throw new Error(`Path '${key}' not defined in framework adapter paths`);
        }
        return pathValue;
    }
    /**
     * Check if a path key exists in the framework's path map
     */
    hasPath(key) {
        return key in this.pathMap;
    }
    /**
     * Resolve a path relative to project root
     */
    resolvePath(relativePath) {
        return path.resolve(this.projectRoot, relativePath);
    }
    /**
     * Join paths
     */
    join(...paths) {
        return path.join(...paths);
    }
    /**
     * Get relative path from project root
     */
    getRelativePath(targetPath) {
        return path.relative(this.projectRoot, targetPath);
    }
    /**
     * Check if path exists
     */
    exists(targetPath) {
        const fullPath = path.isAbsolute(targetPath) ? targetPath : this.resolvePath(targetPath);
        try {
            require('fs').accessSync(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Create directory path
     */
    createDirPath(dirPath) {
        const fullPath = this.resolvePath(dirPath);
        fs.mkdirSync(fullPath, { recursive: true });
        return fullPath;
    }
    /**
     * Ensure directory exists
     */
    async ensureDir(dirPath) {
        const fullPath = this.resolvePath(dirPath);
        await fs.promises.mkdir(fullPath, { recursive: true });
    }
    /**
     * Get source path
     */
    getSrcPath() {
        return this.getPath('src') || 'src';
    }
    /**
     * Get lib path
     */
    getLibPath() {
        return this.getPath('lib') || 'src/lib';
    }
    /**
     * Get components path
     */
    getComponentsPath() {
        return this.getPath('components') || 'src/components';
    }
    /**
     * Get UI components path
     */
    getUIComponentsPath() {
        return this.getPath('ui_components') || 'src/components/ui';
    }
    /**
     * Get utils path
     */
    getUtilsPath() {
        return this.getPath('utils') || 'src/utils';
    }
    /**
     * Get test path
     */
    getTestPath() {
        return this.getPath('test') || 'src/__tests__';
    }
    /**
     * Get database path
     */
    getDatabasePath() {
        return this.getPath('database') || 'src/lib/db';
    }
    /**
     * Get auth path
     */
    getAuthPath() {
        return this.getPath('auth') || 'src/lib/auth';
    }
    /**
     * Get package.json path
     */
    getPackageJsonPath() {
        return this.resolvePath('package.json');
    }
    /**
     * Get tsconfig.json path
     */
    getTsConfigPath() {
        return this.resolvePath('tsconfig.json');
    }
    /**
     * Get .env.example path
     */
    getEnvExamplePath() {
        return this.resolvePath('.env.example');
    }
    /**
     * Get all available path keys
     */
    getAvailablePaths() {
        return Object.keys(this.pathMap);
    }
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
    getMarketplaceUI() {
        const uiFramework = this.pathMap['ui.framework'] || '';
        const uiPath = this.pathMap['ui.path'] || '';
        const marketplaceUI = { default: '' };
        if (uiFramework && uiPath) {
            marketplaceUI.default = uiFramework;
            marketplaceUI[uiFramework] = uiPath;
        }
        return marketplaceUI;
    }
    /**
     * Resolve template variables in a string (for ${paths.key} patterns)
     * CHANGED: Now uses ${} syntax to avoid conflicts with template {{}} syntax
     * ENHANCED: Supports complex expressions like ${paths.key1 || paths.key2}
     */
    resolveTemplate(template) {
        // Replace ${paths.key} patterns with actual resolved paths
        // NOTE: Also support legacy {{paths.key}} for backward compatibility during migration
        // New syntax: ${paths.key} or ${paths.key1 || paths.key2 || 'fallback'}
        let processed = template.replace(/\$\{paths\.([^}]+)\}/g, (match, expression) => {
            try {
                const resolved = this.resolvePathExpression(expression);
                return resolved;
            }
            catch (error) {
                console.warn(`⚠️  Path expression '${expression}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return this.getFallbackPath(expression, match);
            }
        });
        // Legacy syntax: {{paths.key}} (for backward compatibility)
        processed = processed.replace(/\{\{paths\.([^}]+)\}\}/g, (match, key) => {
            console.warn(`⚠️  Legacy path syntax {{paths.${key}}} detected. Please update to \${paths.${key}}`);
            try {
                const resolved = this.resolvePathExpression(key);
                return resolved;
            }
            catch (error) {
                return this.getFallbackPath(key, match);
            }
        });
        return processed;
    }
    /**
     * Resolve a path expression that may contain operators like ||, ?, etc.
     * Supports:
     * - Simple keys: "api" → getPath("api")
     * - Fallback chains: "shared_library || paths.api" → try shared_library, fallback to api
     * - Literal strings: "shared_library || './src/lib/'" → try shared_library, fallback to './src/lib/'
     *
     * CRITICAL: Ensures trailing slashes for directory paths to prevent concatenation issues
     */
    resolvePathExpression(expression) {
        // Handle || operator: paths.shared_library || paths.api || './fallback'
        if (expression.includes('||')) {
            const parts = expression.split('||').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length === 0) {
                throw new Error('Empty path expression after splitting on ||');
            }
            for (const part of parts) {
                let resolved = null;
                // Check if it's a path reference (starts with "paths." or is a simple key)
                if (part.startsWith('paths.')) {
                    const key = part.replace('paths.', '').trim();
                    try {
                        resolved = this.getPath(key);
                    }
                    catch {
                        continue; // Try next part
                    }
                }
                else if (part.startsWith('"') || part.startsWith("'")) {
                    // It's a literal string, remove quotes and return
                    resolved = part.replace(/^["']|["']$/g, '');
                }
                else {
                    // Try as a simple key (without "paths." prefix)
                    try {
                        resolved = this.getPath(part);
                    }
                    catch {
                        continue; // Try next part
                    }
                }
                // Ensure trailing slash for directory paths (unless it's a file path)
                if (resolved && !resolved.endsWith('/') && !resolved.match(/\.\w+$/)) {
                    resolved = resolved + '/';
                }
                if (resolved) {
                    return resolved;
                }
            }
            // If all parts failed, return the last part as fallback (even if it's not a valid path)
            const lastPart = parts[parts.length - 1];
            if (!lastPart) {
                throw new Error('No fallback path found in expression');
            }
            if (lastPart.startsWith('"') || lastPart.startsWith("'")) {
                const resolved = lastPart.replace(/^["']|["']$/g, '');
                // Ensure trailing slash for directory paths
                if (resolved && !resolved.endsWith('/') && !resolved.match(/\.\w+$/)) {
                    return resolved + '/';
                }
                return resolved;
            }
            // Return the last part as-is (might be a fallback path)
            // Ensure trailing slash if it looks like a directory path
            if (lastPart && !lastPart.endsWith('/') && !lastPart.match(/\.\w+$/)) {
                return lastPart + '/';
            }
            return lastPart;
        }
        // Handle ternary operator: condition ? paths.a : paths.b
        if (expression.includes('?')) {
            // For now, we'll parse simple ternary expressions
            // More complex expressions can be added later if needed
            const parts = expression.split('?').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length === 2) {
                const condition = parts[0];
                const result = parts[1];
                if (!condition || !result) {
                    throw new Error('Invalid ternary expression: missing condition or result');
                }
                const resultParts = result.split(':').map(p => p.trim()).filter(p => p.length > 0);
                if (resultParts.length === 2) {
                    const truePath = resultParts[0];
                    const falsePath = resultParts[1];
                    if (!truePath || !falsePath) {
                        throw new Error('Invalid ternary expression: missing true or false path');
                    }
                    // Simple condition check (for now, just check if key exists)
                    // TODO: Support more complex conditions
                    if (condition.includes('paths.')) {
                        const key = condition.replace('paths.', '').trim();
                        try {
                            this.getPath(key);
                            // Condition is true, use truePath
                            const resolved = this.resolvePathExpression(truePath);
                            // Ensure trailing slash for directory paths
                            if (resolved && !resolved.endsWith('/') && !resolved.match(/\.\w+$/)) {
                                return resolved + '/';
                            }
                            return resolved;
                        }
                        catch {
                            // Condition is false, use falsePath
                            const resolved = this.resolvePathExpression(falsePath);
                            // Ensure trailing slash for directory paths
                            if (resolved && !resolved.endsWith('/') && !resolved.match(/\.\w+$/)) {
                                return resolved + '/';
                            }
                            return resolved;
                        }
                    }
                }
            }
        }
        // Simple path key (no operators)
        const resolved = this.getPath(expression);
        // Ensure trailing slash for directory paths (unless it's a file path)
        if (resolved && !resolved.endsWith('/') && !resolved.match(/\.\w+$/)) {
            return resolved + '/';
        }
        return resolved;
    }
    /**
     * Get fallback path for common keys
     */
    getFallbackPath(key, originalMatch) {
        const commonDefaults = {
            'app_root': 'src/app/',
            'components': 'src/components/',
            'shared_library': 'src/lib/',
            'styles': 'src/styles/',
            'readme': 'README.md',
            'source_root': 'src/'
        };
        if (commonDefaults[key]) {
            console.warn(`  ✅ Using fallback default: ${commonDefaults[key]}`);
            return commonDefaults[key];
        }
        console.warn(`  ❌ No fallback available for '${key}', keeping template variable`);
        return originalMatch;
    }
    /**
     * Validate that all ${paths.key} variables in a template exist in the framework paths
     * Also supports legacy {{paths.key}} syntax
     * @param template The template string to validate
     * @param strict If true, throws an error for missing paths. If false, returns validation result
     * @returns Validation result with missing paths
     */
    validatePathVariables(template, strict = false) {
        // Check both new ${paths.key} and legacy {{paths.key}} syntax
        const newSyntaxRegex = /\$\{paths\.([^}]+)\}/g;
        const legacySyntaxRegex = /\{\{paths\.([^}]+)\}\}/g;
        const missingPaths = [];
        // Check new syntax
        let match;
        while ((match = newSyntaxRegex.exec(template)) !== null) {
            const pathKey = match[1];
            if (pathKey) {
                try {
                    this.getPath(pathKey);
                }
                catch (error) {
                    missingPaths.push(pathKey);
                }
            }
        }
        // Check legacy syntax
        while ((match = legacySyntaxRegex.exec(template)) !== null) {
            const pathKey = match[1];
            if (pathKey) {
                try {
                    this.getPath(pathKey);
                }
                catch (error) {
                    missingPaths.push(pathKey);
                }
            }
        }
        const valid = missingPaths.length === 0;
        if (!valid && strict) {
            throw new Error(`Path validation failed. Missing path keys: ${missingPaths.join(', ')}. ` +
                `Available paths: ${this.getAvailablePaths().join(', ')}`);
        }
        return { valid, missingPaths };
    }
    /**
     * Get all path variables used in a template
     * Supports both ${paths.key} and legacy {{paths.key}} syntax
     * @param template The template string to analyze
     * @returns Array of path keys found in the template
     */
    getPathVariablesInTemplate(template) {
        const pathKeys = [];
        // Find new syntax: ${paths.key}
        const newSyntaxRegex = /\$\{paths\.([^}]+)\}/g;
        let match;
        while ((match = newSyntaxRegex.exec(template)) !== null) {
            const pathKey = match[1];
            if (pathKey && !pathKeys.includes(pathKey)) {
                pathKeys.push(pathKey);
            }
        }
        // Find legacy syntax: {{paths.key}}
        const legacySyntaxRegex = /\{\{paths\.([^}]+)\}\}/g;
        while ((match = legacySyntaxRegex.exec(template)) !== null) {
            const pathKey = match[1];
            if (pathKey && !pathKeys.includes(pathKey)) {
                pathKeys.push(pathKey);
            }
        }
        return pathKeys;
    }
    // ============================================================================
    // STATIC CLI ROOT AND MARKETPLACE MANAGEMENT
    // ============================================================================
    /**
     * Initialize CLI root path (call this once at CLI startup)
     */
    static initializeCliRoot() {
        if (!this.cliRoot) {
            this.cliRoot = this.calculateCliRoot();
        }
    }
    /**
     * Get the CLI root directory
     */
    static getCliRoot() {
        if (!this.cliRoot) {
            this.initializeCliRoot();
        }
        return this.cliRoot;
    }
    /**
     * @deprecated Use MarketplaceRegistry.getCoreMarketplacePath() instead
     * This method has been removed to consolidate marketplace path resolution.
     */
    // Removed: Use MarketplaceRegistry.getCoreMarketplacePath() instead
    /**
     * Resolve module ID to full module path using dumb translation
     *
     * The CLI knows nothing about module types. It just performs simple string transformations.
     * This is the only "intelligence" in the CLI.
     */
    static async resolveModuleId(moduleId) {
        // Import the dumb translator
        const { DumbPathTranslator } = await import('./dumb-path-translator.js');
        return DumbPathTranslator.translateModuleId(moduleId);
    }
    /**
     * Calculate CLI root directory by finding the package.json with @thearchitech.xyz/cli
     */
    static calculateCliRoot() {
        const cliFile = fileURLToPath(import.meta.url);
        let current = path.dirname(cliFile);
        // Go up from the current file until we find the CLI package.json
        while (current !== path.dirname(current)) {
            const packageJsonPath = path.join(current, 'package.json');
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                if (packageJson.name === '@thearchitech.xyz/cli') {
                    return current;
                }
            }
            catch {
                // Continue searching
            }
            current = path.dirname(current);
        }
        throw new Error('CLI root not found. Unable to locate @thearchitech.xyz/cli package.json');
    }
}
//# sourceMappingURL=path-service.js.map
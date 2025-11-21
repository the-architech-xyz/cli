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
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
export class PathService {
    projectRoot;
    projectName;
    pathMap = {};
    userOverrides = {}; // User-defined path overrides from genome.project.paths
    frameworkProjectRoot;
    // NEW: Pre-computed path mappings (from PathMappingGenerator)
    // Maps path keys to arrays of concrete paths
    static mappings = {};
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
     * Set user-defined path overrides from genome.project.paths
     * These overrides take precedence over marketplace adapter paths
     */
    setUserOverrides(overrides) {
        this.userOverrides = { ...overrides };
    }
    /**
     * Get user-defined path overrides
     */
    getUserOverrides() {
        return { ...this.userOverrides };
    }
    /**
     * Clear user overrides
     */
    clearUserOverrides() {
        this.userOverrides = {};
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
     * Get a specific path with contextual resolution
     *
     * Resolution order:
     * 1. User override (from genome.project.paths) - HIGHEST PRIORITY
     * 2. Pre-computed mappings (from PathMappingGenerator) - NEW
     * 3. Marketplace adapter path (from adapter.resolvePathDefaults)
     * 4. Error if not found
     *
     * This implements the "Reference Structure with Explicit Overrides" doctrine.
     *
     * NOTE: For backward compatibility, this returns the FIRST path from mappings
     * if the key has multiple paths (semantic expansion). Use PathService.getMapping() for all paths.
     */
    getPath(key) {
        // 1. Check user override first (highest priority)
        if (this.userOverrides[key]) {
            return this.userOverrides[key];
        }
        // 2. Check pre-computed mappings (NEW - supports multi-path keys)
        const mappingPaths = PathService.getMapping(key);
        if (mappingPaths.length > 0 && mappingPaths[0]) {
            // Return first path for backward compatibility
            // BlueprintExecutor will use getMapping() for full expansion
            return mappingPaths[0];
        }
        // 3. Check marketplace adapter paths (legacy fallback)
        const pathValue = this.pathMap[key];
        if (!pathValue) {
            throw new Error(`Path '${key}' not defined. ` +
                `Available paths: ${this.getAvailablePaths().slice(0, 10).join(', ')}${this.getAvailablePaths().length > 10 ? '...' : ''}`);
        }
        return pathValue;
    }
    /**
     * Resolve a path key template with dynamic variables
     *
     * Example:
     * - Template: "packages.{packageName}.src"
     * - Variables: {packageName: "auth"}
     * - Returns: path value for "packages.auth.src"
     *
     * @param template Path key template with variables (e.g., "packages.{packageName}.src")
     * @param variables Variable values to substitute (e.g., {packageName: "auth", appId: "web"})
     * @returns Resolved path value
     */
    resolvePathWithVariables(template, variables) {
        // Replace variables in template
        let resolvedKey = template;
        for (const [varName, varValue] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${varName}\\}`, 'g');
            resolvedKey = resolvedKey.replace(regex, varValue);
        }
        // Get the path value for the resolved key
        return this.getPath(resolvedKey);
    }
    /**
     * Check if a path key exists in the framework's path map or pre-computed mappings
     *
     * NEW: Also checks static mappings (from PathMappingGenerator) for semantic keys
     */
    hasPath(key) {
        // Check instance pathMap first (legacy)
        if (key in this.pathMap) {
            return true;
        }
        // Check pre-computed mappings (NEW - for semantic keys)
        return PathService.hasMapping(key);
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
        const marketplacePath = this.pathMap['ui.marketplace'] || this.pathMap['ui.path'] || '';
        const marketplaceUI = { default: uiFramework };
        if (uiFramework && marketplacePath) {
            marketplaceUI[uiFramework] = marketplacePath;
        }
        else if (marketplacePath) {
            marketplaceUI['path'] = marketplacePath;
        }
        return marketplaceUI;
    }
    resolveTemplate(template) {
        return template.replace(/\$\{paths\.([^}]+)\}/g, (_match, rawKey) => {
            const key = rawKey.trim();
            try {
                // First check if it's a semantic key with mappings
                const mappings = PathService.getMapping(key);
                if (mappings.length > 0 && mappings[0]) {
                    // Semantic key - return first path (for backward compatibility)
                    // BlueprintExecutor will handle full expansion
                    return mappings[0];
                }
                // Fall back to getPath() for non-semantic keys
                return this.getPath(key);
            }
            catch (error) {
                throw new Error(`Unknown path key '${key}' in template`);
            }
        });
    }
    /**
     * Validate that all ${paths.key} variables in a template exist in the framework paths
     * Also validates against marketplace path key definitions if marketplace is provided
     * @param template The template string to validate
     * @param strict If true, throws an error for missing paths. If false, returns validation result
     * @param marketplaceName Optional marketplace name for path key validation
     * @param projectStructure Optional project structure for path key validation
     * @returns Validation result with missing paths
     */
    async validatePathVariables(template, strict = false, marketplaceName, projectStructure) {
        // Check new ${paths.key} syntax
        const newSyntaxRegex = /\$\{paths\.([^}]+)\}/g;
        const missingPaths = [];
        const errors = [];
        let match;
        while ((match = newSyntaxRegex.exec(template)) !== null) {
            const key = match[1]?.trim();
            if (!key)
                continue;
            // Check if path exists in PathService
            if (!this.hasPath(key)) {
                missingPaths.push(key);
            }
            // If marketplace is provided, validate against marketplace path key definitions
            if (marketplaceName) {
                const isValid = await PathService.isValidPathKey(key, marketplaceName, projectStructure);
                if (!isValid) {
                    const validKeys = await PathService.getValidPathKeys(marketplaceName, projectStructure);
                    errors.push({
                        key,
                        message: `Path key '${key}' is not defined in marketplace '${marketplaceName}'. Available keys: ${validKeys.slice(0, 10).join(', ')}${validKeys.length > 10 ? '...' : ''}`
                    });
                }
            }
        }
        const valid = missingPaths.length === 0 && errors.length === 0;
        if (!valid && strict) {
            const errorMessages = [
                ...missingPaths.map(key => `Missing path key: ${key}`),
                ...errors.map(e => e.message)
            ];
            throw new Error(`Path validation failed:\n${errorMessages.join('\n')}\n` +
                `Available paths: ${this.getAvailablePaths().slice(0, 20).join(', ')}${this.getAvailablePaths().length > 20 ? '...' : ''}`);
        }
        return { valid, missingPaths, errors: errors.length > 0 ? errors : undefined };
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
            const pathKey = match[1]?.trim();
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
    static async resolveModuleId(moduleId) {
        return this.translateModuleId(moduleId);
    }
    /**
     * Translate module ID to marketplace path
     * @private
     */
    static async translateModuleId(moduleId) {
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
        // Check if it's already a full path (starts with known prefixes)
        if (moduleId.startsWith('adapters/') ||
            moduleId.startsWith('connectors/') ||
            moduleId.startsWith('features/') ||
            moduleId.startsWith('capabilities/') ||
            moduleId.startsWith('modules/')) {
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
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
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
     * Convert file path to import path based on project structure
     *
     * @param filePath - File path to convert (e.g., './src/server/trpc/router')
     * @param context - Project context with structure information
     * @returns Import path (e.g., '@/server/trpc/router' or '@repo/api/router')
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
    static removeFileExtension(pathStr) {
        // Remove common file extensions
        return pathStr
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
    // ============================================================================
    // PATH MAPPING METHODS (from PathMappingGenerator)
    // ============================================================================
    /**
     * Set pre-computed path mappings from PathMappingGenerator
     *
     * These mappings are generated once before blueprint execution
     * and stored here for fast lookup during execution.
     *
     * @param mappings - Complete path mappings: { key: string[] }
     */
    static setMappings(mappings) {
        this.mappings = mappings;
        Logger.debug('✅ Path mappings set', {
            operation: 'path_service',
            mappingCount: Object.keys(mappings).length
        });
    }
    /**
     * Get all pre-computed path mappings
     *
     * @returns Complete path mappings: { key: string[] }
     */
    static getMappings() {
        return this.mappings;
    }
    /**
     * Get paths for a specific key
     *
     * Returns array of paths for the key (supports multi-app expansion).
     * Returns empty array if key not found.
     *
     * @param key - Path key (e.g., "apps.frontend.components")
     * @returns Array of concrete paths
     */
    static getMapping(key) {
        return this.mappings[key] || [];
    }
    /**
     * Check if a path key has mappings
     *
     * @param key - Path key to check
     * @returns True if key exists in mappings
     */
    static hasMapping(key) {
        return key in this.mappings;
    }
    /**
     * Clear all path mappings
     *
     * Useful for testing or resetting state.
     */
    static clearMappings() {
        this.mappings = {};
        Logger.debug('✅ Path mappings cleared', {
            operation: 'path_service'
        });
    }
    // PATH KEY REGISTRY METHODS (from PathKeyRegistry)
    // ============================================================================
    static pathKeyCache = new Map();
    static defaultPathKeys = [];
    /**
     * Load path keys from marketplace
     * Falls back to default PathKey enum if marketplace doesn't define path-keys.json
     */
    static async loadPathKeys(marketplaceName = 'core') {
        // Check cache
        if (this.pathKeyCache.has(marketplaceName)) {
            return this.pathKeyCache.get(marketplaceName);
        }
        try {
            // Get marketplace path
            const marketplacePath = marketplaceName === 'core'
                ? await MarketplaceRegistry.getCoreMarketplacePath()
                : await MarketplaceRegistry.getUIMarketplacePath(marketplaceName);
            // Try to load path-keys.json
            const pathKeysPath = path.join(marketplacePath, 'path-keys.json');
            try {
                const content = await fs.promises.readFile(pathKeysPath, 'utf-8');
                const pathKeys = JSON.parse(content);
                // Validate structure
                this.validatePathKeys(pathKeys);
                // Cache and return
                this.pathKeyCache.set(marketplaceName, pathKeys);
                Logger.debug('✅ Loaded marketplace path keys', {
                    operation: 'path_key_registry',
                    marketplace: marketplaceName,
                    keyCount: pathKeys.pathKeys.length
                });
                return pathKeys;
            }
            catch (error) {
                // path-keys.json doesn't exist, use defaults
                Logger.debug('⚠️ Marketplace path-keys.json not found, using defaults', {
                    operation: 'path_key_registry',
                    marketplace: marketplaceName,
                    path: pathKeysPath
                });
                return this.getDefaultPathKeys(marketplaceName);
            }
        }
        catch (error) {
            Logger.warn('⚠️ Failed to load marketplace path keys, using defaults', {
                operation: 'path_key_registry',
                marketplace: marketplaceName,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return this.getDefaultPathKeys(marketplaceName);
        }
    }
    /**
     * Get default path keys (from PathKey enum)
     * Used as fallback when marketplace doesn't define path-keys.json
     */
    static getDefaultPathKeys(marketplaceName) {
        if (this.defaultPathKeys.length === 0) {
            // Generate from PathKey enum
            const { PathKey } = require('@thearchitech.xyz/types');
            this.defaultPathKeys = Object.values(PathKey).map(key => ({
                key: key,
                description: `Path key: ${key}`,
                required: false,
                structure: 'both',
                computed: true
            }));
        }
        return {
            version: '1.0.0',
            marketplace: marketplaceName,
            pathKeys: this.defaultPathKeys
        };
    }
    /**
     * Validate path key definition structure
     */
    static validatePathKeys(pathKeys) {
        if (!pathKeys.version || !pathKeys.marketplace || !Array.isArray(pathKeys.pathKeys)) {
            throw new Error('Invalid path-keys.json: missing required fields (version, marketplace, pathKeys)');
        }
        for (const def of pathKeys.pathKeys) {
            if (!def.key || typeof def.key !== 'string') {
                throw new Error(`Invalid path key definition: ${JSON.stringify(def)}`);
            }
            if (def.structure && !['monorepo', 'single-app', 'both'].includes(def.structure)) {
                throw new Error(`Invalid structure value for path key ${def.key}: ${def.structure}`);
            }
        }
    }
    /**
     * Check if a path key is valid for the marketplace
     */
    static async isValidPathKey(key, marketplaceName = 'core', projectStructure) {
        // PRIORITY 1: Check if path key exists in pre-computed mappings (runtime values)
        // This includes path keys created from recipe books (e.g., packages.auth.src)
        // Mappings are the SINGLE SOURCE OF TRUTH for runtime path resolution
        try {
            const mappings = this.getMapping(key);
            if (mappings.length > 0) {
                // Path key exists in mappings - it's valid
                return true;
            }
        }
        catch {
            // Mapping doesn't exist, continue to check path-keys.json
        }
        // PRIORITY 2: Check path-keys.json (static definitions)
        // This validates against marketplace definitions
        const pathKeys = await this.loadPathKeys(marketplaceName);
        // Exact match
        const exactMatch = pathKeys.pathKeys.find(def => def.key === key);
        if (exactMatch) {
            if (projectStructure) {
                const structure = exactMatch.structure ?? 'both';
                return structure === 'both' || structure === projectStructure;
            }
            return true;
        }
        // Wildcard match (e.g., "apps.web.*" matches "apps.web.src")
        const wildcardMatch = pathKeys.pathKeys.find(def => {
            if (def.key.includes('*')) {
                const pattern = def.key.replace(/\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(key);
            }
            return false;
        });
        if (wildcardMatch) {
            if (projectStructure) {
                const structure = wildcardMatch.structure ?? 'both';
                return structure === 'both' || structure === projectStructure;
            }
            return true;
        }
        // No implicit prefix fallback: undefined keys must be explicitly declared
        return false;
    }
    /**
     * Get all valid path keys for a marketplace and structure
     */
    static async getValidPathKeys(marketplaceName = 'core', projectStructure) {
        const pathKeys = await this.loadPathKeys(marketplaceName);
        return pathKeys.pathKeys
            .filter(def => {
            if (!projectStructure)
                return true;
            const structure = def.structure ?? 'both';
            return structure === 'both' || structure === projectStructure;
        })
            .map(def => def.key);
    }
    /**
     * Validate path key usage in a template string
     * Returns validation result with errors and suggestions
     */
    static async validatePathKeyUsage(template, marketplaceName = 'core', projectStructure) {
        const pathKeyRegex = /\$\{paths\.([^}]+)\}/g;
        const errors = [];
        const usedKeys = new Set();
        let match;
        while ((match = pathKeyRegex.exec(template)) !== null) {
            const key = match[1]?.trim();
            if (key && !usedKeys.has(key)) {
                usedKeys.add(key);
                const isValid = await this.isValidPathKey(key, marketplaceName, projectStructure);
                if (!isValid) {
                    const validKeys = await this.getValidPathKeys(marketplaceName, projectStructure);
                    const suggestions = this.getSuggestions(key, validKeys);
                    errors.push({
                        key,
                        message: `Path key '${key}' is not defined in marketplace '${marketplaceName}'. ${suggestions.length > 0 ? `Did you mean: ${suggestions.slice(0, 3).join(', ')}?` : `Available keys: ${validKeys.slice(0, 10).join(', ')}${validKeys.length > 10 ? '...' : ''}`}`
                    });
                }
            }
        }
        const firstError = errors[0];
        return {
            valid: errors.length === 0,
            errors,
            suggestions: firstError
                ? this.getSuggestions(firstError.key, await this.getValidPathKeys(marketplaceName, projectStructure))
                : []
        };
    }
    /**
     * Get suggestions for a misspelled path key
     */
    static getSuggestions(key, validKeys) {
        // Simple Levenshtein-like matching
        const suggestions = [];
        for (const validKey of validKeys) {
            const score = this.similarity(key, validKey);
            if (score > 0.5) {
                suggestions.push({ key: validKey, score });
            }
        }
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => s.key);
    }
    /**
     * Calculate string similarity (simple implementation)
     */
    static similarity(a, b) {
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(a, b);
        return (longer.length - distance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance
     */
    static levenshteinDistance(a, b) {
        const rows = b.length + 1;
        const cols = a.length + 1;
        const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let i = 0; i < rows; i++) {
            matrix[i][0] = i;
        }
        for (let j = 0; j < cols; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i < rows; i++) {
            const currentRow = matrix[i];
            const prevRow = matrix[i - 1];
            for (let j = 1; j < cols; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    currentRow[j] = prevRow[j - 1];
                }
                else {
                    const diagonal = prevRow[j - 1];
                    const left = currentRow[j - 1];
                    const up = prevRow[j];
                    currentRow[j] = Math.min(diagonal + 1, left + 1, up + 1);
                }
            }
        }
        return matrix[rows - 1][cols - 1];
    }
    /**
     * Clear path key cache (useful for testing or reloading)
     */
    static clearPathKeyCache() {
        this.pathKeyCache.clear();
        this.defaultPathKeys = [];
    }
    // ============================================================================
    // STATIC CLI ROOT AND MARKETPLACE MANAGEMENT
    // ============================================================================
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
// Export for backward compatibility (deprecated - use PathService methods directly)
/**
 * @deprecated Use PathService.resolveImportPath() instead
 */
export const ImportPathResolver = {
    resolveImportPath: PathService.resolveImportPath,
    computeImportPaths: PathService.computeImportPaths
};
/**
 * @deprecated Use PathService methods directly instead
 */
export const PathKeyRegistry = {
    loadPathKeys: PathService.loadPathKeys,
    isValidPathKey: PathService.isValidPathKey,
    getValidPathKeys: PathService.getValidPathKeys,
    validatePathKeyUsage: PathService.validatePathKeyUsage,
    clearCache: PathService.clearPathKeyCache
};
//# sourceMappingURL=path-service.js.map
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
import { AdapterConfig, MarketplacePathKeys, PathKeyDefinition } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';

export class PathService {
  private projectRoot: string;
  private projectName: string;
  private pathMap: Record<string, string> = {};
  private userOverrides: Record<string, string> = {}; // User-defined path overrides from genome.project.paths
  private frameworkProjectRoot: string;

  // Static CLI root management
  private static cliRoot: string | null = null;

  constructor(projectRoot: string, projectName?: string, frameworkAdapter?: AdapterConfig) {
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
  setFrameworkPaths(paths: Record<string, string>): void {
    this.pathMap = paths || {};
  }

  /**
   * Merge additional framework paths (later keys overwrite)
   */
  mergeFrameworkPaths(paths: Record<string, string>): void {
    this.pathMap = { ...this.pathMap, ...(paths || {}) };
  }

  /**
   * Set a single path in the path map
   */
  setPath(key: string, value: string): void {
    this.pathMap[key] = value;
  }

  /**
   * Set user-defined path overrides from genome.project.paths
   * These overrides take precedence over marketplace adapter paths
   */
  setUserOverrides(overrides: Record<string, string>): void {
    this.userOverrides = { ...overrides };
  }

  /**
   * Get user-defined path overrides
   */
  getUserOverrides(): Record<string, string> {
    return { ...this.userOverrides };
  }

  /**
   * Clear user overrides
   */
  clearUserOverrides(): void {
    this.userOverrides = {};
  }

  /**
   * Get project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Get project name
   */
  getProjectName(): string {
    return this.projectName;
  }

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
  getPath(key: string): string {
    // 1. Check user override first (highest priority)
    if (this.userOverrides[key]) {
      return this.userOverrides[key];
    }
    
    // 2. Check marketplace adapter paths
    const pathValue = this.pathMap[key];
    if (!pathValue) {
      throw new Error(
        `Path '${key}' not defined. ` +
        `Available paths: ${this.getAvailablePaths().slice(0, 10).join(', ')}${this.getAvailablePaths().length > 10 ? '...' : ''}`
      );
    }
    return pathValue;
  }

  /**
   * Check if a path key exists in the framework's path map
   */
  hasPath(key: string): boolean {
    return key in this.pathMap;
  }

  /**
   * Resolve a path relative to project root
   */
  resolvePath(relativePath: string): string {
    return path.resolve(this.projectRoot, relativePath);
  }

  /**
   * Join paths
   */
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Get relative path from project root
   */
  getRelativePath(targetPath: string): string {
    return path.relative(this.projectRoot, targetPath);
  }

  /**
   * Check if path exists
   */
  exists(targetPath: string): boolean {
    const fullPath = path.isAbsolute(targetPath) ? targetPath : this.resolvePath(targetPath);
    try {
      require('fs').accessSync(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory path
   */
  createDirPath(dirPath: string): string {
    const fullPath = this.resolvePath(dirPath);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  /**
   * Ensure directory exists
   */
  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.promises.mkdir(fullPath, { recursive: true });
  }

  /**
   * Get package.json path
   */
  getPackageJsonPath(): string {
    return this.resolvePath('package.json');
  }

  /**
   * Get tsconfig.json path
   */
  getTsConfigPath(): string {
    return this.resolvePath('tsconfig.json');
  }

  /**
   * Get .env.example path
   */
  getEnvExamplePath(): string {
    return this.resolvePath('.env.example');
  }

  /**
   * Get all available path keys
   */
  getAvailablePaths(): string[] {
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
  getMarketplaceUI(): { [framework: string]: string; default: string } {
    const uiFramework = this.pathMap['ui.framework'] || '';
    const marketplacePath = this.pathMap['ui.marketplace'] || this.pathMap['ui.path'] || '';

    const marketplaceUI: { [framework: string]: string; default: string } = { default: uiFramework };

    if (uiFramework && marketplacePath) {
      marketplaceUI[uiFramework] = marketplacePath;
    } else if (marketplacePath) {
      marketplaceUI['path'] = marketplacePath;
    }

    return marketplaceUI;
  }

  resolveTemplate(template: string): string {
    return template.replace(/\$\{paths\.([^}]+)\}/g, (_match, rawKey) => {
      const key = rawKey.trim();
      try {
        return this.getPath(key);
      } catch (error) {
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
  async validatePathVariables(
    template: string,
    strict: boolean = false,
    marketplaceName?: string,
    projectStructure?: 'monorepo' | 'single-app'
  ): Promise<{ valid: boolean; missingPaths: string[]; errors?: Array<{ key: string; message: string }> }> {
    // Check new ${paths.key} syntax
    const newSyntaxRegex = /\$\{paths\.([^}]+)\}/g;
    const missingPaths: string[] = [];
    const errors: Array<{ key: string; message: string }> = [];
    let match;
    
    while ((match = newSyntaxRegex.exec(template)) !== null) {
      const key = match[1]?.trim();
      if (!key) continue;

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
      throw new Error(
        `Path validation failed:\n${errorMessages.join('\n')}\n` +
        `Available paths: ${this.getAvailablePaths().slice(0, 20).join(', ')}${this.getAvailablePaths().length > 20 ? '...' : ''}`
      );
    }

    return { valid, missingPaths, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Get all path variables used in a template
   * Supports both ${paths.key} and legacy {{paths.key}} syntax
   * @param template The template string to analyze
   * @returns Array of path keys found in the template
   */
  getPathVariablesInTemplate(template: string): string[] {
    const pathKeys: string[] = [];
    
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
  static initializeCliRoot(): void {
    if (!this.cliRoot) {
      this.cliRoot = this.calculateCliRoot();
    }
  }

  /**
   * Get the CLI root directory
   */
  static getCliRoot(): string {
    if (!this.cliRoot) {
      this.initializeCliRoot();
    }
    return this.cliRoot!;
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
  static async resolveModuleId(moduleId: string): Promise<string> {
    return this.translateModuleId(moduleId);
  }

  /**
   * Translate module ID to marketplace path
   * @private
   */
  private static async translateModuleId(moduleId: string): Promise<string> {
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
      } catch {
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
      } catch {
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
      } catch {
        // Continue trying
      }
    }

    throw new Error(`Module not found: ${moduleId}. No valid path found.`);
  }

  /**
   * Get the full file system path for a module
   */
  static async getModulePath(moduleId: string): Promise<string> {
    const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
    const translatedPath = await this.translateModuleId(moduleId);
    return path.join(marketplaceRoot, translatedPath);
  }

  /**
   * Check if a module exists
   */
  static async moduleExists(moduleId: string): Promise<boolean> {
    try {
      await this.translateModuleId(moduleId);
      return true;
    } catch {
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
  static resolveImportPath(filePath: string, context: ProjectContext): string {
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
    
    const isMonorepo = (context.project as any)?.structure === 'monorepo';
    
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
  private static convertToWorkspacePath(filePath: string): string {
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
  private static convertToAliasPath(filePath: string): string {
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
  private static removeFileExtension(pathStr: string): string {
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
  static computeImportPaths(
    filePaths: Record<string, string>, 
    context: ProjectContext
  ): Record<string, string> {
    const importPaths: Record<string, string> = {};
    
    for (const [key, filePath] of Object.entries(filePaths)) {
      importPaths[key] = this.resolveImportPath(filePath, context);
    }
    
    return importPaths;
  }

  // ============================================================================
  // PATH KEY REGISTRY METHODS (from PathKeyRegistry)
  // ============================================================================

  private static pathKeyCache: Map<string, MarketplacePathKeys> = new Map();
  private static defaultPathKeys: PathKeyDefinition[] = [];

  /**
   * Load path keys from marketplace
   * Falls back to default PathKey enum if marketplace doesn't define path-keys.json
   */
  static async loadPathKeys(marketplaceName: string = 'core'): Promise<MarketplacePathKeys> {
    // Check cache
    if (this.pathKeyCache.has(marketplaceName)) {
      return this.pathKeyCache.get(marketplaceName)!;
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
        const pathKeys: MarketplacePathKeys = JSON.parse(content);
        
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
      } catch (error) {
        // path-keys.json doesn't exist, use defaults
        Logger.debug('⚠️ Marketplace path-keys.json not found, using defaults', {
          operation: 'path_key_registry',
          marketplace: marketplaceName,
          path: pathKeysPath
        });
        
        return this.getDefaultPathKeys(marketplaceName);
      }
    } catch (error) {
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
  private static getDefaultPathKeys(marketplaceName: string): MarketplacePathKeys {
    if (this.defaultPathKeys.length === 0) {
      // Generate from PathKey enum
      const { PathKey } = require('@thearchitech.xyz/types');
      this.defaultPathKeys = Object.values(PathKey).map(key => ({
        key: key as string,
        description: `Path key: ${key}`,
        required: false,
        structure: 'both' as const,
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
  private static validatePathKeys(pathKeys: MarketplacePathKeys): void {
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
  static async isValidPathKey(
    key: string,
    marketplaceName: string = 'core',
    projectStructure?: 'monorepo' | 'single-app'
  ): Promise<boolean> {
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
  static async getValidPathKeys(
    marketplaceName: string = 'core',
    projectStructure?: 'monorepo' | 'single-app'
  ): Promise<string[]> {
    const pathKeys = await this.loadPathKeys(marketplaceName);
    
    return pathKeys.pathKeys
      .filter(def => {
        if (!projectStructure) return true;
        const structure = def.structure ?? 'both';
        return structure === 'both' || structure === projectStructure;
      })
      .map(def => def.key);
  }

  /**
   * Validate path key usage in a template string
   * Returns validation result with errors and suggestions
   */
  static async validatePathKeyUsage(
    template: string,
    marketplaceName: string = 'core',
    projectStructure?: 'monorepo' | 'single-app'
  ): Promise<{
    valid: boolean;
    errors: Array<{ key: string; message: string }>;
    suggestions: string[];
  }> {
    const pathKeyRegex = /\$\{paths\.([^}]+)\}/g;
    const errors: Array<{ key: string; message: string }> = [];
    const usedKeys = new Set<string>();
    
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
  private static getSuggestions(key: string, validKeys: string[]): string[] {
    // Simple Levenshtein-like matching
    const suggestions: Array<{ key: string; score: number }> = [];
    
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
  private static similarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(a, b);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(a: string, b: string): number {
    const rows = b.length + 1;
    const cols = a.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j < cols; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i < rows; i++) {
      const currentRow = matrix[i]!;
      const prevRow = matrix[i - 1]!;

      for (let j = 1; j < cols; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          currentRow[j] = prevRow[j - 1]!;
        } else {
          const diagonal = prevRow[j - 1]!;
          const left = currentRow[j - 1]!;
          const up = prevRow[j]!;
          currentRow[j] = Math.min(diagonal + 1, left + 1, up + 1);
        }
      }
    }

    return matrix[rows - 1]![cols - 1]!;
  }

  /**
   * Clear path key cache (useful for testing or reloading)
   */
  static clearPathKeyCache(): void {
    this.pathKeyCache.clear();
    this.defaultPathKeys = [];
  }

  // ============================================================================
  // STATIC CLI ROOT AND MARKETPLACE MANAGEMENT
  // ============================================================================

  /**
   * Calculate CLI root directory by finding the package.json with @thearchitech.xyz/cli
   */
  private static calculateCliRoot(): string {
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
      } catch {
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

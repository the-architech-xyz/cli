/**
 * Path Service
 * 
 * Centralized path management for The Architech.
 * Handles both basic path operations and decentralized path resolution.
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { AdapterConfig } from '@thearchitech.xyz/types';

export class PathService {
  private projectRoot: string;
  private projectName: string;
  private pathMap: Record<string, string> = {};
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
   * Get a specific path from the framework's path map (decentralized)
   */
  getPath(key: string): string {
    const pathValue = this.pathMap[key];
    if (!pathValue) {
      throw new Error(`Path '${key}' not defined in framework adapter paths`);
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
        const { PathKeyRegistry } = await import('./path-key-registry.js');
        const isValid = await PathKeyRegistry.isValidPathKey(key, marketplaceName, projectStructure);
        
        if (!isValid) {
          const validKeys = await PathKeyRegistry.getValidPathKeys(marketplaceName, projectStructure);
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
   */
  static async resolveModuleId(moduleId: string): Promise<string> {
    // Import the dumb translator
    const { DumbPathTranslator } = await import('./dumb-path-translator.js');
    return DumbPathTranslator.translateModuleId(moduleId);
  }

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

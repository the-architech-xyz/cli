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
   * Get source path
   */
  getSrcPath(): string {
    return this.getPath('src') || 'src';
  }

  /**
   * Get lib path
   */
  getLibPath(): string {
    return this.getPath('lib') || 'src/lib';
  }

  /**
   * Get components path
   */
  getComponentsPath(): string {
    return this.getPath('components') || 'src/components';
  }

  /**
   * Get UI components path
   */
  getUIComponentsPath(): string {
    return this.getPath('ui_components') || 'src/components/ui';
  }

  /**
   * Get utils path
   */
  getUtilsPath(): string {
    return this.getPath('utils') || 'src/utils';
  }

  /**
   * Get test path
   */
  getTestPath(): string {
    return this.getPath('test') || 'src/__tests__';
  }

  /**
   * Get database path
   */
  getDatabasePath(): string {
    return this.getPath('database') || 'src/lib/db';
  }

  /**
   * Get auth path
   */
  getAuthPath(): string {
    return this.getPath('auth') || 'src/lib/auth';
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
   * Resolve template variables in a string (for ${paths.key} patterns)
   * CHANGED: Now uses ${} syntax to avoid conflicts with template {{}} syntax
   */
  resolveTemplate(template: string): string {
    // Replace ${paths.key} patterns with actual resolved paths
    // NOTE: Also support legacy {{paths.key}} for backward compatibility during migration
    
    // New syntax: ${paths.key}
    let processed = template.replace(/\$\{paths\.([^}]+)\}/g, (match, key) => {
      try {
        const resolved = this.getPath(key);
        return resolved;
      } catch (error) {
        console.warn(`⚠️  Path '${key}' not found in pathMap. Available paths: [${Object.keys(this.pathMap).join(', ')}]`);
        return this.getFallbackPath(key, match);
      }
    });
    
    // Legacy syntax: {{paths.key}} (for backward compatibility)
    processed = processed.replace(/\{\{paths\.([^}]+)\}\}/g, (match, key) => {
      console.warn(`⚠️  Legacy path syntax {{paths.${key}}} detected. Please update to \${paths.${key}}`);
      try {
        const resolved = this.getPath(key);
        return resolved;
      } catch (error) {
        return this.getFallbackPath(key, match);
      }
    });
    
    return processed;
  }

  /**
   * Get fallback path for common keys
   */
  private getFallbackPath(key: string, originalMatch: string): string {
    const commonDefaults: Record<string, string> = {
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
  validatePathVariables(template: string, strict: boolean = false): { valid: boolean; missingPaths: string[] } {
    // Check both new ${paths.key} and legacy {{paths.key}} syntax
    const newSyntaxRegex = /\$\{paths\.([^}]+)\}/g;
    const legacySyntaxRegex = /\{\{paths\.([^}]+)\}\}/g;
    const missingPaths: string[] = [];
    
    // Check new syntax
    let match;
    while ((match = newSyntaxRegex.exec(template)) !== null) {
      const pathKey = match[1];
      if (pathKey) {
        try {
          this.getPath(pathKey);
        } catch (error) {
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
        } catch (error) {
          missingPaths.push(pathKey);
        }
      }
    }

    const valid = missingPaths.length === 0;

    if (!valid && strict) {
      throw new Error(
        `Path validation failed. Missing path keys: ${missingPaths.join(', ')}. ` +
        `Available paths: ${this.getAvailablePaths().join(', ')}`
      );
    }

    return { valid, missingPaths };
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

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
  private static marketplaceRoot: string | null = null;

  constructor(projectRoot: string, projectName?: string, frameworkAdapter?: AdapterConfig) {
    this.projectRoot = path.resolve(projectRoot);
    this.projectName = projectName || projectRoot.split('/').pop() || 'project';
    this.frameworkProjectRoot = projectRoot;
    
    if (frameworkAdapter?.paths) {
      this.pathMap = frameworkAdapter.paths;
    }
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
   * Resolve template variables in a string (for {{paths.key}} patterns)
   */
  resolveTemplate(template: string): string {
    // Replace {{paths.key}} patterns with actual resolved paths
    return template.replace(/\{\{paths\.([^}]+)\}\}/g, (match, key) => {
      try {
        return this.getPath(key);
      } catch (error) {
        // If path not found, return the original template variable
        console.warn(`⚠️ Path '${key}' not found in framework paths, keeping template variable`);
        return match;
      }
    });
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
      this.marketplaceRoot = null; // Reset marketplace root to recalculate
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
   * Get the marketplace root directory (development or production)
   */
  static async getMarketplaceRoot(): Promise<string> {
    if (!this.marketplaceRoot) {
      const cliRoot = this.getCliRoot();
      
      // Check development first (marketplace as sibling to CLI)
      const devMarketplacePath = path.join(cliRoot, '..', 'marketplace');
      const prodMarketplacePath = path.join(cliRoot, 'node_modules', '@thearchitech.xyz', 'marketplace');
      
      try {
        await fs.promises.access(devMarketplacePath);
        this.marketplaceRoot = devMarketplacePath;
      } catch {
        this.marketplaceRoot = prodMarketplacePath;
      }
    }
    return this.marketplaceRoot;
  }

  /**
   * Resolve module ID to full module path
   * Handles multiple formats:
   * - Full paths: 'integrations/drizzle-nextjs-integration' -> 'integrations/drizzle-nextjs-integration'
   * - Adapter short: 'drizzle' -> 'adapters/drizzle' (if exists)
   * - Adapter category/name: 'framework/nextjs' -> 'adapters/framework/nextjs'
   * - Integration short: 'drizzle-nextjs-integration' -> 'integrations/drizzle-nextjs-integration'
   */
  static async resolveModuleId(moduleId: string): Promise<string> {
    const marketplaceRoot = await this.getMarketplaceRoot();
    
    // If it's already a full path (starts with 'adapters/' or 'integrations/'), use it as-is
    if (moduleId.startsWith('adapters/') || moduleId.startsWith('integrations/')) {
      const fullPath = path.join(marketplaceRoot, moduleId);
      try {
        await fs.promises.access(fullPath);
        return moduleId;
      } catch {
        throw new Error(`Module not found: ${moduleId}. Checked path: ${fullPath}`);
      }
    }
    
    // If it contains a '/' but doesn't start with adapters/integrations, it's likely category/name format
    if (moduleId.includes('/')) {
      // Try as adapter first (most common case)
      const adapterPath = path.join(marketplaceRoot, 'adapters', moduleId);
      try {
        await fs.promises.access(adapterPath);
        return `adapters/${moduleId}`;
      } catch {
        // Try as integration
        const integrationPath = path.join(marketplaceRoot, 'integrations', moduleId);
        try {
          await fs.promises.access(integrationPath);
          return `integrations/${moduleId}`;
        } catch {
          throw new Error(`Module not found: ${moduleId}. Checked paths: ${adapterPath}, ${integrationPath}`);
        }
      }
    }
    
    // Otherwise, it's a short ID - auto-detect whether it's an adapter or integration
    const integrationPath = path.join(marketplaceRoot, 'integrations', moduleId);
    try {
      await fs.promises.access(integrationPath);
      return `integrations/${moduleId}`;
    } catch {
      // Check if it's an adapter
      const adapterPath = path.join(marketplaceRoot, 'adapters', moduleId);
      try {
        await fs.promises.access(adapterPath);
        return `adapters/${moduleId}`;
      } catch {
        throw new Error(`Module not found: ${moduleId}. Checked paths: ${integrationPath}, ${adapterPath}`);
      }
    }
  }

  /**
   * Calculate CLI root directory by finding the package.json with the-architech
   */
  private static calculateCliRoot(): string {
    const cliFile = fileURLToPath(import.meta.url);
    let current = path.dirname(cliFile);
    
    // Go up from the current file until we find the CLI package.json
    while (current !== path.dirname(current)) {
      const packageJsonPath = path.join(current, 'package.json');
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'the-architech') {
          return current;
        }
      } catch {
        // Continue searching
      }
      current = path.dirname(current);
    }
    
    throw new Error('CLI root not found. Unable to locate the-architech package.json');
  }
}

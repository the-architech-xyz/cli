/**
 * Path Service
 * 
 * Centralized path management for The Architech.
 * Handles both basic path operations and decentralized path resolution.
 */

import * as path from 'path';
import * as fs from 'fs';
import { AdapterConfig } from '@thearchitech.xyz/types';

export class PathService {
  private projectRoot: string;
  private projectName: string;
  private pathMap: Record<string, string> = {};
  private frameworkProjectRoot: string;

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
}

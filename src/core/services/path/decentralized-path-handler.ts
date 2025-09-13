/**
 * Decentralized PathHandler - V1 "Perfect Isolated Kits"
 * 
 * A "dumb" utility that gets configured at runtime by the framework adapter.
 * The framework adapter declares its folder structure, and this handler
 * provides path resolution for all other adapters.
 */

import { AdapterConfig } from '../../../types/adapter.js';
import { PathHandler } from './path-handler.js';

export class DecentralizedPathHandler extends PathHandler {
  private pathMap: Record<string, string> = {};
  private frameworkProjectRoot: string;

  constructor(frameworkAdapter: AdapterConfig, projectRoot: string) {
    const projectName = projectRoot.split('/').pop() || 'project';
    super(projectRoot, projectName);
    this.frameworkProjectRoot = projectRoot;
    this.pathMap = frameworkAdapter.paths || {};
  }

  /**
   * Get a specific path from the framework's path map
   */
  getPath(key: string): string {
    const path = this.pathMap[key];
    if (!path) {
      throw new Error(`Path '${key}' not defined in framework adapter paths`);
    }
    return path;
  }

  /**
   * Resolve a template string with path variables
   * Replaces {{paths.*}} with actual paths from the framework
   */
  resolveTemplate(template: string): string {
    let resolved = template;
    
    // Replace {{paths.*}} variables
    const pathRegex = /\{\{paths\.([^}]+)\}\}/g;
    resolved = resolved.replace(pathRegex, (match, pathKey) => {
      return this.getPath(pathKey);
    });

    return resolved;
  }

  /**
   * Get all available paths for debugging/logging
   */
  getAllPaths(): Record<string, string> {
    return { ...this.pathMap };
  }

  /**
   * Validate that all required paths are defined
   */
  validateRequiredPaths(requiredPaths: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const requiredPath of requiredPaths) {
      if (!this.pathMap[requiredPath]) {
        missing.push(requiredPath);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get absolute path by combining project root with relative path
   */
  getAbsolutePath(relativePath: string): string {
    // If it's already absolute, return as is
    if (relativePath.startsWith('/') || relativePath.match(/^[A-Za-z]:/)) {
      return relativePath;
    }
    
    return `${this.frameworkProjectRoot}/${relativePath}`;
  }
}

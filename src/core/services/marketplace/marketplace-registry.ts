/**
 * Marketplace Registry
 * 
 * Centralized service for discovering and resolving marketplace paths
 * Supports both core marketplace and UI marketplaces (shadcn, tamagui, etc.)
 * 
 * Handles:
 * - Dev vs prod environment detection
 * - Automatic path resolution for both core and UI marketplaces
 * - CLI flag overrides for custom paths
 */

import * as fs from 'fs';
import * as path from 'path';
import { PathService } from '../path/path-service.js';

export class MarketplaceRegistry {
  private static corePath: string | null = null;
  private static uiPaths: Map<string, string> = new Map();
  private static overrides: Map<string, string> = new Map();

  /**
   * Get core marketplace path (features, adapters, connectors)
   */
  static async getCoreMarketplacePath(): Promise<string> {
    // Check for override first
    if (this.overrides.has('core')) {
      return this.overrides.get('core')!;
    }

    if (!this.corePath) {
      const cliRoot = PathService.getCliRoot();
      
      // Dev: marketplace as sibling to Architech/
      const devPath = path.join(cliRoot, '..', 'marketplace');
      
      // Prod: npm package
      const prodPath = path.join(cliRoot, 'node_modules', '@thearchitech.xyz', 'marketplace');
      
      this.corePath = await this.resolvePath(devPath, prodPath);
    }
    
    return this.corePath;
  }

  /**
   * Get UI marketplace path for a framework (shadcn, tamagui, etc.)
   */
  static async getUIMarketplacePath(framework: string): Promise<string> {
    // Check for override first
    if (this.overrides.has(framework)) {
      return this.overrides.get(framework)!;
    }

    if (!this.uiPaths.has(framework)) {
      const cliRoot = PathService.getCliRoot();
      const marketplaceName = `marketplace-${framework}`;
      
      // Dev: sibling directory to Architech/
      const devPath = path.join(cliRoot, '..', marketplaceName);
      
      // Prod: npm package
      const prodPath = path.join(cliRoot, 'node_modules', '@thearchitech', marketplaceName);
      
      const resolvedPath = await this.resolvePath(devPath, prodPath);
      this.uiPaths.set(framework, resolvedPath);
    }
    
    return this.uiPaths.get(framework)!;
  }

  /**
   * Resolve path (dev first, fallback to prod)
   */
  private static async resolvePath(devPath: string, prodPath: string): Promise<string> {
    try {
      if (fs.existsSync(devPath)) {
        return devPath;
      }
    } catch {
      // Dev path doesn't exist
    }
    
    // Fallback to prod path
    return prodPath;
  }

  /**
   * Set override path for a marketplace
   */
  static setMarketplacePath(name: string, path: string): void {
    this.overrides.set(name, path);
    
    // If it's a UI marketplace, also update the cache
    if (name !== 'core') {
      this.uiPaths.set(name, path);
    } else {
      this.corePath = path;
    }
  }

  /**
   * Clear all overrides and caches
   */
  static reset(): void {
    this.corePath = null;
    this.uiPaths.clear();
    this.overrides.clear();
  }

  /**
   * Check if a marketplace exists
   */
  static async marketplaceExists(name: 'core' | string): Promise<boolean> {
    try {
      const path = name === 'core' 
        ? await this.getCoreMarketplacePath()
        : await this.getUIMarketplacePath(name);
      
      return fs.existsSync(path);
    } catch {
      return false;
    }
  }

  /**
   * Get all available UI marketplaces
   */
  static async getAvailableUIMarketplaces(): Promise<string[]> {
    const available: string[] = [];
    const commonFrameworks = ['shadcn', 'tamagui'];
    
    for (const framework of commonFrameworks) {
      if (await this.marketplaceExists(framework)) {
        available.push(framework);
      }
    }
    
    return available;
  }
}


/**
 * Path Key Registry
 * 
 * Loads and validates marketplace-specific path key definitions.
 * Provides validation and lookup for path keys used in blueprints.
 */

import { MarketplacePathKeys, PathKeyDefinition } from '@thearchitech.xyz/types';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class PathKeyRegistry {
  private static cache: Map<string, MarketplacePathKeys> = new Map();
  private static defaultPathKeys: PathKeyDefinition[] = [];

  /**
   * Load path keys from marketplace
   * Falls back to default PathKey enum if marketplace doesn't define path-keys.json
   */
  static async loadPathKeys(marketplaceName: string = 'core'): Promise<MarketplacePathKeys> {
    // Check cache
    if (this.cache.has(marketplaceName)) {
      return this.cache.get(marketplaceName)!;
    }

    try {
      // Get marketplace path
      const marketplacePath = marketplaceName === 'core'
        ? await MarketplaceRegistry.getCoreMarketplacePath()
        : await MarketplaceRegistry.getUIMarketplacePath(marketplaceName);

      // Try to load path-keys.json
      const pathKeysPath = path.join(marketplacePath, 'path-keys.json');
      
      try {
        const content = await fs.readFile(pathKeysPath, 'utf-8');
        const pathKeys: MarketplacePathKeys = JSON.parse(content);
        
        // Validate structure
        this.validatePathKeys(pathKeys);
        
        // Cache and return
        this.cache.set(marketplaceName, pathKeys);
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
   * Clear cache (useful for testing or reloading)
   */
  static clearCache(): void {
    this.cache.clear();
    this.defaultPathKeys = [];
  }
}




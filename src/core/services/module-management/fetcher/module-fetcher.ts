/**
 * Module Fetcher Service
 * 
 * Fetches blueprints and templates from the installed @thearchitech.xyz/marketplace package.
 * Reads directly from node_modules for optimal performance and reliability.
 * 
 * @author The Architech Team
 * @version 2.0.0 - NPM-Powered Architecture
 */

import { CacheManagerService } from '../../infrastructure/cache/cache-manager.js';
import { TypeScriptBlueprintParser } from '../../execution/blueprint/typescript-blueprint-parser.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

export interface ModuleManifest {
  modules: Array<{
    id: string;
    version: string;
    path: string;
    engine: {
      cliVersion: string;
    };
    category: 'adapter' | 'integration';
    dependencies?: string[];
    tags?: string[];
  }>;
  lastUpdated: string;
  totalModules: number;
}

export interface FetchResult {
  success: boolean;
  content?: any;
  error?: string;
  fromCache?: boolean;
}

export class ModuleFetcherService {
  private cacheManager: CacheManagerService;
  private marketplacePath: string;
  private manifest: ModuleManifest | null = null;

  constructor(cacheManager: CacheManagerService) {
    this.cacheManager = cacheManager;
    this.marketplacePath = this.resolveMarketplacePath();
  }

  /**
   * Resolve the marketplace package path from node_modules
   */
  private resolveMarketplacePath(): string {
    try {
      console.log(`🔍 Attempting to resolve marketplace package...`);
      
      // Try to find the marketplace package in node_modules
      const currentDir = process.cwd();
      const possiblePaths = [
        resolve(currentDir, 'node_modules/@thearchitech.xyz/marketplace'),
        resolve(currentDir, '../node_modules/@thearchitech.xyz/marketplace'),
        resolve(currentDir, '../../node_modules/@thearchitech.xyz/marketplace'),
        // Also try from the CLI package directory
        resolve(dirname(fileURLToPath(import.meta.url)), '../../../node_modules/@thearchitech.xyz/marketplace'),
        resolve(dirname(fileURLToPath(import.meta.url)), '../../../../node_modules/@thearchitech.xyz/marketplace'),
        // Specific path for the current setup
        resolve(currentDir, 'Architech/node_modules/@thearchitech.xyz/marketplace')
      ];
      
      for (const possiblePath of possiblePaths) {
        console.log(`🔍 Checking: ${possiblePath}`);
        if (existsSync(possiblePath)) {
          console.log(`📦 Found marketplace package at: ${possiblePath}`);
          return possiblePath;
        }
      }
      
      throw new Error('Marketplace directory not found in any expected location');
    } catch (error) {
      console.error(`❌ Error resolving marketplace package:`, error);
      throw new Error(
        '@thearchitech.xyz/marketplace package not found. Please install it as a devDependency:\n' +
        'npm install @thearchitech.xyz/marketplace --save-dev'
      );
    }
  }

  /**
   * Initialize the fetcher service
   */
  async initialize(): Promise<void> {
    await this.cacheManager.initialize();
  }

  /**
   * Fetch a module from the installed marketplace package
   */
  async fetch(moduleId: string, version: string = 'latest'): Promise<FetchResult> {
    try {
      // Check cache first
      if (await this.cacheManager.has(moduleId, version)) {
        const content = await this.cacheManager.get(moduleId, version);
        if (content) {
          return {
            success: true,
            content,
            fromCache: true
          };
        }
      }

      // Load from local marketplace package
      const content = await this.loadFromMarketplace(moduleId, version);
      
      // Cache the result
      await this.cacheManager.set(moduleId, version, content);
      
      return {
        success: true,
        content,
        fromCache: false
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Load module manifest from the installed marketplace package
   */
  async fetchManifest(): Promise<ModuleManifest | null> {
    if (this.manifest) {
      return this.manifest;
    }

    try {
      const manifestPath = path.join(this.marketplacePath, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);
      return this.manifest;
    } catch (error) {
      console.warn(`Failed to load manifest from marketplace package: ${error}`);
      return null;
    }
  }

  /**
   * Prime cache with essential modules
   */
  async primeCache(categories: string[] = ['core', 'official']): Promise<void> {
    try {
      const manifest = await this.fetchManifest();
      if (!manifest) {
        throw new Error('Failed to fetch manifest');
      }

      const modulesToPrime = manifest.modules.filter(module => 
        categories.some(category => 
          module.tags?.includes(category) || 
          module.category === category
        )
      );

      console.log(`📦 Priming cache with ${modulesToPrime.length} modules...`);

      for (const module of modulesToPrime) {
        try {
          await this.fetch(module.id, module.version);
          console.log(`✅ Cached: ${module.id}@${module.version}`);
        } catch (error) {
          console.warn(`⚠️  Failed to cache ${module.id}: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to prime cache: ${error}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cacheManager.getStats();
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Load adapter configuration from the installed marketplace package
   */
  async fetchAdapterConfig(moduleId: string, version: string = 'latest'): Promise<FetchResult> {
    try {
      // Get the manifest to find the module
      const manifest = await this.fetchManifest();
      if (!manifest) {
        return { success: false, error: 'Failed to load manifest from marketplace package' };
      }

      // Find the module
      let module = manifest.modules.find(m => m.id === moduleId);
      if (!module) {
        return { success: false, error: `Module ${moduleId} not found in marketplace` };
      }

      // Handle version resolution
      if (version === 'latest') {
        // Find the highest version
        const allVersions = manifest.modules.filter(m => m.id === moduleId);
        if (allVersions.length > 0) {
          module = allVersions.sort((a, b) => {
            // Simple version comparison
            const aParts = a.version.split('.').map(Number);
            const bParts = b.version.split('.').map(Number);
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              const aPart = aParts[i] || 0;
              const bPart = bParts[i] || 0;
              if (aPart !== bPart) {
                return bPart - aPart; // Descending order
              }
            }
            return 0;
          })[0];
        }
      }

      if (!module) {
        return { success: false, error: `Module ${moduleId}@${version} not found in marketplace` };
      }

      // Load the adapter.json file from local package
      const adapterPath = path.join(this.marketplacePath, module.path);
      const adapterContent = await fs.readFile(adapterPath, 'utf-8');
      const adapterConfig = JSON.parse(adapterContent);
      
      return {
        success: true,
        content: adapterConfig
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Load module content from the installed marketplace package
   */
  private async loadFromMarketplace(moduleId: string, version: string): Promise<any> {
    // First, get the module path from manifest
    const manifest = await this.fetchManifest();
    if (!manifest) {
      throw new Error('Failed to load manifest from marketplace package');
    }

    let module = manifest.modules.find(m => m.id === moduleId && m.version === version);
    
    // If exact version not found and looking for 'latest', find the highest version
    if (!module && version === 'latest') {
      const modules = manifest.modules.filter(m => m.id === moduleId);
      if (modules.length > 0) {
        // Sort by version and take the highest
        module = modules.sort((a, b) => {
          // Simple version comparison (assumes semantic versioning)
          const aParts = a.version.split('.').map(Number);
          const bParts = b.version.split('.').map(Number);
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            if (aPart !== bPart) {
              return bPart - aPart; // Descending order
            }
          }
          return 0;
        })[0];
      }
    }
    
    if (!module) {
      throw new Error(`Module ${moduleId}@${version} not found in marketplace`);
    }

    // Load the blueprint file from local package
    const blueprintPath = module.path.replace('adapter.json', 'blueprint.ts');
    const fullBlueprintPath = path.join(this.marketplacePath, blueprintPath);
    const blueprintContent = await fs.readFile(fullBlueprintPath, 'utf-8');
    
    // Parse the TypeScript blueprint using proper AST parsing
    const blueprint = TypeScriptBlueprintParser.parseBlueprint(blueprintContent);
    
    if (blueprint) {
      return blueprint;
    }
    
    // Fallback: return a minimal blueprint structure
    return {
      id: module.id,
      name: module.id,
      actions: []
    };
  }


  /**
   * Check if module exists in marketplace
   */
  async moduleExists(moduleId: string, version: string = 'latest'): Promise<boolean> {
    try {
      const manifest = await this.fetchManifest();
      if (!manifest) return false;

      return manifest.modules.some(m => m.id === moduleId && m.version === version);
    } catch {
      return false;
    }
  }

  /**
   * Get available versions for a module
   */
  async getModuleVersions(moduleId: string): Promise<string[]> {
    try {
      const manifest = await this.fetchManifest();
      if (!manifest) return [];

      return manifest.modules
        .filter(m => m.id === moduleId)
        .map(m => m.version)
        .sort((a, b) => b.localeCompare(a)); // Sort descending
    } catch {
      return [];
    }
  }
}
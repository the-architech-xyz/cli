/**
 * Module Fetcher Service
 * 
 * Fetches blueprints and templates from the marketplace repository.
 * Implements intelligent caching and version management.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { CacheManagerService } from '../../infrastructure/cache/cache-manager.js';
import { TypeScriptBlueprintParser } from '../../execution/blueprint/typescript-blueprint-parser.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createRequire } from 'module';

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
  private localMarketplacePath?: string;

  constructor(cacheManager: CacheManagerService) {
    this.cacheManager = cacheManager;
    
    // Check for local development fallback
    const localPath = process.env.LOCAL_MARKETPLACE_PATH;
    if (localPath) {
      this.localMarketplacePath = localPath;
      this.marketplacePath = this.localMarketplacePath;
    } else {
      // Use NPM package
      try {
        const require = createRequire(import.meta.url);
        const packagePath = require.resolve('@thearchitech.xyz/marketplace');
        // Get the directory containing the package, not the main file
        this.marketplacePath = path.dirname(packagePath);
      } catch (error) {
        throw new Error('@thearchitech.xyz/marketplace package not found. Please install it or set LOCAL_MARKETPLACE_PATH for development.');
      }
    }
  }

  /**
   * Initialize the fetcher service
   */
  async initialize(): Promise<void> {
    await this.cacheManager.initialize();
    // No need to initialize Git repository anymore
  }

  /**
   * Fetch a module from marketplace or cache
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

      // Fetch from marketplace
      const content = await this.fetchFromMarketplace(moduleId, version);
      
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
   * Fetch module manifest from marketplace
   */
  async fetchManifest(): Promise<ModuleManifest | null> {
    try {
      const manifestPath = path.join(this.marketplacePath, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to fetch manifest: ${error}`);
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


      for (const module of modulesToPrime) {
        try {
          await this.fetch(module.id, module.version);
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
   * Get the marketplace path
   */
  getMarketplacePath(): string {
    return this.marketplacePath;
  }

  /**
   * Fetch adapter configuration from the marketplace
   */
  async fetchAdapterConfig(moduleId: string, version: string = 'latest'): Promise<FetchResult> {
    try {
      // Get the manifest to find the module
      const manifest = await this.fetchManifest();
      if (!manifest) {
        return { success: false, error: 'Failed to fetch manifest' };
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
            // Simple version comparison (you might want to use semver for production)
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

      // Fetch the adapter.json file
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
   * Fetch module content from marketplace
   */
  private async fetchFromMarketplace(moduleId: string, version: string): Promise<any> {
    // First, get the module path from manifest
    const manifest = await this.fetchManifest();
    if (!manifest) {
      throw new Error('Failed to fetch manifest');
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

    // Fetch the blueprint file (look for blueprint.ts instead of adapter.json)
    const blueprintPath = module.path.replace('adapter.json', 'blueprint.ts');
    const fullBlueprintPath = path.join(this.marketplacePath, blueprintPath);
    const blueprintContent = await fs.readFile(fullBlueprintPath, 'utf-8');
    
    // Fetch the adapter config for parameter defaults
    const adapterConfig = await this.fetchAdapterConfig(moduleId, version)
      .then(result => result.success ? result.content : null)
      .catch(() => null);
    
    // Parse the TypeScript blueprint using proper AST parsing
    const blueprint = TypeScriptBlueprintParser.parseBlueprint(blueprintContent, moduleId, adapterConfig);
    
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
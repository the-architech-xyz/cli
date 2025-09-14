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
import * as https from 'https';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  private marketplaceUrl: string;
  private apiToken: string | undefined;

  constructor(cacheManager: CacheManagerService) {
    this.cacheManager = cacheManager;
    this.marketplaceUrl = process.env.ARCHITECH_MARKETPLACE_URL || 'file:///Users/antoine/Documents/Code/Architech/marketplace';
    this.apiToken = process.env.GITHUB_TOKEN || undefined;
  }

  /**
   * Initialize the fetcher service
   */
  async initialize(): Promise<void> {
    await this.cacheManager.initialize();
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
      const manifestUrl = `${this.marketplaceUrl}/manifest.json`;
      const content = await this.fetchFromUrl(manifestUrl);
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
      const adapterUrl = `${this.marketplaceUrl}/${module.path}`;
      const adapterContent = await this.fetchFromUrl(adapterUrl);
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
    const blueprintUrl = `${this.marketplaceUrl}/${blueprintPath}`;
    const blueprintContent = await this.fetchFromUrl(blueprintUrl);
    
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
   * Fetch content from URL
   */
  private async fetchFromUrl(url: string): Promise<string> {
    // Handle local file URLs
    if (url.startsWith('file://')) {
      const filePath = url.replace('file://', '');
      return await fs.readFile(filePath, 'utf-8');
    }

    // Handle remote URLs
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        headers: {
          'User-Agent': 'The-Architech-CLI/1.0.0',
          ...(this.apiToken && { 'Authorization': `token ${this.apiToken}` })
        }
      };

      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
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
/**
 * Adapter Loader - V1 Simple Adapter Discovery
 * 
 * Loads adapters from the adapters directory
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Adapter, AdapterConfig } from '@thearchitech.xyz/types';
import { ModuleFetcherService } from '../fetcher/module-fetcher.js';

export class AdapterLoader {
  private moduleFetcher: ModuleFetcherService;

  constructor(moduleFetcher: ModuleFetcherService) {
    this.moduleFetcher = moduleFetcher;
  }

  /**
   * Load an adapter by category and ID
   */
  async loadAdapter(category: string, adapterId: string): Promise<Adapter> {
    const moduleId = `${category}/${adapterId}`;
    
    if (!this.moduleFetcher) {
      throw new Error('ModuleFetcher is required for loading adapters from marketplace');
    }
    
    try {
      // Load from marketplace
      const result = await this.moduleFetcher.fetch(moduleId);
      if (result.success && result.content) {
        // The result.content should now be the parsed blueprint
        const blueprint = result.content;
        
        // Also fetch the adapter configuration to get paths and other metadata
        const configResult = await this.moduleFetcher.fetchAdapterConfig(moduleId, 'latest');
        if (configResult.success && configResult.content) {
          // Use the full adapter configuration
          const config = configResult.content;
          return {
            config,
            blueprint
          };
        } else {
          // Fallback to minimal config if adapter.json not found
          const config: AdapterConfig = {
            id: adapterId,
            name: blueprint.name || adapterId,
            description: blueprint.description || '',
            version: blueprint.version || '1.0.0',
            category: category as any,
            blueprint: 'blueprint.ts',
            dependencies: blueprint.dependencies || [],
            tags: blueprint.tags || []
          };
          
          return {
            config,
            blueprint
          };
        }
      } else {
        throw new Error(`Failed to load adapter ${moduleId} from marketplace: ${result.error}`);
      }
    } catch (error) {
      throw new Error(`Failed to load adapter ${moduleId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available adapters
   */
  async getAvailableAdapters(): Promise<{ category: string; adapters: string[] }[]> {
    const adaptersDir = path.join(process.cwd(), 'src/adapters');
    const categories: { category: string; adapters: string[] }[] = [];
    
    try {
      const categoryDirs = await fs.readdir(adaptersDir, { withFileTypes: true });
      
      for (const categoryDir of categoryDirs) {
        if (categoryDir.isDirectory()) {
          const categoryPath = path.join(adaptersDir, categoryDir.name);
          const adapterDirs = await fs.readdir(categoryPath, { withFileTypes: true });
          
          const adapters = adapterDirs
            .filter(dir => dir.isDirectory())
            .map(dir => dir.name);
          
          categories.push({
            category: categoryDir.name,
            adapters
          });
        }
      }
      
      return categories;
    } catch (error) {
      console.warn('Failed to scan adapters directory:', error);
      return [];
    }
  }
}

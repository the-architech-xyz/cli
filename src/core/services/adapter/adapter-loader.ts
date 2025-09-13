/**
 * Adapter Loader - V1 Simple Adapter Discovery
 * 
 * Loads adapters from the adapters directory
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Adapter, AdapterConfig } from '../../../types/adapter.js';

export class AdapterLoader {
  /**
   * Load an adapter by category and ID
   */
  async loadAdapter(category: string, adapterId: string): Promise<Adapter> {
    const adapterPath = path.join(process.cwd(), 'src/adapters', category, adapterId);
    
    try {
      // Load adapter.json from dist directory
      const configPath = path.join(process.cwd(), 'dist/adapters', category, adapterId, 'adapter.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent) as AdapterConfig;
      
      // Load blueprint from compiled dist directory
      const blueprintPath = path.join(process.cwd(), 'dist/adapters', category, adapterId, 'blueprint.js');
      const blueprintModule = await import(blueprintPath);
      
      // Convert kebab-case to camelCase for blueprint name
      const camelCaseId = adapterId.replace(/-([a-z])/g, (g) => g[1]?.toUpperCase() || '');
      const blueprint = blueprintModule[`${camelCaseId}Blueprint`];
      
      if (!blueprint) {
        throw new Error(`Blueprint not found: ${adapterId}Blueprint`);
      }
      
      return {
        config,
        blueprint
      };
      
    } catch (error) {
      throw new Error(`Failed to load adapter ${category}/${adapterId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

/**
 * Marketplace Service
 * 
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PathService } from '../path/path-service.js';

export class MarketplaceService {
  /**
   * Load template content from marketplace
   */
  static async loadTemplate(moduleId: string, templateFile: string): Promise<string> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    
    // Check if templateFile already includes 'templates/' prefix
    const templatePath = templateFile.startsWith('templates/') 
      ? path.join(marketplaceRoot, resolvedModuleId, templateFile)
      : path.join(marketplaceRoot, resolvedModuleId, 'templates', templateFile);
    
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Template file not found. Tried to read from: ${templatePath}`);
    }
  }

  /**
   * Load module configuration (adapter.json, integration.json, or feature.json)
   */
  static async loadModuleConfig(moduleId: string): Promise<any> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    
    // Determine config file name based on module type
    let configFileName: string;
    if (resolvedModuleId.startsWith('integrations/')) {
      configFileName = 'integration.json';
    } else if (resolvedModuleId.startsWith('features/')) {
      configFileName = 'feature.json';
    } else {
      configFileName = 'adapter.json';
    }
    
    const configPath = path.join(marketplaceRoot, resolvedModuleId, configFileName);
    
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Module config not found. Tried to read from: ${configPath}`);
    }
  }

  /**
   * Load module blueprint from compiled dist folder
   */
  static async loadModuleBlueprint(moduleId: string, blueprintFileName?: string): Promise<any> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    
    // Get blueprint file name from config if not provided
    let finalBlueprintFileName: string;
    if (!blueprintFileName) {
      const config = await this.loadModuleConfig(moduleId);
      finalBlueprintFileName = config.blueprint?.file || 'blueprint.js';
      
      // Convert .ts extension to .js since we compile blueprints
      if (finalBlueprintFileName.endsWith('.ts')) {
        finalBlueprintFileName = finalBlueprintFileName.replace(/\.ts$/, '.js');
      }
    } else {
      finalBlueprintFileName = blueprintFileName;
    }
    
    const blueprintPath = path.join(
      marketplaceRoot,
      'dist',
      resolvedModuleId,
      finalBlueprintFileName
    );
    
    try {
      const blueprintModule = await import(blueprintPath);
      
      // Find the blueprint export (it might be a named export or default export)
      const moduleName = moduleId.split('/').pop() || moduleId;
      let blueprint = blueprintModule.default || 
                     blueprintModule.blueprint || 
                     blueprintModule[`${moduleName}Blueprint`];
      
      if (!blueprint) {
        // Look for any export that looks like a blueprint
        const exports = Object.keys(blueprintModule);
        const blueprintKey = exports.find(key => 
          key.toLowerCase().includes('blueprint') || 
          key.toLowerCase().includes(moduleName)
        );
        if (blueprintKey) {
          blueprint = blueprintModule[blueprintKey];
        }
      }
      
      if (!blueprint) {
        throw new Error(`No blueprint found in ${blueprintPath}. Available exports: ${Object.keys(blueprintModule).join(', ')}`);
      }
      
      return blueprint;
    } catch (error) {
      throw new Error(`Blueprint not found. Tried to read from: ${blueprintPath}`);
    }
  }

  /**
   * Check if a module exists in the marketplace
   */
  static async moduleExists(moduleId: string): Promise<boolean> {
    try {
      await PathService.resolveModuleId(moduleId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the resolved module path for a given module ID
   */
  static async getModulePath(moduleId: string): Promise<string> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    return path.join(marketplaceRoot, resolvedModuleId);
  }
}

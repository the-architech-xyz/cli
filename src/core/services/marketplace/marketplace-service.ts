/**
 * Marketplace Service
 * 
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PathService } from '../path/path-service.js';
import { BlueprintLoader } from './blueprint-loader.js';

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
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Enhanced error message with suggestions
      const suggestions = await this.getTemplateSuggestions(moduleId, templateFile);
      const modulePath = path.join(marketplaceRoot, resolvedModuleId);
      
      throw new Error(
        `Template file not found: ${templatePath}\n` +
        `Module: ${moduleId}\n` +
        `Template: ${templateFile}\n` +
        `Module path: ${modulePath}\n` +
        `Error: ${errorMsg}\n` +
        `Suggestions: ${suggestions.join(', ')}\n` +
        `Run 'npm run validate:templates' to check all templates.`
      );
    }
  }

  /**
   * Get template suggestions for better error messages
   */
  private static async getTemplateSuggestions(moduleId: string, templateFile: string): Promise<string[]> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    const modulePath = path.join(marketplaceRoot, resolvedModuleId);
    const templatesDir = path.join(modulePath, 'templates');
    
    try {
      const files = await fs.readdir(templatesDir);
      const suggestions = files
        .filter(file => file.endsWith('.tpl'))
        .slice(0, 5) // Show first 5 templates
        .map(file => `templates/${file}`);
      
      return suggestions.length > 0 ? suggestions : ['No templates found in module'];
    } catch {
      return ['Templates directory not found'];
    }
  }

  /**
   * Load feature manifest (feature.json) - convenience method
   */
  static async loadFeatureManifest(moduleId: string): Promise<any> {
    return this.loadModuleConfig(moduleId);
  }

  /**
   * Load module configuration (adapter.json, integration.json, or feature.json)
   */
  static async loadModuleConfig(moduleId: string): Promise<any> {
    const marketplaceRoot = await PathService.getMarketplaceRoot();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    
    // Determine config file name based on module type
    let configFileNames: string[];
    if (resolvedModuleId.startsWith('integrations/')) {
      configFileNames = ['integration.json'];
    } else if (resolvedModuleId.startsWith('connectors/')) {
      configFileNames = ['connector.json', 'integration.json']; // Try both for connectors
    } else if (resolvedModuleId.startsWith('features/')) {
      configFileNames = ['feature.json'];
    } else {
      configFileNames = ['adapter.json'];
    }
    
    // Try each config file name until one is found
    let lastError: Error | null = null;
    for (const configFileName of configFileNames) {
      const configPath = path.join(marketplaceRoot, resolvedModuleId, configFileName);
      try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(configContent);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue; // Try next config file name
      }
    }
    
    // If we get here, no config file was found
    throw new Error(
      `Module configuration not found for ${moduleId}. ` +
      `Tried: ${configFileNames.join(', ')}. ` +
      `Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get the absolute path to a module's blueprint file
   * This is the centralized, tested logic for blueprint path resolution.
   */
  static async getBlueprintPath(moduleId: string, blueprintFileName?: string): Promise<string> {
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
    
    // Return absolute path to blueprint from compiled dist directory
    return path.join(marketplaceRoot, 'dist', resolvedModuleId, finalBlueprintFileName);
  }

  /**
   * Load module blueprint using BlueprintLoader
   */
  static async loadModuleBlueprint(moduleId: string, blueprintFileName?: string): Promise<any> {
    const blueprintPath = await this.getBlueprintPath(moduleId, blueprintFileName);
    
    const result = await BlueprintLoader.loadBlueprint(moduleId, blueprintPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown blueprint loading error');
    }
    
    return result.blueprint;
  }

  /**
   * Check if a module exists in the marketplace
   */
  static async moduleExists(moduleId: string): Promise<boolean> {
    try {
      const marketplaceRoot = await PathService.getMarketplaceRoot();
      const resolvedModuleId = await PathService.resolveModuleId(moduleId);
      const modulePath = path.join(marketplaceRoot, resolvedModuleId);
      
      const stats = await fs.stat(modulePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

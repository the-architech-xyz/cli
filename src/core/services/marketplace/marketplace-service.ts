/**
 * Marketplace Service
 * 
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 * 
 * Uses MarketplaceRegistry as the single source of truth for marketplace paths.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PathService } from '../path/path-service.js';
import { BlueprintLoader } from './blueprint-loader.js';
import { MarketplaceRegistry } from './marketplace-registry.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { Module } from '@thearchitech.xyz/types';

export class MarketplaceService {
  /**
   * Load template content from marketplace
   * 
   * Supports:
   * - Convention-based UI templates: `ui/architech-welcome/welcome-page.tsx.tpl`
   * - Core marketplace templates: `templates/data-extractor.ts.tpl` or `data-extractor.ts.tpl`
   * - Absolute paths: `/absolute/path/to/template.tsx.tpl` (legacy)
   * 
   * @param moduleId - Module ID (e.g., 'features/auth')
   * @param templateFile - Template path (relative or absolute)
   * @param context - Optional ProjectContext for marketplace path resolution
   */
  static async loadTemplate(
    moduleId: string, 
    templateFile: string,
    context?: ProjectContext
  ): Promise<string> {
    const namespaceResolved = await this.tryLoadFromNamespaces(templateFile, context);
    if (namespaceResolved !== null) {
      return namespaceResolved;
    }

    // CONVENTION: Legacy UI templates ('ui/') still supported via namespaces
    if (templateFile.startsWith('ui/')) {
      const transformedPath = `components/${templateFile}`;
      const legacyNamespaceResolved = await this.tryLoadFromNamespaces(transformedPath, context, true);
      if (legacyNamespaceResolved !== null) {
        return legacyNamespaceResolved;
      }
    }
    
    const moduleMetadata = context?.module;

    if (
      moduleMetadata?.resolved?.root &&
      !path.isAbsolute(templateFile) &&
      !templateFile.startsWith('ui/')
    ) {
      const candidatePaths: string[] = [];
      const normalizedTemplate = templateFile.startsWith('templates/')
        ? templateFile.replace(/^templates\//, '')
        : templateFile;

      candidatePaths.push(path.join(moduleMetadata.resolved.root, 'templates', normalizedTemplate));
      if (templateFile.startsWith('templates/')) {
        candidatePaths.push(path.join(moduleMetadata.resolved.root, templateFile));
      }

      for (const candidate of candidatePaths) {
        try {
          return await fs.readFile(candidate, 'utf-8');
        } catch {
          continue;
        }
      }
    }

    // Check if templateFile is an absolute path (legacy support)
    if (path.isAbsolute(templateFile)) {
      try {
        return await fs.readFile(templateFile, 'utf-8');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Template file not found: ${templateFile}\n` +
          `Error: ${errorMsg}`
        );
      }
    }
    
    // DEFAULT: Core marketplace (relative path)
    const marketplaceRoot = context?.marketplace?.core || 
                            await MarketplaceRegistry.getCoreMarketplacePath();
    const resolvedModuleId = await PathService.resolveModuleId(moduleId);
    
    // Check if templateFile already includes 'templates/' prefix
    const templatePath = templateFile.startsWith('templates/')
      ? path.join(marketplaceRoot, resolvedModuleId, templateFile)
      : path.join(marketplaceRoot, resolvedModuleId, 'templates', templateFile);
    
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const suggestions = await this.getTemplateSuggestions(moduleMetadata, moduleId, templateFile);
      const modulePath = moduleMetadata?.resolved?.root || path.join(marketplaceRoot, resolvedModuleId);
      
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

  private static async tryLoadFromNamespaces(
    templateFile: string,
    context?: ProjectContext,
    silentFallback: boolean = false
  ): Promise<string | null> {
    if (!templateFile.startsWith('components/')) {
      return null;
    }

    const namespaces = (context as any)?.marketplace?.namespaces || {};
    if (Object.keys(namespaces).length === 0) {
      if (!silentFallback) {
        Logger.debug('⚠️ No marketplace namespaces available in context', {
          operation: 'template_loading'
        });
      }
      return null;
    }

    const parts = templateFile.split('/');
    if (parts.length < 2) {
      return null;
    }

    // components/<category>/[optional-framework]/... → namespace keys like components.ui, components.ui.shadcn
    const category = parts[1];
    let namespaceKey = `components.${category}`;
    let startIndex = 2;

    if (parts.length > 2) {
      const potentialSpecific = parts[2];
      const specificKey = `${namespaceKey}.${potentialSpecific}`;
      if (namespaces[specificKey]) {
        namespaceKey = specificKey;
        startIndex = 3;
      } else if (potentialSpecific === 'default') {
        startIndex = 3;
      }
    }

    // Fall back to default category namespace if specific one missing
    let basePath = namespaces[namespaceKey] || namespaces[`components.${category}`];

    // Special case: allow fallback to components.core for shared assets
    if (!basePath && category !== 'core') {
      basePath = namespaces['components.core'];
    }

    if (!basePath) {
      if (!silentFallback) {
        Logger.debug('⚠️ Namespace not resolved for template', {
          operation: 'template_loading',
          template: templateFile,
          namespaceKey
        });
      }
      return null;
    }

    const relativeSegments = parts.slice(startIndex);
    const relativePath = relativeSegments.join('/');
    const absolutePath = path.join(basePath, relativePath);

    try {
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      if (!silentFallback) {
        Logger.debug('⚠️ Template not found in namespace path', {
          operation: 'template_loading',
          template: templateFile,
          namespaceKey,
          absolutePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return null;
    }
  }

  /**
   * Get template suggestions for better error messages
   */
  private static async getTemplateSuggestions(
    moduleMetadata: Module | undefined,
    moduleId: string,
    templateFile: string
  ): Promise<string[]> {
    let templatesDir: string | null = null;

    if (moduleMetadata?.resolved?.root) {
      templatesDir = path.join(moduleMetadata.resolved.root, 'templates');
    } else {
      const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
      const resolvedModuleId = await PathService.resolveModuleId(moduleId);
      templatesDir = path.join(marketplaceRoot, resolvedModuleId, 'templates');
    }

    try {
      const files = await fs.readdir(templatesDir);
      const suggestions = files
        .filter(file => file.endsWith('.tpl'))
        .slice(0, 5)
        .map(file => `templates/${file}`);

      return suggestions.length > 0 ? suggestions : ['No templates found in module'];
    } catch {
      return ['Templates directory not found'];
    }
  }

  /**
   * Load feature manifest (feature.json) - convenience method
   */
  static async loadFeatureManifest(module: Module): Promise<any> {
    return this.loadModuleConfig(module);
  }

  /**
   * Load module configuration (adapter.json, integration.json, or feature.json)
   */
  static async loadModuleConfig(module: Module): Promise<any> {
    if (!module?.resolved?.manifest) {
      throw new Error(`Module ${module?.id || '<unknown>'} is missing resolved manifest metadata.`);
    }

    try {
      const content = await fs.readFile(module.resolved.manifest, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load module configuration for ${module.id}: ${message}`);
    }
  }

  /**
   * Get the absolute path to a module's blueprint file
   * This is the centralized, tested logic for blueprint path resolution.
   */
  static getBlueprintPath(module: Module, blueprintFileName?: string): string {
    if (!module?.resolved?.blueprint) {
      throw new Error(`Module ${module?.id || '<unknown>'} is missing resolved blueprint metadata.`);
    }

    if (blueprintFileName) {
      return path.isAbsolute(blueprintFileName)
        ? blueprintFileName
        : path.join(path.dirname(module.resolved.blueprint), blueprintFileName);
    }

    return module.resolved.blueprint;
  }

  /**
   * Load module blueprint using BlueprintLoader
   */
  static async loadModuleBlueprint(module: Module, blueprintFileName?: string): Promise<any> {
    const blueprintPath = this.getBlueprintPath(module, blueprintFileName);

    const result = await BlueprintLoader.loadBlueprint(module.id, blueprintPath);

    if (!result.success) {
      throw new Error(result.error || 'Unknown blueprint loading error');
    }

    if (!result.blueprint) {
      throw new Error(`Blueprint loaded successfully but result.blueprint is ${result.blueprint}`);
    }

    return result.blueprint;
  }

  /**
   * Check if a module exists in the marketplace
   */
  static async moduleExists(moduleId: string): Promise<boolean> {
    try {
      const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
      const resolvedModuleId = await PathService.resolveModuleId(moduleId);
      const modulePath = path.join(marketplaceRoot, resolvedModuleId);
      
      const stats = await fs.stat(modulePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

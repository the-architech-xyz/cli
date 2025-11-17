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
    const uiResolved = await this.tryLoadFromUIMarketplace(templateFile, context);
    if (uiResolved !== null) {
      return uiResolved;
    }
    
    const moduleMetadata = context?.module;

    if (!path.isAbsolute(templateFile) && !templateFile.startsWith('ui/')) {
      const normalizedTemplate = templateFile.startsWith('templates/')
        ? templateFile.replace(/^templates\//, '')
        : templateFile;

      const moduleRootCandidates = new Set<string>();

      if (moduleMetadata?.resolved?.root) {
        moduleRootCandidates.add(moduleMetadata.resolved.root);
      }

      const moduleMarketplaceRoot =
        moduleMetadata?.marketplace?.root ||
        context?.marketplace?.core ||
        (await MarketplaceRegistry.getCoreMarketplacePath());

      const sourceRoot = moduleMetadata?.source?.root;
      if (sourceRoot) {
        const sourcePath = path.isAbsolute(sourceRoot)
          ? sourceRoot
          : path.join(moduleMarketplaceRoot, sourceRoot);
        moduleRootCandidates.add(sourcePath);
      }

      for (const moduleRoot of moduleRootCandidates) {
        const candidatePaths = new Set<string>();
        candidatePaths.add(path.join(moduleRoot, 'templates', normalizedTemplate));
        if (templateFile.startsWith('templates/')) {
          candidatePaths.add(path.join(moduleRoot, templateFile));
        }

        for (const candidate of candidatePaths) {
          try {
            return await fs.readFile(candidate, 'utf-8');
          } catch {
            continue;
          }
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
                            moduleMetadata?.marketplace?.root ||
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

      Logger.warn('Template resolution fallback triggered', {
        moduleId,
        templateFile,
        moduleResolvedRoot: moduleMetadata?.resolved?.root,
        moduleSourceRoot: moduleMetadata?.source?.root,
        marketplaceRoot,
      });

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

  private static async tryLoadFromUIMarketplace(
    templateFile: string,
    context?: ProjectContext
  ): Promise<string | null> {
    const uiRoot = this.getUIMarketplaceRoot(context);
    if (!uiRoot) {
      return null;
    }

    Logger.info('🎯 Resolving UI template', {
      operation: 'template_loading',
      templateFile,
      uiRoot
    });

    const normalizedRoot = uiRoot.endsWith(path.sep) ? uiRoot : `${uiRoot}${path.sep}`;

    const manifestResolved = await this.tryResolveViaUIManifest(templateFile, normalizedRoot);
    if (manifestResolved) {
      Logger.info('✅ UI template resolved via manifest', {
        operation: 'template_loading',
        templateFile,
        uiRoot
      });
      return manifestResolved;
    }

    if (templateFile.startsWith('ui/')) {
      const relativePath = templateFile.replace(/^ui\//, '');
      const directResolved = await this.readIfExists(path.join(normalizedRoot, relativePath));
      if (directResolved) {
        Logger.info('✅ UI template resolved directly from filesystem', {
          operation: 'template_loading',
          templateFile,
          candidatePath: path.join(normalizedRoot, relativePath)
        });
        return directResolved;
      }
    }

    if (templateFile.startsWith('components/ui/')) {
      const relativePath = templateFile.replace(/^components\/ui\//, '');
      const directResolved = await this.readIfExists(path.join(normalizedRoot, relativePath));
      if (directResolved) {
        Logger.info('✅ UI template resolved directly from filesystem', {
          operation: 'template_loading',
          templateFile,
          candidatePath: path.join(normalizedRoot, relativePath)
        });
        return directResolved;
      }
    }

    return null;
  }

  private static getUIMarketplaceRoot(context?: ProjectContext): string | null {
    const uiContext = (context as any)?.marketplace?.ui || {};
    if (typeof uiContext.root === 'string' && uiContext.root.trim()) {
      return uiContext.root;
    }
    if (typeof uiContext.path === 'string' && uiContext.path.trim()) {
      return uiContext.path;
    }

    const handler = (context as any)?.pathHandler as PathService | undefined;
    if (handler?.hasPath && typeof handler.hasPath === 'function') {
      try {
        if (handler.hasPath('ui.marketplace')) {
          return handler.getPath('ui.marketplace');
        }
        if (handler.hasPath('ui.path')) {
          return handler.getPath('ui.path');
        }
      } catch {
        // Ignore path resolution errors here; caller will provide fallback.
      }
    }

    return null;
  }

  private static uiManifestCache: Map<string, any> = new Map();

  private static async tryResolveViaUIManifest(
    templateFile: string,
    uiRoot: string
  ): Promise<string | null> {
    const manifest = await this.loadUIManifest(uiRoot);
    if (!manifest?.components) {
      Logger.info('⚠️ UI manifest missing components section', {
        operation: 'template_loading',
        uiRoot
      });
      return null;
    }

    const candidateKeys = this.deriveUIComponentKeys(templateFile);
    if (candidateKeys.length === 0) {
      Logger.info('⚠️ Unable to derive UI manifest keys', {
        operation: 'template_loading',
        templateFile
      });
      return null;
    }

    const manifestDir = uiRoot.replace(/[\\/]ui[\\/]?$/, '');
    Logger.info('🔍 Searching UI manifest for template', {
      operation: 'template_loading',
      templateFile,
      manifestDir,
      candidateKeys
    });
    for (const key of candidateKeys) {
      const entry = manifest.components[key];
      if (!entry?.path) {
        continue;
      }

      const resolvedPath = path.resolve(manifestDir, entry.path.replace(/^\.\//, ''));
      const content = await this.readIfExists(resolvedPath);
      if (content) {
        Logger.info('✅ UI template resolved via manifest entry', {
          operation: 'template_loading',
          templateFile,
          key,
          resolvedPath
        });
        return content;
      }
    }

    Logger.info('⚠️ UI manifest lookup failed for all candidates', {
      operation: 'template_loading',
      templateFile,
      candidateKeys
    });

    return null;
  }

  private static async loadUIManifest(uiRoot: string): Promise<any | null> {
    const manifestDir = uiRoot.replace(/[\\/]ui[\\/]?$/, '');
    if (this.uiManifestCache.has(manifestDir)) {
      return this.uiManifestCache.get(manifestDir);
    }

    const manifestPath = path.join(manifestDir, 'manifest.json');
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.uiManifestCache.set(manifestDir, parsed);
      Logger.info('✅ Loaded UI marketplace manifest', {
        operation: 'template_loading',
        manifestPath
      });
      return parsed;
    } catch (error) {
      Logger.debug('⚠️ UI marketplace manifest not found or invalid', {
        operation: 'template_loading',
        manifestPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.uiManifestCache.set(manifestDir, null);
      return null;
    }
  }

  private static deriveUIComponentKeys(templateFile: string): string[] {
    const normalized = templateFile.startsWith('components/ui/')
      ? templateFile.replace(/^components\/ui\//, '')
      : templateFile.startsWith('ui/')
        ? templateFile.replace(/^ui\//, '')
        : null;

    if (!normalized) {
      return [];
    }

    const parts = normalized.split('/');
    if (parts.length === 0) {
      return [];
    }

    const fileName = parts[parts.length - 1];
    if (!fileName) {
      return [];
    }
    const baseName = fileName.replace(/\.(tsx|ts|jsx|js)\.tpl$/i, '').replace(/\.tpl$/i, '');
    if (!baseName) {
      return [];
    }

    const candidateKeys = new Set<string>();
    candidateKeys.add(baseName);

    const camelKey = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    candidateKeys.add(camelKey);

    const pascalFromKebab = baseName
      .split(/[-_]/g)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('');
    candidateKeys.add(pascalFromKebab);

    const kebabFromPascal = baseName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();
    candidateKeys.add(kebabFromPascal);

    candidateKeys.add(baseName.toLowerCase());

    Logger.info('🔑 Derived UI manifest keys', {
      operation: 'template_loading',
      templateFile,
      normalized,
      candidateKeys: Array.from(candidateKeys)
    });

    return Array.from(candidateKeys);
  }

  private static async readIfExists(absolutePath: string): Promise<string | null> {
    try {
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      Logger.debug('⚠️ Template not found at expected UI marketplace path', {
        operation: 'template_loading',
        absolutePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

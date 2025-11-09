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
import { Logger } from '../infrastructure/logging/logger.js';
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
    static async loadTemplate(moduleId, templateFile, context) {
        // CONVENTION: If template starts with 'ui/', resolve from UI marketplace
        // IMPORTANT: Check this BEFORE any other processing to avoid fallback to core marketplace
        if (templateFile.startsWith('ui/')) {
            // Keep the full 'ui/...' path - UI marketplace root + ui/ directory structure
            const relativePath = templateFile; // Keep 'ui/architech-welcome/welcome-page.tsx.tpl'
            // Get UI marketplace from context (SINGLE SOURCE OF TRUTH)
            // Marketplace UI is initialized once by PathInitializationService and read-only after
            if (!context?.marketplace?.ui) {
                throw new Error(`Context or marketplace UI not available. ` +
                    `Expected context.marketplace.ui to be set by PathInitializationService. ` +
                    `Template: ${templateFile}`);
            }
            const uiFramework = context.marketplace.ui.default || null;
            const uiMarketplacePath = uiFramework ? context.marketplace.ui[uiFramework] : null;
            if (!uiFramework || !uiMarketplacePath) {
                throw new Error(`UI framework not initialized. ` +
                    `Expected context.marketplace.ui.default to be set by PathInitializationService. ` +
                    `Template: ${templateFile}, ` +
                    `Context marketplace: ${JSON.stringify(context?.marketplace)}`);
            }
            // Join UI marketplace root with full ui/... path
            // Example: /path/to/marketplace-shadcn + ui/architech-welcome/welcome-page.tsx.tpl
            const absolutePath = path.join(uiMarketplacePath, relativePath);
            try {
                return await fs.readFile(absolutePath, 'utf-8');
            }
            catch (error) {
                // Fallback: Try core marketplace if template doesn't exist in UI marketplace
                // This handles cases where a template exists in one UI marketplace (e.g., shadcn) but not another (e.g., tamagui)
                const coreMarketplacePath = context?.marketplace?.core;
                if (coreMarketplacePath) {
                    const coreAbsolutePath = path.join(coreMarketplacePath, relativePath);
                    try {
                        Logger.debug(`⚠️ UI template not found in ${uiFramework} marketplace, trying core marketplace`, {
                            operation: 'template_loading',
                            uiFramework: uiFramework,
                            uiPath: absolutePath,
                            corePath: coreAbsolutePath
                        });
                        return await fs.readFile(coreAbsolutePath, 'utf-8');
                    }
                    catch (coreError) {
                        // Both UI and core marketplaces failed - throw original error
                        const errorMsg = error instanceof Error ? error.message : String(error);
                        throw new Error(`UI template file not found in ${uiFramework} marketplace or core marketplace: ${absolutePath}\n` +
                            `UI Framework: ${uiFramework}\n` +
                            `UI Marketplace Path: ${uiMarketplacePath}\n` +
                            `Core Marketplace Path: ${coreMarketplacePath}\n` +
                            `Relative Path: ${relativePath}\n` +
                            `Template: ${templateFile}\n` +
                            `Error: ${errorMsg}`);
                    }
                }
                else {
                    // No core marketplace fallback available
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    throw new Error(`UI template file not found: ${absolutePath}\n` +
                        `UI Framework: ${uiFramework}\n` +
                        `UI Marketplace Path: ${uiMarketplacePath}\n` +
                        `Relative Path: ${relativePath}\n` +
                        `Template: ${templateFile}\n` +
                        `Error: ${errorMsg}`);
                }
            }
        }
        const moduleMetadata = context?.module;
        if (moduleMetadata?.resolved?.root &&
            !path.isAbsolute(templateFile) &&
            !templateFile.startsWith('ui/')) {
            const candidatePaths = [];
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
                }
                catch {
                    continue;
                }
            }
        }
        // Check if templateFile is an absolute path (legacy support)
        if (path.isAbsolute(templateFile)) {
            try {
                return await fs.readFile(templateFile, 'utf-8');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                throw new Error(`Template file not found: ${templateFile}\n` +
                    `Error: ${errorMsg}`);
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
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const suggestions = await this.getTemplateSuggestions(moduleMetadata, moduleId, templateFile);
            const modulePath = moduleMetadata?.resolved?.root || path.join(marketplaceRoot, resolvedModuleId);
            throw new Error(`Template file not found: ${templatePath}\n` +
                `Module: ${moduleId}\n` +
                `Template: ${templateFile}\n` +
                `Module path: ${modulePath}\n` +
                `Error: ${errorMsg}\n` +
                `Suggestions: ${suggestions.join(', ')}\n` +
                `Run 'npm run validate:templates' to check all templates.`);
        }
    }
    /**
     * Get template suggestions for better error messages
     */
    static async getTemplateSuggestions(moduleMetadata, moduleId, templateFile) {
        let templatesDir = null;
        if (moduleMetadata?.resolved?.root) {
            templatesDir = path.join(moduleMetadata.resolved.root, 'templates');
        }
        else {
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
        }
        catch {
            return ['Templates directory not found'];
        }
    }
    /**
     * Load feature manifest (feature.json) - convenience method
     */
    static async loadFeatureManifest(module) {
        return this.loadModuleConfig(module);
    }
    /**
     * Load module configuration (adapter.json, integration.json, or feature.json)
     */
    static async loadModuleConfig(module) {
        if (!module?.resolved?.manifest) {
            throw new Error(`Module ${module?.id || '<unknown>'} is missing resolved manifest metadata.`);
        }
        try {
            const content = await fs.readFile(module.resolved.manifest, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load module configuration for ${module.id}: ${message}`);
        }
    }
    /**
     * Get the absolute path to a module's blueprint file
     * This is the centralized, tested logic for blueprint path resolution.
     */
    static getBlueprintPath(module, blueprintFileName) {
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
    static async loadModuleBlueprint(module, blueprintFileName) {
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
    static async moduleExists(moduleId) {
        try {
            const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
            const resolvedModuleId = await PathService.resolveModuleId(moduleId);
            const modulePath = path.join(marketplaceRoot, resolvedModuleId);
            const stats = await fs.stat(modulePath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=marketplace-service.js.map
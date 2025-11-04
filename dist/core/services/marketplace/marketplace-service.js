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
            // Get UI marketplace path from context or detect
            let uiFramework = null;
            let uiMarketplacePath = null;
            if (context?.marketplace?.ui) {
                uiFramework = context.marketplace.ui.default || null;
                if (uiFramework) {
                    uiMarketplacePath = context.marketplace.ui[uiFramework] || null;
                }
            }
            // Fallback: detect from context parameters or auto-detect
            if (!uiFramework && context?.parameters?.uiFramework) {
                uiFramework = context.parameters.uiFramework;
            }
            // Resolve UI marketplace path if not in context
            if (!uiMarketplacePath && uiFramework) {
                uiMarketplacePath = await MarketplaceRegistry.getUIMarketplacePath(uiFramework);
            }
            // Final fallback: try to auto-detect
            if (!uiFramework || !uiMarketplacePath) {
                const available = await MarketplaceRegistry.getAvailableUIMarketplaces();
                if (available.length > 0 && available[0]) {
                    uiFramework = available[0];
                    uiMarketplacePath = await MarketplaceRegistry.getUIMarketplacePath(uiFramework);
                }
            }
            if (!uiMarketplacePath) {
                throw new Error(`Cannot resolve UI marketplace path for template: ${templateFile}. ` +
                    `Please specify uiFramework in context or ensure a UI marketplace is available. ` +
                    `Context marketplace: ${JSON.stringify(context?.marketplace)}`);
            }
            // Join UI marketplace root with full ui/... path
            // Example: /path/to/marketplace-shadcn + ui/architech-welcome/welcome-page.tsx.tpl
            const absolutePath = path.join(uiMarketplacePath, relativePath);
            try {
                return await fs.readFile(absolutePath, 'utf-8');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                throw new Error(`UI template file not found: ${absolutePath}\n` +
                    `UI Framework: ${uiFramework}\n` +
                    `UI Marketplace Path: ${uiMarketplacePath}\n` +
                    `Relative Path: ${relativePath}\n` +
                    `Template: ${templateFile}\n` +
                    `Error: ${errorMsg}`);
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
            // Enhanced error message with suggestions
            const suggestions = await this.getTemplateSuggestions(moduleId, templateFile);
            const modulePath = path.join(marketplaceRoot, resolvedModuleId);
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
    static async getTemplateSuggestions(moduleId, templateFile) {
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
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
        }
        catch {
            return ['Templates directory not found'];
        }
    }
    /**
     * Load feature manifest (feature.json) - convenience method
     */
    static async loadFeatureManifest(moduleId) {
        return this.loadModuleConfig(moduleId);
    }
    /**
     * Load module configuration (adapter.json, integration.json, or feature.json)
     */
    static async loadModuleConfig(moduleId) {
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
        const resolvedModuleId = await PathService.resolveModuleId(moduleId);
        // Determine config file name based on module type
        let configFileNames;
        if (resolvedModuleId.startsWith('integrations/')) {
            configFileNames = ['integration.json'];
        }
        else if (resolvedModuleId.startsWith('connectors/')) {
            configFileNames = ['connector.json', 'integration.json']; // Try both for connectors
        }
        else if (resolvedModuleId.startsWith('features/')) {
            configFileNames = ['feature.json'];
        }
        else {
            configFileNames = ['adapter.json'];
        }
        // Try each config file name until one is found
        let lastError = null;
        for (const configFileName of configFileNames) {
            const configPath = path.join(marketplaceRoot, resolvedModuleId, configFileName);
            try {
                const configContent = await fs.readFile(configPath, 'utf-8');
                return JSON.parse(configContent);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                continue; // Try next config file name
            }
        }
        // If we get here, no config file was found
        throw new Error(`Module configuration not found for ${moduleId}. ` +
            `Tried: ${configFileNames.join(', ')}. ` +
            `Last error: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * Get the absolute path to a module's blueprint file
     * This is the centralized, tested logic for blueprint path resolution.
     */
    static async getBlueprintPath(moduleId, blueprintFileName) {
        const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
        const resolvedModuleId = await PathService.resolveModuleId(moduleId);
        // Get blueprint file name from config if not provided
        let finalBlueprintFileName;
        if (!blueprintFileName) {
            const config = await this.loadModuleConfig(moduleId);
            finalBlueprintFileName = config.blueprint?.file || 'blueprint.js';
            // Convert .ts extension to .js since we compile blueprints
            if (finalBlueprintFileName.endsWith('.ts')) {
                finalBlueprintFileName = finalBlueprintFileName.replace(/\.ts$/, '.js');
            }
        }
        else {
            finalBlueprintFileName = blueprintFileName;
        }
        // Return absolute path to blueprint from compiled dist directory
        return path.join(marketplaceRoot, 'dist', resolvedModuleId, finalBlueprintFileName);
    }
    /**
     * Load module blueprint using BlueprintLoader
     */
    static async loadModuleBlueprint(moduleId, blueprintFileName) {
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
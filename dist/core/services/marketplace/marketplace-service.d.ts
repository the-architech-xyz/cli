/**
 * Marketplace Service
 *
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 *
 * Uses MarketplaceRegistry as the single source of truth for marketplace paths.
 */
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { Module } from '@thearchitech.xyz/types';
export declare class MarketplaceService {
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
    static loadTemplate(moduleId: string, templateFile: string, context?: ProjectContext): Promise<string>;
    /**
     * Get template suggestions for better error messages
     */
    private static getTemplateSuggestions;
    /**
     * Load feature manifest (feature.json) - convenience method
     */
    static loadFeatureManifest(module: Module): Promise<any>;
    /**
     * Load module configuration (adapter.json, integration.json, or feature.json)
     */
    static loadModuleConfig(module: Module): Promise<any>;
    /**
     * Get the absolute path to a module's blueprint file
     * This is the centralized, tested logic for blueprint path resolution.
     */
    static getBlueprintPath(module: Module, blueprintFileName?: string): string;
    /**
     * Load module blueprint using BlueprintLoader
     */
    static loadModuleBlueprint(module: Module, blueprintFileName?: string): Promise<any>;
    /**
     * Check if a module exists in the marketplace
     */
    static moduleExists(moduleId: string): Promise<boolean>;
}

/**
 * Marketplace Service
 *
 * Centralized service for all marketplace-related operations.
 * Handles module loading, template loading, and path resolution.
 */
export declare class MarketplaceService {
    /**
     * Load template content from marketplace
     */
    static loadTemplate(moduleId: string, templateFile: string): Promise<string>;
    /**
     * Get template suggestions for better error messages
     */
    private static getTemplateSuggestions;
    /**
     * Load feature manifest (feature.json) - convenience method
     */
    static loadFeatureManifest(moduleId: string): Promise<any>;
    /**
     * Load module configuration (adapter.json, integration.json, or feature.json)
     */
    static loadModuleConfig(moduleId: string): Promise<any>;
    /**
     * Get the absolute path to a module's blueprint file
     * This is the centralized, tested logic for blueprint path resolution.
     */
    static getBlueprintPath(moduleId: string, blueprintFileName?: string): Promise<string>;
    /**
     * Load module blueprint using BlueprintLoader
     */
    static loadModuleBlueprint(moduleId: string, blueprintFileName?: string): Promise<any>;
    /**
     * Check if a module exists in the marketplace
     */
    static moduleExists(moduleId: string): Promise<boolean>;
}

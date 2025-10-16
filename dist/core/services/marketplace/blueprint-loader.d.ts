/**
 * Centralized Blueprint Loader
 *
 * Handles all blueprint export patterns consistently:
 * - default exports
 * - named exports (moduleNameBlueprint)
 * - wrapped objects
 * - mixed exports
 */
export interface BlueprintLoaderResult {
    success: boolean;
    blueprint?: any;
    error?: string;
    exportType?: 'default' | 'named' | 'wrapped';
}
export declare class BlueprintLoader {
    /**
     * Load and normalize a blueprint from a module
     */
    static loadBlueprint(moduleId: string, blueprintPath: string): Promise<BlueprintLoaderResult>;
    /**
     * Try to get blueprint from default export
     */
    private static tryDefaultExport;
    /**
     * Try to get blueprint from named export (moduleNameBlueprint)
     */
    private static tryNamedExport;
    /**
     * Try to get blueprint from wrapped export
     */
    private static tryWrappedExport;
    /**
     * Check if an object is a valid blueprint
     */
    private static isBlueprint;
}

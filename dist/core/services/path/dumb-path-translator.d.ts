/**
 * Dumb Path Translator
 *
 * The CLI knows nothing about module types. It just performs simple string transformations
 * to convert semantic IDs to file system paths. This is the only "intelligence" in the CLI.
 */
export declare class DumbPathTranslator {
    private static marketplaceRoot;
    /**
     * The ONLY intelligence in the CLI: dumb string transformation
     *
     * Rules:
     * 1. Take the part before the ':', add an 's', use as first folder
     * 2. Take the part after the ':', use as the rest of the path
     *
     * Examples:
     * - connector:docker-drizzle -> connectors/docker-drizzle
     * - feature:teams/backend/nextjs-drizzle -> features/teams/backend/nextjs-drizzle
     * - adapter:database/drizzle -> adapters/database/drizzle
     */
    static translateModuleId(moduleId: string): Promise<string>;
    /**
     * Get the full file system path for a module
     */
    static getModulePath(moduleId: string): Promise<string>;
    /**
     * Check if a module exists
     */
    static moduleExists(moduleId: string): Promise<boolean>;
    /**
     * Get marketplace root directory
     */
    private static getMarketplaceRoot;
}

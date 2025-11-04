/**
 * Marketplace Registry
 *
 * Centralized service for discovering and resolving marketplace paths
 * Supports both core marketplace and UI marketplaces (shadcn, tamagui, etc.)
 *
 * Handles:
 * - Dev vs prod environment detection
 * - Automatic path resolution for both core and UI marketplaces
 * - CLI flag overrides for custom paths
 */
export declare class MarketplaceRegistry {
    private static corePath;
    private static uiPaths;
    private static overrides;
    /**
     * Get core marketplace path (features, adapters, connectors)
     */
    static getCoreMarketplacePath(): Promise<string>;
    /**
     * Get UI marketplace path for a framework (shadcn, tamagui, etc.)
     */
    static getUIMarketplacePath(framework: string): Promise<string>;
    /**
     * Resolve path (dev first, fallback to prod)
     */
    private static resolvePath;
    /**
     * Set override path for a marketplace
     */
    static setMarketplacePath(name: string, path: string): void;
    /**
     * Clear all overrides and caches
     */
    static reset(): void;
    /**
     * Check if a marketplace exists
     */
    static marketplaceExists(name: 'core' | string): Promise<boolean>;
    /**
     * Get all available UI marketplaces
     */
    static getAvailableUIMarketplaces(): Promise<string[]>;
}

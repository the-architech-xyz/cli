/**
 * Path Key Registry
 *
 * Loads and validates marketplace-specific path key definitions.
 * Provides validation and lookup for path keys used in blueprints.
 */
import { MarketplacePathKeys } from '@thearchitech.xyz/types';
export declare class PathKeyRegistry {
    private static cache;
    private static defaultPathKeys;
    /**
     * Load path keys from marketplace
     * Falls back to default PathKey enum if marketplace doesn't define path-keys.json
     */
    static loadPathKeys(marketplaceName?: string): Promise<MarketplacePathKeys>;
    /**
     * Get default path keys (from PathKey enum)
     * Used as fallback when marketplace doesn't define path-keys.json
     */
    private static getDefaultPathKeys;
    /**
     * Validate path key definition structure
     */
    private static validatePathKeys;
    /**
     * Check if a path key is valid for the marketplace
     */
    static isValidPathKey(key: string, marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<boolean>;
    /**
     * Get all valid path keys for a marketplace and structure
     */
    static getValidPathKeys(marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<string[]>;
    /**
     * Validate path key usage in a template string
     * Returns validation result with errors and suggestions
     */
    static validatePathKeyUsage(template: string, marketplaceName?: string, projectStructure?: 'monorepo' | 'single-app'): Promise<{
        valid: boolean;
        errors: Array<{
            key: string;
            message: string;
        }>;
        suggestions: string[];
    }>;
    /**
     * Get suggestions for a misspelled path key
     */
    private static getSuggestions;
    /**
     * Calculate string similarity (simple implementation)
     */
    private static similarity;
    /**
     * Calculate Levenshtein distance
     */
    private static levenshteinDistance;
    /**
     * Clear cache (useful for testing or reloading)
     */
    static clearCache(): void;
}

/**
 * Cache Manager Service
 *
 * Manages local caching of blueprints and templates from the marketplace.
 * Provides intelligent caching with version management and cleanup.
 *
 * @author The Architech Team
 * @version 1.0.0
 */
export interface CacheEntry {
    moduleId: string;
    version: string;
    content: any;
    lastAccessed: Date;
    size: number;
}
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
}
export declare class CacheManagerService {
    private cacheDir;
    private maxCacheSize;
    private maxAge;
    constructor();
    /**
     * Initialize the cache directory
     */
    initialize(): Promise<void>;
    /**
     * Check if a module exists in cache
     */
    has(moduleId: string, version: string): Promise<boolean>;
    /**
     * Get a module from cache
     */
    get(moduleId: string, version: string): Promise<any | null>;
    /**
     * Set a module in cache
     */
    set(moduleId: string, version: string, content: any): Promise<void>;
    /**
     * Remove a module from cache
     */
    remove(moduleId: string, version: string): Promise<void>;
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<CacheStats>;
    /**
     * Clean up old entries if cache is too large
     */
    private cleanupIfNeeded;
    /**
     * Remove oldest entries to free up space
     */
    private cleanupOldEntries;
    /**
     * Generate cache key for module
     */
    private getCacheKey;
}

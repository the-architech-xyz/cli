/**
 * Cache Manager Service
 *
 * Manages local caching of blueprints and templates from the marketplace.
 * Provides intelligent caching with version management and cleanup.
 *
 * @author The Architech Team
 * @version 1.0.0
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
export class CacheManagerService {
    cacheDir;
    maxCacheSize; // in bytes
    maxAge; // in milliseconds
    constructor() {
        this.cacheDir = path.join(os.homedir(), '.architech', 'cache');
        this.maxCacheSize = 100 * 1024 * 1024; // 100MB
        this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }
    /**
     * Initialize the cache directory
     */
    async initialize() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to initialize cache directory: ${error}`);
        }
    }
    /**
     * Check if a module exists in cache
     */
    async has(moduleId, version) {
        try {
            const cacheKey = this.getCacheKey(moduleId, version);
            const cachePath = path.join(this.cacheDir, cacheKey);
            const stats = await fs.stat(cachePath);
            const isExpired = Date.now() - stats.mtime.getTime() > this.maxAge;
            if (isExpired) {
                await this.remove(moduleId, version);
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get a module from cache
     */
    async get(moduleId, version) {
        try {
            if (!(await this.has(moduleId, version))) {
                return null;
            }
            const cacheKey = this.getCacheKey(moduleId, version);
            const cachePath = path.join(this.cacheDir, cacheKey);
            const content = await fs.readFile(cachePath, 'utf-8');
            const entry = JSON.parse(content);
            // Update last accessed time
            entry.lastAccessed = new Date();
            await this.set(moduleId, version, entry.content);
            return entry.content;
        }
        catch (error) {
            console.warn(`Failed to get module from cache: ${error}`);
            return null;
        }
    }
    /**
     * Set a module in cache
     */
    async set(moduleId, version, content) {
        try {
            const cacheKey = this.getCacheKey(moduleId, version);
            const cachePath = path.join(this.cacheDir, cacheKey);
            const entry = {
                moduleId,
                version,
                content,
                lastAccessed: new Date(),
                size: JSON.stringify(content).length
            };
            await fs.writeFile(cachePath, JSON.stringify(entry, null, 2));
            // Check if we need to clean up old entries
            await this.cleanupIfNeeded();
        }
        catch (error) {
            throw new Error(`Failed to cache module: ${error}`);
        }
    }
    /**
     * Remove a module from cache
     */
    async remove(moduleId, version) {
        try {
            const cacheKey = this.getCacheKey(moduleId, version);
            const cachePath = path.join(this.cacheDir, cacheKey);
            await fs.unlink(cachePath);
        }
        catch (error) {
            // Ignore errors when removing non-existent files
        }
    }
    /**
     * Clear all cache entries
     */
    async clear() {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(files.map(file => fs.unlink(path.join(this.cacheDir, file))));
        }
        catch (error) {
            throw new Error(`Failed to clear cache: ${error}`);
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const files = await fs.readdir(this.cacheDir);
            let totalSize = 0;
            let totalEntries = 0;
            let oldestEntry = null;
            let newestEntry = null;
            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
                totalEntries++;
                if (!oldestEntry || stats.mtime < oldestEntry) {
                    oldestEntry = stats.mtime;
                }
                if (!newestEntry || stats.mtime > newestEntry) {
                    newestEntry = stats.mtime;
                }
            }
            return {
                totalEntries,
                totalSize,
                oldestEntry,
                newestEntry
            };
        }
        catch (error) {
            return {
                totalEntries: 0,
                totalSize: 0,
                oldestEntry: null,
                newestEntry: null
            };
        }
    }
    /**
     * Clean up old entries if cache is too large
     */
    async cleanupIfNeeded() {
        const stats = await this.getStats();
        if (stats.totalSize > this.maxCacheSize) {
            await this.cleanupOldEntries();
        }
    }
    /**
     * Remove oldest entries to free up space
     */
    async cleanupOldEntries() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const fileStats = await Promise.all(files.map(async (file) => {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);
                return { file, path: filePath, mtime: stats.mtime };
            }));
            // Sort by modification time (oldest first)
            fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
            // Remove oldest 25% of files
            const filesToRemove = fileStats.slice(0, Math.ceil(fileStats.length * 0.25));
            await Promise.all(filesToRemove.map(({ path: filePath }) => fs.unlink(filePath)));
        }
        catch (error) {
            console.warn(`Failed to cleanup old cache entries: ${error}`);
        }
    }
    /**
     * Generate cache key for module
     */
    getCacheKey(moduleId, version) {
        const sanitizedId = moduleId.replace(/[^a-zA-Z0-9-_]/g, '_');
        return `${sanitizedId}@${version}.json`;
    }
}
//# sourceMappingURL=cache-manager.js.map
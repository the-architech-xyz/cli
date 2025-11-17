/**
 * Genome Resolver Service
 *
 * Main service for resolving genome shorthands to actual file paths.
 * Simplified implementation without strategy pattern.
 *
 * Resolution order:
 * 1. Check if input is already a file path → use directly
 * 2. Try local marketplace (../marketplace/genomes/official/)
 * 3. Throw helpful error with suggestions
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
export class GenomeResolver {
    config;
    cache = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Main resolution method
     * Tries file path first, then local marketplace
     */
    async resolve(input, options) {
        // Validate input
        if (!input || input.trim() === '') {
            throw new Error('Genome input cannot be empty');
        }
        const trimmedInput = input.trim();
        // Check cache first (unless skipCache is true)
        if (!options?.skipCache && this.cache.has(trimmedInput)) {
            return this.cache.get(trimmedInput);
        }
        // Try file path resolution first
        if (this.looksLikeFilePath(trimmedInput)) {
            try {
                const resolved = await this.resolveFilePath(trimmedInput);
                if (resolved) {
                    this.cache.set(trimmedInput, resolved);
                    return resolved;
                }
            }
            catch (error) {
                // File path failed, try marketplace
            }
        }
        // Try local marketplace resolution
        try {
            const resolved = await this.resolveLocalMarketplace(trimmedInput);
            if (resolved) {
                this.cache.set(trimmedInput, resolved);
                return resolved;
            }
        }
        catch (error) {
            // Marketplace resolution failed
        }
        // No resolution succeeded - throw helpful error
        throw this.createNotFoundError(trimmedInput, options);
    }
    /**
     * Check if input looks like a file path
     */
    looksLikeFilePath(input) {
        return input.includes('/') ||
            input.includes('\\') ||
            input.endsWith('.genome.ts') ||
            input.endsWith('.ts') ||
            input.startsWith('.') ||
            input.startsWith('~') ||
            path.isAbsolute(input);
    }
    /**
     * Resolve as file path
     * @private
     */
    async resolveFilePath(input) {
        if (!this.looksLikeFilePath(input)) {
            return null;
        }
        // Resolve to absolute path
        const absolutePath = path.resolve(process.cwd(), input);
        // Verify file exists
        try {
            const stats = await fs.stat(absolutePath);
            if (!stats.isFile()) {
                throw new Error(`Path exists but is not a file: ${absolutePath}`);
            }
            // Verify it's a .genome.ts file
            if (!absolutePath.endsWith('.genome.ts') && !absolutePath.endsWith('.ts')) {
                throw new Error(`File must be a .genome.ts file: ${absolutePath}`);
            }
            return {
                name: path.basename(absolutePath, '.genome.ts').replace(/^\d+-/, ''),
                path: absolutePath,
                source: 'file-path'
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Genome file not found: ${absolutePath}\n` +
                    `Tip: Make sure the file path is correct and the file exists.`);
            }
            throw error;
        }
    }
    /**
     * Resolve from local marketplace
     * @private
     */
    async resolveLocalMarketplace(input) {
        if (this.looksLikeFilePath(input)) {
            return null;
        }
        try {
            // Get marketplace root
            const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
            const normalized = input;
            const officialPath = path.join(marketplaceRoot, 'genomes', 'official', `${normalized}.genome.ts`);
            try {
                await fs.access(officialPath);
                return {
                    name: input, // Use original input as display name
                    path: officialPath,
                    source: 'local-marketplace'
                };
            }
            catch {
                // Not in official directory
            }
            // Try community genomes (future)
            const communityPath = path.join(marketplaceRoot, 'genomes', 'community', `${normalized}.genome.ts`);
            try {
                await fs.access(communityPath);
                return {
                    name: input,
                    path: communityPath,
                    source: 'local-marketplace'
                };
            }
            catch {
                // Not in community directory either
            }
            // Not found in local marketplace
            return null;
        }
        catch (error) {
            // Marketplace root not found - this strategy can't be used
            return null;
        }
    }
    /**
     * List all available genomes in local marketplace
     */
    async listAvailable() {
        try {
            const marketplaceRoot = await MarketplaceRegistry.getCoreMarketplacePath();
            const officialDir = path.join(marketplaceRoot, 'genomes', 'official');
            const files = await fs.readdir(officialDir);
            return files
                .filter(f => f.endsWith('.genome.ts'))
                .map(f => f.replace('.genome.ts', '').replace(/^\d+-/, ''))
                .sort();
        }
        catch {
            return [];
        }
    }
    async createNotFoundError(input, _options) {
        return new Error(`Genome not found: "${input}".\n` +
            `Specify a full path (architech new /path/to/genome.genome.ts) or use --list to view available genomes.`);
    }
    /**
     * Clear resolution cache
     */
    clearCache() {
        this.cache.clear();
    }
}
/**
 * Create a GenomeResolver with default configuration.
 * Simplified implementation without strategy pattern.
 */
export function createGenomeResolver(config) {
    return new GenomeResolver(config);
}
/**
 * Create a GenomeResolver using configuration loaded from disk.
 */
export async function createGenomeResolverFromConfig(configPath) {
    const config = await loadResolverConfig(configPath);
    return createGenomeResolver(config);
}
async function loadResolverConfig(configPath) {
    const { ArchitechConfigLoader } = await import('../config/index.js');
    try {
        return await ArchitechConfigLoader.load(configPath || process.cwd());
    }
    catch (error) {
        console.warn('Could not load architech config, using default genome resolver.');
        return undefined;
    }
}
//# sourceMappingURL=genome-resolver.js.map
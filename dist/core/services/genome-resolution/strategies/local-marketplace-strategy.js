/**
 * Local Marketplace Resolution Strategy
 *
 * Resolves genomes from the local marketplace directory.
 * Checks: ../marketplace/genomes/official/{name}.genome.ts
 *
 * Supports aliases (saas-starter → 03-full-saas-platform)
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarketplaceRegistry } from '../../marketplace/marketplace-registry.js';
export class LocalMarketplaceStrategy {
    resolver;
    name = 'local-marketplace';
    constructor(resolver) {
        this.resolver = resolver;
    }
    /**
     * Can handle any non-path input
     */
    canHandle(input) {
        return !this.resolver.looksLikeFilePath(input);
    }
    /**
     * Resolve from local marketplace
     */
    async resolve(input) {
        if (!this.canHandle(input)) {
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
}
//# sourceMappingURL=local-marketplace-strategy.js.map
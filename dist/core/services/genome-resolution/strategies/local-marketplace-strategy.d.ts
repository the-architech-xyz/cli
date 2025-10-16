/**
 * Local Marketplace Resolution Strategy
 *
 * Resolves genomes from the local marketplace directory.
 * Checks: ../marketplace/genomes/official/{name}.genome.ts
 *
 * Supports aliases (saas-starter → 03-full-saas-platform)
 */
import { IResolutionStrategy, ResolvedGenome } from '../types.js';
import { GenomeResolver } from '../genome-resolver.js';
export declare class LocalMarketplaceStrategy implements IResolutionStrategy {
    private resolver;
    readonly name = "local-marketplace";
    constructor(resolver: GenomeResolver);
    /**
     * Can handle any non-path input
     */
    canHandle(input: string): boolean;
    /**
     * Resolve from local marketplace
     */
    resolve(input: string): Promise<ResolvedGenome | null>;
    /**
     * List all available genomes in local marketplace
     */
    listAvailable(): Promise<string[]>;
}

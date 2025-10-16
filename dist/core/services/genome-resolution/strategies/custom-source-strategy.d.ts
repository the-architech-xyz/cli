/**
 * Custom Source Resolution Strategy
 *
 * Resolves genomes from user-defined custom sources.
 * Sources can be:
 * - Local directories (company genomes, personal collections)
 * - Git repositories (future)
 * - HTTP(S) URLs (future)
 *
 * Configured via architech.config.json
 */
import { IResolutionStrategy, ResolvedGenome, GenomeSourceConfig } from '../types.js';
import { GenomeResolver } from '../genome-resolver.js';
export declare class CustomSourceStrategy implements IResolutionStrategy {
    private resolver;
    private sourceConfig;
    readonly name: string;
    constructor(resolver: GenomeResolver, sourceConfig: GenomeSourceConfig);
    /**
     * Can handle any non-path input
     */
    canHandle(input: string): boolean;
    /**
     * Resolve from custom source
     */
    resolve(input: string): Promise<ResolvedGenome | null>;
    /**
     * Resolve from local directory
     */
    private resolveFromLocal;
    /**
     * Resolve from Git repository (Future Feature)
     */
    private resolveFromGit;
    /**
     * Resolve from custom NPM registry (Future Feature)
     */
    private resolveFromNpm;
    /**
     * Resolve from HTTP(S) URL (Future Feature)
     */
    private resolveFromUrl;
}

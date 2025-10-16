/**
 * NPM Package Resolution Strategy
 *
 * Resolves genomes from installed NPM packages.
 * Checks: node_modules/@architech/marketplace/genomes/official/{name}.genome.ts
 *
 * This enables users to install marketplace as npm package and use genomes seamlessly.
 */
import { IResolutionStrategy, ResolvedGenome } from '../types.js';
import { GenomeResolver } from '../genome-resolver.js';
export declare class NpmPackageStrategy implements IResolutionStrategy {
    private resolver;
    private packageName;
    readonly name = "npm-package";
    constructor(resolver: GenomeResolver, packageName?: string);
    /**
     * Can handle any non-path input
     */
    canHandle(input: string): boolean;
    /**
     * Resolve from NPM package
     */
    resolve(input: string): Promise<ResolvedGenome | null>;
    /**
     * Check if NPM package is installed
     */
    isPackageInstalled(): Promise<boolean>;
    /**
     * Get package version if installed
     */
    getPackageVersion(): Promise<string | null>;
}

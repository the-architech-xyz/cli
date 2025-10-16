/**
 * File Path Resolution Strategy
 *
 * Handles direct file path inputs (relative or absolute).
 * This is the highest priority strategy - if user provides a path, use it directly.
 */
import { IResolutionStrategy, ResolvedGenome } from '../types.js';
import { GenomeResolver } from '../genome-resolver.js';
export declare class FilePathStrategy implements IResolutionStrategy {
    private resolver;
    readonly name = "file-path";
    constructor(resolver: GenomeResolver);
    /**
     * Check if input looks like a file path
     */
    canHandle(input: string): boolean;
    /**
     * Resolve as file path
     */
    resolve(input: string): Promise<ResolvedGenome | null>;
}

/**
 * Resolved Genome Types
 *
 * Types for genomes after transformation. These distinguish transformed genomes
 * from raw input genomes, ensuring type safety throughout the transformation pipeline.
 */
import type { Genome, Module } from './recipe.js';
/**
 * Metadata about a module in the resolved genome
 */
export interface ModuleMetadata {
    id: string;
    category: string;
    type: string;
    marketplace: {
        name: string;
    };
    source: {
        root: string;
        marketplace: string;
    };
    manifest: {
        file: string;
    };
    blueprint: {
        file: string;
        runtime: 'source' | 'compiled';
    };
    templates: string[];
    parameters?: Record<string, unknown>;
}
/**
 * Bootstrap metadata for framework initialization
 */
export interface BootstrapMetadata {
    frameworks?: Array<{
        id: string;
        frameworkId: string;
        parameters?: Record<string, unknown>;
        features?: Record<string, unknown>;
    }>;
}
/**
 * Metadata added during genome transformation
 */
export interface ResolvedGenomeMetadata {
    moduleIndex: Record<string, ModuleMetadata>;
    bootstrap?: BootstrapMetadata;
    transformationMode?: 'opinionated' | 'agnostic';
    [key: string]: unknown;
}
/**
 * Module after transformation (guaranteed to have all required fields)
 */
export interface ResolvedModule extends Module {
}
/**
 * Genome after transformation
 *
 * Key differences from input Genome:
 * - modules is always populated (never empty)
 * - metadata.moduleIndex always exists
 * - metadata.bootstrap may exist
 */
export interface ResolvedGenome extends Genome {
    modules: ResolvedModule[];
    metadata: ResolvedGenomeMetadata;
}

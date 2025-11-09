/**
 * Genome Module Converter
 *
 * Converts TypedGenomeModule (from marketplace) to Module (expected by CLI)
 * This bridges the gap between genome authoring types and execution types.
 */
import { GenomeModule, Module } from '@thearchitech.xyz/types';
/**
 * Convert GenomeModule to Module format expected by CLI
 *
 * Preserves metadata like targetPackage from genome module definitions
 */
export declare function convertGenomeModuleToModule(genomeModule: GenomeModule): Module;
/**
 * Convert array of GenomeModule to array of Module
 */
export declare function convertGenomeModulesToModules(genomeModules: GenomeModule[]): Module[];

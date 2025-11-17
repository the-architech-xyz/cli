/**
 * Genome Helper Functions
 *
 * Type-safe helper functions for accessing Genome/ResolvedGenome properties.
 * These functions handle backward compatibility and provide type-safe access
 * to project structure, framework, and apps.
 */
import type { ResolvedGenome, FrameworkApp } from '@thearchitech.xyz/types';
/**
 * Get the project framework, checking new structure (apps) first, then legacy (framework).
 * Returns undefined if no framework is found.
 */
export declare function getProjectFramework(genome: ResolvedGenome): string | undefined;
/**
 * Get the project structure type, defaulting to 'single-app' if not specified.
 */
export declare function getProjectStructure(genome: ResolvedGenome): 'monorepo' | 'single-app';
/**
 * Get the project apps array, returning empty array if not specified.
 */
export declare function getProjectApps(genome: ResolvedGenome): FrameworkApp[];
/**
 * Get the project monorepo configuration, returning undefined if not specified.
 */
export declare function getProjectMonorepo(genome: ResolvedGenome): import("@thearchitech.xyz/types").MonorepoConfig | undefined;
/**
 * Check if the project is a monorepo structure.
 */
export declare function isMonorepo(genome: ResolvedGenome): boolean;
/**
 * Get project metadata properties with type safety.
 * Returns undefined if property doesn't exist.
 */
export declare function getProjectProperty<K extends keyof ResolvedGenome['project']>(genome: ResolvedGenome, key: K): ResolvedGenome['project'][K];

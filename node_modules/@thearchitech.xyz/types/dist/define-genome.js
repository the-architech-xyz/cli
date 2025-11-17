/**
 * Define Genome with Full Type Safety
 *
 * This module provides the defineGenome function with complete type safety
 * for genome definitions, including autocompletion for module IDs and parameter validation.
 */
/**
 * Define a genome with full type safety
 *
 * @param genome - The genome configuration with type safety
 * @returns The genome with validated types
 *
 * @example
 * ```typescript
 * import { defineGenome } from '@thearchitech.xyz/types';
 *
 * const genome = defineGenome({
 *   version: '1.0',
 *   project: {
 *     name: 'my-app',
 *     framework: 'nextjs'
 *   },
 *   modules: [
 *     {
 *       id: 'adapter:database/drizzle', // ✅ Autocompletion works
 *       parameters: {
 *         features: {
 *           migrations: true, // ✅ Type-safe parameters
 *           studio: false
 *         }
 *       }
 *     }
 *   ]
 * });
 * ```
 */
export function defineGenome(genome) {
    genome.modules = genome.modules.map((module) => {
        const normalized = { ...module };
        normalized.category = normalized.category || normalized.id.split('/')[0] || 'module';
        normalized.version = normalized.version || 'latest';
        normalized.parameters = normalized.parameters || {};
        normalized.features = normalized.features || {};
        normalized.externalFiles = normalized.externalFiles || [];
        return normalized;
    });
    return genome;
}

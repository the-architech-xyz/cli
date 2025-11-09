/**
 * Genome Resolution Module
 * 
 * Provides genome resolution services to enable user-friendly shorthand syntax
 * while maintaining support for direct file paths.
 * 
 * Usage:
 *   const resolver = createGenomeResolver();
 *   const resolved = await resolver.resolve('saas-starter');
 *   // Returns: { name: 'saas-starter', path: '/abs/path/to/03-full-saas-platform.genome.ts', ... }
 */

export { GenomeResolver, createGenomeResolver, createGenomeResolverFromConfig } from './genome-resolver.js';
export * from './types.js';
export * from './strategies/index.js';


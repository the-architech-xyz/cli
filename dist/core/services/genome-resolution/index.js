/**
 * Genome Resolution Module
 *
 * Provides genome resolution services to enable user-friendly shorthand syntax
 * while maintaining support for direct file paths.
 *
 * Usage:
 *   const resolver = GenomeResolverFactory.createDefault();
 *   const resolved = await resolver.resolve('saas-starter');
 *   // Returns: { name: 'saas-starter', path: '/abs/path/to/03-full-saas-platform.genome.ts', ... }
 */
export { GenomeResolver } from './genome-resolver.js';
export { GenomeResolverFactory } from './genome-resolver-factory.js';
export * from './types.js';
export * from './strategies/index.js';
//# sourceMappingURL=index.js.map
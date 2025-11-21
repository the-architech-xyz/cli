/**
 * Composition Engine Services
 * 
 * V2 Composition Engine for resolving packages to modules
 * and generating lock files.
 */

export { CompositionEngine } from './composition-engine.js';
export { RecipeExpander } from './recipe-expander.js';
export { DependencyResolver } from './dependency-resolver.js';
export { LockFileService } from './lock-file-service.js';
export { V2GenomeHandler } from './v2-genome-handler.js';

export type { Logger } from './recipe-expander.js';


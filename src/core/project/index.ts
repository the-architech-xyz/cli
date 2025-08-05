/**
 * Project Management - Core Module
 * 
 * Consolidated project management that includes:
 * - Project structure management
 * - Configuration management
 * - Context factory
 */

export { structureService, StructureService } from './structure-service.js';
export { ConfigurationManager } from './configuration-manager.js';
export { ContextFactory } from './context-factory.js';

// Re-export types for convenience
export type {
  ProjectStructure,
  StructureInfo,
  UserPreference,
  PathInfo
} from './structure-service.js'; 
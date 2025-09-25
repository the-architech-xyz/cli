/**
 * Core Services - Main Entry Point
 * 
 * Exports all core services for The Architech
 */

// Adapter System
export * from './module-management/adapter/adapter-loader.js';

// Blueprint System
export * from './execution/blueprint/blueprint-executor.js';

// Path Management
export * from './path/path-service.js';

// Project Management
export * from './project/project-manager.js';

// Genome System
export * from './module-management/genome/genome-registry.js';

// Template System
export * from './file-system/template/index.js';

// Error Handling System
export * from './infrastructure/error/index.js';

// Module Loader System
export * from './module-management/module-loader/index.js';

// Agent Execution System
export * from './execution/agent-execution/index.js';

// Logging System
export * from './infrastructure/logging/index.js';

// File System
export * from './file-system/file-engine/index.js';

// Modifiers
export * from './file-system/modifiers/modifier-registry.js';
export * from './file-system/modifiers/modifier-service.js';

// Integration
export * from './integration/integration-registry.js';
export * from './integration/integration-executor.js';

// Marketplace
export * from './marketplace/marketplace-manager.js';

// Module Management
export * from './module-management/fetcher/module-fetcher.js';

// Cache
export * from './infrastructure/cache/cache-manager.js';

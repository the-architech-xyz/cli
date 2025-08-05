/**
 * Core Module Exports
 * 
 * Central export point for all core functionality.
 */

// CLI utilities
export * from './cli/command-runner.js';
export * from './cli/logger.js';
export * from './cli/banner.js';

// Project management
export * from './project/structure-service.js';

// Templates
export * from './templates/template-service.js';

// Questions and recommendations
export * from './questions/dynamic-questioner.js';
export * from './questions/simplified-questioner.js';

// New adapter system
export * from './interfaces/base.js';
export * from './interfaces/providers.js';
export * from './registry/adapter-registry.js';
export * from './adapters/database/drizzle-adapter.js';
export * from './adapters/database/prisma-adapter.js';
export * from './adapters/auth/better-auth-adapter.js';
export * from './adapters/auth/nextauth-adapter.js';
export * from './adapters/ui/shadcn-ui-adapter.js';
export * from './adapters/ui/chakra-ui-adapter.js';
export * from './adapters/framework/nextjs-adapter.js';
export * from './adapters/deployment/docker-adapter.js';
export * from './adapters/testing/vitest-adapter.js';
export * from './adapters/observability/google-analytics-adapter.js'; 
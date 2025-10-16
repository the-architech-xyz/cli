/**
 * Genome Module Converter
 * 
 * Converts TypedGenomeModule (from marketplace) to Module (expected by CLI)
 * This bridges the gap between genome authoring types and execution types.
 */

import { Module, GenomeModule } from '@thearchitech.xyz/types';

/**
 * Convert GenomeModule to Module format expected by CLI
 */
export function convertGenomeModuleToModule(genomeModule: GenomeModule): Module {
  // Extract category from module ID (e.g., 'framework/nextjs' -> 'framework')
  const category = extractCategoryFromModuleId(genomeModule.id);
  
  return {
    id: genomeModule.id,
    category,
    parameters: genomeModule.parameters || {}, // Ensure parameters is always an object
    features: genomeModule.features || {},
    externalFiles: genomeModule.externalFiles || [],
    config: genomeModule.config
  };
}

/**
 * Convert array of GenomeModule to array of Module
 */
export function convertGenomeModulesToModules(genomeModules: GenomeModule[]): Module[] {
  return genomeModules.map(convertGenomeModuleToModule);
}

/**
 * Extract category from module ID
 * Examples:
 * - 'framework/nextjs' -> 'framework'
 * - 'ui/shadcn-ui' -> 'ui'
 * - 'features/auth/backend/better-auth-nextjs' -> 'features'
 */
function extractCategoryFromModuleId(moduleId: string): string {
  const parts = moduleId.split('/');
  return parts[0] || 'unknown';
}

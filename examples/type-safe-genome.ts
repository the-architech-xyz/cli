/**
 * Type-Safe Genome Example
 * 
 * This example demonstrates how to create a type-safe genome using
 * the generated TypeScript definitions.
 */

import { Genome } from '@thearchitech.xyz/marketplace';

/**
 * Type-safe genome definition
 * 
 * TypeScript provides auto-completion and validation for:
 * - Module IDs
 * - Parameter names and types
 * - Feature names and types
 */
const genome: Genome = {
  version: '1.0.0',
  project: {
    name: 'type-safe-app',
    description: 'A type-safe application using The Architech',
    version: '0.1.0',
    framework: 'nextjs',
    path: './type-safe-app'
  },
  modules: [
    // Framework module with type-safe parameters
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,
        tailwind: true,
        eslint: true,
        appRouter: true,
        srcDir: true,
        importAlias: '@/*'
      },
      features: {
        performance: true,
        security: true,
        'server-actions': true
      }
    },
    
    // UI module with type-safe parameters
    {
      id: 'ui/shadcn-ui',
      parameters: {
        // TypeScript knows the valid component names
        components: ['button', 'card', 'input', 'dialog', 'form'],
        // TypeScript knows the valid theme options
        theme: 'dark',
        // TypeScript knows this is a boolean
        darkMode: true
      },
      features: {
        // TypeScript knows the available features
        theming: true,
        accessibility: true
      }
    },
    
    // Database module with type-safe parameters
    {
      id: 'database/drizzle',
      parameters: {
        // TypeScript knows the valid provider options
        provider: 'neon',
        migrations: true,
        studio: true,
        databaseType: 'postgresql'
      }
    }
  ]
};

/**
 * To use this genome with the CLI, you would:
 * 1. Convert it to YAML
 * 2. Save it to a file
 * 3. Run: architech new my-genome.yaml
 * 
 * Or you could add a command to the CLI that accepts TypeScript genomes directly.
 */
export default genome;


#!/usr/bin/env node

/**
 * Type Generator Script for The Architech
 * 
 * This script runs the TypeScript type generator to create type definitions
 * from JSON schemas in adapter.json files.
 */

// Run the TypeScript file using ts-node
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

// Execute the generator
require('../src/scripts/generate-types.ts');


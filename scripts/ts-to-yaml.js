#!/usr/bin/env node

/**
 * TypeScript Genome to YAML Converter
 * 
 * This script converts a TypeScript genome file to YAML format
 * for use with the Architech CLI.
 * 
 * Usage: node ts-to-yaml.js <input-file.ts> [output-file.yaml]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { register } = require('ts-node');

// Register ts-node to import TypeScript files
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

// Parse command line arguments
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Error: Input file is required');
  console.log('Usage: node ts-to-yaml.js <input-file.ts> [output-file.yaml]');
  process.exit(1);
}

// Determine output file
let outputFile = process.argv[3];
if (!outputFile) {
  const baseName = path.basename(inputFile, path.extname(inputFile));
  outputFile = `${baseName}.yaml`;
}

// Import the TypeScript genome
try {
  console.log(`🔍 Importing TypeScript genome from ${inputFile}...`);
  const genomePath = path.resolve(inputFile);
  
  // Clear require cache to ensure we get fresh data
  delete require.cache[require.resolve(genomePath)];
  
  // Import the genome
  const genome = require(genomePath).default;
  if (!genome) {
    console.error('❌ Error: No default export found in the TypeScript file');
    process.exit(1);
  }
  
  // Convert to YAML
  console.log('🔄 Converting to YAML...');
  const yamlContent = yaml.dump(genome, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
  });
  
  // Write to output file
  fs.writeFileSync(outputFile, yamlContent, 'utf-8');
  console.log(`✅ YAML genome written to ${outputFile}`);
} catch (error) {
  console.error('❌ Error converting TypeScript to YAML:', error);
  process.exit(1);
}


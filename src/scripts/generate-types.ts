#!/usr/bin/env node
/**
 * Type Generator for The Architech
 * 
 * Generates TypeScript type definitions from JSON schemas in adapter.json files.
 * This creates a type-safe development experience for blueprint and genome authors.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Configuration
const MARKETPLACE_PATH = path.resolve(process.env.MARKETPLACE_PATH || '../marketplace');
const OUTPUT_DIR = path.resolve('./types/generated');
const ADAPTERS_GLOB = 'adapters/**/adapter.json';
const INTEGRATIONS_GLOB = 'integrations/**/adapter.json';

// Ensure output directories exist
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Convert JSON schema type to TypeScript type
function jsonSchemaTypeToTypeScript(type: string): string {
  switch (type) {
    case 'string': return 'string';
    case 'boolean': return 'boolean';
    case 'number': return 'number';
    case 'integer': return 'number';
    case 'array': return 'Array<any>';
    case 'object': return 'Record<string, any>';
    default: return 'any';
  }
}

// Generate TypeScript type for a parameter
function generateParameterType(param: any, paramName: string): string {
  let type = jsonSchemaTypeToTypeScript(param.type);
  
  // Handle arrays with item types
  if (param.type === 'array' && param.items) {
    if (param.items.type === 'string' && param.items.enum) {
      // String enum array
      const enumValues = param.items.enum.map((value: string) => `'${value}'`).join(' | ');
      type = `Array<${enumValues}>`;
    } else {
      // Regular typed array
      type = `Array<${jsonSchemaTypeToTypeScript(param.items.type)}>`;
    }
  }
  
  // Handle string enums
  if (param.type === 'string' && param.enum) {
    type = param.enum.map((value: string) => `'${value}'`).join(' | ');
  }
  
  // Make optional if not required
  const isRequired = param.required === true;
  const optionalModifier = isRequired ? '' : '?';
  
  return `${paramName}${optionalModifier}: ${type}`;
}

// Generate TypeScript interface for adapter parameters
function generateParametersInterface(adapterConfig: any, adapterName: string): string {
  const interfaceName = `${adapterName}Parameters`;
  let interfaceContent = `export interface ${interfaceName} {\n`;
  
  // Add parameters
  if (adapterConfig.parameters) {
    for (const [paramName, param] of Object.entries(adapterConfig.parameters)) {
      interfaceContent += `  ${generateParameterType(param, paramName)};\n`;
    }
  }
  
  interfaceContent += '}\n\n';
  return interfaceContent;
}

// Generate TypeScript interface for adapter features
function generateFeaturesInterface(adapterConfig: any, adapterName: string): string {
  const interfaceName = `${adapterName}Features`;
  let interfaceContent = `export interface ${interfaceName} {\n`;
  
  // Add features
  if (adapterConfig.features) {
    for (const [featureName, feature] of Object.entries(adapterConfig.features)) {
      interfaceContent += `  ${featureName}?: boolean;\n`;
    }
  }
  
  interfaceContent += '}\n\n';
  return interfaceContent;
}

// Generate TypeScript file for an adapter
function generateAdapterTypes(adapterPath: string): { category: string; id: string; name: string; path: string; outputPath: string } | null {
  try {
    // Read adapter.json
    const adapterContent = fs.readFileSync(adapterPath, 'utf-8');
    const adapterConfig = JSON.parse(adapterContent);
    
    // Extract adapter ID and name
    const adapterDir = path.dirname(adapterPath);
    const relativePath = path.relative(MARKETPLACE_PATH, adapterDir);
    const pathParts = relativePath.split(path.sep);
    
    // Determine if this is an adapter or integration
    const isAdapter = pathParts[0] === 'adapters';
    const category = pathParts[1];
    const id = pathParts[2];
    const adapterName = toPascalCase(id);
    
    // Create output path
    const outputPath = path.join(OUTPUT_DIR, relativePath, 'types.d.ts');
    ensureDirectoryExists(path.dirname(outputPath));
    
    // Generate content
    let content = `/**
 * Generated TypeScript definitions for ${adapterConfig.name || id}
 * Category: ${category}
 * Generated from: ${adapterPath}
 */

`;
    
    // Generate interfaces
    content += generateParametersInterface(adapterConfig, adapterName);
    content += generateFeaturesInterface(adapterConfig, adapterName);
    
    // Write file
    fs.writeFileSync(outputPath, content);
    
    return {
      category,
      id,
      name: adapterName,
      path: relativePath,
      outputPath
    } as const;
  } catch (error) {
    console.error(`❌ Failed to generate types for ${adapterPath}:`, error);
    return null;
  }
}

// Generate the master genome type definition
function generateGenomeTypes(adapters: any[]): void {
  let content = `/**
 * Generated TypeScript definitions for The Architech Genome
 * This file provides type-safe genome authoring experience
 */

`;

  // Import all adapter types
  adapters.forEach(adapter => {
    if (!adapter) return;
    const importPath = `./${adapter.path}/types`;
    content += `import { ${adapter.name}Parameters, ${adapter.name}Features } from '${importPath}';\n`;
  });
  
  content += '\n';
  
  // Generate the Genome interface
  content += `export interface Genome {\n`;
  content += `  version: string;\n`;
  content += `  project: {\n`;
  content += `    name: string;\n`;
  content += `    description?: string;\n`;
  content += `    version?: string;\n`;
  content += `    framework: string;\n`;
  content += `    path?: string;\n`;
  content += `  };\n`;
  content += `  modules: Array<\n`;
  
  // Add union type for all modules
  adapters.forEach((adapter, index) => {
    if (!adapter) return;
    const isLast = index === adapters.length - 1;
    content += `    | { id: '${adapter.category}/${adapter.id}'; parameters?: ${adapter.name}Parameters; features?: ${adapter.name}Features }${isLast ? '' : '\n'}`;
  });
  
  content += `\n  >;\n`;
  content += `}\n`;
  
  // Write the file
  const outputPath = path.join(OUTPUT_DIR, 'genome.d.ts');
  fs.writeFileSync(outputPath, content);
}

// Utility: Convert string to PascalCase
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Main function
async function main() {
  try {
    
    // Ensure output directory exists
    ensureDirectoryExists(OUTPUT_DIR);
    
    // Find all adapter.json files
    const adapterPaths = glob.sync(ADAPTERS_GLOB, { cwd: MARKETPLACE_PATH })
      .map(p => path.join(MARKETPLACE_PATH, p));
    
    const integrationPaths = glob.sync(INTEGRATIONS_GLOB, { cwd: MARKETPLACE_PATH })
      .map(p => path.join(MARKETPLACE_PATH, p));
    
    
    // Generate types for each adapter
    const adapterResults = adapterPaths.map(generateAdapterTypes);
    const integrationResults = integrationPaths.map(generateAdapterTypes);
    const allResults = [...adapterResults, ...integrationResults].filter(Boolean);
    
    // Generate master genome type definition
    generateGenomeTypes(allResults);
    
  } catch (error) {
    console.error('❌ Type generation failed:', error);
    process.exit(1);
  }
}

// Run the script
main();


/**
 * Marketplace Manifest Generator
 * 
 * Generates a manifest.json file for the marketplace repository
 * that lists all available modules with their metadata.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import * as path from 'path';

interface ModuleManifest {
  modules: Array<{
    id: string;
    version: string;
    path: string;
    engine: {
      cliVersion: string;
    };
    category: 'adapter' | 'integration';
    dependencies?: string[];
    tags?: string[];
  }>;
  lastUpdated: string;
  totalModules: number;
}

async function findBlueprintFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.name === 'blueprint.yaml') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read, skip
    }
  }
  
  await scanDir(directory);
  return files;
}

async function generateManifest() {
  console.log('🔍 Scanning marketplace modules...');
  
  const manifest: ModuleManifest = {
    modules: [],
    lastUpdated: new Date().toISOString(),
    totalModules: 0
  };

  try {
    // Scan adapters
    const adapterFiles = await findBlueprintFiles('adapters');
    console.log(`📦 Found ${adapterFiles.length} adapter blueprints`);
    
    for (const blueprintPath of adapterFiles) {
      try {
        const moduleInfo = await processBlueprintFile(blueprintPath, 'adapter');
        if (moduleInfo) {
          manifest.modules.push(moduleInfo);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process adapter ${blueprintPath}: ${error}`);
      }
    }

    // Scan integrations
    const integrationFiles = await findBlueprintFiles('integrations');
    console.log(`🔗 Found ${integrationFiles.length} integration blueprints`);
    
    for (const blueprintPath of integrationFiles) {
      try {
        const moduleInfo = await processBlueprintFile(blueprintPath, 'integration');
        if (moduleInfo) {
          manifest.modules.push(moduleInfo);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process integration ${blueprintPath}: ${error}`);
      }
    }

    // Sort modules by category and id
    manifest.modules.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.id.localeCompare(b.id);
    });

    manifest.totalModules = manifest.modules.length;

    // Write manifest file
    const manifestPath = 'manifest.json';
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Generated manifest with ${manifest.totalModules} modules`);
    console.log(`📄 Manifest saved to: ${manifestPath}`);
    
    // Show summary
    const adapterCount = manifest.modules.filter(m => m.category === 'adapter').length;
    const integrationCount = manifest.modules.filter(m => m.category === 'integration').length;
    
    console.log(`📊 Summary:`);
    console.log(`   - Adapters: ${adapterCount}`);
    console.log(`   - Integrations: ${integrationCount}`);
    console.log(`   - Total: ${manifest.totalModules}`);
    
  } catch (error) {
    console.error('❌ Failed to generate manifest:', error);
    process.exit(1);
  }
}

async function processBlueprintFile(blueprintPath: string, category: 'adapter' | 'integration'): Promise<ModuleManifest['modules'][0] | null> {
  try {
    // Read blueprint file
    const blueprintContent = await fs.readFile(blueprintPath, 'utf-8');
    const blueprint = JSON.parse(blueprintContent);
    
    // Extract module ID from path
    const pathParts = blueprintPath.split('/');
    const moduleId = pathParts.slice(1, -1).join('/'); // Remove 'adapters/' or 'integrations/' and 'blueprint.yaml'
    
    // Extract version from blueprint or use default
    const version = blueprint.version || '1.0.0';
    
    // Extract CLI version requirement
    const cliVersion = blueprint.engine?.cliVersion || '>=1.0.0';
    
    // Extract dependencies
    const dependencies = blueprint.dependencies || [];
    
    // Extract tags
    const tags = blueprint.tags || [];
    
    return {
      id: moduleId,
      version,
      path: blueprintPath,
      engine: {
        cliVersion
      },
      category,
      dependencies,
      tags
    };
  } catch (error) {
    console.warn(`Failed to process ${blueprintPath}: ${error}`);
    return null;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateManifest().catch(console.error);
}

export { generateManifest };
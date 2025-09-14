/**
 * Migration Script: CLI to Marketplace
 * 
 * Migrates all adapters and integrations from the CLI repository
 * to the marketplace repository format.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import * as path from 'path';

interface MigrationResult {
  success: boolean;
  migrated: number;
  errors: string[];
}

async function findFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else {
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

async function migrateToMarketplace() {
  console.log('🚀 Starting migration to marketplace format...');
  
  const result: MigrationResult = {
    success: true,
    migrated: 0,
    errors: []
  };

  try {
    // Create marketplace directory structure
    await fs.mkdir('marketplace', { recursive: true });
    await fs.mkdir('marketplace/adapters', { recursive: true });
    await fs.mkdir('marketplace/integrations', { recursive: true });

    // Migrate adapters
    console.log('📦 Migrating adapters...');
    const adapterFiles = await findFiles('src/adapters');
    
    for (const filePath of adapterFiles) {
      try {
        const relativePath = path.relative('src/adapters', filePath);
        const targetPath = path.join('marketplace/adapters', relativePath);
        
        // Create target directory
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Copy file
        await fs.copyFile(filePath, targetPath);
        result.migrated++;
        
        console.log(`  ✅ Migrated: ${relativePath}`);
      } catch (error) {
        const errorMsg = `Failed to migrate adapter ${filePath}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    // Migrate integrations
    console.log('🔗 Migrating integrations...');
    const integrationFiles = await findFiles('src/integrations');
    
    for (const filePath of integrationFiles) {
      try {
        const relativePath = path.relative('src/integrations', filePath);
        const targetPath = path.join('marketplace/integrations', relativePath);
        
        // Create target directory
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Copy file
        await fs.copyFile(filePath, targetPath);
        result.migrated++;
        
        console.log(`  ✅ Migrated: ${relativePath}`);
      } catch (error) {
        const errorMsg = `Failed to migrate integration ${filePath}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    // Generate manifest
    console.log('📄 Generating marketplace manifest...');
    const { generateManifest } = await import('./generate-marketplace-manifest.js');
    await generateManifest();

    // Create README for marketplace
    await createMarketplaceReadme();

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   - Files migrated: ${result.migrated}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('📁 Marketplace structure created in ./marketplace/');
      console.log('📄 Run "npm run generate-manifest" to update the manifest');
    } else {
      result.success = false;
      console.log('\n⚠️  Migration completed with errors');
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error('❌ Migration failed:', error);
  }

  return result;
}

async function createMarketplaceReadme() {
  const readmeContent = `# The Architech Marketplace

This repository contains all the adapters and integrations for The Architech CLI.

## Structure

\`\`\`
marketplace/
├── adapters/           # Framework, database, auth, etc. adapters
│   ├── framework/
│   ├── database/
│   └── ...
├── integrations/       # Cross-adapter integrations
│   ├── connect/
│   └── ...
└── manifest.json       # Auto-generated module manifest
\`\`\`

## Adding New Modules

1. Create your module in the appropriate directory
2. Follow the blueprint format (see examples)
3. Run \`npm run generate-manifest\` to update the manifest
4. Submit a pull request

## Module Format

Each module should have:
- \`blueprint.yaml\` - The blueprint definition
- \`adapter.json\` or \`integration.json\` - Module metadata
- \`templates/\` - Template files (if applicable)

## Contributing

See the main CLI repository for contribution guidelines.
`;

  await fs.writeFile('marketplace/README.md', readmeContent);
  console.log('📄 Created marketplace README.md');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToMarketplace().catch(console.error);
}

export { migrateToMarketplace };
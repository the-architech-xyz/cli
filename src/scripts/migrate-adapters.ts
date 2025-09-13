/**
 * Migration Script: Update all adapters to use standardized schema
 * 
 * This script migrates all existing adapters to use the new centralized
 * adapter schema system, ensuring consistency across the entire codebase.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STANDARD_PARAMETERS, STANDARD_CONSTRAINTS, AdapterSchemaValidator } from '../types/adapter-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AdapterMigration {
  adapterPath: string;
  oldSchema: any;
  newSchema: any;
  changes: string[];
}

/**
 * Migrates a single adapter to use standardized schema
 */
function migrateAdapter(adapterPath: string): AdapterMigration {
  const adapterJsonPath = join(adapterPath, 'adapter.json');
  const oldSchema = JSON.parse(readFileSync(adapterJsonPath, 'utf-8'));
  
  const changes: string[] = [];
  const newSchema = { ...oldSchema };
  
  // 1. Fix parameter naming inconsistencies
  if (newSchema.parameters) {
    Object.keys(newSchema.parameters).forEach(paramName => {
      // Fix database parameter naming
      if (paramName === 'database' && newSchema.parameters[paramName].type === 'string') {
        newSchema.parameters[STANDARD_PARAMETERS.DATABASE_TYPE] = newSchema.parameters[paramName];
        delete newSchema.parameters[paramName];
        changes.push(`Renamed parameter 'database' to '${STANDARD_PARAMETERS.DATABASE_TYPE}'`);
      }
      
      // Fix framework parameter naming
      if (paramName === 'framework' && newSchema.parameters[paramName].type === 'string') {
        newSchema.parameters[STANDARD_PARAMETERS.FRAMEWORK_TYPE] = newSchema.parameters[paramName];
        delete newSchema.parameters[paramName];
        changes.push(`Renamed parameter 'framework' to '${STANDARD_PARAMETERS.FRAMEWORK_TYPE}'`);
      }
      
      // Fix UI parameter naming
      if (paramName === 'ui' && newSchema.parameters[paramName].type === 'string') {
        newSchema.parameters[STANDARD_PARAMETERS.UI_LIBRARY] = newSchema.parameters[paramName];
        delete newSchema.parameters[paramName];
        changes.push(`Renamed parameter 'ui' to '${STANDARD_PARAMETERS.UI_LIBRARY}'`);
      }
    });
  }
  
  // 2. Add dependency constraints based on adapter category
  if (!newSchema.constraints) {
    newSchema.constraints = {};
  }
  
  // Add framework constraints for UI adapters
  if (newSchema.category === 'ui') {
    if (newSchema.name === 'shadcn-ui') {
      newSchema.constraints.requiredFrameworks = [STANDARD_CONSTRAINTS.FRAMEWORKS.NEXTJS];
      newSchema.constraints.requiredUILibraries = [STANDARD_CONSTRAINTS.UI_LIBRARIES.TAILWIND];
      changes.push('Added framework constraints: requires Next.js and Tailwind CSS');
    }
  }
  
  // Add database constraints for database adapters
  if (newSchema.category === 'database') {
    if (newSchema.name === 'drizzle') {
      newSchema.constraints.requiredDatabases = [
        STANDARD_CONSTRAINTS.DATABASES.POSTGRESQL,
        STANDARD_CONSTRAINTS.DATABASES.MYSQL,
        STANDARD_CONSTRAINTS.DATABASES.SQLITE
      ];
      changes.push('Added database constraints: supports PostgreSQL, MySQL, SQLite');
    }
  }
  
  // Add framework constraints for framework adapters
  if (newSchema.category === 'framework') {
    if (newSchema.name === 'nextjs') {
      newSchema.constraints.requiredFrameworks = [STANDARD_CONSTRAINTS.FRAMEWORKS.NEXTJS];
      newSchema.constraints.minNodeVersion = '18.0.0';
      changes.push('Added framework constraints: requires Node.js 18+');
    }
  }
  
  // 3. Add missing required fields
  if (!newSchema.features) {
    newSchema.features = [];
    changes.push('Added missing features array');
  }
  
  if (!newSchema.dependencies) {
    newSchema.dependencies = {};
    changes.push('Added missing dependencies object');
  }
  
  // 4. Validate the new schema
  const validation = AdapterSchemaValidator.validate(newSchema);
  if (!validation.valid) {
    changes.push(`Validation errors: ${validation.errors.join(', ')}`);
  }
  
  return {
    adapterPath,
    oldSchema,
    newSchema,
    changes
  };
}

/**
 * Main migration function
 */
function migrateAllAdapters(): void {
  const adaptersDir = join(__dirname, '../adapters');
  const migrations: AdapterMigration[] = [];
  
  console.log('🔄 Starting adapter migration...\n');
  
  // Find all adapters
  const categories = readdirSync(adaptersDir);
  
  categories.forEach(category => {
    const categoryPath = join(adaptersDir, category);
    if (!statSync(categoryPath).isDirectory()) return;
    
    const adapters = readdirSync(categoryPath);
    
    adapters.forEach(adapter => {
      const adapterPath = join(categoryPath, adapter);
      if (!statSync(adapterPath).isDirectory()) return;
      
      try {
        const migration = migrateAdapter(adapterPath);
        migrations.push(migration);
        
        console.log(`✅ Migrated ${category}/${adapter}`);
        if (migration.changes.length > 0) {
          migration.changes.forEach(change => {
            console.log(`   - ${change}`);
          });
        }
        console.log();
        
        // Write the new schema
        const adapterJsonPath = join(adapterPath, 'adapter.json');
        writeFileSync(adapterJsonPath, JSON.stringify(migration.newSchema, null, 2));
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${category}/${adapter}:`, error);
      }
    });
  });
  
  // Summary
  console.log('📊 Migration Summary:');
  console.log(`   Total adapters migrated: ${migrations.length}`);
  console.log(`   Adapters with changes: ${migrations.filter(m => m.changes.length > 0).length}`);
  console.log(`   Adapters with validation errors: ${migrations.filter(m => m.changes.some(c => c.includes('Validation errors'))).length}`);
  
  // Show validation errors
  const errorMigrations = migrations.filter(m => m.changes.some(c => c.includes('Validation errors')));
  if (errorMigrations.length > 0) {
    console.log('\n⚠️  Adapters with validation errors:');
    errorMigrations.forEach(migration => {
      console.log(`   - ${migration.adapterPath}`);
      migration.changes.filter(c => c.includes('Validation errors')).forEach(error => {
        console.log(`     ${error}`);
      });
    });
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllAdapters();
}

export { migrateAllAdapters, migrateAdapter };

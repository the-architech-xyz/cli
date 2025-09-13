/**
 * TypeORM Migration System Feature
 * 
 * Adds database migrations and schema versioning
 */

import { Blueprint } from '../../../../types/adapter.js';

const migrationSystemBlueprint: Blueprint = {
  id: 'typeorm-migration-system',
  name: 'TypeORM Migration System',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['typeorm'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/migration-manager.ts',
      content: `import { DataSource } from 'typeorm';
import { execSync } from 'child_process';

// Migration management utilities
export class MigrationManager {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async generateMigration(name: string): Promise<void> {
    try {
      console.log('🔄 Generating migration: ' + name);
      execSync('npx typeorm migration:generate src/lib/db/migrations/' + name, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migration generated successfully');
    } catch (error) {
      console.error('❌ Migration generation failed:', error);
      throw error;
    }
  }

  async createMigration(name: string): Promise<void> {
    try {
      console.log('🔄 Creating migration: ' + name);
      execSync('npx typeorm migration:create src/lib/db/migrations/' + name, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migration created successfully');
    } catch (error) {
      console.error('❌ Migration creation failed:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running migrations...');
      await this.dataSource.runMigrations();
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration execution failed:', error);
      throw error;
    }
  }

  async revertMigration(): Promise<void> {
    try {
      console.log('🔄 Reverting last migration...');
      await this.dataSource.undoLastMigration();
      console.log('✅ Migration reverted successfully');
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    }
  }

  async showMigrations(): Promise<void> {
    try {
      console.log('🔄 Checking migration status...');
      const pendingMigrations = await this.dataSource.showMigrations();
      
      if (pendingMigrations) {
        console.log('📋 Pending migrations found');
      } else {
        console.log('✅ All migrations are up to date');
      }
    } catch (error) {
      console.error('❌ Failed to check migration status:', error);
      throw error;
    }
  }

  {{#if module.parameters.auto-migration}}
  async autoMigrate(): Promise<void> {
    try {
      console.log('🔄 Running automatic migration...');
      await this.dataSource.synchronize();
      console.log('✅ Automatic migration completed');
    } catch (error) {
      console.error('❌ Automatic migration failed:', error);
      throw error;
    }
  }
  {{/if}}
}`
    }
  ]
};
export default migrationSystemBlueprint;

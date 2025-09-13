/**
 * Sequelize Migrations Feature Blueprint
 * 
 * Automated database schema migrations and versioning
 */

import { Blueprint } from '../../../../types/adapter.js';

const migrationsBlueprint: Blueprint = {
  id: 'sequelize-migrations',
  name: 'Database Migrations',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/database/migrations.ts',
      content: `import { Sequelize } from 'sequelize';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import sequelize from '../config.js';

export class MigrationManager {
  private sequelize: Sequelize;

  constructor(sequelizeInstance?: Sequelize) {
    this.sequelize = sequelizeInstance || sequelize;
  }

  /**
   * Generate a new migration file
   */
  async generateMigration(name: string): Promise<string> {
    try {
      console.log('🔄 Generating migration: ' + name);
      execSync('npx sequelize-cli migration:generate --name ' + name, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Find the generated migration file
      const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
      const files = await fs.readdir(migrationsDir);
      const migrationFile = files.find(file => file.includes(name));
      
      if (migrationFile) {
        console.log('✅ Migration ' + name + ' generated successfully');
        return path.join(migrationsDir, migrationFile);
      }
      
      throw new Error('Migration file not found');
    } catch (error) {
      console.error('❌ Error generating migration:', error);
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running pending migrations...');
      execSync('npx sequelize-cli db:migrate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackMigration(): Promise<void> {
    try {
      console.log('🔄 Rolling back last migration...');
      execSync('npx sequelize-cli db:migrate:undo', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migration rolled back successfully');
    } catch (error) {
      console.error('❌ Error rolling back migration:', error);
      throw error;
    }
  }

  /**
   * Rollback all migrations
   */
  async rollbackAllMigrations(): Promise<void> {
    try {
      console.log('🔄 Rolling back all migrations...');
      execSync('npx sequelize-cli db:migrate:undo:all', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ All migrations rolled back successfully');
    } catch (error) {
      console.error('❌ Error rolling back all migrations:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
  }> {
    try {
      const result = execSync('npx sequelize-cli db:migrate:status', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const lines = result.split('\\n').filter(line => line.trim());
      const executed: string[] = [];
      const pending: string[] = [];
      
      lines.forEach(line => {
        if (line.includes('up')) {
          const migrationName = line.split(' ')[0];
          executed.push(migrationName);
        } else if (line.includes('down')) {
          const migrationName = line.split(' ')[0];
          pending.push(migrationName);
        }
      });
      
      return { executed, pending };
    } catch (error) {
      console.error('❌ Error getting migration status:', error);
      throw error;
    }
  }

  /**
   * Create backup before migration
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(process.cwd(), 'backups', 'migration-backup-' + timestamp + '.sql');
      
      // Ensure backups directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      console.log('🔄 Creating backup: ' + backupPath);
      
      // This is a simplified backup - in production, use proper database backup tools
      const config = this.sequelize.config;
      const backupCommand = \`pg_dump -h \${config.host} -p \${config.port} -U \${config.username} -d \${config.database} > \${backupPath}\`;
      
      execSync(backupCommand, { stdio: 'inherit' });
      console.log('✅ Backup created successfully: ' + backupPath);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      console.log('🔄 Restoring from backup: ' + backupPath);
      
      const config = this.sequelize.config;
      const restoreCommand = \`psql -h \${config.host} -p \${config.port} -U \${config.username} -d \${config.database} < \${backupPath}\`;
      
      execSync(restoreCommand, { stdio: 'inherit' });
      console.log('✅ Database restored from backup successfully');
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      throw error;
    }
  }

  /**
   * Auto-migrate on startup
   */
  async autoMigrate(): Promise<void> {
    try {
      console.log('🔄 Auto-migrating database...');
      await this.runMigrations();
      console.log('✅ Auto-migration completed');
    } catch (error) {
      console.error('❌ Error in auto-migration:', error);
      throw error;
    }
  }
}

// Global migration manager instance
export const migrationManager = new MigrationManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/scripts/migrate.ts',
      content: `#!/usr/bin/env node

import { migrationManager } from '../lib/database/migrations.js';

async function main() {
  const command = process.argv[2];
  const name = process.argv[3];

  try {
    switch (command) {
      case 'generate':
        if (!name) {
          console.error('❌ Migration name is required');
          process.exit(1);
        }
        await migrationManager.generateMigration(name);
        break;

      case 'up':
        await migrationManager.runMigrations();
        break;

      case 'down':
        await migrationManager.rollbackMigration();
        break;

      case 'down:all':
        await migrationManager.rollbackAllMigrations();
        break;

      case 'status':
        const status = await migrationManager.getMigrationStatus();
        console.log('\\n📊 Migration Status:');
        console.log('Executed:', status.executed.length);
        console.log('Pending:', status.pending.length);
        if (status.pending.length > 0) {
          console.log('\\nPending migrations:');
          status.pending.forEach(migration => console.log('  - ' + migration));
        }
        break;

      case 'backup':
        const backupPath = await migrationManager.createBackup();
        console.log('Backup created at:', backupPath);
        break;

      case 'restore':
        if (!name) {
          console.error('❌ Backup path is required');
          process.exit(1);
        }
        await migrationManager.restoreFromBackup(name);
        break;

      default:
        console.log('\\n📋 Available commands:');
        console.log('  generate <name>  - Generate a new migration');
        console.log('  up              - Run pending migrations');
        console.log('  down            - Rollback last migration');
        console.log('  down:all        - Rollback all migrations');
        console.log('  status          - Show migration status');
        console.log('  backup          - Create database backup');
        console.log('  restore <path>  - Restore from backup');
        break;
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error);
    process.exit(1);
  }
}

main();`
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:generate',
      command: 'tsx src/scripts/migrate.ts generate'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:up',
      command: 'tsx src/scripts/migrate.ts up'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:down',
      command: 'tsx src/scripts/migrate.ts down'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:down:all',
      command: 'tsx src/scripts/migrate.ts down:all'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:status',
      command: 'tsx src/scripts/migrate.ts status'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:backup',
      command: 'tsx src/scripts/migrate.ts backup'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'migrate:restore',
      command: 'tsx src/scripts/migrate.ts restore'
    }
  ]
};
export default migrationsBlueprint;

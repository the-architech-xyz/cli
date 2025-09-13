/**
 * Drizzle Migrations Feature
 * 
 * Adds automated database schema migrations and versioning to Drizzle
 */

import { Blueprint } from '../../../../types/adapter.js';

const migrationsBlueprint: Blueprint = {
  id: 'drizzle-migrations',
  name: 'Drizzle Migrations',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['drizzle-kit'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'drizzle.config.ts',
      content: `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: '{{module.parameters.database}}',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  {{#if module.parameters.auto-generate}}
  autoGenerate: true,
  {{/if}}
  {{#if module.parameters.backup}}
  backup: true,
  {{/if}}
});`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/migrations/migration-manager.ts',
      content: `import { migrate } from 'drizzle-orm/{{module.parameters.database}}-migrator';
import { db } from '../index';
import path from 'path';

// Migration management utilities
export class MigrationManager {
  static async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running database migrations...');
      
      const migrationsFolder = path.join(process.cwd(), 'drizzle');
      await migrate(db, { migrationsFolder });
      
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  static async generateMigration(name: string): Promise<void> {
    try {
      console.log('🔄 Generating migration: ' + name);
      
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit generate --name ' + name, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Migration ' + name + ' generated successfully');
    } catch (error) {
      console.error('❌ Migration generation failed:', error);
      throw error;
    }
  }

  static async pushSchema(): Promise<void> {
    try {
      console.log('🔄 Pushing schema to database...');
      
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit push', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Schema pushed successfully');
    } catch (error) {
      console.error('❌ Schema push failed:', error);
      throw error;
    }
  }

  static async pullSchema(): Promise<void> {
    try {
      console.log('🔄 Pulling schema from database...');
      
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit pull', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Schema pulled successfully');
    } catch (error) {
      console.error('❌ Schema pull failed:', error);
      throw error;
    }
  }

  static async checkMigrationStatus(): Promise<{
    pending: number;
    applied: number;
    total: number;
  }> {
    try {
      // This would typically query the migrations table
      // For now, we'll return a mock status
      return {
        pending: 0,
        applied: 0,
        total: 0,
      };
    } catch (error) {
      console.error('❌ Failed to check migration status:', error);
      throw error;
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/migrate.js',
      content: `#!/usr/bin/env node

/**
 * Migration Script
 * 
 * Run this script to execute database migrations
 */

const { runMigrations } = require('../src/lib/db/migrations/migration-runner');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Run migrations
runMigrations();`
    }
  ]
};export default migrationsBlueprint;

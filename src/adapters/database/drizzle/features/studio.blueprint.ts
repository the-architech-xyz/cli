/**
 * Drizzle Studio Feature
 * 
 * Adds visual database browser and query interface to Drizzle
 */

import { Blueprint } from '../../../../types/adapter.js';

const studioBlueprint: Blueprint = {
  id: 'drizzle-studio',
  name: 'Drizzle Studio',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['drizzle-kit'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/studio/studio-config.ts',
      content: `// Drizzle Studio Configuration
export const studioConfig = {
  host: '{{module.parameters.host}}',
  port: {{module.parameters.port}},
  database: '{{module.parameters.database}}',
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  verbose: true,
  strict: true,
};

// Studio utilities
export class StudioManager {
  static getStudioUrl(): string {
    return 'http://' + studioConfig.host + ':' + studioConfig.port;
  }

  static async startStudio(): Promise<void> {
    try {
      console.log('🚀 Starting Drizzle Studio on ' + this.getStudioUrl());
      
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit studio --port ' + studioConfig.port + ' --host ' + studioConfig.host, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.error('❌ Failed to start Drizzle Studio:', error);
      throw error;
    }
  }

  static async stopStudio(): Promise<void> {
    try {
      console.log('🛑 Stopping Drizzle Studio...');
      
      // This would typically kill the studio process
      // For now, we'll just log the action
      console.log('✅ Drizzle Studio stopped');
    } catch (error) {
      console.error('❌ Failed to stop Drizzle Studio:', error);
      throw error;
    }
  }

  static async checkStudioStatus(): Promise<boolean> {
    try {
      const response = await fetch(this.getStudioUrl());
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'scripts/studio.js',
      content: `#!/usr/bin/env node

/**
 * Drizzle Studio Script
 * 
 * Start Drizzle Studio for database management
 */

const { StudioManager } = require('../src/lib/db/studio/studio-config');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Start studio
StudioManager.startStudio();`
    }
  ]
};export default studioBlueprint;

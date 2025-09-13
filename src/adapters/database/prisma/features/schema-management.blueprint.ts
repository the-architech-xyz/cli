/**
 * Prisma Schema Management Feature
 * 
 * Adds advanced schema management with Prisma schema and migrations
 */

import { Blueprint } from '../../../../types/adapter.js';

const schemaManagementBlueprint: Blueprint = {
  id: 'prisma-schema-management',
  name: 'Prisma Schema Management',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['prisma'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/schema-manager.ts',
      content: `import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Schema management utilities
export class SchemaManager {
  static async generateClient(): Promise<void> {
    try {
      console.log('🔄 Generating Prisma client...');
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error);
      throw error;
    }
  }

  static async pushSchema(): Promise<void> {
    try {
      console.log('🔄 Pushing schema to database...');
      execSync('npx prisma db push', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema pushed successfully');
    } catch (error) {
      console.error('❌ Failed to push schema:', error);
      throw error;
    }
  }

  static async pullSchema(): Promise<void> {
    try {
      console.log('🔄 Pulling schema from database...');
      execSync('npx prisma db pull', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema pulled successfully');
    } catch (error) {
      console.error('❌ Failed to pull schema:', error);
      throw error;
    }
  }

  static async validateSchema(): Promise<void> {
    try {
      console.log('🔄 Validating Prisma schema...');
      execSync('npx prisma validate', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema validation passed');
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      throw error;
    }
  }

  static async formatSchema(): Promise<void> {
    try {
      console.log('🔄 Formatting Prisma schema...');
      execSync('npx prisma format', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema formatted successfully');
    } catch (error) {
      console.error('❌ Failed to format schema:', error);
      throw error;
    }
  }

  {{#if module.parameters.introspection}}
  static async introspectDatabase(): Promise<void> {
    try {
      console.log('🔄 Introspecting database...');
      execSync('npx prisma db pull', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database introspection completed');
    } catch (error) {
      console.error('❌ Database introspection failed:', error);
      throw error;
    }
  }
  {{/if}}

  {{#if module.parameters.schema-validation}}
  static async checkSchemaHealth(): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if schema file exists
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        issues.push('Schema file not found at prisma/schema.prisma');
        return { isValid: false, issues, warnings };
      }

      // Validate schema syntax
      try {
        execSync('npx prisma validate', { stdio: 'pipe' });
      } catch (error) {
        issues.push('Schema validation failed: ' + (error as any).message);
      }

      // Check for common issues
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      if (!schemaContent.includes('generator client')) {
        warnings.push('No Prisma client generator found');
      }

      if (!schemaContent.includes('datasource db')) {
        issues.push('No database datasource found');
      }

      if (schemaContent.includes('@@map(') && !schemaContent.includes('model')) {
        warnings.push('Schema contains table mappings but no models');
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      issues.push('Failed to check schema health: ' + (error as Error).message);
      return { isValid: false, issues, warnings };
    }
  }
  {{/if}}

  static async createMigration(name: string): Promise<void> {
    try {
      console.log('🔄 Creating migration: ' + name);
      execSync('npx prisma migrate dev --name ' + name, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migration created successfully');
    } catch (error) {
      console.error('❌ Failed to create migration:', error);
      throw error;
    }
  }

  static async applyMigrations(): Promise<void> {
    try {
      console.log('🔄 Applying migrations...');
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migrations applied successfully');
    } catch (error) {
      console.error('❌ Failed to apply migrations:', error);
      throw error;
    }
  }

  static async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      execSync('npx prisma migrate reset --force', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      throw error;
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/database/schema-manager.tsx',
      content: `'use client';

import React, { useState } from 'react';
import { SchemaManager } from '@/lib/db/schema-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function SchemaManagerComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  const [schemaHealth, setSchemaHealth] = useState<any>(null);

  const executeAction = async (action: () => Promise<void>, actionName: string) => {
    setIsLoading(true);
    try {
      await action();
      setLastAction(actionName + ' completed successfully');
    } catch (error) {
      setLastAction(actionName + ' failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSchemaHealth = async () => {
    setIsLoading(true);
    try {
      const health = await SchemaManager.checkSchemaHealth();
      setSchemaHealth(health);
      setLastAction('Schema health check completed');
    } catch (error) {
      setLastAction('Schema health check failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const createMigration = async () => {
    const name = prompt('Enter migration name:');
    if (name) {
      await executeAction(() => SchemaManager.createMigration(name), 'Migration creation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Management</h1>
          <p className="text-muted-foreground">
            Manage your Prisma schema and database migrations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={checkSchemaHealth} disabled={isLoading}>
            Check Health
          </Button>
        </div>
      </div>

      {/* Schema Health Status */}
      {schemaHealth && (
        <Card>
          <CardHeader>
            <CardTitle>Schema Health Status</CardTitle>
            <CardDescription>Current status of your Prisma schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant={schemaHealth.isValid ? 'default' : 'destructive'}>
                {schemaHealth.isValid ? 'Healthy' : 'Issues Found'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {schemaHealth.issues.length} issues, {schemaHealth.warnings.length} warnings
              </span>
            </div>
            
            {schemaHealth.issues.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-600">Issues:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {schemaHealth.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {schemaHealth.warnings.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-yellow-600">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {schemaHealth.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schema Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Operations</CardTitle>
            <CardDescription>Manage Prisma client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => executeAction(() => SchemaManager.generateClient(), 'Client generation')}
              disabled={isLoading}
              className="w-full"
            >
              Generate Client
            </Button>
            <Button 
              onClick={() => executeAction(() => SchemaManager.validateSchema(), 'Schema validation')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Validate Schema
            </Button>
            <Button 
              onClick={() => executeAction(() => SchemaManager.formatSchema(), 'Schema formatting')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Format Schema
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Operations</CardTitle>
            <CardDescription>Manage database schema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => executeAction(() => SchemaManager.pushSchema(), 'Schema push')}
              disabled={isLoading}
              className="w-full"
            >
              Push Schema
            </Button>
            <Button 
              onClick={() => executeAction(() => SchemaManager.pullSchema(), 'Schema pull')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Pull Schema
            </Button>
            {{#if module.parameters.introspection}}
            <Button 
              onClick={() => executeAction(() => SchemaManager.introspectDatabase(), 'Database introspection')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Introspect DB
            </Button>
            {{/if}}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migration Operations</CardTitle>
            <CardDescription>Manage database migrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={createMigration}
              disabled={isLoading}
              className="w-full"
            >
              Create Migration
            </Button>
            <Button 
              onClick={() => executeAction(() => SchemaManager.applyMigrations(), 'Migration apply')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Apply Migrations
            </Button>
            <Button 
              onClick={() => executeAction(() => SchemaManager.resetDatabase(), 'Database reset')}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              Reset Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Last Action Status */}
      {lastAction && (
        <Card>
          <CardHeader>
            <CardTitle>Last Action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{lastAction}</p>
          </CardContent>
        </Card>
      )}

      {/* Schema Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Management Tips</CardTitle>
          <CardDescription>Best practices for Prisma schema management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Always validate your schema before pushing to production</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Use migrations for production databases, db push for development</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Regularly introspect your database to keep schema in sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Format your schema file to maintain consistency</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`
    }
  ]
};
export default schemaManagementBlueprint;

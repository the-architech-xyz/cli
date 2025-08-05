/**
 * Drizzle Database Adapter - Enhanced Implementation
 * 
 * Comprehensive implementation of IDatabaseProvider for Drizzle ORM.
 * Includes file generation, dependency management, configuration validation,
 * and proper error handling with rollback capabilities.
 */

import { IDatabaseProvider } from '../../interfaces/providers.js';
import { AgentContext, PluginResult, PluginMetadata, ParameterSchema, CoreCategory, ValidationResult, ValidationError } from '../../interfaces/base.js';
import * as fsExtra from 'fs-extra';
import * as path from 'path';

export class DrizzleAdapter implements IDatabaseProvider {
  getMetadata(): PluginMetadata {
    return {
      name: "@architech/drizzle-adapter",
      version: "0.1.0",
      category: CoreCategory.DATABASE,
      description: "Drizzle ORM adapter for SQL databases with full type safety",
      dependencies: ["drizzle-orm", "@neondatabase/serverless", "drizzle-kit"],
      conflicts: ["prisma", "typeorm"],
      requirements: [
        {
          type: "package",
          name: "drizzle-orm",
          description: "TypeScript ORM for SQL databases"
        }
      ],
      license: "MIT",
      repository: "https://github.com/drizzle-team/drizzle-orm",
      documentation: "https://orm.drizzle.team/",
      tags: ["database", "orm", "typescript", "sql"],
      author: "The Architech Team"
    };
  }

  getParameterSchema(): ParameterSchema {
    return {
      parameters: [
        {
          id: "databaseUrl",
          name: "Database URL",
          description: "Connection string for your database (e.g., postgresql://...)",
          type: "string",
          required: true,
          validation: [
            {
              type: "pattern",
              value: "^(postgresql|mysql|sqlite)://.*",
              message: "Database URL must be a valid connection string"
            }
          ]
        },
        {
          id: "databaseType",
          name: "Database Type",
          description: "Type of database to use",
          type: "string",
          required: true,
          default: "postgresql",
          enum: ["postgresql", "mysql", "sqlite"]
        },
        {
          id: "schemaPath",
          name: "Schema Path",
          description: "Path to your database schema file",
          type: "string",
          default: "lib/db/schema.ts"
        },
        {
          id: "migrationsPath",
          name: "Migrations Path",
          description: "Path to store database migrations",
          type: "string",
          default: "lib/db/migrations"
        },
        {
          id: "seedData",
          name: "Include Seed Data",
          description: "Generate sample data for development",
          type: "boolean",
          default: true
        }
      ],
      groups: [
        {
          id: "connection",
          name: "Database Connection",
          description: "Configure your database connection",
          order: 1
        },
        {
          id: "schema",
          name: "Schema Configuration",
          description: "Configure your database schema",
          order: 2
        }
      ]
    };
  }

  async validate(context: AgentContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate database URL
    const databaseUrl = context.answers.databaseUrl;
    if (!databaseUrl) {
      errors.push({
        field: "databaseUrl",
        message: "Database URL is required",
        code: "MISSING_DATABASE_URL",
        severity: "error"
      });
    } else if (!/^(postgresql|mysql|sqlite):\/\/.*/.test(databaseUrl)) {
      errors.push({
        field: "databaseUrl",
        message: "Invalid database URL format",
        code: "INVALID_DATABASE_URL",
        severity: "error"
      });
    }

    // Validate schema path
    const schemaPath = context.answers.schemaPath;
    if (schemaPath && !schemaPath.endsWith('.ts')) {
      warnings.push("Schema path should end with .ts for TypeScript support");
    }

    // Check for conflicts
    const packageJsonPath = path.join(context.workspacePath, 'package.json');
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      if (packageJson.dependencies?.prisma) {
        errors.push({
          field: "dependencies",
          message: "Prisma is already installed and may conflict with Drizzle",
          code: "CONFLICTING_ORM",
          severity: "error"
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async connect(context: AgentContext): Promise<void> {
    await context.runStep('install-drizzle', 'npm install drizzle-orm @neondatabase/serverless');
    await context.runStep('install-dev-deps', 'npm install drizzle-kit --save-dev');
  }

  async generateSchema(context: AgentContext): Promise<void> {
    const schemaPath = context.answers.schemaPath || 'lib/db/schema.ts';
    const fullSchemaPath = path.join(context.workspacePath, schemaPath);
    
    // Ensure directory exists
    await fsExtra.ensureDir(path.dirname(fullSchemaPath));

    const schemaContent = this.generateSchemaContent(context.answers);
    await fsExtra.writeFile(fullSchemaPath, schemaContent);
    
    context.log('Schema file generated successfully', 'info');
  }

  async runMigrations(context: AgentContext): Promise<void> {
    // Create drizzle config
    const configContent = this.generateDrizzleConfig(context.answers);
    const configPath = path.join(context.workspacePath, 'drizzle.config.ts');
    await fsExtra.writeFile(configPath, configContent);

    await context.runStep('generate-migration', 'npx drizzle-kit generate');
    await context.runStep('run-migration', 'npx drizzle-kit push');
  }

  async getOrmClient(context: AgentContext): Promise<any> {
    const clientPath = path.join(context.workspacePath, 'lib/db/index.ts');
    await fsExtra.ensureDir(path.dirname(clientPath));

    const clientContent = this.generateClientContent(context.answers);
    await fsExtra.writeFile(clientPath, clientContent);
    
    context.log('Database client generated successfully', 'info');
  }

  async seedDatabase(context: AgentContext): Promise<void> {
    if (!context.answers.seedData) {
      context.log('Skipping seed data generation', 'info');
      return;
    }

    const seedPath = path.join(context.workspacePath, 'lib/db/seed.ts');
    await fsExtra.ensureDir(path.dirname(seedPath));

    const seedContent = this.generateSeedContent(context.answers);
    await fsExtra.writeFile(seedPath, seedContent);
    
    context.log('Seed data generated successfully', 'info');
  }

  async setupConnection(context: AgentContext): Promise<void> {
    // Create environment variables
    const envContent = this.generateEnvContent(context.answers);
    const envPath = path.join(context.workspacePath, '.env.local');
    await fsExtra.writeFile(envPath, envContent);
    
    context.log('Environment variables configured', 'info');
  }

  async configureEnvironment(context: AgentContext): Promise<void> {
    // Add database scripts to package.json
    const packageJsonPath = path.join(context.workspacePath, 'package.json');
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = await fsExtra.readJson(packageJsonPath);
      
      packageJson.scripts = {
        ...packageJson.scripts,
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit push",
        "db:studio": "drizzle-kit studio",
        "db:seed": "tsx lib/db/seed.ts"
      };

      await fsExtra.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
  }

  async execute(context: AgentContext): Promise<PluginResult> {
    const startTime = Date.now();
    const artifacts: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      context.log('Starting Drizzle database setup...', 'info');

      // Validate configuration
      const validation = await this.validate(context);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message),
          warnings: validation.warnings,
          artifacts: [],
          duration: Date.now() - startTime
        };
      }

      // Execute setup steps
      await this.connect(context);
      await this.generateSchema(context);
      await this.getOrmClient(context);
      await this.setupConnection(context);
      await this.configureEnvironment(context);
      
      if (context.answers.seedData) {
        await this.seedDatabase(context);
      }

      // Add generated files to artifacts
      artifacts.push(
        context.answers.schemaPath || 'lib/db/schema.ts',
        'lib/db/index.ts',
        'drizzle.config.ts',
        '.env.local'
      );

      if (context.answers.seedData) {
        artifacts.push('lib/db/seed.ts');
      }

      context.log('Drizzle database setup completed successfully', 'info');

      return {
        success: true,
        artifacts,
        warnings,
        errors,
        dependencies: ["drizzle-orm", "@neondatabase/serverless", "drizzle-kit"],
        scripts: {
          "db:generate": "drizzle-kit generate",
          "db:migrate": "drizzle-kit push",
          "db:studio": "drizzle-kit studio",
          "db:seed": "tsx lib/db/seed.ts"
        },
        configs: {
          "drizzle": {
            schema: context.answers.schemaPath || 'lib/db/schema.ts',
            out: context.answers.migrationsPath || 'lib/db/migrations'
          }
        },
        duration: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.log(`Drizzle setup failed: ${errorMessage}`, 'error');
      
      return {
        success: false,
        errors: [errorMessage],
        warnings,
        artifacts: [],
        duration: Date.now() - startTime
      };
    }
  }

  async rollback(context: AgentContext): Promise<void> {
    context.log('Rolling back Drizzle database setup...', 'info');
    
    const filesToRemove = [
      context.answers.schemaPath || 'lib/db/schema.ts',
      'lib/db/index.ts',
      'lib/db/seed.ts',
      'drizzle.config.ts',
      '.env.local'
    ];

    for (const file of filesToRemove) {
      const filePath = path.join(context.workspacePath, file);
      if (await fsExtra.pathExists(filePath)) {
        await fsExtra.remove(filePath);
      }
    }

    // Remove dependencies
    await context.runStep('remove-deps', 'npm uninstall drizzle-orm @neondatabase/serverless drizzle-kit');
    
    context.log('Drizzle rollback completed', 'info');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateSchemaContent(config: any): string {
    return `import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar: varchar('avatar', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: uuid('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
`;
  }

  private generateClientContent(config: any): string {
    return `import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Export types for use in your application
export type { User, NewUser, Post, NewPost } from './schema';
export { users, posts } from './schema';
`;
  }

  private generateSeedContent(config: any): string {
    return `import { db } from './index';
import { users, posts } from './schema';

export async function seed() {
  try {
    // Create sample users
    const user1 = await db.insert(users).values({
      email: 'john@example.com',
      name: 'John Doe',
      emailVerified: true,
    }).returning();

    const user2 = await db.insert(users).values({
      email: 'jane@example.com',
      name: 'Jane Smith',
      emailVerified: true,
    }).returning();

    // Create sample posts
    await db.insert(posts).values([
      {
        title: 'Welcome to our blog!',
        content: 'This is our first blog post. Welcome to our platform!',
        published: true,
        authorId: user1[0].id,
      },
      {
        title: 'Getting Started with Drizzle',
        content: 'Learn how to use Drizzle ORM in your Next.js application.',
        published: true,
        authorId: user2[0].id,
      },
    ]);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch(console.error);
}
`;
  }

  private generateDrizzleConfig(config: any): string {
    return `import type { Config } from 'drizzle-kit';

export default {
  schema: './${config.schemaPath || 'lib/db/schema.ts'}',
  out: './${config.migrationsPath || 'lib/db/migrations'}',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
`;
  }

  private generateEnvContent(config: any): string {
    return `# Database Configuration
DATABASE_URL="${config.databaseUrl || 'postgresql://user:password@localhost:5432/mydb'}"

# Add your other environment variables here
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
`;
  }
} 
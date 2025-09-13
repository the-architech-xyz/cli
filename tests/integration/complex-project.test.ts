/**
 * Complex Project Integration Test
 * 
 * Tests the generation of a complex SaaS project with multiple modules
 * and integrations to ensure advanced functionality works end-to-end.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent.js';
import { ProjectManager } from '../../src/core/services/project/project-manager.js';
import { testUtils, TEST_OUTPUT_DIR } from '../setup.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Complex SaaS Project Generation', () => {
  const testProjectName = 'test-complex-saas';
  const testProjectPath = testUtils.createTestProjectPath(testProjectName);
  
  let orchestrator: OrchestratorAgent;
  let projectManager: ProjectManager;

  beforeAll(async () => {
    // Initialize project manager and orchestrator
    projectManager = new ProjectManager(testProjectPath);
    orchestrator = new OrchestratorAgent(projectManager);
  });

  afterAll(async () => {
    // Cleanup is handled by test setup
  });

  it('should generate a complex SaaS project with multiple modules', async () => {
    // Create a complex recipe
    const recipe = {
      project: {
        name: testProjectName,
        framework: 'nextjs',
        path: testProjectPath,
        description: 'A complex SaaS test project with multiple modules'
      },
      modules: [
        {
          id: 'nextjs',
          category: 'framework',
          version: 'latest',
          parameters: {
            typescript: true,
            tailwind: true,
            appRouter: true,
            eslint: true
          }
        },
        {
          id: 'drizzle',
          category: 'database',
          version: 'latest',
          parameters: {
            provider: 'postgresql',
            migrations: true
          }
        },
        {
          id: 'better-auth',
          category: 'auth',
          version: 'latest',
          parameters: {
            emailVerification: true,
            multiFactor: false
          }
        },
        {
          id: 'shadcn-ui',
          category: 'ui',
          version: 'latest',
          parameters: {
            components: ['button', 'input', 'form', 'card']
          }
        },
        {
          id: 'stripe',
          category: 'payment',
          version: 'latest',
          parameters: {
            subscriptions: true,
            webhooks: true
          }
        },
        {
          id: 'vitest',
          category: 'testing',
          version: 'latest',
          parameters: {
            coverage: true,
            e2e: true
          }
        }
      ],
      integrations: [
        {
          name: 'drizzle-nextjs-integration',
          features: ['api-routes', 'middleware']
        },
        {
          name: 'better-auth-nextjs-integration',
          features: ['api-routes', 'middleware']
        },
        {
          name: 'stripe-nextjs-integration',
          features: ['api-routes', 'webhooks']
        }
      ],
      options: {
        skipInstall: true,
        verbose: true
      }
    };

    // Execute the recipe
    const result = await orchestrator.executeRecipe(recipe);

    // Verify execution was successful
    expect(result.success).toBe(true);
    expect(result.modulesExecuted).toBe(6);
    expect(result.errors).toHaveLength(0);
  });

  it('should create all essential project files', async () => {
    // Check for essential files
    const essentialFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'tailwind.config.js',
      'app/layout.tsx',
      'app/page.tsx',
      'drizzle.config.ts',
      'vitest.config.ts'
    ];

    for (const file of essentialFiles) {
      const filePath = join(testProjectPath, file);
      const exists = await testUtils.waitForFile(filePath, 2000);
      expect(exists).toBe(true);
    }
  });

  it('should have comprehensive package.json with all dependencies', async () => {
    const packageJsonPath = join(testProjectPath, 'package.json');
    const packageJsonContent = await testUtils.readFile(packageJsonPath);
    
    expect(packageJsonContent).not.toBeNull();
    
    const packageJson = JSON.parse(packageJsonContent!);
    
    // Check basic structure
    expect(packageJson.name).toBe(testProjectName);
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    
    // Check framework dependencies
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    
    // Check database dependencies
    expect(packageJson.dependencies).toHaveProperty('drizzle-orm');
    expect(packageJson.dependencies).toHaveProperty('postgres');
    
    // Check auth dependencies
    expect(packageJson.dependencies).toHaveProperty('better-auth');
    
    // Check UI dependencies
    expect(packageJson.dependencies).toHaveProperty('@radix-ui/react-slot');
    expect(packageJson.dependencies).toHaveProperty('class-variance-authority');
    expect(packageJson.dependencies).toHaveProperty('clsx');
    expect(packageJson.dependencies).toHaveProperty('tailwind-merge');
    
    // Check payment dependencies
    expect(packageJson.dependencies).toHaveProperty('stripe');
    
    // Check testing dependencies
    expect(packageJson.devDependencies).toHaveProperty('vitest');
    expect(packageJson.devDependencies).toHaveProperty('@vitejs/plugin-react');
    expect(packageJson.devDependencies).toHaveProperty('jsdom');
    
    // Check TypeScript dependencies
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('@types/react');
    expect(packageJson.devDependencies).toHaveProperty('@types/node');
    
    // Check Tailwind dependencies
    expect(packageJson.devDependencies).toHaveProperty('tailwindcss');
    expect(packageJson.devDependencies).toHaveProperty('autoprefixer');
    expect(packageJson.devDependencies).toHaveProperty('postcss');
  });

  it('should have correct database configuration', async () => {
    const drizzleConfigPath = join(testProjectPath, 'drizzle.config.ts');
    const drizzleConfigContent = await testUtils.readFile(drizzleConfigPath);
    
    expect(drizzleConfigContent).not.toBeNull();
    expect(drizzleConfigContent).toContain('import { defineConfig } from "drizzle-kit"');
    expect(drizzleConfigContent).toContain('dialect: "postgresql"');
  });

  it('should have correct testing configuration', async () => {
    const vitestConfigPath = join(testProjectPath, 'vitest.config.ts');
    const vitestConfigContent = await testUtils.readFile(vitestConfigPath);
    
    expect(vitestConfigContent).not.toBeNull();
    expect(vitestConfigContent).toContain('import { defineConfig } from "vitest/config"');
    expect(vitestConfigContent).toContain('environment: "jsdom"');
  });

  it('should create proper app structure with components', async () => {
    // Check for app directory structure
    const appFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'app/globals.css'
    ];

    for (const file of appFiles) {
      const filePath = join(testProjectPath, file);
      const exists = await testUtils.waitForFile(filePath, 2000);
      expect(exists).toBe(true);
    }

    // Check for components directory (shadcn-ui)
    const componentsDir = join(testProjectPath, 'components');
    const componentsExists = testUtils.fileExists(componentsDir);
    expect(componentsExists).toBe(true);
  });

  it('should create API routes for integrations', async () => {
    // Check for API routes directory
    const apiDir = join(testProjectPath, 'app/api');
    const apiExists = testUtils.fileExists(apiDir);
    expect(apiExists).toBe(true);
  });

  it('should create environment configuration', async () => {
    // Check for environment files
    const envFiles = [
      '.env.example',
      '.env.local'
    ];

    for (const file of envFiles) {
      const filePath = join(testProjectPath, file);
      const exists = await testUtils.waitForFile(filePath, 2000);
      expect(exists).toBe(true);
    }
  });

  it('should create architech.json with all modules and integrations', async () => {
    const architechConfigPath = join(testProjectPath, 'architech.json');
    const architechConfigContent = await testUtils.readFile(architechConfigPath);
    
    expect(architechConfigContent).not.toBeNull();
    
    const architechConfig = JSON.parse(architechConfigContent!);
    
    // Check architech.json structure
    expect(architechConfig.version).toBe('1.0');
    expect(architechConfig.project).toBeDefined();
    expect(architechConfig.project.name).toBe(testProjectName);
    expect(architechConfig.project.framework).toBe('nextjs');
    expect(architechConfig.modules).toBeDefined();
    expect(architechConfig.modules).toHaveLength(6);
    
    // Check all modules are present
    const moduleIds = architechConfig.modules.map((m: any) => m.id);
    expect(moduleIds).toContain('nextjs');
    expect(moduleIds).toContain('drizzle');
    expect(moduleIds).toContain('better-auth');
    expect(moduleIds).toContain('shadcn-ui');
    expect(moduleIds).toContain('stripe');
    expect(moduleIds).toContain('vitest');
  });

  it('should handle errors gracefully', async () => {
    // Test with invalid recipe
    const invalidRecipe = {
      project: {
        name: 'invalid-test',
        framework: 'nextjs',
        path: testUtils.createTestProjectPath('invalid-test'),
        description: 'Invalid test project'
      },
      modules: [
        {
          id: 'nonexistent-module',
          category: 'nonexistent',
          version: 'latest',
          parameters: {}
        }
      ],
      options: {
        skipInstall: true,
        verbose: true
      }
    };

    const result = await orchestrator.executeRecipe(invalidRecipe);
    
    // Should fail gracefully
    expect(result.success).toBe(false);
    expect(result.modulesExecuted).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

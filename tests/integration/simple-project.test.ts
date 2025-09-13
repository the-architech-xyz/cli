/**
 * Simple Project Integration Test
 * 
 * Tests the generation of a basic Next.js project to ensure
 * core functionality works end-to-end.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent.js';
import { ProjectManager } from '../../src/core/services/project/project-manager.js';
import { testUtils, TEST_OUTPUT_DIR } from '../setup.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Simple Project Generation', () => {
  const testProjectName = 'test-simple-nextjs';
  const testProjectPath = testUtils.createTestProjectPath(testProjectName);
  
  let orchestrator: OrchestratorAgent;
  let projectManager: ProjectManager;

  beforeAll(async () => {
    // Load test recipe
    const recipePath = join(process.cwd(), 'tests/fixtures/simple-nextjs.yaml');
    const recipeContent = readFileSync(recipePath, 'utf-8');
    const recipe = JSON.parse(recipeContent.replace(/\.yaml$/, '.json')); // Convert YAML to JSON for now
    
    // Initialize project manager and orchestrator
    projectManager = new ProjectManager(testProjectPath);
    orchestrator = new OrchestratorAgent(projectManager);
    
    // Update recipe path to use test directory
    recipe.project.path = testProjectPath;
  });

  afterAll(async () => {
    // Cleanup is handled by test setup
  });

  it('should generate a complete Next.js project structure', async () => {
    // Load and parse the recipe
    const recipePath = join(process.cwd(), 'tests/fixtures/simple-nextjs.yaml');
    const recipeContent = readFileSync(recipePath, 'utf-8');
    
    // For now, we'll create a simple recipe object
    // In a real implementation, you'd parse the YAML
    const recipe = {
      project: {
        name: testProjectName,
        framework: 'nextjs',
        path: testProjectPath,
        description: 'A simple Next.js test project'
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
    expect(result.modulesExecuted).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should create essential project files', async () => {
    // Check for essential Next.js files
    const essentialFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'tailwind.config.js',
      'app/layout.tsx',
      'app/page.tsx'
    ];

    for (const file of essentialFiles) {
      const filePath = join(testProjectPath, file);
      const exists = await testUtils.waitForFile(filePath, 2000);
      expect(exists).toBe(true);
    }
  });

  it('should have correct package.json configuration', async () => {
    const packageJsonPath = join(testProjectPath, 'package.json');
    const packageJsonContent = await testUtils.readFile(packageJsonPath);
    
    expect(packageJsonContent).not.toBeNull();
    
    const packageJson = JSON.parse(packageJsonContent!);
    
    // Check basic package.json structure
    expect(packageJson.name).toBe(testProjectName);
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    
    // Check for Next.js dependencies
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');
    
    // Check for TypeScript dependencies
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('@types/react');
    expect(packageJson.devDependencies).toHaveProperty('@types/node');
    
    // Check for Tailwind dependencies
    expect(packageJson.devDependencies).toHaveProperty('tailwindcss');
    expect(packageJson.devDependencies).toHaveProperty('autoprefixer');
    expect(packageJson.devDependencies).toHaveProperty('postcss');
  });

  it('should have correct TypeScript configuration', async () => {
    const tsconfigPath = join(testProjectPath, 'tsconfig.json');
    const tsconfigContent = await testUtils.readFile(tsconfigPath);
    
    expect(tsconfigContent).not.toBeNull();
    
    const tsconfig = JSON.parse(tsconfigContent!);
    
    // Check TypeScript configuration
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.target).toBe('es5');
    expect(tsconfig.compilerOptions.lib).toContain('dom');
    expect(tsconfig.compilerOptions.allowJs).toBe(true);
    expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
    expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
    expect(tsconfig.compilerOptions.module).toBe('esnext');
    expect(tsconfig.compilerOptions.moduleResolution).toBe('bundler');
    expect(tsconfig.compilerOptions.resolveJsonModule).toBe(true);
    expect(tsconfig.compilerOptions.isolatedModules).toBe(true);
    expect(tsconfig.compilerOptions.jsx).toBe('preserve');
    expect(tsconfig.compilerOptions.incremental).toBe(true);
    expect(tsconfig.compilerOptions.plugins).toContainEqual({
      name: 'next'
    });
    expect(tsconfig.include).toContain('next-env.d.ts');
    expect(tsconfig.include).toContain('**/*.ts');
    expect(tsconfig.include).toContain('**/*.tsx');
    expect(tsconfig.include).toContain('.next/types/**/*.ts');
    expect(tsconfig.exclude).toContain('node_modules');
  });

  it('should have correct Next.js configuration', async () => {
    const nextConfigPath = join(testProjectPath, 'next.config.ts');
    const nextConfigContent = await testUtils.readFile(nextConfigPath);
    
    expect(nextConfigContent).not.toBeNull();
    expect(nextConfigContent).toContain('import type { NextConfig } from "next"');
    expect(nextConfigContent).toContain('const nextConfig: NextConfig = {');
  });

  it('should have correct Tailwind configuration', async () => {
    const tailwindConfigPath = join(testProjectPath, 'tailwind.config.js');
    const tailwindConfigContent = await testUtils.readFile(tailwindConfigPath);
    
    expect(tailwindConfigContent).not.toBeNull();
    expect(tailwindConfigContent).toContain('content: [');
    expect(tailwindConfigContent).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}');
    expect(tailwindConfigContent).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}');
    expect(tailwindConfigContent).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');
  });

  it('should create basic app structure', async () => {
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
  });

  it('should create architech.json configuration file', async () => {
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
    expect(architechConfig.modules).toHaveLength(1);
    expect(architechConfig.modules[0].id).toBe('nextjs');
    expect(architechConfig.modules[0].category).toBe('framework');
  });
});

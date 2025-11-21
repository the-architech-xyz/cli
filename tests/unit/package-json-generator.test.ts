/**
 * Package JSON Generator Unit Tests
 * 
 * Tests for the PackageJsonGenerator service that generates package.json files
 * based on recipe book metadata.
 */

import { describe, it, expect } from 'vitest';
import { PackageJsonGenerator } from '../../src/core/services/project/package-json-generator.js';
import type { PackageStructure } from '@thearchitech.xyz/types';

describe('PackageJsonGenerator', () => {
  const mockPackageStructure: PackageStructure = {
    name: 'auth',
    directory: 'packages/auth',
    dependencies: {
      'better-auth': 'latest',
      '@{projectName}/db': 'workspace:*'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0'
    },
    exports: {
      './client': './src/client.ts',
      './server': './src/server.ts',
      './types': './src/types.ts'
    }
  };

  describe('generatePackageJson', () => {
    it('should generate package.json with project-specific naming', () => {
      const result = PackageJsonGenerator.generatePackageJson(
        'auth',
        mockPackageStructure,
        'synap'
      );

      expect(result.name).toBe('@synap/auth');
      expect(result.version).toBe('1.0.0');
      expect(result.private).toBe(true);
      expect(result.main).toBe('src/index.ts');
      expect(result.types).toBe('src/index.ts');
    });

    it('should resolve workspace dependencies with project name', () => {
      const result = PackageJsonGenerator.generatePackageJson(
        'auth',
        mockPackageStructure,
        'synap'
      );

      expect(result.dependencies).toHaveProperty('@synap/db');
      expect(result.dependencies!['@synap/db']).toBe('workspace:*');
      expect(result.dependencies).toHaveProperty('better-auth');
      expect(result.dependencies!['better-auth']).toBe('latest');
    });

    it('should include devDependencies from packageStructure', () => {
      const result = PackageJsonGenerator.generatePackageJson(
        'auth',
        mockPackageStructure,
        'synap'
      );

      expect(result.devDependencies).toHaveProperty('typescript');
      expect(result.devDependencies!['typescript']).toBe('^5.0.0');
      expect(result.devDependencies).toHaveProperty('@types/node');
    });

    it('should include exports from packageStructure', () => {
      const result = PackageJsonGenerator.generatePackageJson(
        'auth',
        mockPackageStructure,
        'synap'
      );

      expect(result.exports).toEqual({
        './client': './src/client.ts',
        './server': './src/server.ts',
        './types': './src/types.ts'
      });
    });

    it('should add default build/dev scripts', () => {
      const result = PackageJsonGenerator.generatePackageJson(
        'auth',
        mockPackageStructure,
        'synap'
      );

      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts!['build']).toBe('tsc');
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts!['dev']).toBe('tsc --watch');
    });

    it('should add database-specific scripts for db package', () => {
      const dbPackageStructure: PackageStructure = {
        name: 'db',
        directory: 'packages/db',
        dependencies: {
          'drizzle-orm': 'latest'
        }
      };

      const result = PackageJsonGenerator.generatePackageJson(
        'db',
        dbPackageStructure,
        'synap'
      );

      expect(result.scripts).toHaveProperty('db:generate');
      expect(result.scripts!['db:generate']).toBe('drizzle-kit generate');
      expect(result.scripts).toHaveProperty('db:migrate');
      expect(result.scripts!['db:migrate']).toBe('drizzle-kit migrate');
    });

    it('should preserve custom scripts from packageStructure', () => {
      const customPackageStructure: PackageStructure = {
        name: 'ui',
        directory: 'packages/ui',
        dependencies: {},
        scripts: {
          'build': 'tsc --build',
          'test': 'vitest'
        }
      };

      const result = PackageJsonGenerator.generatePackageJson(
        'ui',
        customPackageStructure,
        'synap'
      );

      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts!['build']).toBe('tsc --build');
      expect(result.scripts).toHaveProperty('test');
      expect(result.scripts!['test']).toBe('vitest');
    });
  });

  describe('generateAppPackageJson', () => {
    it('should generate package.json for Next.js app', () => {
      const result = PackageJsonGenerator.generateAppPackageJson(
        'web',
        'nextjs',
        'synap',
        {
          '@synap/auth': 'workspace:*',
          '@synap/ui': 'workspace:*'
        }
      );

      expect(result.name).toBe('@synap/web');
      expect(result.dependencies).toHaveProperty('@synap/auth');
      expect(result.dependencies).toHaveProperty('@synap/ui');
      expect(result.dependencies).toHaveProperty('next');
      expect(result.dependencies).toHaveProperty('react');
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts!['dev']).toBe('next dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts!['build']).toBe('next build');
    });

    it('should generate package.json for Expo app', () => {
      const result = PackageJsonGenerator.generateAppPackageJson(
        'mobile',
        'expo',
        'synap',
        {
          '@synap/auth': 'workspace:*'
        }
      );

      expect(result.name).toBe('@synap/mobile');
      expect(result.dependencies).toHaveProperty('expo');
      expect(result.dependencies).toHaveProperty('react-native');
      expect(result.scripts).toHaveProperty('start');
      expect(result.scripts!['start']).toBe('expo start');
      expect(result.scripts).toHaveProperty('android');
      expect(result.scripts).toHaveProperty('ios');
    });

    it('should generate package.json for Hono API app', () => {
      const result = PackageJsonGenerator.generateAppPackageJson(
        'api',
        'hono',
        'synap',
        {
          '@synap/db': 'workspace:*'
        }
      );

      expect(result.name).toBe('@synap/api');
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts!['dev']).toBe('tsx watch src/index.ts');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts!['build']).toBe('tsc');
    });

    it('should include workspace dependencies in app package.json', () => {
      const workspaceDeps = {
        '@synap/auth': 'workspace:*',
        '@synap/ui': 'workspace:*',
        '@synap/db': 'workspace:*'
      };

      const result = PackageJsonGenerator.generateAppPackageJson(
        'web',
        'nextjs',
        'synap',
        workspaceDeps
      );

      expect(result.dependencies).toMatchObject(workspaceDeps);
    });
  });
});


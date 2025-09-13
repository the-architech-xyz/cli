/**
 * Pure Modifiers Integration Tests
 * 
 * Tests all pure modifiers to ensure they work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPureModifierRegistry, PureModifierRegistry } from '../../src/core/services/modifiers/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Pure Modifiers Integration Tests', () => {
  let registry: PureModifierRegistry;
  let testDir: string;
  
  beforeEach(async () => {
    registry = createPureModifierRegistry();
    testDir = join(tmpdir(), 'architech-pure-modifiers-test');
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  describe('JSExportWrapper', () => {
    it('should wrap default export with function', async () => {
      const testFile = join(testDir, 'test.js');
      const originalContent = `export default {
  reactStrictMode: true,
  swcMinify: true
};`;
      
      await fs.writeFile(testFile, originalContent);
      
      await registry.execute('js-export-wrapper', testFile, {
        exportToWrap: 'default',
        wrapperFunction: {
          name: 'withSentryConfig',
          importFrom: '@sentry/nextjs'
        },
        wrapperOptions: {
          org: 'my-org',
          project: 'my-project'
        }
      });
      
      const result = await fs.readFile(testFile, 'utf-8');
      expect(result).toContain('import { withSentryConfig } from "@sentry/nextjs"');
      expect(result).toContain('export default withSentryConfig({');
      expect(result).toContain('"org": "my-org"');
    });
  });
  
  describe('TSModuleEnhancer', () => {
    it('should add imports and statements to TypeScript file', async () => {
      const testFile = join(testDir, 'test.ts');
      const originalContent = `// Existing content
export const existing = 'test';`;
      
      await fs.writeFile(testFile, originalContent);
      
      await registry.execute('ts-module-enhancer', testFile, {
        importsToAdd: [
          { name: 'pgTable', from: 'drizzle-orm/pg-core', type: 'import' },
          { name: 'text', from: 'drizzle-orm/pg-core', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'const',
            content: `export const users = pgTable('users', {
              id: text('id').primaryKey(),
              email: text('email').notNull().unique()
            });`
          }
        ]
      });
      
      const result = await fs.readFile(testFile, 'utf-8');
      expect(result).toContain('import { pgTable, text } from "drizzle-orm/pg-core"');
      expect(result).toContain('export const users = pgTable');
    });
  });
  
  describe('JSConfigMerger', () => {
    it('should merge properties into JavaScript config object', async () => {
      const testFile = join(testDir, 'config.js');
      const originalContent = `export default {
  reactStrictMode: true,
  swcMinify: true
};`;
      
      await fs.writeFile(testFile, originalContent);
      
      await registry.execute('js-config-merger', testFile, {
        exportName: 'default',
        propertiesToMerge: {
          experimental: {
            appDir: true
          },
          images: {
            domains: ['example.com']
          }
        },
        mergeStrategy: 'deep'
      });
      
      const result = await fs.readFile(testFile, 'utf-8');
      expect(result).toContain('experimental');
      expect(result).toContain('appDir');
      expect(result).toContain('images');
    });
  });
  
  describe('JSXWrapper', () => {
    it('should wrap JSX component with provider', async () => {
      const testFile = join(testDir, 'layout.tsx');
      const originalContent = `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`;
      
      await fs.writeFile(testFile, originalContent);
      
      await registry.execute('jsx-wrapper', testFile, {
        targetComponent: 'body',
        wrapperComponent: {
          name: 'Sentry.Provider',
          importFrom: '@sentry/nextjs',
          props: {
            dsn: 'https://example@sentry.io/123456'
          }
        },
        wrapStrategy: 'provider'
      });
      
      const result = await fs.readFile(testFile, 'utf-8');
      expect(result).toContain('import { Sentry } from "@sentry/nextjs"');
      expect(result).toContain('<Sentry.Provider dsn="https://example@sentry.io/123456">');
    });
  });
  
  describe('JSONObjectMerger', () => {
    it('should merge properties into JSON file', async () => {
      const testFile = join(testDir, 'package.json');
      const originalContent = `{
  "name": "test-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`;
      
      await fs.writeFile(testFile, originalContent);
      
      await registry.execute('json-object-merger', testFile, {
        targetPath: ['scripts'],
        propertiesToMerge: {
          'sentry:upload-sourcemaps': 'sentry-cli sourcemaps upload --release $SENTRY_RELEASE',
          'sentry:create-release': 'sentry-cli releases new $SENTRY_RELEASE'
        },
        mergeStrategy: 'shallow'
      });
      
      const result = await fs.readFile(testFile, 'utf-8');
      const parsed = JSON.parse(result);
      expect(parsed.scripts['sentry:upload-sourcemaps']).toBeDefined();
      expect(parsed.scripts['sentry:create-release']).toBeDefined();
      expect(parsed.scripts.dev).toBe('next dev'); // Should preserve existing
    });
  });
  
  describe('Registry Validation', () => {
    it('should have all expected modifiers registered', () => {
      const stats = registry.getStats();
      expect(stats.totalModifiers).toBe(5);
      expect(stats.modifierNames).toContain('js-export-wrapper');
      expect(stats.modifierNames).toContain('ts-module-enhancer');
      expect(stats.modifierNames).toContain('js-config-merger');
      expect(stats.modifierNames).toContain('jsx-wrapper');
      expect(stats.modifierNames).toContain('json-object-merger');
    });
    
    it('should validate parameters correctly', async () => {
      const testFile = join(testDir, 'test.js');
      await fs.writeFile(testFile, 'export default {};');
      
      // Test invalid parameters
      await expect(
        registry.execute('js-export-wrapper', testFile, {
          exportToWrap: 'default',
          // Missing wrapperFunction
          wrapperOptions: {}
        })
      ).rejects.toThrow();
      
      // Test valid parameters
      await expect(
        registry.execute('js-export-wrapper', testFile, {
          exportToWrap: 'default',
          wrapperFunction: {
            name: 'withSentryConfig',
            importFrom: '@sentry/nextjs'
          },
          wrapperOptions: {}
        })
      ).resolves.not.toThrow();
    });
  });
});

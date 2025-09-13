/**
 * File Modification Engine Tests
 * 
 * Comprehensive tests for Layer 1: The File Modification Engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileModificationEngine } from '../file-modification-engine.js';
import { VirtualFileSystem } from '../virtual-file-system.js';

describe('FileModificationEngine', () => {
  let engine: FileModificationEngine;
  const testDir = '/tmp/architech-test';

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    await fs.mkdir(testDir, { recursive: true });
    engine = new FileModificationEngine(new VirtualFileSystem(), testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createFile', () => {
    it('should create a new file in VFS', async () => {
      const result = await engine.createFile('test.txt', 'Hello World');
      
      expect(result.success).toBe(true);
      expect(result.filePath).toBe(path.join(testDir, 'test.txt'));
      
      // Check VFS
      const files = engine.getAllFiles();
      expect(files).toHaveLength(1);
      expect(files[0].content).toBe('Hello World');
    });

    it('should fail if file already exists', async () => {
      await engine.createFile('test.txt', 'Hello World');
      
      const result = await engine.createFile('test.txt', 'Hello Again');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File already exists');
    });

    it('should create nested directories when flushing to disk', async () => {
      await engine.createFile('nested/deep/file.txt', 'Nested content');
      await engine.flushToDisk();
      
      const content = await fs.readFile(path.join(testDir, 'nested/deep/file.txt'), 'utf-8');
      expect(content).toBe('Nested content');
    });
  });

  describe('readFile', () => {
    it('should read from VFS when file exists in VFS', async () => {
      await engine.createFile('test.txt', 'VFS content');
      
      const content = await engine.readFile('test.txt');
      expect(content).toBe('VFS content');
    });

    it('should read from disk when file exists on disk but not in VFS', async () => {
      // Create file on disk
      await fs.writeFile(path.join(testDir, 'disk.txt'), 'Disk content');
      
      const content = await engine.readFile('disk.txt');
      expect(content).toBe('Disk content');
    });

    it('should throw error when file does not exist', async () => {
      await expect(engine.readFile('nonexistent.txt')).rejects.toThrow('File not found');
    });
  });

  describe('overwriteFile', () => {
    it('should overwrite existing file in VFS', async () => {
      await engine.createFile('test.txt', 'Original content');
      await engine.overwriteFile('test.txt', 'New content');
      
      const content = await engine.readFile('test.txt');
      expect(content).toBe('New content');
    });

    it('should create file if it does not exist', async () => {
      await engine.overwriteFile('new.txt', 'New file content');
      
      const content = await engine.readFile('new.txt');
      expect(content).toBe('New file content');
    });
  });

  describe('appendToFile', () => {
    it('should append content to existing file', async () => {
      await engine.createFile('test.txt', 'Hello');
      await engine.appendToFile('test.txt', ' World');
      
      const content = await engine.readFile('test.txt');
      expect(content).toBe('Hello World');
    });

    it('should create file if it does not exist', async () => {
      await engine.appendToFile('new.txt', 'New content');
      
      const content = await engine.readFile('new.txt');
      expect(content).toBe('New content');
    });
  });

  describe('prependToFile', () => {
    it('should prepend content to existing file', async () => {
      await engine.createFile('test.txt', 'World');
      await engine.prependToFile('test.txt', 'Hello ');
      
      const content = await engine.readFile('test.txt');
      expect(content).toBe('Hello World');
    });

    it('should create file if it does not exist', async () => {
      await engine.prependToFile('new.txt', 'New content');
      
      const content = await engine.readFile('new.txt');
      expect(content).toBe('New content');
    });
  });

  describe('mergeJsonFile', () => {
    it('should merge JSON objects', async () => {
      await engine.createFile('package.json', JSON.stringify({
        name: 'test',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0'
        }
      }, null, 2));

      await engine.mergeJsonFile('package.json', {
        dependencies: {
          'typescript': '^5.0.0'
        },
        scripts: {
          'build': 'tsc'
        }
      });

      const content = await engine.readFile('package.json');
      const parsed = JSON.parse(content);
      
      expect(parsed.name).toBe('test');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.dependencies.react).toBe('^18.0.0');
      expect(parsed.dependencies.typescript).toBe('^5.0.0');
      expect(parsed.scripts.build).toBe('tsc');
    });

    it('should create file if it does not exist', async () => {
      await engine.mergeJsonFile('new.json', { name: 'new-project' });
      
      const content = await engine.readFile('new.json');
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('new-project');
    });
  });

  describe('modifyTsFile', () => {
    it('should modify TypeScript file using AST', async () => {
      await engine.createFile('test.ts', `
export const hello = 'world';
export function greet(name: string) {
  return \`Hello \${name}\`;
}
      `);

      await engine.modifyTsFile('test.ts', (sourceFile) => {
        // Add a new import
        sourceFile.addImportDeclaration({
          moduleSpecifier: 'react',
          namedImports: ['useState']
        });
        
        // Add a new export
        sourceFile.addExportDeclaration({
          namedExports: ['defaultGreeting'],
          declaration: 'const defaultGreeting = "Hello World";'
        });
      });

      const content = await engine.readFile('test.ts');
      expect(content).toContain("import { useState } from 'react';");
      expect(content).toContain('export { defaultGreeting };');
      expect(content).toContain('const defaultGreeting = "Hello World";');
    });

    it('should create file if it does not exist', async () => {
      await engine.modifyTsFile('new.ts', (sourceFile) => {
        sourceFile.addVariableStatement({
          declarationKind: 'const',
          declarations: [{
            name: 'message',
            initializer: "'Hello from AST'"
          }]
        });
      });

      const content = await engine.readFile('new.ts');
      expect(content).toContain("const message = 'Hello from AST';");
    });
  });

  describe('flushToDisk', () => {
    it('should write all VFS files to disk', async () => {
      await engine.createFile('file1.txt', 'Content 1');
      await engine.createFile('nested/file2.txt', 'Content 2');
      await engine.mergeJsonFile('package.json', { name: 'test-project' });
      
      await engine.flushToDisk();
      
      // Check files exist on disk
      const file1 = await fs.readFile(path.join(testDir, 'file1.txt'), 'utf-8');
      const file2 = await fs.readFile(path.join(testDir, 'nested/file2.txt'), 'utf-8');
      const packageJson = await fs.readFile(path.join(testDir, 'package.json'), 'utf-8');
      
      expect(file1).toBe('Content 1');
      expect(file2).toBe('Content 2');
      expect(JSON.parse(packageJson).name).toBe('test-project');
    });
  });

  describe('operation tracking', () => {
    it('should track all operations', async () => {
      await engine.createFile('test1.txt', 'Content 1');
      await engine.appendToFile('test1.txt', ' more');
      await engine.createFile('test2.txt', 'Content 2');
      
      const operations = engine.getOperations();
      expect(operations).toHaveLength(3);
      expect(operations[0].type).toBe('create');
      expect(operations[1].type).toBe('append');
      expect(operations[2].type).toBe('create');
    });
  });
});

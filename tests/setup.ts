/**
 * Test Setup
 * 
 * Global test configuration and utilities
 */

import { beforeAll, afterAll } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test output directory
export const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output');

// Clean up test output directory before and after tests
beforeAll(() => {
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
});

afterAll(() => {
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
});

// Test utilities
export const testUtils = {
  /**
   * Create a test project path
   */
  createTestProjectPath: (name: string): string => {
    return join(TEST_OUTPUT_DIR, name);
  },

  /**
   * Wait for a file to exist
   */
  waitForFile: async (filePath: string, timeout = 5000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (existsSync(filePath)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  },

  /**
   * Read file content safely
   */
  readFile: async (filePath: string): Promise<string | null> => {
    try {
      const { readFile } = await import('fs/promises');
      return await readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  },

  /**
   * Check if file exists
   */
  fileExists: (filePath: string): boolean => {
    return existsSync(filePath);
  }
};

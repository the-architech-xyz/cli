/**
 * Test Setup File
 * 
 * Global test configuration and setup for The Architech CLI tests.
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  
  // Restore console after tests
  afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
});

// Mock fs-extra to avoid file system operations in tests
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    existsSync: vi.fn(),
    copy: vi.fn(),
    remove: vi.fn(),
    writeJson: vi.fn(),
    readJson: vi.fn()
  }
}));

// Mock inquirer to avoid interactive prompts in tests
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}));

// Mock chalk to avoid color codes in test output
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    magenta: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text)
  }
})); 
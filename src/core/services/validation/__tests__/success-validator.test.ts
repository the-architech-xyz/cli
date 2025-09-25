/**
 * Success Validator Tests
 * 
 * Tests for the SuccessValidator service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuccessValidator } from '../success-validator.js';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mock dependencies
vi.mock('fs/promises');
vi.mock('child_process');

describe('SuccessValidator', () => {
  let successValidator: SuccessValidator;
  let mockProjectPath: string;

  beforeEach(() => {
    successValidator = new SuccessValidator();
    mockProjectPath = '/test/project';
  });

  describe('validateFileExistence', () => {
    it('should validate that files exist', async () => {
      const mockFiles = ['package.json', 'src/index.ts', 'README.md'];
      
      // Mock fs.access to simulate files existing
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        size: 1024
      } as any);

      const result = await successValidator.validateFileExistence(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.filesValidated).toBe(mockFiles.length);
    });

    it('should detect missing files', async () => {
      const mockFiles = ['package.json', 'missing-file.ts'];
      
      // Mock fs.access to throw for missing file
      vi.mocked(fs.access)
        .mockResolvedValueOnce(undefined) // package.json exists
        .mockRejectedValueOnce(new Error('ENOENT')); // missing-file.ts doesn't exist

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        size: 1024
      } as any);

      const result = await successValidator.validateFileExistence(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('File missing-file.ts does not exist');
      expect(result.filesValidated).toBe(1);
    });

    it('should detect non-file paths', async () => {
      const mockFiles = ['package.json'];
      
      // Mock fs.access to succeed but fs.stat to return directory
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => false,
        size: 0
      } as any);

      const result = await successValidator.validateFileExistence(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('Path package.json exists but is not a file');
    });
  });

  describe('validateBuild', () => {
    it('should validate successful build', async () => {
      // Mock successful npm install and npm run build
      vi.mocked(exec).mockImplementation((command: string) => {
        if (command.includes('npm install')) {
          return Promise.resolve({ stdout: 'Installed packages', stderr: '' });
        } else if (command.includes('npm run build')) {
          return Promise.resolve({ stdout: 'Build successful', stderr: '' });
        }
        return Promise.reject(new Error('Unknown command'));
      });

      const result = await successValidator.validateBuild(mockProjectPath);

      expect(result.isSuccess).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.buildOutput).toContain('Build successful');
    });

    it('should detect npm install failure', async () => {
      // Mock npm install failure
      vi.mocked(exec).mockImplementation((command: string) => {
        if (command.includes('npm install')) {
          return Promise.reject(new Error('npm install failed'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await successValidator.validateBuild(mockProjectPath);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('npm install failed');
    });

    it('should detect build failure', async () => {
      // Mock successful npm install but failed build
      vi.mocked(exec).mockImplementation((command: string) => {
        if (command.includes('npm install')) {
          return Promise.resolve({ stdout: 'Installed packages', stderr: '' });
        } else if (command.includes('npm run build')) {
          return Promise.reject(new Error('Build failed: TypeScript errors'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await successValidator.validateBuild(mockProjectPath);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('Build failed: TypeScript errors');
    });
  });

  describe('validate', () => {
    it('should perform complete validation', async () => {
      const mockFiles = ['package.json', 'src/index.ts'];
      
      // Mock successful file existence check
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        size: 1024
      } as any);

      // Mock successful build
      vi.mocked(exec).mockImplementation((command: string) => {
        if (command.includes('npm install')) {
          return Promise.resolve({ stdout: 'Installed packages', stderr: '' });
        } else if (command.includes('npm run build')) {
          return Promise.resolve({ stdout: 'Build successful', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await successValidator.validate(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.filesValidated).toBe(mockFiles.length);
      expect(result.buildOutput).toContain('Build successful');
    });

    it('should fail if file validation fails', async () => {
      const mockFiles = ['missing-file.ts'];
      
      // Mock file not found
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await successValidator.validate(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('File missing-file.ts does not exist');
    });

    it('should fail if build validation fails', async () => {
      const mockFiles = ['package.json'];
      
      // Mock successful file existence check
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        size: 1024
      } as any);

      // Mock build failure
      vi.mocked(exec).mockImplementation((command: string) => {
        if (command.includes('npm install')) {
          return Promise.resolve({ stdout: 'Installed packages', stderr: '' });
        } else if (command.includes('npm run build')) {
          return Promise.reject(new Error('Build failed'));
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await successValidator.validate(mockProjectPath, mockFiles);

      expect(result.isSuccess).toBe(false);
      expect(result.errors).toContain('Build failed');
    });
  });
});
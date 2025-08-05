/**
 * ConfigurationManager Tests
 *
 * Tests for the project configuration management system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigurationManager, ProjectConfiguration, ConfigurationOptions } from '../../../src/core/project/configuration-manager';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    existsSync: vi.fn(),
    copy: vi.fn(),
    remove: vi.fn(),
    pathExists: vi.fn(),
    writeJson: vi.fn(),
    readJson: vi.fn()
  }
}));

// Mock path
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: vi.fn((path) => path.split('/').pop()),
  relative: vi.fn((from, to) => to.replace(from + '/', ''))
}));

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let mockFsExtra: any;

  beforeEach(async () => {
    configManager = new ConfigurationManager();
    const fsExtra = await import('fs-extra');
    mockFsExtra = fsExtra.default;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(configManager).toBeDefined();
    });
  });

  describe('createConfiguration', () => {
    it('should create a basic project configuration', () => {
      const options: ConfigurationOptions = {
        skipGit: false,
        skipInstall: false,
        useDefaults: true,
        verbose: false
      };

      const config = configManager.createConfiguration(
        'test-project',
        'nextjs',
        'single-app',
        options
      );

      expect(config.name).toBe('test-project');
      expect(config.framework).toBe('nextjs');
      expect(config.structure).toBe('single-app');
      expect(config.version).toBe('0.1.0');
      expect(config.features).toBeDefined();
      expect(config.modules).toBeDefined();
    });

    it('should create configuration with custom options', () => {
      const options: ConfigurationOptions = {
        packageManager: 'yarn',
        skipGit: true,
        skipInstall: true,
        useDefaults: false,
        verbose: true
      };

      const config = configManager.createConfiguration(
        'test-api',
        'express',
        'monorepo',
        options
      );

      expect(config.name).toBe('test-api');
      expect(config.framework).toBe('express');
      expect(config.structure).toBe('monorepo');
      expect(config.packageManager).toBe('yarn');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a valid configuration', () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui', 'database'],
        modules: ['ui', 'db'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      const result = configManager.validateConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject configuration with missing required fields', () => {
      const config = {
        name: '',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: [],
        modules: [],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      } as ProjectConfiguration;

      const result = configManager.validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject configuration with invalid framework', () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'invalid-framework',
        packageManager: 'npm',
        features: ['ui'],
        modules: ['ui'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      const result = configManager.validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('saveConfiguration', () => {
    it('should save configuration to file', async () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui', 'database'],
        modules: ['ui', 'db'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      mockFsExtra.writeJson.mockResolvedValue(undefined);

      await configManager.saveConfiguration('/tmp/test-project', config);

      expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
        '/tmp/test-project/.architech.json',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle file write errors', async () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui'],
        modules: ['ui'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      mockFsExtra.writeJson.mockRejectedValue(new Error('Permission denied'));

      await expect(configManager.saveConfiguration('/invalid/path', config)).rejects.toThrow('Permission denied');
    });
  });

  describe('loadConfiguration', () => {
    it('should load configuration from file', async () => {
      const configData: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui', 'database'],
        modules: ['ui', 'db'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      // Mock pathExists to return true (file exists)
      mockFsExtra.pathExists.mockResolvedValue(true);
      // Mock readJson to return the config data
      mockFsExtra.readJson.mockResolvedValue(configData);

      const result = await configManager.loadConfiguration('/tmp/test-project');

      expect(result).toBeDefined();
      expect(result?.name).toBe('test-project');
      expect(result?.framework).toBe('nextjs');
    });

    it('should handle missing config file', async () => {
      // Mock pathExists to return false (file doesn't exist)
      mockFsExtra.pathExists.mockResolvedValue(false);

      const result = await configManager.loadConfiguration('/tmp/test-project');

      expect(result).toBeNull();
    });

    it('should handle invalid JSON in config file', async () => {
      // Mock pathExists to return true (file exists)
      mockFsExtra.pathExists.mockResolvedValue(true);
      // Mock readJson to throw an error
      mockFsExtra.readJson.mockRejectedValue(new Error('Invalid JSON'));

      const result = await configManager.loadConfiguration('/tmp/test-project');

      expect(result).toBeNull();
    });
  });

  describe('getStructureConfig', () => {
    it('should get structure config from project configuration', () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'monorepo',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui', 'database'],
        modules: ['ui', 'db'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      const structureConfig = configManager.getStructureConfig(config);

      expect(structureConfig.type).toBe('monorepo');
      expect(structureConfig.modules).toContain('ui');
      expect(structureConfig.modules).toContain('db');
    });
  });

  describe('getTemplateData', () => {
    it('should get template data from project configuration', () => {
      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui', 'database'],
        modules: ['ui', 'db'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      const templateData = configManager.getTemplateData(config);

      expect(templateData).toBeDefined();
      expect(templateData.projectName).toBe('test-project');
      expect(templateData.framework).toBe('nextjs');
      expect(templateData.features).toContain('ui');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFsExtra.writeJson.mockRejectedValue(new Error('Disk full'));

      const config: ProjectConfiguration = {
        name: 'test-project',
        version: '0.1.0',
        description: 'A test project',
        author: 'Test Author',
        license: 'MIT',
        structure: 'single-app',
        framework: 'nextjs',
        packageManager: 'npm',
        features: ['ui'],
        modules: ['ui'],
        frameworkConfig: {},
        scripts: {},
        dependencies: {},
        devDependencies: {},
        typescript: true,
        eslint: true,
        prettier: true,
        tailwind: true,
        deployment: {
          useDocker: false,
          useCI: false
        },
        metadata: {}
      };

      await expect(configManager.saveConfiguration('/tmp/test-project', config)).rejects.toThrow('Disk full');
    });

    it('should handle permission errors', async () => {
      mockFsExtra.readJson.mockRejectedValue(new Error('Permission denied'));

      const result = await configManager.loadConfiguration('/root/protected');

      expect(result).toBeNull();
    });
  });
}); 
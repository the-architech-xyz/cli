/**
 * ProjectStructureService Tests
 *
 * Tests for the project structure generation and file management system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StructureService } from '../../../src/core/project/structure-service';
import { ProjectContext, ProjectType } from '../../../src/types/smart-questions';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    existsSync: vi.fn(),
    copy: vi.fn(),
    remove: vi.fn(),
    mkdirp: vi.fn(),
    pathExists: vi.fn()
  }
}));

// Mock path with proper exports
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: vi.fn((path) => path.split('/').pop()),
  relative: vi.fn((from, to) => to.replace(from + '/', ''))
}));

describe('StructureService', () => {
  let structureService: StructureService;
  let mockFsExtra: any;

  beforeEach(async () => {
    structureService = new StructureService();
    const fsExtra = await import('fs-extra');
    mockFsExtra = fsExtra.default;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(structureService).toBeDefined();
    });
  });

  describe('detectStructure', () => {
    it('should detect monorepo structure', async () => {
      mockFsExtra.pathExists.mockImplementation((path: string) => {
        return Promise.resolve(path.includes('turbo.json') || path.includes('apps') || path.includes('packages'));
      });

      const structure = await structureService.detectStructure('/tmp/test-project');

      expect(structure.type).toBe('monorepo');
      expect(structure.isMonorepo).toBe(true);
      expect(structure.isSingleApp).toBe(false);
    });

    it('should detect single app structure', async () => {
      mockFsExtra.pathExists.mockResolvedValue(false);

      const structure = await structureService.detectStructure('/tmp/test-project');

      expect(structure.type).toBe('single-app');
      expect(structure.isMonorepo).toBe(false);
      expect(structure.isSingleApp).toBe(true);
    });
  });

  describe('createStructureInfo', () => {
    it('should create monorepo structure info', () => {
      const info = structureService.createStructureInfo('scalable-monorepo', 'nextjs-14');

      expect(info.type).toBe('monorepo');
      expect(info.userPreference).toBe('scalable-monorepo');
      expect(info.isMonorepo).toBe(true);
      expect(info.isSingleApp).toBe(false);
    });

    it('should create single app structure info', () => {
      const info = structureService.createStructureInfo('quick-prototype', 'nextjs-14');

      expect(info.type).toBe('single-app');
      expect(info.userPreference).toBe('quick-prototype');
      expect(info.isMonorepo).toBe(false);
      expect(info.isSingleApp).toBe(true);
    });
  });

  describe('validateStructureInfo', () => {
    it('should validate valid monorepo structure', () => {
      const info = {
        type: 'monorepo' as const,
        userPreference: 'scalable-monorepo' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const isValid = structureService.validateStructureInfo(info);
      expect(isValid).toBe(true);
    });

    it('should validate valid single app structure', () => {
      const info = {
        type: 'single-app' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };

      const isValid = structureService.validateStructureInfo(info);
      expect(isValid).toBe(true);
    });

    it('should reject invalid structure combinations', () => {
      const info = {
        type: 'monorepo' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const isValid = structureService.validateStructureInfo(info);
      expect(isValid).toBe(false);
    });
  });

  describe('getPaths', () => {
    it('should get paths for monorepo structure', () => {
      const structure = {
        type: 'monorepo' as const,
        userPreference: 'scalable-monorepo' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const paths = structureService.getPaths('/tmp/test-project', structure);

      expect(paths.root).toBe('/tmp/test-project');
      expect(paths.apps).toBeDefined();
      expect(paths.packages).toBeDefined();
    });

    it('should get paths for single app structure', () => {
      const structure = {
        type: 'single-app' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };

      const paths = structureService.getPaths('/tmp/test-project', structure);

      expect(paths.root).toBe('/tmp/test-project');
      expect(paths.src).toBeDefined();
      expect(paths.app).toBeDefined();
    });
  });

  describe('getModulePath', () => {
    it('should get module path for monorepo', () => {
      const structure = {
        type: 'monorepo' as const,
        userPreference: 'scalable-monorepo' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const modulePath = structureService.getModulePath('/tmp/test-project', structure, 'ui');

      expect(modulePath).toContain('packages/ui');
    });

    it('should get module path for single app', () => {
      const structure = {
        type: 'single-app' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };

      const modulePath = structureService.getModulePath('/tmp/test-project', structure, 'ui');

      expect(modulePath).toContain('src/lib/ui');
    });
  });

  describe('getAppPath', () => {
    it('should get app path for monorepo', () => {
      const structure = {
        type: 'monorepo' as const,
        userPreference: 'scalable-monorepo' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const appPath = structureService.getAppPath('/tmp/test-project', structure, 'web');

      expect(appPath).toContain('apps/web');
    });

    it('should get app path for single app', () => {
      const structure = {
        type: 'single-app' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };

      const appPath = structureService.getAppPath('/tmp/test-project', structure);

      expect(appPath).toBe('/tmp/test-project');
    });
  });

  describe('getUnifiedInterfacePath', () => {
    it('should get unified interface path for monorepo', () => {
      const structure = {
        type: 'monorepo' as const,
        userPreference: 'scalable-monorepo' as const,
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };

      const interfacePath = structureService.getUnifiedInterfacePath('/tmp/test-project', structure, 'ui');

      expect(interfacePath).toContain('packages/ui');
    });

    it('should get unified interface path for single app', () => {
      const structure = {
        type: 'single-app' as const,
        userPreference: 'quick-prototype' as const,
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };

      const interfacePath = structureService.getUnifiedInterfacePath('/tmp/test-project', structure, 'ui');

      expect(interfacePath).toContain('src/lib/ui');
    });
  });

  describe('pathExists', () => {
    it('should check if path exists', async () => {
      mockFsExtra.pathExists.mockResolvedValue(true);

      const exists = await structureService.pathExists('/tmp/test-project', {
        type: 'single-app',
        userPreference: 'quick-prototype',
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      }, 'src/components');

      expect(exists).toBe(true);
    });
  });

  describe('getRelativePath', () => {
    it('should get relative path from full path', () => {
      const relativePath = structureService.getRelativePath('/tmp/test-project', '/tmp/test-project/src/components/Button.tsx');

      expect(relativePath).toBe('src/components/Button.tsx');
    });
  });

  describe('ensureModuleDirectory', () => {
    it('should ensure module directory exists', async () => {
      mockFsExtra.ensureDir.mockResolvedValue(undefined);

      const modulePath = await structureService.ensureModuleDirectory('/tmp/test-project', {
        type: 'single-app',
        userPreference: 'quick-prototype',
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      }, 'ui');

      expect(modulePath).toContain('src/lib/ui');
      expect(mockFsExtra.ensureDir).toHaveBeenCalled();
    });
  });

  describe('getStructureDescription', () => {
    it('should get description for monorepo structure', () => {
      const description = structureService.getStructureDescription({
        type: 'monorepo',
        userPreference: 'scalable-monorepo',
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      });

      expect(description).toContain('monorepo');
    });

    it('should get description for single app structure', () => {
      const description = structureService.getStructureDescription({
        type: 'single-app',
        userPreference: 'quick-prototype',
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      });

      expect(description).toContain('single app');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFsExtra.pathExists.mockRejectedValue(new Error('Disk full'));

      await expect(structureService.detectStructure('/tmp/test-project')).rejects.toThrow('Disk full');
    });

    it('should handle permission errors', async () => {
      mockFsExtra.ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(structureService.ensureModuleDirectory('/root/protected', {
        type: 'single-app',
        userPreference: 'quick-prototype',
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      }, 'ui')).rejects.toThrow('Permission denied');
    });
  });
}); 
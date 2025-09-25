import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstallPackagesHandler } from '../install-packages-handler.js';
import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { ModifierRegistry } from '../../../../file-system/modifiers/modifier-registry.js';
import { VirtualFileSystem } from '../../../../file-system/file-engine/virtual-file-system.js';

// Mock dependencies
vi.mock('../../../../file-system/modifiers/modifier-registry.js');
vi.mock('../../../../file-system/file-engine/virtual-file-system.js');

describe('InstallPackagesHandler', () => {
  let handler: InstallPackagesHandler;
  let mockModifierRegistry: ModifierRegistry;
  let mockVFS: VirtualFileSystem;
  let mockProjectRoot: string;
  let mockContext: ProjectContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockProjectRoot = '/test/project';
    mockContext = {
      project: { name: 'test', path: mockProjectRoot },
      modules: [],
      pathHandler: null as any
    };

    mockModifierRegistry = new ModifierRegistry();
    mockVFS = new VirtualFileSystem('test', mockProjectRoot);
    
    handler = new InstallPackagesHandler(mockModifierRegistry);
  });

  describe('getSupportedActionType', () => {
    it('should return INSTALL_PACKAGES', () => {
      expect(handler.getSupportedActionType()).toBe('INSTALL_PACKAGES');
    });
  });

  describe('handle', () => {
    it('should successfully install packages in VFS mode', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react', 'react-dom'],
        isDev: false
      };

      // Mock modifier execution
      const mockModifier = {
        execute: vi.fn().mockResolvedValue({ success: true })
      };
      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(mockModifier as any);

      // Mock VFS methods
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(true);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(true);
      expect(result.files).toEqual(['package.json']);
      expect(mockModifier.execute).toHaveBeenCalledWith(
        'package.json',
        {
          dependencies: { react: 'latest', 'react-dom': 'latest' },
          devDependencies: {}
        },
        mockContext,
        mockVFS
      );
    });

    it('should successfully install dev packages', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['@types/react', '@types/node'],
        isDev: true
      };

      const mockModifier = {
        execute: vi.fn().mockResolvedValue({ success: true })
      };
      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(mockModifier as any);
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(true);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(true);
      expect(mockModifier.execute).toHaveBeenCalledWith(
        'package.json',
        {
          dependencies: {},
          devDependencies: { '@types/react': 'latest', '@types/node': 'latest' }
        },
        mockContext,
        mockVFS
      );
    });

    it('should handle package.json that does not exist (modifier handles creation)', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react'],
        isDev: false
      };

      const mockModifier = {
        execute: vi.fn().mockResolvedValue({ success: true })
      };
      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(mockModifier as any);
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(false);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(true);
      expect(mockModifier.execute).toHaveBeenCalledWith(
        'package.json',
        {
          dependencies: { react: 'latest' },
          devDependencies: {}
        },
        mockContext,
        mockVFS
      );
    });

    it('should return error if VFS is not provided', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react'],
        isDev: false
      };

      const result = await handler.handle(action, mockContext, mockProjectRoot);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSTALL_PACKAGES requires VFS mode');
    });

    it('should return error if packages are missing', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        isDev: false
      } as any;

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSTALL_PACKAGES action missing packages');
    });

    it('should return error if modifier is not found', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react'],
        isDev: false
      };

      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(undefined);
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(true);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('package-json-merger modifier not available');
    });

    it('should return error if modifier execution fails', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react'],
        isDev: false
      };

      const mockModifier = {
        execute: vi.fn().mockResolvedValue({ success: false, error: 'Modifier failed' })
      };
      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(mockModifier as any);
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(true);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Package installation failed: Modifier failed');
    });

    it('should handle exceptions with ArchitechError', async () => {
      const action: BlueprintAction = {
        type: 'INSTALL_PACKAGES',
        packages: ['react'],
        isDev: false
      };

      const mockModifier = {
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      };
      vi.spyOn(mockModifierRegistry, 'get').mockReturnValue(mockModifier as any);
      vi.spyOn(mockVFS, 'fileExists').mockReturnValue(true);

      const result = await handler.handle(action, mockContext, mockProjectRoot, mockVFS);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred. Please run with --verbose for more details.');
    });
  });
});

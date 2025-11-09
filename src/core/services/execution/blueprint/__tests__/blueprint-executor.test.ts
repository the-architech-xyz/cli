/**
 * Blueprint Executor Tests
 * 
 * Tests for the BlueprintExecutor service using the new Executor-Centric architecture
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintExecutor } from '../blueprint-executor.js';
import { Blueprint, ProjectContext, BlueprintActionType } from '@thearchitech.xyz/types';

// Mock dependencies
vi.mock('../../file-system/modifiers/modifier-registry.js');
vi.mock('../../file-system/modifiers/package-json-merger.js');
vi.mock('../../file-system/modifiers/tsconfig-enhancer.js');
vi.mock('../action-handlers/index.js');

describe('BlueprintExecutor', () => {
  let blueprintExecutor: BlueprintExecutor;
  let mockProjectRoot: string;

  beforeEach(() => {
    mockProjectRoot = '/test/project';
    blueprintExecutor = new BlueprintExecutor(mockProjectRoot);
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      expect(blueprintExecutor).toBeDefined();
    });
  });

  describe('executeBlueprint', () => {
    it('should handle empty blueprint', async () => {
      const mockBlueprint: Blueprint = {
        id: 'test-blueprint',
        name: 'Test Blueprint',
        actions: []
      };

      const mockContext: ProjectContext = {
        project: { name: 'test', path: '/test' },
        modules: [],
        pathHandler: null as any
      };

      // Mock the ActionHandlerRegistry
      const mockRegistry = {
        handleAction: vi.fn()
      };

      // Replace the internal dependencies
      (blueprintExecutor as any).actionHandlerRegistry = mockRegistry;
      
      // Mock VirtualFileSystem (not needed for empty blueprint, but method expects it)
      const mockVFS = {
        initializeWithFiles: vi.fn().mockResolvedValue(undefined),
        flushToDisk: vi.fn().mockResolvedValue(undefined)
      };
      
      // Mock VirtualFileSystem constructor
      const VirtualFileSystem = vi.fn().mockImplementation(() => mockVFS);
      vi.doMock('../../file-system/file-engine/virtual-file-system.js', () => ({
        VirtualFileSystem
      }));

      const result = await blueprintExecutor.executeBlueprint(mockBlueprint, mockContext, mockVFS);

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should create VFS when needed', async () => {
      const mockBlueprint: Blueprint = {
        id: 'test-blueprint',
        name: 'Test Blueprint',
        actions: [
          {
            type: BlueprintActionType.ENHANCE_FILE,

            path: 'package.json',
            modifier: 'package-json-merger'
          }
        ]
      };

      const mockContext: ProjectContext = {
        project: { name: 'test', path: '/test' },
        modules: [],
        pathHandler: null as any
      };

      // Mock the ActionHandlerRegistry
      const mockRegistry = {
        handleAction: vi.fn().mockResolvedValue({
          success: true,
          files: ['package.json']
        })
      };

      // Mock VirtualFileSystem
      const mockVFS = {
        initializeWithFiles: vi.fn().mockResolvedValue(undefined),
        flushToDisk: vi.fn().mockResolvedValue(undefined),
        fileExists: vi.fn().mockReturnValue(true),
        readFile: vi.fn().mockResolvedValue('{}'),
        writeFile: vi.fn().mockResolvedValue(undefined)
      };

      // Replace the internal dependencies
      (blueprintExecutor as any).actionHandlerRegistry = mockRegistry;

      const result = await blueprintExecutor.executeBlueprint(mockBlueprint, mockContext, mockVFS);

      expect(result.success).toBe(true);
      expect(mockRegistry.handleAction).toHaveBeenCalled();
    });

    it('should handle action execution errors', async () => {
      const mockBlueprint: Blueprint = {
        id: 'test-blueprint',
        name: 'Test Blueprint',
        actions: [
          {
            type: BlueprintActionType.CREATE_FILE,
            path: 'test.txt',
            content: 'Hello World'
          }
        ]
      };

      const mockContext: ProjectContext = {
        project: { name: 'test', path: '/test' },
        modules: [],
        pathHandler: null as any
      };

      // Mock the ActionHandlerRegistry to return error
      const mockRegistry = {
        handleAction: vi.fn().mockResolvedValue({
          success: false,
          error: 'File creation failed'
        })
      };

      // Mock VirtualFileSystem
      const mockVFS = {
        initializeWithFiles: vi.fn().mockResolvedValue(undefined),
        flushToDisk: vi.fn().mockResolvedValue(undefined)
      };

      // Replace the internal dependencies
      (blueprintExecutor as any).actionHandlerRegistry = mockRegistry;

      const result = await blueprintExecutor.executeBlueprint(mockBlueprint, mockContext, mockVFS);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Blueprint test-blueprint execution failed: File creation failed');
    });
  });
});

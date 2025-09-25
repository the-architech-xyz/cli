/**
 * Full Generation Integration Tests
 * 
 * Tests for the complete generation flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrchestratorAgent } from '../../../src/agents/orchestrator-agent.js';
import { ProjectManager } from '../../../src/core/services/project/project-manager.js';
import { Recipe, Module } from '@thearchitech.xyz/types';

// Mock file system operations
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{"name": "test-app"}'),
  access: vi.fn().mockResolvedValue(undefined)
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

describe('Full Generation Integration', () => {
  let orchestratorAgent: OrchestratorAgent;
  let mockProjectManager: ProjectManager;

  beforeEach(() => {
    mockProjectManager = {
      getPathHandler: vi.fn().mockReturnValue({
        getProjectRoot: () => '/test/project',
        getProjectName: () => 'test-app'
      }),
      initializeProject: vi.fn().mockResolvedValue(undefined)
    } as any;

    orchestratorAgent = new OrchestratorAgent(mockProjectManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeRecipe', () => {
    it('should execute a simple recipe successfully', async () => {
      const recipe: Recipe = {
        project: {
          name: 'test-app',
          version: '1.0.0',
          framework: 'nextjs',
          path: '/test/project',
          description: 'Test application'
        },
        modules: [
          {
            id: 'framework/nextjs',
            category: 'framework',
            version: '1.0.0',
            parameters: {
              typescript: true,
              tailwind: true
            }
          }
        ],
        options: {}
      };

      // Mock all the services to return success
      vi.spyOn(orchestratorAgent as any, 'moduleLoader', 'get').mockReturnValue({
        setupFramework: vi.fn().mockResolvedValue({
          success: true,
          pathHandler: {
            getProjectRoot: () => '/test/project',
            getProjectName: () => 'test-app'
          }
        }),
        loadModuleAdapter: vi.fn().mockResolvedValue({
          success: true,
          adapter: {
            config: {},
            blueprint: {
              id: 'test-blueprint',
              name: 'Test Blueprint',
              actions: []
            }
          }
        }),
        createProjectContext: vi.fn().mockReturnValue({})
      });

      vi.spyOn(orchestratorAgent as any, 'dependencyGraph', 'get').mockReturnValue({
        buildGraph: vi.fn().mockResolvedValue({
          success: true,
          errors: []
        })
      });

      vi.spyOn(orchestratorAgent as any, 'executionPlanner', 'get').mockReturnValue({
        createExecutionPlan: vi.fn().mockReturnValue({
          success: true,
          batches: [{
            batchNumber: 1,
            modules: recipe.modules,
            canExecuteInParallel: true
          }]
        })
      });

      vi.spyOn(orchestratorAgent as any, 'parallelExecutor', 'get').mockReturnValue({
        executeAllBatches: vi.fn().mockResolvedValue({
          success: true,
          batchResults: [{
            success: true,
            results: [{
              success: true,
              executedModules: ['framework/nextjs']
            }]
          }],
          totalFailed: 0,
          totalDuration: 1000
        })
      });

      vi.spyOn(orchestratorAgent as any, 'successValidator', 'get').mockReturnValue({
        validate: vi.fn().mockResolvedValue({
          isSuccess: true,
          errors: [],
          warnings: [],
          details: {
            filesValidated: 1,
            filesMissing: [],
            buildSuccess: true,
            buildErrors: [],
            installSuccess: true,
            installErrors: []
          }
        })
      });

      const result = await orchestratorAgent.executeRecipe(recipe, false);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation failure gracefully', async () => {
      const recipe: Recipe = {
        project: {
          name: 'test-app',
          version: '1.0.0',
          framework: 'nextjs',
          path: '/test/project',
          description: 'Test application'
        },
        modules: [
          {
            id: 'invalid/module',
            category: 'invalid',
            version: '1.0.0',
            parameters: {}
          }
        ],
        options: {}
      };

      // Mock validation failure
      vi.spyOn(orchestratorAgent as any, 'moduleLoader', 'get').mockReturnValue({
        setupFramework: vi.fn().mockResolvedValue({
          success: false,
          error: 'Invalid framework module'
        })
      });

      const result = await orchestratorAgent.executeRecipe(recipe, false);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid framework module');
    });

    it('should handle execution failure gracefully', async () => {
      const recipe: Recipe = {
        project: {
          name: 'test-app',
          version: '1.0.0',
          framework: 'nextjs',
          path: '/test/project',
          description: 'Test application'
        },
        modules: [
          {
            id: 'framework/nextjs',
            category: 'framework',
            version: '1.0.0',
            parameters: {}
          }
        ],
        options: {}
      };

      // Mock successful setup but failed execution
      vi.spyOn(orchestratorAgent as any, 'moduleLoader', 'get').mockReturnValue({
        setupFramework: vi.fn().mockResolvedValue({
          success: true,
          pathHandler: {
            getProjectRoot: () => '/test/project',
            getProjectName: () => 'test-app'
          }
        })
      });

      vi.spyOn(orchestratorAgent as any, 'dependencyGraph', 'get').mockReturnValue({
        buildGraph: vi.fn().mockResolvedValue({
          success: true,
          errors: []
        })
      });

      vi.spyOn(orchestratorAgent as any, 'executionPlanner', 'get').mockReturnValue({
        createExecutionPlan: vi.fn().mockReturnValue({
          success: true,
          batches: [{
            batchNumber: 1,
            modules: recipe.modules,
            canExecuteInParallel: true
          }]
        })
      });

      vi.spyOn(orchestratorAgent as any, 'parallelExecutor', 'get').mockReturnValue({
        executeAllBatches: vi.fn().mockResolvedValue({
          success: false,
          batchResults: [{
            success: false,
            results: [{
              success: false,
              failedModules: ['framework/nextjs']
            }]
          }],
          totalFailed: 1,
          totalDuration: 1000,
          errors: ['Module execution failed']
        })
      });

      const result = await orchestratorAgent.executeRecipe(recipe, false);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Module execution failed');
    });
  });
});

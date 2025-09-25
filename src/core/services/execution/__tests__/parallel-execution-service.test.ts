/**
 * Parallel Execution Service Tests
 * 
 * Tests for the ParallelExecutionService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallelExecutionService } from '../parallel-execution-service.js';

// Mock the OrchestratorAgent
const mockOrchestratorAgent = {
  executeModule: vi.fn()
};

describe('ParallelExecutionService', () => {
  let parallelExecutionService: ParallelExecutionService;

  beforeEach(() => {
    parallelExecutionService = new ParallelExecutionService(mockOrchestratorAgent as any);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with orchestrator agent', () => {
      expect(parallelExecutionService).toBeDefined();
    });
  });

  describe('executeAllBatches', () => {
    it('should execute single batch successfully', async () => {
      const mockBatch = {
        batchNumber: 1,
        modules: [
          { id: 'framework/nextjs', category: 'framework' },
          { id: 'ui/shadcn-ui', category: 'ui' }
        ],
        canExecuteInParallel: true
      };

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeAllBatches([mockBatch]);

      expect(result.success).toBe(true);
      expect(result.batchResults).toHaveLength(1);
      expect(result.batchResults[0].success).toBe(true);
      expect(result.batchResults[0].results).toHaveLength(2);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(2);
    });

    it('should handle batch execution failure', async () => {
      const mockBatch = {
        batchNumber: 1,
        modules: [
          { id: 'framework/nextjs', category: 'framework' }
        ],
        canExecuteInParallel: true
      };

      mockOrchestratorAgent.executeModule.mockResolvedValue({
        success: false,
        error: 'Module execution failed'
      });

      const result = await parallelExecutionService.executeAllBatches([mockBatch]);

      expect(result.success).toBe(false);
      expect(result.batchResults).toHaveLength(1);
      expect(result.batchResults[0].success).toBe(false);
      expect(result.batchResults[0].results[0].success).toBe(false);
    });

    it('should execute multiple batches sequentially', async () => {
      const mockBatches = [
        {
          batchNumber: 1,
          modules: [{ id: 'framework/nextjs', category: 'framework' }],
          canExecuteInParallel: true
        },
        {
          batchNumber: 2,
          modules: [{ id: 'ui/shadcn-ui', category: 'ui' }],
          canExecuteInParallel: true
        }
      ];

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeAllBatches(mockBatches);

      expect(result.success).toBe(true);
      expect(result.batchResults).toHaveLength(2);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure in batch', async () => {
      const mockBatch = {
        batchNumber: 1,
        modules: [
          { id: 'framework/nextjs', category: 'framework' },
          { id: 'ui/shadcn-ui', category: 'ui' }
        ],
        canExecuteInParallel: true
      };

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'UI module failed' });

      const result = await parallelExecutionService.executeAllBatches([mockBatch]);

      expect(result.success).toBe(false);
      expect(result.batchResults[0].success).toBe(false);
      expect(result.batchResults[0].results[0].success).toBe(true);
      expect(result.batchResults[0].results[1].success).toBe(false);
    });
  });

  describe('executeBatch', () => {
    it('should execute modules in parallel when canExecuteInParallel is true', async () => {
      const mockBatch = {
        batchNumber: 1,
        modules: [
          { id: 'framework/nextjs', category: 'framework' },
          { id: 'ui/shadcn-ui', category: 'ui' }
        ],
        canExecuteInParallel: true
      };

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeBatch(mockBatch);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(2);
    });

    it('should execute modules sequentially when canExecuteInParallel is false', async () => {
      const mockBatch = {
        batchNumber: 1,
        modules: [
          { id: 'framework/nextjs', category: 'framework' },
          { id: 'ui/shadcn-ui', category: 'ui' }
        ],
        canExecuteInParallel: false
      };

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeBatch(mockBatch);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeModulesSequentially', () => {
    it('should execute modules one by one', async () => {
      const mockModules = [
        { id: 'framework/nextjs', category: 'framework' },
        { id: 'ui/shadcn-ui', category: 'ui' }
      ];

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeModulesSequentially(mockModules);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(2);
    });

    it('should stop execution on first failure', async () => {
      const mockModules = [
        { id: 'framework/nextjs', category: 'framework' },
        { id: 'ui/shadcn-ui', category: 'ui' }
      ];

      mockOrchestratorAgent.executeModule
        .mockResolvedValueOnce({ success: false, error: 'Framework failed' })
        .mockResolvedValueOnce({ success: true });

      const result = await parallelExecutionService.executeModulesSequentially(mockModules);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(mockOrchestratorAgent.executeModule).toHaveBeenCalledTimes(1);
    });
  });
});

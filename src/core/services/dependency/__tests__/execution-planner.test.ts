/**
 * Unit Tests for ExecutionPlanner Service
 */

import { ExecutionPlanner } from '../execution-planner';
import { DependencyGraph } from '../dependency-graph';
import { Module } from '@thearchitech.xyz/types';

// Mock DependencyGraph
const mockDependencyGraph = {
  getGraph: jest.fn()
} as any;

describe('ExecutionPlanner', () => {
  let executionPlanner: ExecutionPlanner;

  beforeEach(() => {
    executionPlanner = new ExecutionPlanner(mockDependencyGraph);
  });

  describe('createExecutionPlan', () => {
    it('should create execution plan for simple graph', () => {
      const mockGraph = new Map([
        ['framework/nextjs', {
          module: { id: 'framework/nextjs', category: 'framework', version: '1.0.0', parameters: {} },
          dependencies: [],
          dependents: ['ui/shadcn-ui'],
          inDegree: 0,
          outDegree: 1
        }],
        ['ui/shadcn-ui', {
          module: { id: 'ui/shadcn-ui', category: 'ui', version: '1.0.0', parameters: {} },
          dependencies: ['framework/nextjs'],
          dependents: [],
          inDegree: 1,
          outDegree: 0
        }]
      ]);

      mockDependencyGraph.getGraph.mockReturnValue(mockGraph);

      const result = executionPlanner.createExecutionPlan();

      expect(result.success).toBe(true);
      expect(result.batches).toHaveLength(2);
      expect(result.batches[0].modules).toHaveLength(1);
      expect(result.batches[0].modules[0].id).toBe('framework/nextjs');
      expect(result.batches[1].modules).toHaveLength(1);
      expect(result.batches[1].modules[0].id).toBe('ui/shadcn-ui');
    });

    it('should create parallel execution batches', () => {
      const mockGraph = new Map([
        ['framework/nextjs', {
          module: { id: 'framework/nextjs', category: 'framework', version: '1.0.0', parameters: {} },
          dependencies: [],
          dependents: ['ui/shadcn-ui', 'database/drizzle'],
          inDegree: 0,
          outDegree: 2
        }],
        ['ui/shadcn-ui', {
          module: { id: 'ui/shadcn-ui', category: 'ui', version: '1.0.0', parameters: {} },
          dependencies: ['framework/nextjs'],
          dependents: [],
          inDegree: 1,
          outDegree: 0
        }],
        ['database/drizzle', {
          module: { id: 'database/drizzle', category: 'database', version: '1.0.0', parameters: {} },
          dependencies: ['framework/nextjs'],
          dependents: [],
          inDegree: 1,
          outDegree: 0
        }]
      ]);

      mockDependencyGraph.getGraph.mockReturnValue(mockGraph);

      const result = executionPlanner.createExecutionPlan();

      expect(result.success).toBe(true);
      expect(result.batches).toHaveLength(2);
      expect(result.batches[0].modules).toHaveLength(1); // Framework first
      expect(result.batches[1].modules).toHaveLength(2); // UI and DB in parallel
      expect(result.batches[1].canExecuteInParallel).toBe(true);
    });

    it('should handle empty graph', () => {
      mockDependencyGraph.getGraph.mockReturnValue(new Map());

      const result = executionPlanner.createExecutionPlan();

      expect(result.success).toBe(true);
      expect(result.batches).toHaveLength(0);
      expect(result.totalBatches).toBe(0);
    });
  });

  describe('getExecutionSummary', () => {
    it('should return correct execution summary', () => {
      const mockPlan = {
        success: true,
        batches: [
          {
            batchNumber: 1,
            modules: [{ id: 'framework/nextjs', category: 'framework', version: '1.0.0', parameters: {} }],
            canExecuteInParallel: false,
            estimatedDuration: 30000,
            dependencies: []
          },
          {
            batchNumber: 2,
            modules: [
              { id: 'ui/shadcn-ui', category: 'ui', version: '1.0.0', parameters: {} },
              { id: 'database/drizzle', category: 'database', version: '1.0.0', parameters: {} }
            ],
            canExecuteInParallel: true,
            estimatedDuration: 15000,
            dependencies: ['framework/nextjs']
          }
        ],
        totalBatches: 2,
        estimatedTotalDuration: 45000,
        errors: [],
        warnings: []
      };

      const summary = executionPlanner.getExecutionSummary(mockPlan);

      expect(summary.totalModules).toBe(3);
      expect(summary.parallelBatches).toBe(1);
      expect(summary.sequentialBatches).toBe(1);
      expect(summary.estimatedDuration).toBe('45.0s');
      expect(summary.efficiency).toBe(50); // 1 out of 2 batches can run in parallel
    });
  });

  describe('validateExecutionPlan', () => {
    it('should validate successful execution plan', () => {
      const mockPlan = {
        success: true,
        batches: [
          {
            batchNumber: 1,
            modules: [{ id: 'framework/nextjs', category: 'framework', version: '1.0.0', parameters: {} }],
            canExecuteInParallel: false,
            estimatedDuration: 30000,
            dependencies: []
          }
        ],
        totalBatches: 1,
        estimatedTotalDuration: 30000,
        errors: [],
        warnings: []
      };

      const validation = executionPlanner.validateExecutionPlan(mockPlan);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid execution plan', () => {
      const mockPlan = {
        success: false,
        batches: [],
        totalBatches: 0,
        estimatedTotalDuration: 0,
        errors: ['Test error'],
        warnings: []
      };

      const validation = executionPlanner.validateExecutionPlan(mockPlan);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Execution plan creation failed');
    });

    it('should warn about long durations', () => {
      const mockPlan = {
        success: true,
        batches: [
          {
            batchNumber: 1,
            modules: [{ id: 'framework/nextjs', category: 'framework', version: '1.0.0', parameters: {} }],
            canExecuteInParallel: false,
            estimatedDuration: 120000, // 2 minutes
            dependencies: []
          }
        ],
        totalBatches: 1,
        estimatedTotalDuration: 120000,
        errors: [],
        warnings: []
      };

      const validation = executionPlanner.validateExecutionPlan(mockPlan);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain(expect.stringContaining('estimated duration > 1 minute'));
    });
  });
});

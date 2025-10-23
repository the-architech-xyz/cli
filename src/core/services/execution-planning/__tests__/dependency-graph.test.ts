/**
 * Unit Tests for DependencyGraph Service
 */

import { DependencyGraph } from '../dependency-graph';
import { Module } from '@thearchitech.xyz/types';

// Mock AdapterLoader
const mockAdapterLoader = {
  loadAdapter: jest.fn()
} as any;

describe('DependencyGraph', () => {
  let dependencyGraph: DependencyGraph;

  beforeEach(() => {
    dependencyGraph = new DependencyGraph(mockAdapterLoader);
  });

  describe('buildGraph', () => {
    it('should build a simple dependency graph', async () => {
      const modules: Module[] = [
        {
          id: 'framework/nextjs',
          category: 'framework',
          version: '1.0.0',
          parameters: {}
        },
        {
          id: 'ui/shadcn-ui',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        }
      ];

      mockAdapterLoader.loadAdapter.mockResolvedValue({
        config: { prerequisites: { modules: [] } }
      });

      const result = await dependencyGraph.buildGraph(modules);

      expect(result.success).toBe(true);
      expect(result.graph.size).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect circular dependencies', async () => {
      const modules: Module[] = [
        {
          id: 'module/a',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        },
        {
          id: 'module/b',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        }
      ];

      // Mock circular dependency: A depends on B, B depends on A
      mockAdapterLoader.loadAdapter
        .mockResolvedValueOnce({
          config: { prerequisites: { modules: ['module/b'] } }
        })
        .mockResolvedValueOnce({
          config: { prerequisites: { modules: ['module/a'] } }
        });

      const result = await dependencyGraph.buildGraph(modules);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Circular dependencies detected'));
    });

    it('should handle missing dependencies', async () => {
      const modules: Module[] = [
        {
          id: 'module/a',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        }
      ];

      mockAdapterLoader.loadAdapter.mockResolvedValue({
        config: { prerequisites: { modules: ['nonexistent/module'] } }
      });

      const result = await dependencyGraph.buildGraph(modules);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Missing dependencies'));
    });
  });

  describe('getRootNodes', () => {
    it('should return nodes with no dependencies', async () => {
      const modules: Module[] = [
        {
          id: 'framework/nextjs',
          category: 'framework',
          version: '1.0.0',
          parameters: {}
        },
        {
          id: 'ui/shadcn-ui',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        }
      ];

      mockAdapterLoader.loadAdapter.mockResolvedValue({
        config: { prerequisites: { modules: [] } }
      });

      await dependencyGraph.buildGraph(modules);
      const rootNodes = dependencyGraph.getRootNodes();

      expect(rootNodes).toHaveLength(2);
      expect(rootNodes.every(node => node.dependencies.length === 0)).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return correct graph statistics', async () => {
      const modules: Module[] = [
        {
          id: 'framework/nextjs',
          category: 'framework',
          version: '1.0.0',
          parameters: {}
        },
        {
          id: 'ui/shadcn-ui',
          category: 'ui',
          version: '1.0.0',
          parameters: {}
        }
      ];

      mockAdapterLoader.loadAdapter.mockResolvedValue({
        config: { prerequisites: { modules: [] } }
      });

      await dependencyGraph.buildGraph(modules);
      const stats = dependencyGraph.getStatistics();

      expect(stats.totalNodes).toBe(2);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.rootNodes).toBe(2);
      expect(stats.leafNodes).toBe(2);
    });
  });
});

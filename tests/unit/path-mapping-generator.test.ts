import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathMappingGenerator } from '../../src/core/services/path/path-mapping-generator.js';
import { PathService } from '../../src/core/services/path/path-service.js';
import type { ResolvedGenome, MarketplaceAdapter, FrameworkApp } from '@thearchitech.xyz/types';

describe('PathMappingGenerator', () => {
  beforeEach(() => {
    // Clear mappings before each test
    PathService.clearMappings();
  });

  describe('generateMappings', () => {
    it('should generate mappings from marketplace adapter path defaults', async () => {
      const mockGenome: ResolvedGenome = {
        project: {
          name: 'test-project',
          path: './test-project',
          structure: 'monorepo',
          apps: [
            {
              id: 'web',
              package: 'apps/web',
              path: 'apps/web',
              framework: 'nextjs',
              type: 'web'
            } as FrameworkApp
          ]
        },
        modules: [],
        packages: {},
        marketplaces: {}
      };

      const mockAdapter: MarketplaceAdapter = {
        resolvePathDefaults: vi.fn().mockResolvedValue({
          'apps.web.src': 'apps/web/src/',
          'apps.web.components': 'apps/web/src/components/',
          'packages.shared.src': 'packages/shared/src/'
        }),
        loadPathKeys: vi.fn().mockResolvedValue({
          pathKeys: [
            {
              key: 'apps.web.src',
              description: 'Web app source directory',
              required: true,
              structure: ['monorepo', 'single-app']
            },
            {
              key: 'apps.web.components',
              description: 'Web app components directory',
              required: false,
              structure: ['monorepo', 'single-app']
            },
            {
              key: 'packages.shared.src',
              description: 'Shared package source directory',
              required: false,
              structure: ['monorepo']
            }
          ]
        })
      };

      const marketplaceAdapters = new Map([['core', mockAdapter]]);

      const mappings = await PathMappingGenerator.generateMappings(mockGenome, marketplaceAdapters);

      expect(mappings).toBeDefined();
      expect(mappings['apps.web.src']).toEqual(['apps/web/src/']);
      expect(mappings['apps.web.components']).toEqual(['apps/web/src/components/']);
      expect(mappings['packages.shared.src']).toEqual(['packages/shared/src/']);
    });

    it('should expand semantic keys to multiple paths', async () => {
      const mockGenome: ResolvedGenome = {
        project: {
          name: 'test-project',
          path: './test-project',
          structure: 'monorepo',
          apps: [
            {
              id: 'web',
              package: 'apps/web',
              path: 'apps/web',
              framework: 'nextjs',
              type: 'web'
            } as FrameworkApp,
            {
              id: 'mobile',
              package: 'apps/mobile',
              path: 'apps/mobile',
              framework: 'expo',
              type: 'mobile'
            } as FrameworkApp
          ]
        },
        modules: [],
        packages: {},
        marketplaces: {}
      };

      const mockAdapter: MarketplaceAdapter = {
        resolvePathDefaults: vi.fn().mockResolvedValue({
          'apps.web.components': 'apps/web/src/components/',
          'apps.mobile.components': 'apps/mobile/src/components/',
          'apps.frontend.components': 'apps/web/src/components/' // Semantic key
        }),
        loadPathKeys: vi.fn().mockResolvedValue({
          pathKeys: [
            {
              key: 'apps.frontend.components',
              description: 'Frontend components (semantic - expands to web + mobile)',
              required: false,
              structure: ['monorepo'],
              semantic: true,
              resolveToApps: ['web', 'mobile']
            },
            {
              key: 'apps.web.components',
              description: 'Web app components',
              required: false,
              structure: ['monorepo']
            },
            {
              key: 'apps.mobile.components',
              description: 'Mobile app components',
              required: false,
              structure: ['monorepo']
            }
          ]
        })
      };

      const marketplaceAdapters = new Map([['core', mockAdapter]]);

      const mappings = await PathMappingGenerator.generateMappings(mockGenome, marketplaceAdapters);

      expect(mappings).toBeDefined();
      // Semantic key should expand to multiple paths
      expect(mappings['apps.frontend.components']).toBeDefined();
      expect(mappings['apps.frontend.components'].length).toBeGreaterThan(1);
    });

    it('should apply user overrides with highest priority', async () => {
      const mockGenome: ResolvedGenome = {
        project: {
          name: 'test-project',
          path: './test-project',
          structure: 'monorepo',
          apps: [],
          paths: {
            'apps.web.src': 'custom/web/src/' // User override
          }
        },
        modules: [],
        packages: {},
        marketplaces: {}
      };

      const mockAdapter: MarketplaceAdapter = {
        resolvePathDefaults: vi.fn().mockResolvedValue({
          'apps.web.src': 'apps/web/src/' // Marketplace default
        }),
        loadPathKeys: vi.fn().mockResolvedValue({
          pathKeys: [
            {
              key: 'apps.web.src',
              description: 'Web app source directory',
              required: true,
              structure: ['monorepo', 'single-app']
            }
          ]
        })
      };

      const marketplaceAdapters = new Map([['core', mockAdapter]]);

      const mappings = await PathMappingGenerator.generateMappings(mockGenome, marketplaceAdapters);

      expect(mappings).toBeDefined();
      // User override should take precedence
      expect(mappings['apps.web.src']).toEqual(['custom/web/src/']);
    });

    it('should handle empty marketplace adapters gracefully', async () => {
      const mockGenome: ResolvedGenome = {
        project: {
          name: 'test-project',
          path: './test-project',
          structure: 'monorepo',
          apps: []
        },
        modules: [],
        packages: {},
        marketplaces: {}
      };

      const marketplaceAdapters = new Map();

      const mappings = await PathMappingGenerator.generateMappings(mockGenome, marketplaceAdapters);

      expect(mappings).toBeDefined();
      expect(Object.keys(mappings).length).toBe(0);
    });

    it('should handle adapter errors gracefully', async () => {
      const mockGenome: ResolvedGenome = {
        project: {
          name: 'test-project',
          path: './test-project',
          structure: 'monorepo',
          apps: []
        },
        modules: [],
        packages: {},
        marketplaces: {}
      };

      const mockAdapter: MarketplaceAdapter = {
        resolvePathDefaults: vi.fn().mockRejectedValue(new Error('Adapter error')),
        loadPathKeys: vi.fn().mockResolvedValue({
          pathKeys: []
        })
      };

      const marketplaceAdapters = new Map([['core', mockAdapter]]);

      // Should not throw, but log warning
      const mappings = await PathMappingGenerator.generateMappings(mockGenome, marketplaceAdapters);

      expect(mappings).toBeDefined();
    });
  });
});


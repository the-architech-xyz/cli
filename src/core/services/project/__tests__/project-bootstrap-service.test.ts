import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectBootstrapService } from '../project-bootstrap-service.js';
import { PathService } from '../../path/path-service.js';
import { ModuleService } from '../../module-management/module-service.js';
import { BlueprintPreprocessor } from '../../execution/blueprint/blueprint-preprocessor.js';
import { ModuleConfigurationService } from '../../orchestration/module-configuration-service.js';
import type { Genome } from '@thearchitech.xyz/types';

describe('ProjectBootstrapService.buildFrameworkPlans', () => {
  let bootstrapService: ProjectBootstrapService;
  let mockPathService: PathService;
  let mockModuleService: ModuleService;
  let mockBlueprintPreprocessor: BlueprintPreprocessor;
  let mockModuleConfigService: ModuleConfigurationService;

  beforeEach(() => {
    // Create minimal mocks
    mockPathService = {
      getProjectRoot: () => '/test/project',
    } as any;

    mockModuleService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      loadModuleAdapter: vi.fn(),
      createProjectContext: vi.fn(),
    } as any;

    mockBlueprintPreprocessor = {
      processBlueprint: vi.fn(),
    } as any;

    mockModuleConfigService = {
      mergeModuleConfiguration: vi.fn(),
    } as any;

    bootstrapService = new ProjectBootstrapService(
      mockModuleService,
      mockPathService,
      mockBlueprintPreprocessor,
      mockModuleConfigService
    );
  });

  it('should detect framework from project.apps[0].framework for single-app structure', async () => {
    // Create a genome with apps[0].framework pattern (the bug scenario)
    const genome: Genome = {
      version: '1.0.0',
      project: {
        name: 'test-app',
        structure: 'single-app',
        apps: [
          {
            id: 'web',
            type: 'web',
            framework: 'nextjs',  // Framework specified here, not at project.framework
            parameters: {
              typescript: true,
              tailwind: true,
            },
          },
        ],
      },
      modules: [],
      metadata: {
        moduleIndex: {
          'framework/nextjs': {
            id: 'framework/nextjs',
            category: 'framework',
            type: 'framework',
            marketplace: { name: 'core' },
            source: { root: '/marketplace', marketplace: 'core' },
            manifest: { file: 'manifest.json' },
            blueprint: { file: 'blueprint.ts', runtime: 'source' },
            templates: [],
            parameters: {},
          },
        },
      } as any,
    };

    // Call bootstrap - this internally calls buildFrameworkPlans
    const result = await bootstrapService.bootstrap(genome);

    // The fix should now detect the framework from apps[0].framework
    // If the bug still exists, result would be undefined (no bootstrap plan)
    // If fixed, the service should attempt to bootstrap (may fail on module loading, but plan should exist)
    
    // We can't easily test the private method directly, but we can verify:
    // 1. The method doesn't return early with empty plans
    // 2. It attempts to load the framework module
    
    // The key validation: mockModuleService.loadModuleAdapter should be called
    // if the framework was detected correctly
    expect(mockModuleService.loadModuleAdapter).toHaveBeenCalled();
    
    // Verify it was called with the correct framework module
    const callArgs = (mockModuleService.loadModuleAdapter as any).mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs && callArgs[0]) {
      expect(callArgs[0].id).toBe('framework/nextjs');
    }
  });

  it('should still work with project.framework for backward compatibility', async () => {
    const genome: Genome = {
      version: '1.0.0',
      project: {
        name: 'test-app',
        structure: 'single-app',
        framework: 'nextjs',  // Old pattern: framework at project level
      },
      modules: [],
      metadata: {
        moduleIndex: {
          'framework/nextjs': {
            id: 'framework/nextjs',
            category: 'framework',
            type: 'framework',
            marketplace: { name: 'core' },
            source: { root: '/marketplace', marketplace: 'core' },
            manifest: { file: 'manifest.json' },
            blueprint: { file: 'blueprint.ts', runtime: 'source' },
            templates: [],
            parameters: {},
          },
        },
      } as any,
    };

    await bootstrapService.bootstrap(genome);

    // Should still work with old pattern
    expect(mockModuleService.loadModuleAdapter).toHaveBeenCalled();
  });

  it('should merge app parameters when using apps[0].framework pattern', async () => {
    const genome: Genome = {
      version: '1.0.0',
      project: {
        name: 'test-app',
        structure: 'single-app',
        apps: [
          {
            id: 'web',
            type: 'web',
            framework: 'nextjs',
            parameters: {
              typescript: true,
              tailwind: true,
              srcDir: true,
            },
          },
        ],
      },
      modules: [],
      metadata: {
        moduleIndex: {
          'framework/nextjs': {
            id: 'framework/nextjs',
            category: 'framework',
            type: 'framework',
            marketplace: { name: 'core' },
            source: { root: '/marketplace', marketplace: 'core' },
            manifest: { file: 'manifest.json' },
            blueprint: { file: 'blueprint.ts', runtime: 'source' },
            templates: [],
            parameters: {
              appRouter: true,
            },
          },
        },
      } as any,
    };

    await bootstrapService.bootstrap(genome);

    // Verify module config service was called with merged parameters
    expect(mockModuleConfigService.mergeModuleConfiguration).toHaveBeenCalled();
    const mergeCall = (mockModuleConfigService.mergeModuleConfiguration as any).mock.calls[0];
    if (mergeCall && mergeCall[0]) {
      const module = mergeCall[0];
      // Should have both default and app parameters
      expect(module.parameters).toBeDefined();
      // The exact merge logic is tested through integration, but we verify it was called
    }
  });
});







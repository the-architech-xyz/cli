/**
 * Full Generation Integration Tests
 *
 * Tests the high-level orchestration flow without touching the filesystem.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrchestratorAgent } from '../../../src/agents/orchestrator-agent.js';
import { ProjectManager } from '../../../src/core/services/project/project-manager.js';
import { Recipe } from '@thearchitech.xyz/types';
import { ModuleService } from '../../../src/core/services/module-management/module-service.js';
import { ProjectBootstrapService } from '../../../src/core/services/project/project-bootstrap-service.js';
import { BlueprintPreprocessor } from '../../../src/core/services/execution/blueprint/blueprint-preprocessor.js';
import { ModuleConfigurationService } from '../../../src/core/services/orchestration/module-configuration-service.js';
import { MarketplaceService } from '../../../src/core/services/marketplace/marketplace-service.js';
import { MonorepoPackageResolver } from '../../../src/core/services/project/monorepo-package-resolver.js';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{"name":"test-app"}'),
  access: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('child_process', () => ({
  exec: vi.fn()
}));

vi.mock('../../../src/core/services/project/structure-initialization-layer.js', () => ({
  StructureInitializationLayer: class {
    async initialize() {
      return { success: true, packages: [] };
    }
  }
}));

vi.mock('../../../src/core/services/file-system/file-engine/virtual-file-system.js', () => ({
  VirtualFileSystem: class {
    async flushToDisk() {
      return;
    }
  }
}));

vi.mock('../../../src/core/services/execution/blueprint/blueprint-executor.js', () => ({
  BlueprintExecutor: class {
    async executeActions() {
      return { success: true, errors: [] };
    }
  }
}));

vi.mock('../../../src/core/services/project/path-initialization-service.js', () => ({
  PathInitializationService: {
    initializePaths: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Full generation orchestrator', () => {
  let orchestrator: OrchestratorAgent;
  let mockProjectManager: ProjectManager;
  const spies: Array<ReturnType<typeof vi.spyOn>> = [];

  beforeEach(() => {
    mockProjectManager = {
      getPathHandler: vi.fn().mockReturnValue({
        getProjectRoot: () => '/tmp/project',
        getProjectName: () => 'test-app'
      }),
      initializeProject: vi.fn().mockResolvedValue(undefined)
    } as any;

    orchestrator = new OrchestratorAgent(mockProjectManager);

    spies.push(
      vi.spyOn(ModuleService.prototype, 'initialize').mockResolvedValue(),
      vi.spyOn(ModuleService.prototype, 'loadModuleAdapter').mockResolvedValue({
        success: true,
        adapter: {
          config: { paths: {} },
          blueprint: { id: 'dummy-blueprint', actions: [] }
        }
      } as any),
      vi.spyOn(ModuleService.prototype, 'createProjectContext').mockResolvedValue({
        success: true,
        context: {
          project: { path: '/tmp/project' },
          module: {},
          framework: 'nextjs',
          modules: {},
          pathHandler: mockProjectManager.getPathHandler()
        } as any
      }),
      vi.spyOn(ProjectBootstrapService.prototype, 'bootstrap').mockResolvedValue({ paths: {} } as any),
      vi.spyOn(BlueprintPreprocessor.prototype, 'processBlueprint').mockResolvedValue({
        success: true,
        actions: []
      } as any),
      vi.spyOn(ModuleConfigurationService.prototype, 'mergeModuleConfiguration').mockReturnValue({
        templateContext: {}
      } as any),
      vi.spyOn(MarketplaceService, 'loadModuleBlueprint').mockResolvedValue({
        actions: []
      } as any),
      vi.spyOn(MonorepoPackageResolver, 'resolveTargetPackage').mockReturnValue(null as any)
    );
  });

  afterEach(() => {
    spies.forEach(spy => spy.mockRestore());
    spies.length = 0;
    vi.clearAllMocks();
  });

  it('executes a simple genome successfully', async () => {
    const recipe: Recipe = {
      project: {
        name: 'test-app',
        description: 'Integration test project',
        version: '1.0.0',
        framework: 'nextjs',
        path: '/tmp/project'
      },
      modules: [
        {
          id: 'features/architech-welcome',
          category: 'features',
          parameters: {}
        }
      ],
      options: {}
    };

    const result = await orchestrator.executeRecipe(recipe, false);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(ModuleService.prototype.loadModuleAdapter).toHaveBeenCalled();
    expect(ProjectBootstrapService.prototype.bootstrap).toHaveBeenCalled();
  });
});
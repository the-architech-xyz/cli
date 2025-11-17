import { Genome, ResolvedGenome } from '@thearchitech.xyz/types';
import type { AdapterConfig } from '@thearchitech.xyz/types';
import * as path from 'path';
import { PathService } from '../path/path-service.js';
import { ModuleService } from '../module-management/module-service.js';
import { BlueprintPreprocessor } from '../execution/blueprint/blueprint-preprocessor.js';
import { getProjectStructure, getProjectApps, getProjectFramework } from '../../utils/genome-helpers.js';
import { ModuleConfigurationService } from '../orchestration/module-configuration-service.js';
import { FrameworkContextService } from './framework-context-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { VirtualFileSystem } from '../file-system/file-engine/virtual-file-system.js';
import { BlueprintExecutor } from '../execution/blueprint/blueprint-executor.js';
import type { StructureInitializationResult, PackageStructure } from './structure-initialization-layer.js';
import { Module } from '@thearchitech.xyz/types';

interface FrameworkMetadataEntry {
  id: string;
  frameworkId: string;
  parameters?: Record<string, any>;
  features?: Record<string, any>;
}

interface FrameworkBootstrapPlan {
  frameworkId: string;
  module: Module;
  targetPath: string;
  appId?: string;
  appType?: string;
  packagePath?: string;
  parameters: Record<string, any>;
}

export class ProjectBootstrapService {
  private moduleServiceInitialized = false;

  constructor(
    private readonly moduleService: ModuleService,
    private readonly pathHandler: PathService,
    private readonly blueprintPreprocessor: BlueprintPreprocessor,
    private readonly moduleConfigService: ModuleConfigurationService
  ) {}

  async bootstrap(
    genome: ResolvedGenome,
    structureResult?: StructureInitializationResult
  ): Promise<AdapterConfig | undefined> {
    // ResolvedGenome guarantees metadata.moduleIndex exists
    const moduleIndex = this.getModuleIndex(genome);

    const plans = this.buildFrameworkPlans(genome, moduleIndex, structureResult);
    if (plans.length === 0) {
      Logger.debug('No framework modules detected for bootstrap.', {
        operation: 'project_bootstrap'
      });
      return undefined;
    }

    await this.ensureModuleServiceInitialized();

    let preferredAdapter: AdapterConfig | undefined;

    for (const plan of plans) {
      const adapterConfig = await this.executeFrameworkPlan(plan, genome);
      if (
        !preferredAdapter ||
        plan.appType === 'web' ||
        (!plan.appType && plan.packagePath === undefined)
      ) {
        preferredAdapter = adapterConfig;
      }
    }

    return preferredAdapter;
  }

  private getModuleIndex(genome: ResolvedGenome): Record<string, any> {
    // ResolvedGenome guarantees metadata.moduleIndex exists
    return genome.metadata.moduleIndex;
  }

  private getFrameworkMetadata(genome: ResolvedGenome): FrameworkMetadataEntry[] {
    // ResolvedGenome guarantees metadata exists
    const bootstrapMeta = genome.metadata.bootstrap;
    return (bootstrapMeta?.frameworks as FrameworkMetadataEntry[] | undefined) || [];
  }

  private buildFrameworkPlans(
    genome: ResolvedGenome,
    moduleIndex: Record<string, any>,
    structureResult?: StructureInitializationResult
  ): FrameworkBootstrapPlan[] {
    const plans: FrameworkBootstrapPlan[] = [];
    const structure = getProjectStructure(genome);
    const frameworkMetadata = this.getFrameworkMetadata(genome);
    const packagesByName = new Map<string, PackageStructure>();

    if (structureResult?.packages) {
      for (const pkg of structureResult.packages) {
        packagesByName.set(pkg.name, pkg);
      }
    }

    if (structure === 'monorepo') {
      const apps = getProjectApps(genome);
      for (const app of apps) {
        if (!app?.framework) continue;
        const frameworkId = `framework/${app.framework}`;
        const module = this.buildModuleDefinition(frameworkId, moduleIndex, frameworkMetadata);
        if (!module) {
          Logger.warn(`Framework module metadata not found for ${frameworkId}; skipping app ${app.id || '(unnamed)'}`, {
            operation: 'project_bootstrap'
          });
          continue;
        }

        const parameters = {
          ...(module.parameters || {}),
          ...(this.getFrameworkParameters(frameworkMetadata, frameworkId) || {}),
          ...(app.parameters || {})
        };

        module.parameters = parameters;

        const packageName = this.getAppPackageName(app);
        const packageStructure = packagesByName.get(packageName);
        const targetRelPath = packageStructure?.path || this.getAppPackagePath(app, packageName);
        const targetPath = path.join(this.pathHandler.getProjectRoot(), targetRelPath);

        plans.push({
          frameworkId,
          module,
          targetPath,
          appId: app.id,
          appType: app.type,
          packagePath: targetRelPath,
          parameters
        });
      }
    } else {
      // For single-app, check both project.framework and apps[0].framework
      // This handles genomes that specify framework via the apps array pattern
      const framework = getProjectFramework(genome);
      
      if (!framework) {
        Logger.warn('No project.framework or apps[0].framework specified; skipping framework bootstrap.', {
          operation: 'project_bootstrap'
        });
        return plans;
      }

      // For single-app with apps[0].framework, also get parameters from the app config
      const apps = getProjectApps(genome);
      const appConfig = apps.length > 0 ? apps[0] : undefined;
      const appParameters = appConfig?.parameters || {};

      const frameworkId = `framework/${framework}`;
      const module = this.buildModuleDefinition(frameworkId, moduleIndex, frameworkMetadata);
      if (!module) {
        Logger.warn(`Framework module metadata not found for ${frameworkId}; skipping bootstrap.`, {
          operation: 'project_bootstrap'
        });
        return plans;
      }

      const parameters = {
        ...(module.parameters || {}),
        ...(this.getFrameworkParameters(frameworkMetadata, frameworkId) || {}),
        // Note: genome.project.parameters doesn't exist in ProjectConfig type
        // If needed, it should be added to the type definition
        ...({} as Record<string, unknown>),
        ...appParameters  // Merge app-specific parameters (e.g., from apps[0].parameters)
      };

      module.parameters = parameters;

      plans.push({
        frameworkId,
        module,
        targetPath: this.pathHandler.getProjectRoot(),
        parameters
      });
    }

    return plans;
  }

  private buildModuleDefinition(
    frameworkId: string,
    moduleIndex: Record<string, any>,
    frameworkMetadata: FrameworkMetadataEntry[]
  ): Module | null {
    const metadata = moduleIndex[frameworkId];
    if (!metadata) {
      return null;
    }

    const parameters = this.getFrameworkParameters(frameworkMetadata, frameworkId) || {};

    const module: Module = {
      id: frameworkId,
      category: metadata.category || metadata.type || 'framework',
      parameters,
      parameterSchema: metadata.parameters,
      features: {},
      externalFiles: [],
      marketplace: metadata.marketplace,
      source: metadata.source,
      manifest: metadata.manifest,
      blueprint: metadata.blueprint,
      templates: metadata.templates || [],
      resolved: metadata.resolved
    };

    return module;
  }

  private getFrameworkParameters(
    frameworkMetadata: FrameworkMetadataEntry[],
    frameworkId: string
  ): Record<string, any> | undefined {
    const match =
      frameworkMetadata.find(entry => entry.frameworkId === frameworkId) ||
      frameworkMetadata.find(entry => entry.id === frameworkId) ||
      frameworkMetadata.find(entry => entry.id === frameworkId.replace('framework/', 'adapters/framework/'));

    return match?.parameters;
  }

  private async executeFrameworkPlan(plan: FrameworkBootstrapPlan, genome: ResolvedGenome): Promise<AdapterConfig> {
    Logger.info(`🏗️ Bootstrapping framework ${plan.frameworkId}`, {
      operation: 'project_bootstrap',
      targetPath: plan.targetPath,
      appId: plan.appId,
      packagePath: plan.packagePath
    });

    const adapterResult = await this.moduleService.loadModuleAdapter(plan.module);
    if (!adapterResult.success || !adapterResult.adapter) {
      throw new Error(adapterResult.error || `Failed to load framework module: ${plan.frameworkId}`);
    }

    const mergedConfig = this.moduleConfigService.mergeModuleConfiguration(
      plan.module,
      adapterResult.adapter,
      genome
    );

    const preprocessingResult = await this.blueprintPreprocessor.processBlueprint(
      adapterResult.adapter.blueprint as any,
      mergedConfig
    );

    if (!preprocessingResult.success) {
      throw new Error(
        `Framework blueprint preprocessing failed for ${plan.frameworkId}: ${preprocessingResult.error || 'Unknown error'}`
      );
    }

    const contextResult = await this.moduleService.createProjectContext(
      genome,
      this.pathHandler,
      plan.module
    );

    if (!contextResult.success || !contextResult.context) {
      throw new Error(
        `Failed to create project context for ${plan.frameworkId}: ${contextResult.error || 'Unknown error'}`
      );
    }

    const projectContext = contextResult.context;
    projectContext.project.path = plan.targetPath;

    const blueprintExecutor = new BlueprintExecutor(plan.targetPath);
    const vfs = new VirtualFileSystem(
      `framework-${plan.frameworkId.replace('/', '-')}`,
      plan.targetPath
    );

    const executionResult = await blueprintExecutor.executeActions(
      preprocessingResult.actions,
      projectContext,
      vfs
    );

    if (!executionResult.success) {
      throw new Error(
        `Framework blueprint execution failed for ${plan.frameworkId}: ${executionResult.errors?.join(', ') || 'Unknown error'}`
      );
    }

    await vfs.flushToDisk();
    Logger.info(`✅ Framework ${plan.frameworkId} bootstrapped`, {
      operation: 'project_bootstrap',
      targetPath: plan.targetPath
    });

    return adapterResult.adapter.config;
  }

  private async ensureModuleServiceInitialized(): Promise<void> {
    if (this.moduleServiceInitialized) {
      return;
    }
    await this.moduleService.initialize();
    this.moduleServiceInitialized = true;
  }

  private getAppPackageName(app: any): string {
    if (app?.package && typeof app.package === 'string') {
      const parts = app.package.split('/').filter(Boolean);
      if (parts.length > 0) {
        return parts[parts.length - 1];
      }
    }
    if (app?.id) {
      return app.id;
    }
    if (app?.type) {
      return app.type;
    }
    return 'app';
  }

  private getAppPackagePath(app: any, packageName: string): string {
    if (app?.package && typeof app.package === 'string') {
      return app.package;
    }
    switch (app?.type) {
      case 'web':
        return `apps/${packageName}`;
      case 'api':
        return `apps/${packageName}`;
      case 'mobile':
        return `apps/${packageName}`;
      default:
        return `apps/${packageName}`;
    }
  }
}


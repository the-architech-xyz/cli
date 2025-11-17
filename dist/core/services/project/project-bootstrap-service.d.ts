import { ResolvedGenome } from '@thearchitech.xyz/types';
import type { AdapterConfig } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { ModuleService } from '../module-management/module-service.js';
import { BlueprintPreprocessor } from '../execution/blueprint/blueprint-preprocessor.js';
import { ModuleConfigurationService } from '../orchestration/module-configuration-service.js';
import type { StructureInitializationResult } from './structure-initialization-layer.js';
export declare class ProjectBootstrapService {
    private readonly moduleService;
    private readonly pathHandler;
    private readonly blueprintPreprocessor;
    private readonly moduleConfigService;
    private moduleServiceInitialized;
    constructor(moduleService: ModuleService, pathHandler: PathService, blueprintPreprocessor: BlueprintPreprocessor, moduleConfigService: ModuleConfigurationService);
    bootstrap(genome: ResolvedGenome, structureResult?: StructureInitializationResult): Promise<AdapterConfig | undefined>;
    private getModuleIndex;
    private getFrameworkMetadata;
    private buildFrameworkPlans;
    private buildModuleDefinition;
    private getFrameworkParameters;
    private executeFrameworkPlan;
    private ensureModuleServiceInitialized;
    private getAppPackageName;
    private getAppPackagePath;
}

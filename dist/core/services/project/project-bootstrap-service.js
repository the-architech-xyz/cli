import * as path from 'path';
import { getProjectStructure, getProjectApps, getProjectFramework } from '../../utils/genome-helpers.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { VirtualFileSystem } from '../file-system/file-engine/virtual-file-system.js';
import { BlueprintExecutor } from '../execution/blueprint/blueprint-executor.js';
export class ProjectBootstrapService {
    moduleService;
    pathHandler;
    blueprintPreprocessor;
    moduleConfigService;
    moduleServiceInitialized = false;
    constructor(moduleService, pathHandler, blueprintPreprocessor, moduleConfigService) {
        this.moduleService = moduleService;
        this.pathHandler = pathHandler;
        this.blueprintPreprocessor = blueprintPreprocessor;
        this.moduleConfigService = moduleConfigService;
    }
    async bootstrap(genome, structureResult) {
        // ResolvedGenome guarantees metadata.moduleIndex exists
        const moduleIndex = this.getModuleIndex(genome);
        Logger.info('🔍 Starting framework bootstrap', {
            operation: 'project_bootstrap',
            moduleIndexSize: Object.keys(moduleIndex).length,
            frameworkModulesInIndex: Object.keys(moduleIndex).filter(id => id.includes('framework')),
            bootstrapFrameworks: genome.metadata.bootstrap?.frameworks?.length || 0
        });
        const plans = this.buildFrameworkPlans(genome, moduleIndex, structureResult);
        if (plans.length === 0) {
            Logger.warn('⚠️ No framework modules detected for bootstrap.', {
                operation: 'project_bootstrap',
                apps: getProjectApps(genome).map(a => ({ id: a.id, framework: a.framework })),
                availableFrameworkModules: Object.keys(moduleIndex).filter(id => id.includes('framework'))
            });
            return undefined;
        }
        Logger.info(`✅ Found ${plans.length} framework(s) to bootstrap`, {
            operation: 'project_bootstrap',
            frameworks: plans.map(p => p.frameworkId)
        });
        await this.ensureModuleServiceInitialized();
        let preferredAdapter;
        for (const plan of plans) {
            const adapterConfig = await this.executeFrameworkPlan(plan, genome);
            if (!preferredAdapter ||
                plan.appType === 'web' ||
                (!plan.appType && plan.packagePath === undefined)) {
                preferredAdapter = adapterConfig;
            }
        }
        return preferredAdapter;
    }
    getModuleIndex(genome) {
        // ResolvedGenome guarantees metadata.moduleIndex exists
        return genome.metadata.moduleIndex;
    }
    getFrameworkMetadata(genome) {
        // ResolvedGenome guarantees metadata exists
        const bootstrapMeta = genome.metadata.bootstrap;
        return bootstrapMeta?.frameworks || [];
    }
    buildFrameworkPlans(genome, moduleIndex, structureResult) {
        const plans = [];
        const structure = getProjectStructure(genome);
        const frameworkMetadata = this.getFrameworkMetadata(genome);
        const packagesByName = new Map();
        if (structureResult?.packages) {
            for (const pkg of structureResult.packages) {
                packagesByName.set(pkg.name, pkg);
            }
        }
        if (structure === 'monorepo') {
            const apps = getProjectApps(genome);
            for (const app of apps) {
                if (!app?.framework)
                    continue;
                // Try multiple framework ID patterns to find the module
                // V2 modules use: adapters/framework/nextjs
                // Legacy modules use: framework/nextjs
                const frameworkIdPatterns = [
                    `adapters/framework/${app.framework}`, // V2 format (most common)
                    `framework/${app.framework}`, // Legacy format
                    `adapters/core/${app.framework}`, // Alternative format
                ];
                let module = null;
                let foundFrameworkId = null;
                for (const frameworkId of frameworkIdPatterns) {
                    module = this.buildModuleDefinition(frameworkId, moduleIndex, frameworkMetadata);
                    if (module) {
                        // Use the actual module ID (might be different from frameworkId if we used alternative match)
                        foundFrameworkId = module.id;
                        Logger.info(`✅ Found framework module: ${module.id} for app ${app.id} (searched for ${frameworkId})`, {
                            operation: 'project_bootstrap',
                            appId: app.id,
                            framework: app.framework,
                            moduleId: module.id,
                            searchedId: frameworkId
                        });
                        break;
                    }
                }
                if (!module) {
                    Logger.warn(`Framework module metadata not found for app ${app.id || '(unnamed)'} with framework '${app.framework}'. Tried: ${frameworkIdPatterns.join(', ')}`, {
                        operation: 'project_bootstrap',
                        appId: app.id,
                        framework: app.framework,
                        availableModules: Object.keys(moduleIndex).filter(id => id.includes('framework') || id.includes(app.framework))
                    });
                    continue;
                }
                // Use the actual module ID we found (not the search pattern)
                const frameworkId = foundFrameworkId;
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
        }
        else {
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
            // Try multiple framework ID patterns to find the module
            // V2 modules use: adapters/framework/nextjs
            // Legacy modules use: framework/nextjs
            const frameworkIdPatterns = [
                `adapters/framework/${framework}`, // V2 format (most common)
                `framework/${framework}`, // Legacy format
                `adapters/core/${framework}`, // Alternative format
            ];
            let module = null;
            let foundFrameworkId = null;
            for (const frameworkId of frameworkIdPatterns) {
                module = this.buildModuleDefinition(frameworkId, moduleIndex, frameworkMetadata);
                if (module) {
                    // Use the actual module ID (might be different from frameworkId if we used alternative match)
                    foundFrameworkId = module.id;
                    Logger.info(`✅ Found framework module: ${module.id} for single-app (searched for ${frameworkId})`, {
                        operation: 'project_bootstrap',
                        framework,
                        moduleId: module.id,
                        searchedId: frameworkId
                    });
                    break;
                }
            }
            if (!module) {
                Logger.warn(`Framework module metadata not found for framework '${framework}'. Tried: ${frameworkIdPatterns.join(', ')}`, {
                    operation: 'project_bootstrap',
                    framework,
                    availableModules: Object.keys(moduleIndex).filter(id => id.includes('framework') || id.includes(framework))
                });
                return plans;
            }
            // Use the actual module ID we found (not the search pattern)
            const frameworkId = foundFrameworkId;
            const parameters = {
                ...(module.parameters || {}),
                ...(this.getFrameworkParameters(frameworkMetadata, frameworkId) || {}),
                // Note: genome.project.parameters doesn't exist in ProjectConfig type
                // If needed, it should be added to the type definition
                ...{},
                ...appParameters // Merge app-specific parameters (e.g., from apps[0].parameters)
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
    buildModuleDefinition(frameworkId, moduleIndex, frameworkMetadata) {
        // Try exact match first
        let metadata = moduleIndex[frameworkId];
        // If not found, try alternative ID formats
        if (!metadata) {
            const alternatives = [
                frameworkId.replace('adapters/framework/', 'framework/'),
                frameworkId.replace('framework/', 'adapters/framework/'),
                frameworkId.replace('adapters/core/', 'adapters/framework/'),
            ];
            for (const altId of alternatives) {
                if (moduleIndex[altId]) {
                    metadata = moduleIndex[altId];
                    Logger.debug(`Found framework module using alternative ID: ${altId} (searched for ${frameworkId})`, {
                        operation: 'project_bootstrap',
                        originalId: frameworkId,
                        foundId: altId
                    });
                    break;
                }
            }
        }
        // If still not found, try partial match (e.g., search for "nextjs" in any framework module)
        if (!metadata) {
            const frameworkName = frameworkId.split('/').pop() || '';
            const matchingKeys = Object.keys(moduleIndex).filter(id => id.includes('framework') && id.includes(frameworkName));
            if (matchingKeys.length > 0) {
                // Use the first match (prefer adapters/framework/* format)
                const preferredKey = matchingKeys.find(k => k.startsWith('adapters/framework/')) || matchingKeys[0];
                if (preferredKey) {
                    metadata = moduleIndex[preferredKey];
                }
                Logger.info(`Found framework module using partial match: ${preferredKey} (searched for ${frameworkId})`, {
                    operation: 'project_bootstrap',
                    originalId: frameworkId,
                    foundId: preferredKey,
                    allMatches: matchingKeys
                });
            }
        }
        if (!metadata) {
            // Enhanced logging: show all framework-related modules
            const frameworkModules = Object.keys(moduleIndex).filter(id => id.includes('framework') || id.includes(frameworkId.split('/').pop() || ''));
            Logger.warn(`Framework module not found in moduleIndex: ${frameworkId}`, {
                operation: 'project_bootstrap',
                frameworkId,
                totalModulesInIndex: Object.keys(moduleIndex).length,
                frameworkRelatedModules: frameworkModules,
                first10Keys: Object.keys(moduleIndex).slice(0, 10)
            });
            return null;
        }
        const parameters = this.getFrameworkParameters(frameworkMetadata, frameworkId) || {};
        // Use the actual ID from metadata (might be different from frameworkId if we used alternative match)
        const actualModuleId = metadata.id || frameworkId;
        // Construct resolved field from metadata
        // buildModuleIndex doesn't include resolved, so we construct it from manifest/blueprint
        const resolved = {
            root: metadata.source?.root || '',
            manifest: metadata.manifest?.file || '',
            blueprint: metadata.blueprint?.file || '',
            templates: (metadata.templates || []).map((t) => typeof t === 'string' ? t : t.file)
        };
        const module = {
            id: actualModuleId,
            category: metadata.category || metadata.type || 'framework',
            parameters,
            parameterSchema: metadata.parameters,
            features: {},
            externalFiles: [],
            marketplace: metadata.marketplace,
            source: metadata.source || {
                root: resolved.root,
                marketplace: metadata.marketplace?.name || 'official',
                type: 'local'
            },
            manifest: metadata.manifest,
            blueprint: metadata.blueprint,
            templates: metadata.templates || [],
            resolved: resolved
        };
        return module;
    }
    getFrameworkParameters(frameworkMetadata, frameworkId) {
        const match = frameworkMetadata.find(entry => entry.frameworkId === frameworkId) ||
            frameworkMetadata.find(entry => entry.id === frameworkId) ||
            frameworkMetadata.find(entry => entry.id === frameworkId.replace('framework/', 'adapters/framework/'));
        return match?.parameters;
    }
    async executeFrameworkPlan(plan, genome) {
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
        const mergedConfig = this.moduleConfigService.mergeModuleConfiguration(plan.module, adapterResult.adapter, genome);
        const preprocessingResult = await this.blueprintPreprocessor.processBlueprint(adapterResult.adapter.blueprint, mergedConfig);
        if (!preprocessingResult.success) {
            throw new Error(`Framework blueprint preprocessing failed for ${plan.frameworkId}: ${preprocessingResult.error || 'Unknown error'}`);
        }
        const contextResult = await this.moduleService.createProjectContext(genome, this.pathHandler, plan.module);
        if (!contextResult.success || !contextResult.context) {
            throw new Error(`Failed to create project context for ${plan.frameworkId}: ${contextResult.error || 'Unknown error'}`);
        }
        const projectContext = contextResult.context;
        projectContext.project.path = plan.targetPath;
        const blueprintExecutor = new BlueprintExecutor(plan.targetPath);
        const vfs = new VirtualFileSystem(`framework-${plan.frameworkId.replace('/', '-')}`, plan.targetPath);
        const executionResult = await blueprintExecutor.executeActions(preprocessingResult.actions, projectContext, vfs);
        if (!executionResult.success) {
            throw new Error(`Framework blueprint execution failed for ${plan.frameworkId}: ${executionResult.errors?.join(', ') || 'Unknown error'}`);
        }
        await vfs.flushToDisk();
        Logger.info(`✅ Framework ${plan.frameworkId} bootstrapped`, {
            operation: 'project_bootstrap',
            targetPath: plan.targetPath
        });
        return adapterResult.adapter.config;
    }
    async ensureModuleServiceInitialized() {
        if (this.moduleServiceInitialized) {
            return;
        }
        await this.moduleService.initialize();
        this.moduleServiceInitialized = true;
    }
    getAppPackageName(app) {
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
    getAppPackagePath(app, packageName) {
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
//# sourceMappingURL=project-bootstrap-service.js.map
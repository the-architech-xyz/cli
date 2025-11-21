/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { PathService } from "../core/services/path/path-service.js";
import { PathMappingGenerator } from "../core/services/path/path-mapping-generator.js";
import { BlueprintExecutor } from "../core/services/execution/blueprint/blueprint-executor.js";
import { getProjectStructure, getProjectMonorepo, getProjectApps } from "../core/utils/genome-helpers.js";
import * as fs from 'fs/promises';
import * as path from 'path';
import { FrameworkContextService } from "../core/services/project/framework-context-service.js";
import { ModuleService } from "../core/services/module-management/module-service.js";
import { MarketplaceService } from "../core/services/marketplace/marketplace-service.js";
import { CacheManagerService } from "../core/services/infrastructure/cache/cache-manager.js";
import { Logger, ExecutionTracer, LogLevel, } from "../core/services/infrastructure/logging/index.js";
import { ErrorHandler } from "../core/services/infrastructure/error/index.js";
import { BlueprintPreprocessor } from "../core/services/execution/blueprint/blueprint-preprocessor.js";
import { AppManifestGenerator } from "../core/services/project/app-manifest-generator.js";
import { ModuleConfigurationService } from "../core/services/orchestration/module-configuration-service.js";
import { MonorepoPackageResolver } from "../core/services/project/monorepo-package-resolver.js";
import { validateFrameworkCompatibility } from "../core/utils/framework-compatibility.js";
import { ProjectBootstrapService } from "../core/services/project/project-bootstrap-service.js";
export class OrchestratorAgent {
    projectManager;
    pathHandler;
    moduleService;
    cacheManager;
    blueprintPreprocessor;
    appManifestGenerator;
    moduleConfigService;
    projectBootstrapService;
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.pathHandler = projectManager.getPathHandler();
        this.cacheManager = new CacheManagerService();
        this.moduleService = new ModuleService(this.cacheManager);
        this.moduleConfigService = new ModuleConfigurationService();
        this.blueprintPreprocessor = new BlueprintPreprocessor();
        this.appManifestGenerator = new AppManifestGenerator();
        this.projectBootstrapService = new ProjectBootstrapService(this.moduleService, this.pathHandler, this.blueprintPreprocessor, this.moduleConfigService);
    }
    /**
     * Execute a recipe using unified dependency-driven execution
     */
    async executeRecipe(genome, verbose = false, enhancedLogger, options) {
        const traceId = ExecutionTracer.startTrace("orchestrator_execution");
        const results = [];
        const errors = [];
        const warnings = [];
        // Configure Logger level based on verbose flag
        if (verbose) {
            Logger.setLevel(LogLevel.DEBUG);
        }
        Logger.setVerbose(verbose);
        const executionOptions = options ?? {};
        try {
            // Enhanced logging: Start validation phase
            if (enhancedLogger) {
                enhancedLogger.startPhase("validating");
            }
            Logger.info(`🚀 Starting genome execution: ${genome.project.name}`, {
                traceId,
                operation: "genome_execution",
            });
            // 1. Validate genome (already transformed in command, guaranteed to have modules)
            ExecutionTracer.logOperation(traceId, "Validating genome");
            const validationResult = this.validateRecipe(genome);
            if (!validationResult.valid) {
                throw new Error(`Genome validation failed: ${validationResult.errors.join(", ")}`);
            }
            // 1.1. Initialize project structure
            ExecutionTracer.logOperation(traceId, "Initializing project structure");
            await this.projectManager.initializeProject();
            // 1.2. Initialize structure layer (single-app or monorepo) based on genome
            ExecutionTracer.logOperation(traceId, "Initializing structure layer");
            // Debug: Log genome structure before initialization
            Logger.info(`🔍 Genome structure check:`, {
                traceId,
                operation: 'structure_initialization',
                structure: getProjectStructure(genome),
                hasMonorepo: !!getProjectMonorepo(genome),
                hasApps: getProjectApps(genome).length > 0,
                appsCount: getProjectApps(genome).length
            });
            // Load recipe books early for structure initialization
            const recipeBooks = await this.loadRecipeBooksFromGenome(genome, executionOptions);
            console.log(`[OrchestratorAgent] 🔨 Starting structure initialization...`);
            console.log(`[OrchestratorAgent] Recipe books: ${recipeBooks?.size || 0}`);
            const { StructureInitializationLayer } = await import('../core/services/project/structure-initialization-layer.js');
            Logger.info(`🔨 Starting structure initialization...`, {
                traceId,
                operation: 'structure_initialization',
                hasRecipeBooks: !!recipeBooks,
                recipeBookCount: recipeBooks?.size || 0
            });
            const structureLayer = new StructureInitializationLayer(this.pathHandler, recipeBooks);
            console.log(`[OrchestratorAgent] 🔨 Calling structureLayer.initialize()...`);
            Logger.info(`🔨 Calling structureLayer.initialize()...`, {
                traceId,
                operation: 'structure_initialization'
            });
            // Extract dependency map from metadata if available
            const dependencyMap = genome.metadata?.dependencies
                ? new Map(Object.entries(genome.metadata.dependencies))
                : undefined;
            const structureResult = await structureLayer.initialize(genome, dependencyMap);
            console.log(`[OrchestratorAgent] 🔨 Structure initialization completed: success=${structureResult.success}, packages=${structureResult.packages.length}`);
            console.log(`[OrchestratorAgent] Packages:`, structureResult.packages.map(p => `${p.name} → ${p.path}`));
            Logger.info(`🔨 Structure initialization completed: success=${structureResult.success}, packages=${structureResult.packages.length}`, {
                traceId,
                operation: 'structure_initialization',
                success: structureResult.success,
                packageCount: structureResult.packages.length,
                error: structureResult.error
            });
            if (!structureResult.success) {
                throw new Error(`Structure initialization failed: ${structureResult.error}`);
            }
            Logger.info(`✅ Project structure initialized with ${structureResult.packages.length} packages`, {
                traceId,
                operation: 'structure_initialization',
                packages: structureResult.packages.map(p => `${p.name} (${p.path})`)
            });
            // Debug: Verify packages were created
            if (structureResult.packages.length > 0) {
                Logger.info(`📦 Created packages:`, {
                    traceId,
                    operation: 'structure_initialization',
                    packages: structureResult.packages.map(p => `${p.name} → ${p.path}`)
                });
            }
            else {
                Logger.warn(`⚠️ No packages were created during structure initialization!`, {
                    traceId,
                    operation: 'structure_initialization'
                });
            }
            ExecutionTracer.logOperation(traceId, "Bootstrapping project foundations");
            const frameworkAdapterConfig = await this.projectBootstrapService.bootstrap(genome, structureResult);
            // Genome transformation is done in the command layer (new.ts)
            // The orchestrator receives a pre-transformed genome with modules already resolved
            // All transformation logic (dependency resolution, module expansion, execution ordering)
            // is handled by the marketplace adapter's GenomeTransformer
            const resolvedGenome = genome;
            // Complete validation phase
            if (enhancedLogger) {
                enhancedLogger.completePhase();
                enhancedLogger.startPhase("planning");
            }
            // NEW: Pre-compute path mappings (BEFORE path initialization)
            // This generates all path mappings once, including semantic key expansion
            ExecutionTracer.logOperation(traceId, "Generating path mappings");
            const marketplaceAdapters = new Map();
            // Collect all marketplace adapters
            if (executionOptions.marketplaceAdapter) {
                const marketplaceName = executionOptions.marketplaceInfo?.name || 'core';
                marketplaceAdapters.set(marketplaceName, executionOptions.marketplaceAdapter);
            }
            // Generate path mappings (pass recipe books to override with packageStructure.directory)
            const pathMappings = await PathMappingGenerator.generateMappings(resolvedGenome, marketplaceAdapters, recipeBooks);
            // Store in PathService (global state for blueprint execution)
            PathService.setMappings(pathMappings);
            Logger.info(`✅ Pre-computed ${Object.keys(pathMappings).length} path mappings`, {
                traceId,
                operation: "path_mapping_generation",
                mappingCount: Object.keys(pathMappings).length
            });
            // Initialize all paths centrally (BEFORE framework setup and module execution)
            // This ensures paths (including marketplace UI) are available during blueprint execution
            // NOTE: PathInitializationService will use pre-computed mappings when available
            ExecutionTracer.logOperation(traceId, "Initializing project paths");
            const { PathInitializationService } = await import('../core/services/project/path-initialization-service.js');
            await PathInitializationService.initializePaths(resolvedGenome, this.pathHandler, frameworkAdapterConfig, {
                marketplaceAdapter: executionOptions.marketplaceAdapter,
                marketplaceInfo: executionOptions.marketplaceInfo,
                runtimeOverrides: executionOptions.pathOverrides,
            });
            // Execute modules sequentially in transformer order
            if (enhancedLogger) {
                enhancedLogger.completePhase();
                enhancedLogger.setTotalModules(resolvedGenome.modules.length);
                enhancedLogger.startPhase("modules");
            }
            Logger.info(`📦 Executing ${resolvedGenome.modules.length} modules`, {
                traceId,
                operation: "module_execution",
            });
            // Recipe books already loaded during structure initialization, reuse them
            // (If not loaded, load them now - but they should already be loaded above)
            for (const mod of resolvedGenome.modules) {
                const execResult = await this.executeModule(mod, resolvedGenome, traceId, enhancedLogger, recipeBooks);
                if (!execResult.success) {
                    errors.push(execResult.error || `Module ${mod.id} failed`);
                    return {
                        success: false,
                        modulesExecuted: results.length,
                        errors,
                        warnings
                    };
                }
                results.push(execResult);
                // Optional progress update if logger supports it
                if (enhancedLogger && typeof enhancedLogger.incrementModule === 'function') {
                    enhancedLogger.incrementModule();
                }
            }
            // Log completion of module execution
            Logger.info("🎉 All modules executed successfully", {
                traceId,
                modulesExecuted: results.length,
                operation: "module_execution_complete"
            });
            // Ensure workspaces are configured for monorepos (before dependency installation)
            Logger.debug("🔍 Checking if workspace configuration is needed", {
                traceId,
                structure: resolvedGenome.project.structure,
                isMonorepo: resolvedGenome.project.structure === 'monorepo',
                operation: "workspace_configuration_check"
            });
            if (resolvedGenome.project.structure === 'monorepo') {
                Logger.info("🔧 Monorepo detected, ensuring workspaces are configured...", {
                    traceId,
                    operation: "workspace_configuration_start"
                });
                ExecutionTracer.logOperation(traceId, "Ensuring workspaces are configured");
                try {
                    await this.ensureWorkspacesConfigured();
                    Logger.info("✅ Workspace configuration completed successfully", {
                        traceId,
                        operation: "workspace_configuration_complete"
                    });
                }
                catch (error) {
                    Logger.warn(`⚠️  Failed to ensure workspaces configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                        traceId,
                        operation: "workspace_configuration",
                        error: error instanceof Error ? error.stack : String(error)
                    });
                    warnings.push(`Workspace configuration warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            else {
                Logger.debug("⏭️  Skipping workspace configuration (not a monorepo)", {
                    traceId,
                    structure: resolvedGenome.project.structure,
                    operation: "workspace_configuration_skip"
                });
            }
            // Install dependencies (only if all modules succeeded)
            Logger.info("📦 Starting final dependency installation...", {
                traceId,
                operation: "dependency_installation_start"
            });
            ExecutionTracer.logOperation(traceId, "Installing dependencies");
            try {
                await this.installDependencies(genome);
                Logger.info("✅ Final dependency installation completed successfully", {
                    traceId,
                    operation: "dependency_installation_complete"
                });
            }
            catch (error) {
                const dependencyErrorResult = ErrorHandler.handleDependencyFailure(error, verbose);
                errors.push(ErrorHandler.formatUserError(dependencyErrorResult, verbose));
                Logger.error(`❌ ${dependencyErrorResult.error}`, {
                    traceId,
                    operation: "dependency_installation",
                });
                ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : new Error(String(error)));
                return {
                    success: false,
                    modulesExecuted: results.length,
                    errors,
                    warnings,
                };
            }
            // Generate app manifest
            ExecutionTracer.logOperation(traceId, "Generating app manifest");
            try {
                const projectPath = this.projectManager.getProjectConfig().path || './';
                await this.appManifestGenerator.generateAndSaveManifest(genome, projectPath);
                Logger.info(`📋 App manifest generated successfully`, {
                    traceId,
                    operation: "manifest_generation",
                });
            }
            catch (manifestError) {
                Logger.warn(`⚠️ Failed to generate app manifest: ${manifestError instanceof Error ? manifestError.message : 'Unknown error'}`, {
                    traceId,
                    operation: "manifest_generation",
                });
                warnings.push(`Failed to generate app manifest: ${manifestError instanceof Error ? manifestError.message : 'Unknown error'}`);
            }
            // 14. Complete execution
            ExecutionTracer.endTrace(traceId, true);
            Logger.info(`🎉 Recipe execution completed successfully!`, {
                traceId,
                operation: "recipe_execution",
            });
            return {
                success: true,
                modulesExecuted: results.length,
                errors,
                warnings,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push(errorMessage);
            Logger.error(`❌ Recipe execution failed: ${errorMessage}`, {
                traceId,
                operation: "recipe_execution",
            });
            ExecutionTracer.endTrace(traceId, false, error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                modulesExecuted: results.length,
                errors,
                warnings,
            };
        }
    }
    /**
     * Filter out framework modules from execution plan since they're executed during setup
     */
    filterOutFrameworkModules(plan) {
        return {
            ...plan,
            batches: plan.batches
                .map((batch) => ({
                ...batch,
                modules: batch.modules.filter((module) => module.category !== "framework"),
            }))
                .filter((batch) => batch.modules.length > 0),
        };
    }
    /**
     * Execute unified dependency-driven plan
     * Single execution loop that relies on dependency graph for correct ordering
     */
    async executeUnifiedPlan(genome, traceId, verbose, executionPlan, enhancedLogger, recipeBooks) {
        const results = [];
        const errors = [];
        try {
            Logger.info(`🚀 Executing unified dependency-driven plan with ${executionPlan.batches.length} batches`, {
                traceId,
                operation: "unified_execution",
            });
            // Execute all batches in dependency order
            for (let i = 0; i < executionPlan.batches.length; i++) {
                const batch = executionPlan.batches[i];
                Logger.debug(`🔍 CWD BEFORE batch ${i + 1}: ${process.cwd()}`);
                Logger.info(`🚀 Executing batch ${i + 1}/${executionPlan.batches.length} (${batch.modules.length} modules)`, {
                    traceId,
                    operation: "unified_execution",
                });
                // Execute modules in this batch (each module gets its own VFS lifecycle)
                for (const module of batch.modules) {
                    // Skip framework adapter modules; frameworks are already set up earlier
                    if (module.id.startsWith('adapters/framework/')) {
                        Logger.info(`⏭️  Skipping framework module during module phase: ${module.id}`, {
                            traceId,
                            operation: 'module_execution'
                        });
                        continue;
                    }
                    // Enhanced logging: Determine module type and phase
                    if (enhancedLogger) {
                        let phaseKey = "adapters";
                        if (module.category === "framework") {
                            phaseKey = "framework";
                        }
                        else if (module.category === "integration") {
                            phaseKey = "integrations";
                        }
                        // Check if we need to transition phases
                        const currentPhase = enhancedLogger["currentPhase"];
                        if (currentPhase !== phaseKey) {
                            if (currentPhase) {
                                enhancedLogger.completePhase();
                            }
                            enhancedLogger.startPhase(phaseKey);
                        }
                        // Log module progress
                        enhancedLogger.logModuleProgress(module.id, "installing");
                    }
                    const result = await this.executeModule(module, genome, traceId, enhancedLogger, recipeBooks);
                    if (result.success) {
                        results.push(result);
                        Logger.info(`✅ Module ${module.id} completed successfully`, {
                            traceId,
                            operation: "unified_execution",
                        });
                        // Enhanced logging: Mark module as completed
                        if (enhancedLogger) {
                            enhancedLogger.logModuleProgress(module.id, "completed");
                        }
                    }
                    else {
                        errors.push(`Module ${module.id} failed: ${result.error}`);
                        Logger.error(`❌ Module ${module.id} failed: ${result.error}`, {
                            traceId,
                            operation: "unified_execution",
                        });
                        // Enhanced logging: Mark module as failed
                        if (enhancedLogger) {
                            enhancedLogger.logModuleProgress(module.id, "failed");
                        }
                        return { success: false, results, errors };
                    }
                }
                Logger.info(`✅ Batch ${i + 1} completed successfully`, {
                    traceId,
                    operation: "unified_execution",
                });
            }
            // Enhanced logging: Complete current phase and start finalizing
            if (enhancedLogger) {
                if (enhancedLogger["currentPhase"]) {
                    enhancedLogger.completePhase();
                }
                enhancedLogger.startPhase("finalizing");
                enhancedLogger.completePhase();
            }
            return { success: true, results, errors };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push(`Unified execution failed: ${errorMessage}`);
            Logger.error(`❌ Unified execution failed: ${errorMessage}`, {
                traceId,
                operation: "unified_execution",
            });
            return { success: false, results, errors };
        }
    }
    /**
     * Execute a single module with its own transactional VFS
     * Each blueprint gets: Create VFS → Execute → Flush to Disk
     *
     * NEW: Supports dual execution contexts:
     * - Package execution (adapters, tech-stack)
     * - App execution (connectors, features frontend/backend)
     * - Root execution (single-app mode)
     */
    async executeModule(module, genome, traceId, enhancedLogger, recipeBooks) {
        try {
            Logger.info(`🔧 Executing module: ${module.id}`, {
                traceId,
                operation: "module_execution",
            });
            // Resolve execution context (package OR apps)
            const resolution = MonorepoPackageResolver.resolveExecutionContext(module, genome, recipeBooks);
            // Skip modules with no valid execution context (no package AND no apps)
            if (!resolution || (!resolution.targetPackage && (!resolution.targetApps || resolution.targetApps.length === 0))) {
                Logger.warn(`⏭️ Skipping module ${module.id} - no valid execution context (no package and no compatible apps)`, {
                    traceId,
                    operation: "module_execution",
                    moduleId: module.id,
                    resolution: resolution ? JSON.stringify(resolution) : 'null'
                });
                return { success: true, executedModules: [] }; // Skip silently (not an error)
            }
            if (resolution?.targetPackage) {
                // Package execution (adapters, tech-stack)
                return await this.executeInPackage(module, genome, resolution.targetPackage, traceId, enhancedLogger);
            }
            else if (resolution?.targetApps && resolution.targetApps.length > 0) {
                // App execution (connectors, features frontend/backend)
                // Filter out non-existent apps BEFORE execution
                const apps = getProjectApps(genome);
                const existingAppIds = apps.map((a) => a.id);
                const validTargetApps = resolution.targetApps.filter(appId => existingAppIds.includes(appId));
                if (validTargetApps.length === 0) {
                    Logger.warn(`⚠️ No valid apps found for module ${module.id}. ` +
                        `Target apps: ${resolution.targetApps.join(', ')}, ` +
                        `Available apps: ${existingAppIds.join(', ')}`, {
                        traceId,
                        operation: "module_execution",
                        moduleId: module.id,
                        targetApps: resolution.targetApps,
                        availableApps: existingAppIds
                    });
                    return { success: false, error: `No valid apps found for module ${module.id}` };
                }
                if (validTargetApps.length < resolution.targetApps.length) {
                    Logger.info(`🔒 Filtered out ${resolution.targetApps.length - validTargetApps.length} non-existent apps. ` +
                        `Executing in: ${validTargetApps.join(', ')}`, {
                        traceId,
                        operation: "module_execution",
                        moduleId: module.id,
                        originalTargetApps: resolution.targetApps,
                        validTargetApps
                    });
                }
                // Execute for each valid app
                const results = [];
                let hasError = false;
                let errorMessage;
                for (const appId of validTargetApps) {
                    const result = await this.executeInApp(module, genome, appId, traceId, enhancedLogger, recipeBooks);
                    results.push(...(result.executedModules || []));
                    if (!result.success) {
                        hasError = true;
                        errorMessage = result.error;
                        // Continue executing for other apps, but track error
                    }
                }
                return {
                    success: !hasError,
                    error: errorMessage,
                    executedModules: results
                };
            }
            else {
                // Root execution (single-app mode or fallback)
                return await this.executeInRoot(module, genome, traceId, enhancedLogger);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`, {
                traceId,
                operation: "module_execution",
            });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Execute module in package context (adapters, tech-stack)
     */
    async executeInPackage(module, genome, targetPackage, traceId, enhancedLogger) {
        let blueprintVFS = null;
        let originalWorkingDirectory = null;
        try {
            Logger.info(`📦 Executing module in package: ${targetPackage}`, {
                traceId,
                operation: "module_execution",
                moduleId: module.id,
                targetPackage
            });
            originalWorkingDirectory = process.cwd();
            const targetPackagePath = path.join(this.pathHandler.getProjectRoot(), targetPackage);
            // CRITICAL: Ensure package directory exists before chdir
            // This is a defensive check - packages should be created during structure initialization,
            // but this prevents failures if structure initialization missed a package
            try {
                await fs.mkdir(targetPackagePath, { recursive: true });
                Logger.debug(`✅ Ensured package directory exists: ${targetPackagePath}`, {
                    traceId,
                    operation: "module_execution",
                    targetPackage
                });
            }
            catch (error) {
                Logger.warn(`⚠️ Failed to create package directory: ${targetPackagePath}`, {
                    traceId,
                    operation: "module_execution",
                    targetPackage,
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue anyway - chdir will fail with a clearer error if directory doesn't exist
            }
            process.chdir(targetPackagePath);
            // Load the module to get its blueprint
            const moduleResult = await this.moduleService.loadModuleAdapter(module);
            if (!moduleResult.success || !moduleResult.adapter) {
                return {
                    success: false,
                    error: `Failed to load module ${module.id}: ${moduleResult.error || "Unknown error"}`,
                };
            }
            // NEW: Process blueprint with preprocessor
            const mergedConfig = this.mergeModuleConfiguration(module, moduleResult.adapter, genome);
            // Load normalized blueprint object via MarketplaceService (uses BlueprintLoader)
            const loadedBlueprint = await MarketplaceService.loadModuleBlueprint(module);
            Logger.debug('Loaded blueprint module metadata', {
                operation: 'blueprint_loading',
                moduleId: module.id,
                hasDefault: !!loadedBlueprint.default,
                hasActions: !!loadedBlueprint.actions,
                hasBlueprint: !!loadedBlueprint.blueprint
            });
            Logger.info(`🧩 Preprocessing blueprint for module ${module.id}`, {
                traceId,
                operation: 'module_execution',
                blueprintFormat: {
                    hasDefault: !!loadedBlueprint.default,
                    hasActions: !!loadedBlueprint.actions,
                    hasBlueprint: !!loadedBlueprint.blueprint
                }
            });
            const preprocessingResult = await this.blueprintPreprocessor.processBlueprint(loadedBlueprint, mergedConfig);
            if (!preprocessingResult.success) {
                return {
                    success: false,
                    error: `Blueprint preprocessing failed: ${preprocessingResult.error}`,
                };
            }
            // Create modules record for context factory
            const modulesRecord = {};
            // ResolvedGenome guarantees modules is always an array
            const genomeModules = genome.modules;
            genomeModules.forEach(mod => {
                modulesRecord[mod.id] = mod;
            });
            // Create dynamic project context based on framework and parameters
            const projectContext = await FrameworkContextService.createProjectContext(genome, module, this.pathHandler, modulesRecord);
            // PathResolver removed - paths are now stored in correct format (relative to package root)
            // PathService.resolveTemplate() returns paths that are already normalized
            // CRITICAL FIX: Merge templateContext into ProjectContext root for ALL modules
            // This allows templates to access {{modules}}, {{project}}, etc. directly
            if (mergedConfig.templateContext) {
                Object.assign(projectContext, mergedConfig.templateContext);
            }
            // Add targetPackage to context for action handlers (e.g., INSTALL_PACKAGES)
            // This allows handlers to know which package they should target, even if executing in a different package
            projectContext.targetPackage = targetPackage || undefined;
            // Also add targetApp if this is app execution (for features that install packages to apps)
            // This is set when executing in app context
            // Add frontendApps to context for auto-wrapper generation
            // Extract frontend apps (web, mobile) from genome
            const apps = getProjectApps(genome);
            const frontendApps = apps
                .filter((a) => a.type === 'web' || a.type === 'mobile')
                .map((app) => ({
                type: app.type,
                package: app.package,
                framework: app.framework
            }));
            projectContext.frontendApps = frontendApps;
            projectContext.hasMultipleFrontendApps = frontendApps.length > 1;
            projectContext.hasWebApp = frontendApps.some((a) => a.type === 'web');
            projectContext.hasMobileApp = frontendApps.some((a) => a.type === 'mobile');
            // Extract commonly used parameters from module.parameters and add them directly to context
            // This allows templates to use variables like `platforms`, `params`, etc. directly
            // Check both module.parameters and templateContext.module.parameters for maximum compatibility
            const moduleParams = projectContext.module?.parameters ||
                mergedConfig.templateContext?.module?.parameters ||
                {};
            // Add params as a direct alias for module.parameters (used by many templates)
            // CRITICAL: Must be added AFTER templateContext merge to ensure it's available
            // Always add params (even if empty) so templates can safely use params.xxx
            projectContext.params = moduleParams;
            Logger.debug('Applied module parameters to context', {
                operation: 'context_enrichment',
                moduleId: module.id,
                paramKeys: Object.keys(moduleParams)
            });
            // Add platforms if available (used by UI adapters like Tamagui)
            // Default to web: true, mobile: false if not specified
            if (this.isValidPlatforms(moduleParams.platforms)) {
                projectContext.platforms = moduleParams.platforms;
            }
            else {
                // Provide sensible defaults based on framework
                const framework = projectContext.framework || 'nextjs';
                projectContext.platforms = {
                    web: framework === 'nextjs' || framework === 'react',
                    mobile: framework === 'expo' || framework === 'react-native'
                };
            }
            // Add theme if available (used by UI adapters)
            if (typeof moduleParams.theme === 'string') {
                projectContext.theme = moduleParams.theme;
            }
            // NEW: Handle Constitutional Architecture configuration merging
            if (this.isConstitutionalModule(moduleResult.adapter)) {
                projectContext.constitutional = {
                    activeFeatures: new Map([[module.id, mergedConfig.activeFeatures]]),
                    mergedConfigurations: new Map([[module.id, mergedConfig]]),
                    capabilityRegistry: new Map(),
                };
            }
            // **ARCHITECTURAL DECISION**: UI templates use convention-based loading
            // Templates with `ui/` prefix are automatically resolved from UI marketplace via MarketplaceService
            // The blueprint.ts file uses CREATE_FILE actions with `ui/...` template paths
            // 1. CREATE per-blueprint VFS
            // CRITICAL: Always use project root, no contextRoot (all paths absolute from project root)
            const projectRoot = this.pathHandler.getProjectRoot();
            blueprintVFS = new (await import('../core/services/file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${moduleResult.adapter.blueprint.id}`, projectRoot // Always project root, no contextRoot
            );
            Logger.info(`📦 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id}`, {
                traceId,
                operation: "module_execution",
            });
            // 2. EXECUTE preprocessed actions with BlueprintExecutor
            const executorRoot = targetPackagePath;
            Logger.debug('Creating blueprint executor', {
                operation: 'blueprint_execution',
                executorRoot,
                targetPackage
            });
            const blueprintExecutor = new BlueprintExecutor(executorRoot);
            const result = await blueprintExecutor.executeActions(preprocessingResult.actions, projectContext, blueprintVFS);
            if (result.success) {
                // 3. FLUSH VFS to disk on success - critical for subsequent modules!
                await blueprintVFS.flushToDisk();
                Logger.info(`💾 VFS flushed to disk for blueprint: ${moduleResult.adapter.blueprint.id}`, {
                    traceId,
                    operation: "module_execution",
                });
                Logger.info(`✅ Module ${module.id} executed successfully in package: ${targetPackage}`, {
                    traceId,
                    operation: "module_execution",
                });
                // ✅ CRITICAL: Clean up VFS after flush to prevent memory leaks
                blueprintVFS.clear();
                blueprintVFS = null;
                return { success: true, executedModules: [module] };
            }
            else {
                // DO NOT flush on failure - preserve clean state
                // ✅ CRITICAL: Still clean up VFS even on failure
                if (blueprintVFS) {
                    blueprintVFS.clear();
                    blueprintVFS = null;
                }
                Logger.error(`❌ Module ${module.id} execution failed: ${result.errors?.join(", ") || "Unknown error"}`, {
                    traceId,
                    operation: "module_execution",
                });
                return {
                    success: false,
                    error: result.errors?.join(", ") || "Unknown error",
                };
            }
        }
        catch (error) {
            // ✅ CRITICAL: Always clean up VFS in case of error
            if (blueprintVFS) {
                blueprintVFS.clear();
                blueprintVFS = null;
            }
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`, {
                traceId,
                operation: "module_execution",
            });
            return { success: false, error: errorMessage };
        }
        finally {
            // ✅ CRITICAL: Ensure VFS is always cleaned up, even if execution fails
            if (blueprintVFS) {
                blueprintVFS.clear();
                blueprintVFS = null;
            }
            // Restore original working directory if changed
            if (originalWorkingDirectory) {
                process.chdir(originalWorkingDirectory);
            }
        }
    }
    /**
     * Execute module in app context (connectors, features frontend/backend)
     */
    async executeInApp(module, genome, appId, traceId, enhancedLogger, recipeBooks) {
        let blueprintVFS = null;
        let originalWorkingDirectory = null;
        try {
            // Get app path from genome
            const apps = getProjectApps(genome);
            // Find app by ID - single strategy (id field must be set correctly)
            const app = apps.find((a) => a.id === appId);
            if (!app) {
                Logger.warn(`⚠️ App ${appId} not found in genome, skipping execution. Available app IDs: ${apps.map(a => a.id).join(', ')}`, {
                    traceId,
                    operation: "module_execution",
                    moduleId: module.id,
                    appId,
                    availableAppIds: apps.map(a => a.id)
                });
                return { success: false, error: `App ${appId} not found` };
            }
            // Framework and app type compatibility validation (firewall)
            // Get requirements from resolution (includes recipe book metadata)
            // NOTE: Use the same recipeBooks passed to executeModule, not undefined
            const resolution = MonorepoPackageResolver.resolveExecutionContext(module, genome, recipeBooks);
            const frameworkRequirement = resolution?.requiredFramework;
            const requiredAppTypes = resolution?.requiredAppTypes;
            const compatibility = validateFrameworkCompatibility(module, appId, genome, frameworkRequirement, requiredAppTypes);
            if (!compatibility.compatible) {
                Logger.error(`❌ Framework compatibility firewall: ${compatibility.error}`, {
                    traceId,
                    operation: "module_execution",
                    moduleId: module.id,
                    appId,
                    appFramework: app.framework
                });
                return {
                    success: false,
                    error: compatibility.error || 'Framework compatibility check failed'
                };
            }
            // Resolve app path
            const appPath = app.package || `apps/${appId}`;
            const appFullPath = path.join(this.pathHandler.getProjectRoot(), appPath);
            Logger.info(`📱 Executing module in app: ${appId} (${appPath})`, {
                traceId,
                operation: "module_execution",
                moduleId: module.id,
                appId,
                appPath
            });
            originalWorkingDirectory = process.cwd();
            process.chdir(appFullPath);
            // Load the module to get its blueprint
            const moduleResult = await this.moduleService.loadModuleAdapter(module);
            if (!moduleResult.success || !moduleResult.adapter) {
                return {
                    success: false,
                    error: `Failed to load module ${module.id}: ${moduleResult.error || "Unknown error"}`,
                };
            }
            // Process blueprint with preprocessor
            const mergedConfig = this.mergeModuleConfiguration(module, moduleResult.adapter, genome);
            // Load normalized blueprint object via MarketplaceService
            const loadedBlueprint = await MarketplaceService.loadModuleBlueprint(module);
            const preprocessingResult = await this.blueprintPreprocessor.processBlueprint(loadedBlueprint, mergedConfig);
            if (!preprocessingResult.success) {
                return {
                    success: false,
                    error: `Blueprint preprocessing failed: ${preprocessingResult.error}`,
                };
            }
            // Create modules record for context factory
            const modulesRecord = {};
            const genomeModules = genome.modules;
            genomeModules.forEach(mod => {
                modulesRecord[mod.id] = mod;
            });
            // Create dynamic project context
            const projectContext = await FrameworkContextService.createProjectContext(genome, module, this.pathHandler, modulesRecord);
            // Merge templateContext
            if (mergedConfig.templateContext) {
                Object.assign(projectContext, mergedConfig.templateContext);
            }
            // Add app-specific context for action handlers (e.g., INSTALL_PACKAGES)
            // Set targetPackage to app path so INSTALL_PACKAGES installs to app's package.json
            projectContext.targetPackage = appPath; // Use app path for package.json targeting
            projectContext.targetApp = appId; // App ID for context (not in ProjectContext type)
            // Add frontendApps to context
            const allApps = getProjectApps(genome);
            const frontendApps = allApps
                .filter((a) => a.type === 'web' || a.type === 'mobile')
                .map((app) => ({
                type: app.type,
                package: app.package,
                framework: app.framework
            }));
            projectContext.frontendApps = frontendApps;
            projectContext.hasMultipleFrontendApps = frontendApps.length > 1;
            projectContext.hasWebApp = frontendApps.some((a) => a.type === 'web');
            projectContext.hasMobileApp = frontendApps.some((a) => a.type === 'mobile');
            // Extract module parameters
            const moduleParams = projectContext.module?.parameters ||
                mergedConfig.templateContext?.module?.parameters ||
                {};
            projectContext.params = moduleParams;
            // Add platforms
            if (this.isValidPlatforms(moduleParams.platforms)) {
                projectContext.platforms = moduleParams.platforms;
            }
            else {
                const framework = projectContext.framework || 'nextjs';
                projectContext.platforms = {
                    web: framework === 'nextjs' || framework === 'react',
                    mobile: framework === 'expo' || framework === 'react-native'
                };
            }
            if (typeof moduleParams.theme === 'string') {
                projectContext.theme = moduleParams.theme;
            }
            // Handle Constitutional Architecture
            if (this.isConstitutionalModule(moduleResult.adapter)) {
                projectContext.constitutional = {
                    activeFeatures: new Map([[module.id, mergedConfig.activeFeatures]]),
                    mergedConfigurations: new Map([[module.id, mergedConfig]]),
                    capabilityRegistry: new Map(),
                };
            }
            // Create VFS with project root (all paths absolute from project root)
            const projectRoot = this.pathHandler.getProjectRoot();
            blueprintVFS = new (await import('../core/services/file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${moduleResult.adapter.blueprint.id}-${appId}`, projectRoot // Always project root, no contextRoot
            );
            Logger.info(`📱 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id} in app: ${appId}`, {
                traceId,
                operation: "module_execution",
            });
            // Execute preprocessed actions
            const blueprintExecutor = new BlueprintExecutor(appFullPath);
            const result = await blueprintExecutor.executeActions(preprocessingResult.actions, projectContext, blueprintVFS);
            if (result.success) {
                // Flush VFS to disk
                await blueprintVFS.flushToDisk();
                Logger.info(`💾 VFS flushed to disk for blueprint: ${moduleResult.adapter.blueprint.id} in app: ${appId}`, {
                    traceId,
                    operation: "module_execution",
                });
                Logger.info(`✅ Module ${module.id} executed successfully in app: ${appId}`, {
                    traceId,
                    operation: "module_execution",
                });
                blueprintVFS.clear();
                blueprintVFS = null;
                return { success: true, executedModules: [module] };
            }
            else {
                if (blueprintVFS) {
                    blueprintVFS.clear();
                    blueprintVFS = null;
                }
                Logger.error(`❌ Module ${module.id} execution failed in app ${appId}: ${result.errors?.join(", ") || "Unknown error"}`, {
                    traceId,
                    operation: "module_execution",
                });
                return {
                    success: false,
                    error: result.errors?.join(", ") || "Unknown error",
                };
            }
        }
        catch (error) {
            if (blueprintVFS) {
                blueprintVFS.clear();
                blueprintVFS = null;
            }
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const errorStack = error instanceof Error ? error.stack : String(error);
            // Log full error details for debugging
            Logger.error(`❌ Module ${module.id} execution error in app ${appId}: ${errorMessage}`, {
                traceId,
                operation: "module_execution",
                moduleId: module.id,
                appId,
                errorStack,
                error: errorMessage,
            }, error instanceof Error ? error : undefined);
            // Return actual error message, not generic one
            return { success: false, error: errorMessage };
        }
        finally {
            if (blueprintVFS) {
                blueprintVFS.clear();
                blueprintVFS = null;
            }
            if (originalWorkingDirectory) {
                process.chdir(originalWorkingDirectory);
            }
        }
    }
    /**
     * Execute module in root context (single-app mode or fallback)
     */
    async executeInRoot(module, genome, traceId, enhancedLogger) {
        // For now, execute similar to package but with root as context
        // This is a fallback for single-app mode
        Logger.info(`🌐 Executing module in root context: ${module.id}`, {
            traceId,
            operation: "module_execution",
            moduleId: module.id
        });
        // Use executeInPackage with empty targetPackage (root)
        return await this.executeInPackage(module, genome, '', traceId, enhancedLogger);
    }
    /**
     * Ensure workspaces are configured in root package.json for monorepos
     */
    async ensureWorkspacesConfigured() {
        const projectRoot = this.pathHandler.getProjectRoot();
        const packageJsonPath = path.join(projectRoot, "package.json");
        const fs = await import("fs/promises");
        Logger.info("🔧 [ensureWorkspacesConfigured] Starting workspace configuration check", {
            projectRoot,
            packageJsonPath,
            operation: "workspace_configuration_method"
        });
        try {
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent);
            // Check if workspaces are already configured
            if (packageJson.workspaces && Array.isArray(packageJson.workspaces) && packageJson.workspaces.length > 0) {
                Logger.debug("✅ Workspaces already configured in root package.json", {
                    workspaces: packageJson.workspaces
                });
                return;
            }
            // Check if monorepo structure exists
            const appsDir = path.join(projectRoot, 'apps');
            const packagesDir = path.join(projectRoot, 'packages');
            let hasApps = false;
            let hasPackages = false;
            try {
                const appsStats = await fs.stat(appsDir);
                hasApps = appsStats.isDirectory();
            }
            catch {
                // apps directory doesn't exist
            }
            try {
                const packagesStats = await fs.stat(packagesDir);
                hasPackages = packagesStats.isDirectory();
            }
            catch {
                // packages directory doesn't exist
            }
            if (!hasApps && !hasPackages) {
                Logger.debug("No monorepo structure detected, skipping workspace configuration");
                return;
            }
            // Add workspaces property
            const workspaces = [];
            if (hasApps) {
                workspaces.push('apps/*');
            }
            if (hasPackages) {
                workspaces.push('packages/*');
            }
            packageJson.workspaces = workspaces;
            Logger.info("📦 Adding workspaces configuration to root package.json", {
                workspaces
            });
            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
            Logger.info("✅ Workspaces configured successfully", {
                workspaces
            });
        }
        catch (error) {
            Logger.error("❌ Failed to ensure workspaces configuration", {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Install dependencies (monorepo-aware)
     * V2 COMPLIANCE: Detects package manager from genome or lock files
     */
    async installDependencies(genome) {
        const projectRoot = this.pathHandler.getProjectRoot();
        const packageJsonPath = path.join(projectRoot, "package.json");
        Logger.info("📦 [installDependencies] Starting dependency installation", {
            projectRoot,
            packageJsonPath,
            operation: "dependency_installation_method"
        });
        // Check if package.json exists
        const fs = await import("fs/promises");
        try {
            await fs.access(packageJsonPath);
            Logger.debug("✅ [installDependencies] package.json found", { packageJsonPath });
        }
        catch {
            Logger.warn("⚠️  [installDependencies] No package.json found, skipping dependency installation", {
                packageJsonPath,
                operation: "dependency_installation_skip"
            });
            return;
        }
        // Detect package manager from genome, lock files, or pnpm-workspace.yaml
        const packageManager = await this.detectPackageManager(genome, projectRoot);
        Logger.info(`📦 Installing dependencies with ${packageManager}...`, {
            packageManager,
            operation: "dependency_installation"
        });
        // Run install command with detected package manager
        const { execSync } = await import('child_process');
        const installCommand = this.getInstallCommand(packageManager);
        try {
            execSync(installCommand, {
                cwd: projectRoot,
                stdio: 'inherit'
            });
            Logger.info(`✅ Dependencies installed successfully with ${packageManager}`);
        }
        catch (error) {
            throw new Error(`Failed to install dependencies with ${packageManager}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Detect package manager from genome, lock files, or pnpm-workspace.yaml
     * V2 COMPLIANCE: Checks genome monorepo config first, then lock files
     */
    async detectPackageManager(genome, projectRoot) {
        // Priority 1: Check genome monorepo config
        if (genome) {
            const monorepoConfig = getProjectMonorepo(genome);
            if (monorepoConfig && typeof monorepoConfig === 'object') {
                // Check for explicit packageManager in monorepo config
                if ('packageManager' in monorepoConfig) {
                    const pm = monorepoConfig.packageManager;
                    if (pm === 'pnpm' || pm === 'yarn' || pm === 'npm') {
                        Logger.debug(`📦 Detected package manager from genome: ${pm}`, {
                            source: 'genome_monorepo_config',
                            operation: 'package_manager_detection'
                        });
                        return pm;
                    }
                }
                // Check turborepo module parameters
                if (genome.modules) {
                    const turborepoModule = genome.modules.find((m) => m.id === 'monorepo/turborepo' || m.id === 'adapters/monorepo/turborepo');
                    if (turborepoModule && 'parameters' in turborepoModule && turborepoModule.parameters) {
                        const pm = turborepoModule.parameters.packageManager;
                        if (pm === 'pnpm' || pm === 'yarn' || pm === 'npm') {
                            Logger.debug(`📦 Detected package manager from turborepo module: ${pm}`, {
                                source: 'turborepo_module',
                                operation: 'package_manager_detection'
                            });
                            return pm;
                        }
                    }
                }
            }
        }
        // Priority 2: Check for lock files in project root
        if (projectRoot) {
            const fs = await import('fs/promises');
            const pathModule = await import('path');
            try {
                await fs.access(pathModule.join(projectRoot, 'pnpm-lock.yaml'));
                Logger.debug(`📦 Detected package manager from lock file: pnpm`, {
                    source: 'pnpm-lock.yaml',
                    operation: 'package_manager_detection'
                });
                return 'pnpm';
            }
            catch {
                // pnpm-lock.yaml doesn't exist
            }
            try {
                await fs.access(pathModule.join(projectRoot, 'yarn.lock'));
                Logger.debug(`📦 Detected package manager from lock file: yarn`, {
                    source: 'yarn.lock',
                    operation: 'package_manager_detection'
                });
                return 'yarn';
            }
            catch {
                // yarn.lock doesn't exist
            }
            try {
                await fs.access(pathModule.join(projectRoot, 'package-lock.json'));
                Logger.debug(`📦 Detected package manager from lock file: npm`, {
                    source: 'package-lock.json',
                    operation: 'package_manager_detection'
                });
                return 'npm';
            }
            catch {
                // package-lock.json doesn't exist
            }
            // Check for pnpm-workspace.yaml (indicates pnpm even without lock file)
            try {
                await fs.access(pathModule.join(projectRoot, 'pnpm-workspace.yaml'));
                Logger.debug(`📦 Detected package manager from pnpm-workspace.yaml: pnpm`, {
                    source: 'pnpm-workspace.yaml',
                    operation: 'package_manager_detection'
                });
                return 'pnpm';
            }
            catch {
                // pnpm-workspace.yaml doesn't exist
            }
        }
        // Priority 3: Default to pnpm for V2 (supports workspace:* protocol)
        Logger.debug(`📦 Using default package manager: pnpm`, {
            source: 'default',
            operation: 'package_manager_detection'
        });
        return 'pnpm';
    }
    /**
     * Get install command for package manager
     */
    getInstallCommand(packageManager) {
        switch (packageManager) {
            case 'pnpm':
                return 'pnpm install';
            case 'yarn':
                return 'yarn install';
            case 'npm':
                return 'npm install';
            default:
                return 'pnpm install';
        }
    }
    /**
     * Validate recipe structure
     */
    validateRecipe(genome) {
        const errors = [];
        if (!genome) {
            errors.push("Genome is null or undefined");
            return { valid: false, errors };
        }
        if (!genome.project) {
            errors.push("Genome must have a project section");
        }
        else {
            if (!genome.project.name) {
                errors.push("Project must have a name");
            }
            if (!genome.project.path) {
                errors.push("Project must have a path");
            }
        }
        // Check if genome is capability-driven
        const isCapabilityDriven = 'capabilities' in genome &&
            typeof genome.capabilities === 'object' &&
            genome.capabilities !== null &&
            Object.keys(genome.capabilities).length > 0;
        if (!isCapabilityDriven) {
            // Traditional genome validation
            // ResolvedGenome guarantees modules is always an array
            if (genome.modules.length === 0) {
                errors.push("Genome must have at least one module");
            }
        }
        else {
            // Capability-driven genome validation
            // ResolvedGenome guarantees modules is always an array
            // No need to check or initialize
            // Validate capabilities
            if (!genome.capabilities || Object.keys(genome.capabilities).length === 0) {
                errors.push("Capability-driven genome must have at least one capability");
            }
        }
        return { valid: errors.length === 0, errors };
    }
    /**
     * Classify modules by type based on ID convention
     * - Frameworks: category === 'framework'
     * - Connectors: id starts with 'connectors/'
     * - Adapters: everything else
     */
    /**
     * Classify modules by type (delegates to ModuleClassifier)
     */
    classifyModulesByType(modules) {
        const adapters = [];
        const connectors = [];
        const features = [];
        for (const m of modules) {
            if (m.id.startsWith('connectors/'))
                connectors.push(m);
            else if (m.id.startsWith('features/'))
                features.push(m);
            else
                adapters.push(m);
        }
        return { frameworks: [], adapters, connectors, features };
    }
    /**
     * Get module type from ID (delegates to ModuleClassifier)
     */
    getModuleType(moduleId) {
        if (moduleId.startsWith('connectors/'))
            return 'connector';
        if (moduleId.startsWith('features/'))
            return 'feature';
        if (moduleId.startsWith('framework/'))
            return 'framework';
        return 'adapter';
    }
    /**
     * NEW: Check if module supports Constitutional Architecture
     */
    isConstitutionalModule(adapter) {
        return (adapter &&
            adapter.config &&
            adapter.config.parameters &&
            adapter.config.parameters.features &&
            adapter.config.internal_structure);
    }
    /**
     * Load recipe books from genome marketplaces
     */
    async loadRecipeBooksFromGenome(genome, executionOptions) {
        const recipeBooks = new Map();
        // Try to load from marketplace adapter if available
        if (executionOptions?.marketplaceAdapter?.loadRecipeBook) {
            try {
                const recipeBook = await executionOptions.marketplaceAdapter.loadRecipeBook();
                // Use marketplace name from options or default to 'official'
                const marketplaceName = executionOptions.marketplaceInfo?.name || 'official';
                recipeBooks.set(marketplaceName, recipeBook);
                Logger.debug(`✅ Loaded recipe book from marketplace adapter: ${marketplaceName}`, {
                    operation: 'recipe_book_loading',
                    marketplaceName
                });
            }
            catch (error) {
                Logger.warn(`⚠️ Failed to load recipe book from marketplace adapter: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    operation: 'recipe_book_loading',
                    error: error instanceof Error ? error.stack : String(error)
                });
            }
        }
        return recipeBooks;
    }
    /**
     * Merge module configuration with user overrides (delegates to ModuleConfigurationService)
     */
    mergeModuleConfiguration(module, adapter, genome) {
        return this.moduleConfigService.mergeModuleConfiguration(module, adapter, genome);
    }
    /**
     * Type guard for platforms object
     */
    isValidPlatforms(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'web' in value &&
            'mobile' in value &&
            typeof value.web === 'boolean' &&
            typeof value.mobile === 'boolean');
    }
}
//# sourceMappingURL=orchestrator-agent.js.map
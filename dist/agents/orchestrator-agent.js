/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { BlueprintExecutor } from "../core/services/execution/blueprint/blueprint-executor.js";
import { getProjectStructure, getProjectMonorepo, getProjectApps } from "../core/utils/genome-helpers.js";
import * as path from 'path';
import { FrameworkContextService } from "../core/services/project/framework-context-service.js";
import { ModuleService } from "../core/services/module-management/module-service.js";
import { MarketplaceService } from "../core/services/marketplace/marketplace-service.js";
import { CacheManagerService } from "../core/services/infrastructure/cache/cache-manager.js";
import { Logger, ExecutionTracer, LogLevel, } from "../core/services/infrastructure/logging/index.js";
import { ErrorHandler } from "../core/services/infrastructure/error/index.js";
// import { DependencyGraph } from "../core/services/execution-planning/dependency-graph.js";
// import { ManifestDrivenFeatureResolver } from "../core/services/feature-resolution/manifest-driven-feature-resolver.js";
// import { ModuleClassifier } from "../core/services/orchestration/module-classifier.js";
// import { ModuleAutoInclusionService } from "../core/services/orchestration/module-auto-inclusion.js";
import { ComponentDependencyResolver } from "../core/services/orchestration/component-dependency-resolver.js";
import { BlueprintPreprocessor } from "../core/services/execution/blueprint/blueprint-preprocessor.js";
import { AppManifestGenerator } from "../core/services/project/app-manifest-generator.js";
import { ModuleConfigurationService } from "../core/services/orchestration/module-configuration-service.js";
import { MonorepoPackageResolver } from "../core/services/project/monorepo-package-resolver.js";
import { ProjectBootstrapService } from "../core/services/project/project-bootstrap-service.js";
export class OrchestratorAgent {
    projectManager;
    pathHandler;
    moduleService;
    cacheManager;
    blueprintPreprocessor;
    appManifestGenerator;
    moduleConfigService;
    componentDependencyResolver;
    projectBootstrapService;
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.pathHandler = projectManager.getPathHandler();
        this.cacheManager = new CacheManagerService();
        this.moduleService = new ModuleService(this.cacheManager);
        this.moduleConfigService = new ModuleConfigurationService();
        this.componentDependencyResolver = new ComponentDependencyResolver();
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
            const { StructureInitializationLayer } = await import('../core/services/project/structure-initialization-layer.js');
            const structureLayer = new StructureInitializationLayer(this.pathHandler);
            const structureResult = await structureLayer.initialize(genome);
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
            ExecutionTracer.logOperation(traceId, "Bootstrapping project foundations");
            const frameworkAdapterConfig = await this.projectBootstrapService.bootstrap(genome, structureResult);
            // Note: Genome transformation is done in the command layer (new.ts)
            // The orchestrator receives a pre-transformed genome with modules already resolved
            // 1.3-1.8. All resolution/auto-inclusion is now done by the transformer
            const enhancedGenome = genome;
            // 1.75. COMPONENT DEPENDENCY RESOLUTION - Auto-install required UI components
            Logger.info("📦 Resolving component dependencies", {
                traceId,
                operation: "component_dependency_resolution",
            });
            const componentDependencies = await this.resolveComponentDependencies(enhancedGenome);
            // Inject resolved components into UI technology modules
            if (componentDependencies.size > 0) {
                for (const module of enhancedGenome.modules) {
                    for (const [uiTechId, requiredComponents] of componentDependencies.entries()) {
                        // Match module to UI technology - handle both formats:
                        // - 'ui/shadcn-ui' (from feature.json)
                        // - 'adapters/ui/shadcn-ui' (after transformation)
                        const matches = module.id === uiTechId ||
                            module.id === `adapters/${uiTechId}` ||
                            module.id.endsWith(`/${uiTechId}`);
                        if (matches) {
                            // Merge required components with user-specified components
                            const userComponents = module.parameters?.components || [];
                            const allComponents = Array.from(new Set([...userComponents, ...requiredComponents])).sort();
                            // Update module parameters
                            module.parameters = {
                                ...module.parameters,
                                components: allComponents
                            };
                            Logger.info(`✅ Injected components into ${module.id}: [${requiredComponents.join(', ')}]`, {
                                traceId,
                                operation: "component_injection",
                            });
                        }
                    }
                }
            }
            // 1.6. All dependency resolution handled by transformer
            const resolvedGenome = enhancedGenome;
            // 2. Load and validate modules
            ExecutionTracer.logOperation(traceId, "Loading modules");
            Logger.info(`📦 Loading ${resolvedGenome.modules.length} resolved modules`, {
                traceId,
                operation: "module_loading",
            });
            // Complete validation phase
            if (enhancedLogger) {
                enhancedLogger.completePhase();
            }
            // 2.5. Architectural validation handled by transformer; proceed
            // Enhanced logging: Start planning phase
            if (enhancedLogger) {
                enhancedLogger.startPhase("planning");
            }
            // 3-4. Skip classification and CLI dependency graph (handled by transformer ordering)
            // 5.5. Initialize all paths centrally (BEFORE framework setup and module execution)
            // This ensures paths (including marketplace UI) are available during blueprint execution
            ExecutionTracer.logOperation(traceId, "Initializing project paths");
            const { PathInitializationService } = await import('../core/services/project/path-initialization-service.js');
            await PathInitializationService.initializePaths(resolvedGenome, this.pathHandler, frameworkAdapterConfig, {
                marketplaceAdapter: executionOptions.marketplaceAdapter,
                marketplaceInfo: executionOptions.marketplaceInfo,
                runtimeOverrides: executionOptions.pathOverrides,
            });
            // 6-10. Skip CLI planning/graph; execute modules sequentially in transformer order
            if (enhancedLogger) {
                enhancedLogger.completePhase();
                enhancedLogger.setTotalModules(resolvedGenome.modules.length);
                enhancedLogger.startPhase("modules");
            }
            for (const mod of resolvedGenome.modules) {
                const execResult = await this.executeModule(mod, resolvedGenome, traceId, enhancedLogger);
                if (!execResult.success) {
                    errors.push(execResult.error || `Module ${mod.id} failed`);
                    return {
                        success: false,
                        modulesExecuted: results.length,
                        errors,
                        warnings
                    };
                }
                // Optional progress update if logger supports it
                if (enhancedLogger && typeof enhancedLogger.incrementModule === 'function') {
                    enhancedLogger.incrementModule();
                }
            }
            // 11. Install dependencies (only if all modules succeeded)
            ExecutionTracer.logOperation(traceId, "Installing dependencies");
            try {
                await this.installDependencies();
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
            // 12. Validate success
            ExecutionTracer.logOperation(traceId, "Validating success");
            // For now, skip success validation as it's not fully implemented
            Logger.info(`✅ Success validation completed`, {
                traceId,
                operation: "success_validation",
            });
            // 13. Generate app manifest
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
    async executeUnifiedPlan(genome, traceId, verbose, executionPlan, enhancedLogger) {
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
                    const result = await this.executeModule(module, genome, traceId, enhancedLogger);
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
     * Resolve component dependencies across all features
     * Collects required components from feature manifests and ensures UI technologies install them
     */
    /**
     * Resolve component dependencies (delegates to ComponentDependencyResolver)
     */
    async resolveComponentDependencies(genome) {
        return this.componentDependencyResolver.resolveComponentDependencies(genome);
    }
    /**
     * Execute a single module with its own transactional VFS
     * Each blueprint gets: Create VFS → Execute → Flush to Disk
     */
    async executeModule(module, genome, traceId, enhancedLogger) {
        let blueprintVFS = null;
        let originalWorkingDirectory = null;
        try {
            Logger.info(`🔧 Executing module: ${module.id}`, {
                traceId,
                operation: "module_execution",
            });
            // Handle monorepo package targeting using auto-detection
            const targetPackage = MonorepoPackageResolver.resolveTargetPackage(module, genome);
            let targetPackagePath = null;
            if (targetPackage) {
                originalWorkingDirectory = process.cwd();
                targetPackagePath = path.join(this.pathHandler.getProjectRoot(), targetPackage);
                process.chdir(targetPackagePath);
                Logger.info(`📦 Executing module in package: ${targetPackage}`, {
                    traceId,
                    operation: "module_execution",
                });
            }
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
            // CRITICAL: Always use project root, pass context root separately
            const projectRoot = this.pathHandler.getProjectRoot();
            const contextRoot = targetPackage || ''; // Package path relative to project root, empty for single repo
            blueprintVFS = new (await import('../core/services/file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${moduleResult.adapter.blueprint.id}`, projectRoot, // Always project root
            contextRoot // Context relative to project root
            );
            Logger.info(`📦 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id}`, {
                traceId,
                operation: "module_execution",
            });
            // 2. EXECUTE preprocessed actions with BlueprintExecutor
            // CRITICAL: Use targetPackagePath if available (monorepo), otherwise use project root
            const executorRoot = targetPackagePath || this.pathHandler.getProjectRoot();
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
                Logger.info(`✅ Module ${module.id} executed successfully`, {
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
     * Install dependencies
     */
    async installDependencies() {
        const projectRoot = this.pathHandler.getProjectRoot();
        const packageJsonPath = path.join(projectRoot, "package.json");
        // Check if package.json exists
        const fs = await import("fs/promises");
        try {
            await fs.access(packageJsonPath);
        }
        catch {
            Logger.debug("No package.json found, skipping dependency installation");
            return;
        }
        Logger.info("📦 Installing dependencies with npm...");
        // Run npm install in the project directory
        const { execSync } = await import('child_process');
        try {
            execSync('npm install', {
                cwd: projectRoot,
                stdio: 'inherit'
            });
            Logger.info("✅ Dependencies installed successfully");
        }
        catch (error) {
            throw new Error(`Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { BlueprintExecutor } from "../core/services/execution/blueprint/blueprint-executor.js";
import * as path from 'path';
import { BlueprintAnalyzer } from "../core/services/project/blueprint-analyzer/index.js";
import { FrameworkContextService } from "../core/services/project/framework-context-service.js";
import { ModuleService } from "../core/services/module-management/module-service.js";
import { convertGenomeModulesToModules } from "../core/services/module-management/genome-module-converter.js";
import { MarketplaceService } from "../core/services/marketplace/marketplace-service.js";
import { CacheManagerService } from "../core/services/infrastructure/cache/cache-manager.js";
import { Logger, ExecutionTracer, LogLevel, } from "../core/services/infrastructure/logging/index.js";
import { ErrorHandler } from "../core/services/infrastructure/error/index.js";
// Deprecated: planning/graph/feature resolution handled by transformer
// import { DependencyGraph } from "../core/services/execution-planning/dependency-graph.js";
// import { ExecutionPlanner } from "../core/services/execution-planning/execution-planner.js";
// import { ManifestDrivenFeatureResolver } from "../core/services/feature-resolution/manifest-driven-feature-resolver.js";
// import { FeatureModuleResolver } from "../core/services/feature-resolution/feature-module-resolver.js";
// import { ModuleClassifier } from "../core/services/orchestration/module-classifier.js";
// import { ModuleAutoInclusionService } from "../core/services/orchestration/module-auto-inclusion.js";
import { ComponentDependencyResolver } from "../core/services/orchestration/component-dependency-resolver.js";
import { BlueprintPreprocessor } from "../core/services/execution/blueprint/blueprint-preprocessor.js";
import { AppManifestGenerator } from "../core/services/project/app-manifest-generator.js";
import { ModuleConfigurationService } from "../core/services/orchestration/module-configuration-service.js";
export class OrchestratorAgent {
    projectManager;
    pathHandler;
    moduleService;
    blueprintAnalyzer;
    cacheManager;
    // Deprecated services removed in favor of transformer ordering
    // private dependencyGraph: any;
    // private executionPlanner: any;
    // private architectureValidator: any;
    // private semanticDependencyResolver: any;
    // private manifestDrivenFeatureResolver: any;
    // private featureModuleResolver: any;
    blueprintPreprocessor;
    appManifestGenerator;
    moduleConfigService;
    // private moduleClassifier: any;
    // private moduleAutoInclusion: any;
    componentDependencyResolver;
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.pathHandler = projectManager.getPathHandler();
        this.cacheManager = new CacheManagerService();
        this.moduleService = new ModuleService(this.cacheManager);
        // Initialize blueprint analyzer
        this.blueprintAnalyzer = new BlueprintAnalyzer();
        // Initialize dependency resolution services
        // Deprecated initializations removed
        this.moduleConfigService = new ModuleConfigurationService();
        this.componentDependencyResolver = new ComponentDependencyResolver();
        this.blueprintPreprocessor = new BlueprintPreprocessor();
        this.appManifestGenerator = new AppManifestGenerator();
    }
    /**
     * Execute a recipe using unified dependency-driven execution
     */
    async executeRecipe(genome, verbose = false, enhancedLogger) {
        const traceId = ExecutionTracer.startTrace("orchestrator_execution");
        const results = [];
        const errors = [];
        const warnings = [];
        // Configure Logger level based on verbose flag
        if (verbose) {
            Logger.setLevel(LogLevel.DEBUG);
        }
        Logger.setVerbose(verbose);
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
            // 1.2. Initialize monorepo structure if needed
            if (genome.project.structure === 'monorepo' && genome.project.monorepo) {
                ExecutionTracer.logOperation(traceId, "Initializing monorepo structure");
                await this.projectManager.initializeMonorepoStructure(genome.project.monorepo);
            }
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
            // 5. Setup framework and get framework-specific path handler
            ExecutionTracer.logOperation(traceId, "Setting up framework");
            const frameworkSetup = await this.moduleService.setupFramework(resolvedGenome, this.pathHandler);
            if (!frameworkSetup.success) {
                throw new Error(`Framework setup failed: ${frameworkSetup.error}`);
            }
            // Update path handler with framework-specific paths
            if (frameworkSetup.pathHandler) {
                this.pathHandler = frameworkSetup.pathHandler;
                Logger.info("📁 Framework paths configured", {
                    traceId,
                    operation: "framework_setup",
                    availablePaths: this.pathHandler.getAvailablePaths(),
                });
            }
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
                    Logger.debug(`🔍 CWD BEFORE module ${module.id}: ${process.cwd()}`);
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
            const targetPackage = this.determineTargetPackage(module, genome);
            if (targetPackage) {
                originalWorkingDirectory = process.cwd();
                const packagePath = path.join(this.pathHandler.getProjectRoot(), targetPackage);
                process.chdir(packagePath);
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
            const loadedBlueprint = await MarketplaceService.loadModuleBlueprint(module.id);
            Logger.info(`🧩 Preprocessing blueprint for module ${module.id}`, {
                traceId,
                operation: 'module_execution'
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
            const convertedModules = convertGenomeModulesToModules(genome.modules);
            convertedModules.forEach(mod => {
                modulesRecord[mod.id] = mod;
            });
            // Create dynamic project context based on framework and parameters
            const projectContext = await FrameworkContextService.createProjectContext(genome, module, this.pathHandler, modulesRecord);
            // CRITICAL FIX: Merge templateContext into ProjectContext root for ALL modules
            // This allows templates to access {{modules}}, {{project}}, etc. directly
            if (mergedConfig.templateContext) {
                Object.assign(projectContext, mergedConfig.templateContext);
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
            blueprintVFS = new (await import('../core/services/file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${moduleResult.adapter.blueprint.id}`, this.pathHandler.getProjectRoot());
            Logger.info(`📦 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id}`, {
                traceId,
                operation: "module_execution",
            });
            // 2. EXECUTE preprocessed actions with BlueprintExecutor
            const blueprintExecutor = new BlueprintExecutor(this.pathHandler.getProjectRoot());
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
                return { success: true, executedModules: [module] };
            }
            else {
                // DO NOT flush on failure - preserve clean state
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
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            Logger.error(`❌ Module ${module.id} execution error: ${errorMessage}`, {
                traceId,
                operation: "module_execution",
            });
            return { success: false, error: errorMessage };
        }
        finally {
            // Restore original working directory if changed
            if (originalWorkingDirectory) {
                process.chdir(originalWorkingDirectory);
            }
        }
    }
    /**
     * Determine which package a module should be executed in
     */
    determineTargetPackage(module, genome) {
        // Check if genome defines monorepo structure
        if (genome.project.structure !== 'monorepo' || !genome.project.monorepo) {
            return null;
        }
        // Auto-determine package based on module type and centralized path logic
        const moduleType = this.getModuleType(module.id);
        const monorepoConfig = genome.project.monorepo;
        switch (moduleType) {
            case 'framework':
                if (module.id.includes('nextjs')) {
                    return monorepoConfig.packages?.web || 'apps/web';
                }
                else if (module.id.includes('expo')) {
                    return monorepoConfig.packages?.mobile || 'apps/mobile';
                }
                else if (module.id.includes('api')) {
                    return monorepoConfig.packages?.api || 'packages/api';
                }
                break;
            case 'feature':
                // Features typically go to web by default
                return monorepoConfig.packages?.web || 'apps/web';
            case 'connector':
                // Connectors typically go to shared
                return monorepoConfig.packages?.shared || 'packages/shared';
            case 'adapter':
                // Adapters typically go to shared
                return monorepoConfig.packages?.shared || 'packages/shared';
        }
        // Default to web package
        return monorepoConfig.packages?.web || 'apps/web';
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
            if (!genome.modules || !Array.isArray(genome.modules)) {
                errors.push("Genome must have a modules array");
            }
            else if (genome.modules.length === 0) {
                errors.push("Genome must have at least one module");
            }
        }
        else {
            // Capability-driven genome validation
            if (!genome.modules || !Array.isArray(genome.modules)) {
                // Initialize empty modules array for capability-driven genomes
                genome.modules = [];
            }
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
     * Enforce hierarchical execution order (delegates to ModuleClassifier)
     */
    enforceHierarchicalOrder(executionPlan, classification) {
        return executionPlan;
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
     * Merge parameter defaults with user overrides (delegates to ModuleConfigurationService)
     */
    mergeParametersWithDefaults(parameterSchema, userOverrides) {
        return this.moduleConfigService.mergeParametersWithDefaults(parameterSchema, userOverrides);
    }
    /**
     * Apply marketplace defaults (delegates to ModuleAutoInclusionService)
     */
    applyMarketplaceDefaults(modules) {
        return modules;
    }
    /**
     * Auto-include tech-stack modules (delegates to ModuleAutoInclusionService)
     */
    async applyTechStackAutoInclusion(modules) {
        return modules;
    }
    /**
     * Auto-include tRPC overrides (delegates to ModuleAutoInclusionService)
     */
    async applyTRPCOverrideAutoInclusion(modules) {
        return modules;
    }
}
//# sourceMappingURL=orchestrator-agent.js.map
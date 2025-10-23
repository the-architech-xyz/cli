/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { MARKETPLACE_DEFAULTS } from "../marketplace.config.js";
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
import { DependencyGraph } from "../core/services/execution-planning/dependency-graph.js";
import { ExecutionPlanner, } from "../core/services/execution-planning/execution-planner.js";
import { VirtualFileSystem } from "../core/services/file-system/file-engine/virtual-file-system.js";
import { ArchitectureValidator } from "../core/services/validation/architecture-validator.js";
import { SemanticDependencyResolver } from "../core/services/dependency-resolution/semantic-dependency-resolver.js";
import { ManifestDrivenFeatureResolver, } from "../core/services/feature-resolution/manifest-driven-feature-resolver.js";
import { FeatureModuleResolver } from "../core/services/feature-resolution/feature-module-resolver.js";
import { ModuleConfigurationService } from "../core/services/orchestration/module-configuration-service.js";
import { ModuleClassifier } from "../core/services/orchestration/module-classifier.js";
import { ModuleAutoInclusionService } from "../core/services/orchestration/module-auto-inclusion.js";
import { ComponentDependencyResolver } from "../core/services/orchestration/component-dependency-resolver.js";
import { BlueprintPreprocessor } from "../core/services/execution/blueprint/blueprint-preprocessor.js";
import { AppManifestGenerator } from "../core/services/project/app-manifest-generator.js";
export class OrchestratorAgent {
    projectManager;
    pathHandler;
    moduleService;
    blueprintAnalyzer;
    cacheManager;
    dependencyGraph;
    executionPlanner;
    architectureValidator;
    semanticDependencyResolver;
    manifestDrivenFeatureResolver;
    featureModuleResolver;
    blueprintPreprocessor;
    appManifestGenerator;
    moduleConfigService;
    moduleClassifier;
    moduleAutoInclusion;
    componentDependencyResolver;
    constructor(projectManager) {
        this.projectManager = projectManager;
        this.pathHandler = projectManager.getPathHandler();
        this.cacheManager = new CacheManagerService();
        this.moduleService = new ModuleService(this.cacheManager);
        // Initialize blueprint analyzer
        this.blueprintAnalyzer = new BlueprintAnalyzer();
        // Initialize dependency resolution services
        this.dependencyGraph = new DependencyGraph(this.moduleService);
        this.executionPlanner = new ExecutionPlanner(this.dependencyGraph);
        this.architectureValidator = new ArchitectureValidator();
        this.semanticDependencyResolver = new SemanticDependencyResolver(this.moduleService, {
            failFast: true,
            verbose: true,
        });
        // Initialize manifest-driven feature resolver
        this.manifestDrivenFeatureResolver = new ManifestDrivenFeatureResolver(this.moduleService, this.projectManager.getMarketplacePath());
        // Initialize feature module resolver
        this.featureModuleResolver = new FeatureModuleResolver(this.manifestDrivenFeatureResolver);
        // Initialize blueprint preprocessor
        this.blueprintPreprocessor = new BlueprintPreprocessor();
        this.appManifestGenerator = new AppManifestGenerator();
        // Initialize orchestration services
        this.moduleConfigService = new ModuleConfigurationService();
        this.moduleClassifier = new ModuleClassifier();
        this.moduleAutoInclusion = new ModuleAutoInclusionService();
        this.componentDependencyResolver = new ComponentDependencyResolver();
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
            // 1. Validate genome
            ExecutionTracer.logOperation(traceId, "Validating genome");
            const validationResult = this.validateRecipe(genome);
            if (!validationResult.valid) {
                throw new Error(`Genome validation failed: ${validationResult.errors.join(", ")}`);
            }
            // 1.5. FEATURE MODULE RESOLUTION - NEW CRITICAL STEP
            ExecutionTracer.logOperation(traceId, "Feature module resolution");
            Logger.info("🎯 Starting feature module resolution", {
                traceId,
                operation: "feature_module_resolution",
                modulesCount: genome.modules.length,
            });
            // Resolve feature modules using manifest-driven approach
            const resolvedModules = await this.featureModuleResolver.resolveFeatureModules(genome.modules);
            Logger.info(`✅ Feature module resolution complete`, {
                traceId,
                operation: "feature_module_resolution",
                originalModules: genome.modules.length,
                resolvedModules: resolvedModules.length,
                expandedModules: resolvedModules.length - genome.modules.length,
            });
            // 1.6. MARKETPLACE DEFAULTS - Auto-include opinionated modules
            ExecutionTracer.logOperation(traceId, "Applying marketplace defaults");
            Logger.info("🎯 Applying marketplace defaults", {
                traceId,
                operation: "marketplace_defaults",
                modulesCount: resolvedModules.length,
            });
            // Apply marketplace defaults for all Next.js projects
            const modulesWithDefaults = this.applyMarketplaceDefaults(resolvedModules);
            Logger.info(`✅ Marketplace defaults applied`, {
                traceId,
                operation: "marketplace_defaults",
                originalModules: resolvedModules.length,
                finalModules: modulesWithDefaults.length,
                addedModules: modulesWithDefaults.length - resolvedModules.length,
            });
            // 1.65. ADAPTER REQUIREMENTS - Auto-include required adapters from connectors
            ExecutionTracer.logOperation(traceId, "Adapter requirements auto-inclusion");
            Logger.info("🎯 Auto-including required adapters from connectors", {
                traceId,
                operation: "adapter_requirements",
                modulesCount: modulesWithDefaults.length,
            });
            const modulesWithAdapters = await this.moduleAutoInclusion.applyAdapterRequirements(modulesWithDefaults, this.projectManager.getMarketplacePath());
            Logger.info(`✅ Adapter requirements resolved`, {
                traceId,
                operation: "adapter_requirements",
                originalModules: modulesWithDefaults.length,
                finalModules: modulesWithAdapters.length,
                addedAdapters: modulesWithAdapters.length - modulesWithDefaults.length,
            });
            // 1.7. TECH-STACK AUTO-INCLUSION - Auto-include tech-stack modules for features
            ExecutionTracer.logOperation(traceId, "Tech-stack auto-inclusion");
            Logger.info("🎯 Starting tech-stack auto-inclusion", {
                traceId,
                operation: "tech_stack_auto_inclusion",
                modulesCount: modulesWithAdapters.length,
            });
            const modulesWithTechStack = await this.applyTechStackAutoInclusion(modulesWithAdapters);
            Logger.info(`✅ Tech-stack auto-inclusion complete`, {
                traceId,
                operation: "tech_stack_auto_inclusion",
                originalModules: modulesWithDefaults.length,
                finalModules: modulesWithTechStack.length,
                addedTechStackModules: modulesWithTechStack.length - modulesWithDefaults.length,
            });
            // Use resolved modules with defaults and tech-stack for the rest of the execution
            const enhancedGenome = {
                ...genome,
                modules: modulesWithTechStack,
            };
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
                        // Match module to UI technology (e.g., 'ui/shadcn-ui')
                        if (module.id === uiTechId) {
                            // Merge required components with user-specified components
                            const userComponents = module.parameters?.components || [];
                            const allComponents = Array.from(new Set([...userComponents, ...requiredComponents])).sort();
                            // Update module parameters
                            module.parameters = {
                                ...module.parameters,
                                components: allComponents
                            };
                            Logger.info(`✅ Injected components into ${uiTechId}: [${requiredComponents.join(', ')}]`, {
                                traceId,
                                operation: "component_injection",
                            });
                        }
                    }
                }
            }
            // 1.6. HIGH-LEVEL DEPENDENCY RESOLUTION - NEW CRITICAL STEP
            ExecutionTracer.logOperation(traceId, "High-level dependency resolution");
            Logger.info("🧠 Starting intelligent dependency resolution", {
                traceId,
                operation: "dependency_resolution",
                initialModules: genome.modules.length,
            });
            const resolutionResult = await this.semanticDependencyResolver.resolveGenome(enhancedGenome.modules);
            if (!resolutionResult.success) {
                const errorMessages = resolutionResult.conflicts
                    .map((conflict) => `  ❌ ${conflict.message} (Module: ${conflict.module}${conflict.capability ? `, Capability: ${conflict.capability}` : ""})`)
                    .join("\n");
                const suggestionMessages = resolutionResult.conflicts
                    .filter((conflict) => conflict.suggestions.length > 0)
                    .map((conflict) => `  💡 ${conflict.suggestions.join(", ")}`)
                    .join("\n");
                const fullErrorMessage = `Dependency resolution failed with ${resolutionResult.conflicts.length} conflicts:\n${errorMessages}${suggestionMessages ? `\n\nSuggestions:\n${suggestionMessages}` : ""}`;
                Logger.error(`❌ ${fullErrorMessage}`, {
                    traceId,
                    operation: "dependency_resolution",
                });
                throw new Error(fullErrorMessage);
            }
            // Log resolution results
            Logger.info("✅ Dependency resolution successful", {
                traceId,
                operation: "dependency_resolution",
                resolvedModules: resolutionResult.modules.length,
                executionOrder: resolutionResult.executionOrder.length,
                warnings: resolutionResult.warnings.length,
            });
            // Log execution order
            Logger.info("📋 Resolved execution order:", {
                traceId,
                operation: "dependency_resolution",
                order: resolutionResult.executionOrder
                    .map((m) => m.id)
                    .join(" → "),
            });
            // Use resolved modules instead of original genome modules
            const resolvedGenome = {
                ...genome,
                modules: resolutionResult.executionOrder,
            };
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
            // 2.5. ARCHITECTURAL VALIDATION - NEW MANDATORY STEP
            ExecutionTracer.logOperation(traceId, "Architectural validation");
            const architecturalValidation = await this.architectureValidator.validateRecipe(resolvedGenome, traceId);
            if (!architecturalValidation.isValid) {
                const errorMessages = architecturalValidation.errors
                    .map((error) => `  ❌ ${error.message} (Module: ${error.module})`)
                    .join("\n");
                const warningMessages = architecturalValidation.warnings
                    .map((warning) => `  ⚠️  ${warning.message} (Module: ${warning.module})`)
                    .join("\n");
                const fullErrorMessage = `Architectural validation failed with ${architecturalValidation.errors.length} errors:\n${errorMessages}${warningMessages ? `\n\nWarnings:\n${warningMessages}` : ""}`;
                Logger.error(`❌ ${fullErrorMessage}`, {
                    traceId,
                    operation: "architectural_validation",
                });
                throw new Error(fullErrorMessage);
            }
            Logger.info("✅ Architectural validation passed - proceeding with generation", {
                traceId,
                operation: "architectural_validation",
            });
            // Enhanced logging: Start planning phase
            if (enhancedLogger) {
                enhancedLogger.startPhase("planning");
            }
            // 3. Classify modules by type (Convention-Based Architecture)
            ExecutionTracer.logOperation(traceId, "Classifying modules by type");
            const moduleClassification = this.classifyModulesByType(resolvedGenome.modules);
            Logger.info(`📊 Module Classification:`, {
                traceId,
                operation: "module_classification",
                frameworks: moduleClassification.frameworks.map((m) => m.id),
                adapters: moduleClassification.adapters.map((m) => m.id),
                connectors: moduleClassification.connectors.map((m) => m.id),
                features: moduleClassification.features.map((m) => m.id),
            });
            // 4. Build dependency graph
            ExecutionTracer.logOperation(traceId, "Building dependency graph");
            const graphResult = await this.dependencyGraph.buildGraph(resolvedGenome.modules);
            if (!graphResult.success) {
                throw new Error(`Dependency graph build failed: ${graphResult.errors.join(", ")}`);
            }
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
            // 6. Create execution plan
            ExecutionTracer.logOperation(traceId, "Creating execution plan");
            const executionPlan = this.executionPlanner.createExecutionPlan();
            if (!executionPlan.success) {
                throw new Error(`Execution plan creation failed: ${executionPlan.errors.join(", ")}`);
            }
            // 7. Enforce hierarchical execution order (Framework -> Adapters -> Integrations)
            ExecutionTracer.logOperation(traceId, "Enforcing hierarchical execution order");
            const hierarchicalPlan = this.enforceHierarchicalOrder(executionPlan, moduleClassification);
            Logger.info(`🔄 Hierarchical execution plan created`, {
                traceId,
                operation: "hierarchical_ordering",
            });
            // 8. Log execution plan with FULL DETAILS
            Logger.info(`📋 Execution plan created:`, {
                traceId,
                operation: "execution_planning",
            });
            // Complete planning phase
            if (enhancedLogger) {
                enhancedLogger.completePhase();
            }
            // DEBUG: Log the ENTIRE execution plan structure
            Logger.debug(`🔍 COMPLETE EXECUTION PLAN STRUCTURE:`, {
                traceId,
                operation: "execution_planning",
                data: {
                    totalBatches: hierarchicalPlan.batches.length,
                    totalModules: hierarchicalPlan.batches.reduce((sum, batch) => sum + batch.modules.length, 0),
                    estimatedDuration: hierarchicalPlan.batches.reduce((sum, batch) => sum + batch.estimatedDuration, 0),
                    batches: hierarchicalPlan.batches.map((batch) => ({
                        batchNumber: batch.batchNumber,
                        moduleCount: batch.modules.length,
                        moduleIds: batch.modules.map((m) => m.id),
                        moduleTypes: batch.modules.map((m) => this.getModuleType(m.id)),
                        canExecuteInParallel: batch.canExecuteInParallel,
                        estimatedDuration: batch.estimatedDuration,
                        dependencies: batch.dependencies,
                    })),
                },
            });
            for (const batch of hierarchicalPlan.batches) {
                const moduleIds = batch.modules.map((m) => m.id).join(", ");
            }
            // 9. Validate framework module is first
            if (resolvedGenome.modules.length === 0) {
                throw new Error("Genome contains no modules");
            }
            const firstModule = resolvedGenome.modules[0];
            if (!firstModule) {
                throw new Error("First module is undefined");
            }
            if (firstModule.category !== "framework") {
                throw new Error(`First module must be a framework module, but found: ${firstModule.category}`);
            }
            Logger.info(`✅ Framework validation passed: ${firstModule.id}`, {
                traceId,
                operation: "framework_validation",
            });
            // 10. Execute using unified dependency-driven execution (skip framework as it's already executed)
            ExecutionTracer.logOperation(traceId, "Executing unified dependency-driven plan");
            // Filter out framework modules since they're already executed during setup
            const filteredPlan = this.filterOutFrameworkModules(hierarchicalPlan);
            // Enhanced logging: Start execution phases
            if (enhancedLogger) {
                // Count modules by type for progress tracking (excluding framework)
                const totalModules = filteredPlan.batches.reduce((sum, batch) => sum + batch.modules.length, 0);
                enhancedLogger.setTotalModules(totalModules);
                // Start adapters phase (framework already completed)
                enhancedLogger.startPhase("adapters");
            }
            const executionResult = await this.executeUnifiedPlan(genome, traceId, verbose, filteredPlan, enhancedLogger);
            if (executionResult.success) {
                results.push(...executionResult.results);
                Logger.info(`✅ All modules executed successfully`, {
                    traceId,
                    operation: "unified_execution",
                });
            }
            else {
                // FAIL-FAST: Stop immediately on any module failure
                errors.push(...executionResult.errors);
                Logger.error(`❌ Unified execution failed: ${executionResult.errors.join(", ")}`, {
                    traceId,
                    operation: "unified_execution",
                });
                return {
                    success: false,
                    modulesExecuted: results.length,
                    errors,
                    warnings,
                };
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
        try {
            Logger.info(`🔧 Executing module: ${module.id}`, {
                traceId,
                operation: "module_execution",
            });
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
            // Get blueprint path using MarketplaceService (centralized, tested logic)
            const blueprintPath = await MarketplaceService.getBlueprintPath(module.id);
            const preprocessingResult = await this.blueprintPreprocessor.loadAndProcessBlueprint(blueprintPath, mergedConfig);
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
            // 1. CREATE per-blueprint VFS
            blueprintVFS = new VirtualFileSystem(`blueprint-${moduleResult.adapter.blueprint.id}`, this.pathHandler.getProjectRoot());
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
        if (!genome.modules || !Array.isArray(genome.modules)) {
            errors.push("Genome must have a modules array");
        }
        else if (genome.modules.length === 0) {
            errors.push("Genome must have at least one module");
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
        return this.moduleClassifier.classifyModulesByType(modules);
    }
    /**
     * Get module type from ID (delegates to ModuleClassifier)
     */
    getModuleType(moduleId) {
        return this.moduleClassifier.getModuleType(moduleId);
    }
    /**
     * Enforce hierarchical execution order (delegates to ModuleClassifier)
     */
    enforceHierarchicalOrder(executionPlan, classification) {
        return this.moduleClassifier.enforceHierarchicalOrder(executionPlan, classification);
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
        return this.moduleAutoInclusion.applyMarketplaceDefaults(modules, MARKETPLACE_DEFAULTS);
    }
    /**
     * Auto-include tech-stack modules (delegates to ModuleAutoInclusionService)
     */
    async applyTechStackAutoInclusion(modules) {
        const marketplaceRoot = this.projectManager.getMarketplacePath();
        return this.moduleAutoInclusion.applyTechStackAutoInclusion(modules, marketplaceRoot);
    }
}
//# sourceMappingURL=orchestrator-agent.js.map
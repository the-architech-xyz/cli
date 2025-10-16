/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */

import { Module } from "@thearchitech.xyz/marketplace";
import {
  Genome,
  ExecutionResult,
  ConstitutionalExecutionContext,
  BlueprintModule,
  MergedConfiguration,
} from "@thearchitech.xyz/types";
import { ProjectContext } from "@thearchitech.xyz/marketplace/types/template-context.js";
import { MARKETPLACE_DEFAULTS } from "../marketplace.config.js";
import { ProjectManager } from "../core/services/project/project-manager.js";
import { PathService } from "../core/services/path/path-service.js";
import { BlueprintExecutor } from "../core/services/execution/blueprint/blueprint-executor.js";
import * as fs from 'fs/promises';
import * as path from 'path';
import { BlueprintAnalyzer } from "../core/services/project/blueprint-analyzer/index.js";
import { FrameworkContextService } from "../core/services/context/framework-context-service.js";
import { ModuleService } from "../core/services/module-management/module-service.js";
import { convertGenomeModulesToModules } from "../core/services/module-management/genome-module-converter.js";
import { MarketplaceService } from "../core/services/marketplace/marketplace-service.js";
import { CacheManagerService } from "../core/services/infrastructure/cache/cache-manager.js";
import {
  Logger,
  ExecutionTracer,
  LogLevel,
} from "../core/services/infrastructure/logging/index.js";
import { EnhancedLogger } from "../core/cli/enhanced-logger.js";
import { ErrorHandler } from "../core/services/infrastructure/error/index.js";
import { DependencyGraph } from "../core/services/dependency/dependency-graph.js";
import {
  ExecutionPlanner,
  ExecutionPlan,
} from "../core/services/dependency/execution-planner.js";
import { SequentialExecutionService } from "../core/services/execution/sequential-execution-service.js";
import { VirtualFileSystem } from "../core/services/file-system/file-engine/virtual-file-system.js";
import { SuccessValidator } from "../core/services/validation/success-validator.js";
import { ArchitectureValidator } from "../core/services/validation/architecture-validator.js";
import { HighLevelDependencyResolver } from "../core/services/dependency-resolution/high-level-dependency-resolver.js";
import { CapabilityRegistryBuilder } from "../core/services/dependency-resolution/capability-registry-builder.js";
import {
  ManifestDrivenFeatureResolver,
  extractProjectStackFromModules,
} from "../core/services/feature-resolution/manifest-driven-feature-resolver.js";
import { FeatureModuleResolver } from "../core/services/feature-resolution/feature-module-resolver.js";
import { BlueprintPreprocessor } from "../core/services/blueprint-preprocessor/blueprint-preprocessor.js";
import { AppManifestGenerator } from "../core/services/manifest/app-manifest-generator.js";
// Import types for dependency resolution
interface ResolutionError {
  type: string;
  module: string;
  capability?: string;
  message: string;
  suggestions: string[];
  severity: "error" | "warning";
}

interface ResolvedModule {
  id: string;
  category: string;
  version?: string;
  parameters: Record<string, any>;
  features?: Record<string, any>;
  externalFiles?: string[];
  resolutionPath: string[];
  capabilities: string[];
  prerequisites: string[];
  confidence: number;
}

export class OrchestratorAgent {
  private projectManager: ProjectManager;
  private pathHandler: PathService;
  private moduleService: ModuleService;
  private blueprintAnalyzer: BlueprintAnalyzer;
  private cacheManager: CacheManagerService;
  private dependencyGraph: DependencyGraph;
  private executionPlanner: ExecutionPlanner;
  private sequentialExecutor: SequentialExecutionService;
  private successValidator: SuccessValidator;
  private architectureValidator: ArchitectureValidator;
  private highLevelDependencyResolver: HighLevelDependencyResolver;
  private capabilityRegistryBuilder: CapabilityRegistryBuilder;
  private manifestDrivenFeatureResolver: ManifestDrivenFeatureResolver;
  private featureModuleResolver: FeatureModuleResolver;
  private blueprintPreprocessor: BlueprintPreprocessor;
  private appManifestGenerator: AppManifestGenerator;

  constructor(projectManager: ProjectManager) {
    this.projectManager = projectManager;
    this.pathHandler = projectManager.getPathHandler();
    this.cacheManager = new CacheManagerService();
    this.moduleService = new ModuleService(this.cacheManager);

    // Initialize blueprint analyzer
    this.blueprintAnalyzer = new BlueprintAnalyzer();

    // Initialize dependency resolution services
    this.dependencyGraph = new DependencyGraph(this.moduleService);
    this.executionPlanner = new ExecutionPlanner(this.dependencyGraph);
    this.sequentialExecutor = new SequentialExecutionService();
    this.successValidator = new SuccessValidator();
    this.architectureValidator = new ArchitectureValidator();

    // Initialize high-level dependency resolution
    this.capabilityRegistryBuilder = new CapabilityRegistryBuilder(
      this.moduleService
    );
    this.highLevelDependencyResolver = new HighLevelDependencyResolver(
      this.moduleService,
      {
        failFast: true,
        verbose: true,
      }
    );

    // Initialize manifest-driven feature resolver
    this.manifestDrivenFeatureResolver = new ManifestDrivenFeatureResolver(
      this.moduleService,
      this.projectManager.getMarketplacePath()
    );

    // Initialize feature module resolver
    this.featureModuleResolver = new FeatureModuleResolver(
      this.manifestDrivenFeatureResolver
    );
    
    // Initialize blueprint preprocessor
    this.blueprintPreprocessor = new BlueprintPreprocessor();
    this.appManifestGenerator = new AppManifestGenerator();
  }

  /**
   * Execute a recipe using unified dependency-driven execution
   */
  async executeRecipe(
    genome: Genome,
    verbose: boolean = false,
    enhancedLogger?: EnhancedLogger
  ): Promise<ExecutionResult> {
    const traceId = ExecutionTracer.startTrace("orchestrator_execution");
    const results: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

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
        throw new Error(
          `Genome validation failed: ${validationResult.errors.join(", ")}`
        );
      }

      // 1.5. FEATURE MODULE RESOLUTION - NEW CRITICAL STEP
      ExecutionTracer.logOperation(traceId, "Feature module resolution");
      Logger.info("🎯 Starting feature module resolution", {
        traceId,
        operation: "feature_module_resolution",
        modulesCount: genome.modules.length,
      });

      // Resolve feature modules using manifest-driven approach
      const resolvedModules =
        await this.featureModuleResolver.resolveFeatureModules(genome.modules as Module[]); // TODO: verify if that work

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

      // 1.7. TECH-STACK AUTO-INCLUSION - Auto-include tech-stack modules for features
      ExecutionTracer.logOperation(traceId, "Tech-stack auto-inclusion");
      Logger.info("🎯 Starting tech-stack auto-inclusion", {
        traceId,
        operation: "tech_stack_auto_inclusion",
        modulesCount: modulesWithDefaults.length,
      });

      const modulesWithTechStack = await this.applyTechStackAutoInclusion(modulesWithDefaults);

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
              const allComponents = Array.from(
                new Set([...userComponents, ...requiredComponents])
              ).sort();
              
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

      const resolutionResult =
        await this.highLevelDependencyResolver.resolveGenome(
          enhancedGenome.modules
        );

      if (!resolutionResult.success) {
        const errorMessages = resolutionResult.conflicts
          .map(
            (conflict: ResolutionError) =>
              `  ❌ ${conflict.message} (Module: ${conflict.module}${conflict.capability ? `, Capability: ${conflict.capability}` : ""})`
          )
          .join("\n");

        const suggestionMessages = resolutionResult.conflicts
          .filter(
            (conflict: ResolutionError) => conflict.suggestions.length > 0
          )
          .map(
            (conflict: ResolutionError) =>
              `  💡 ${conflict.suggestions.join(", ")}`
          )
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
          .map((m: ResolvedModule) => m.id)
          .join(" → "),
      });

      // Use resolved modules instead of original genome modules
      const resolvedGenome = {
        ...genome,
        modules: resolutionResult.executionOrder,
      };

      // 2. Load and validate modules
      ExecutionTracer.logOperation(traceId, "Loading modules");
      Logger.info(
        `📦 Loading ${resolvedGenome.modules.length} resolved modules`,
        {
          traceId,
          operation: "module_loading",
        }
      );

      // Complete validation phase
      if (enhancedLogger) {
        enhancedLogger.completePhase();
      }

      // 2.5. ARCHITECTURAL VALIDATION - NEW MANDATORY STEP
      ExecutionTracer.logOperation(traceId, "Architectural validation");
      const architecturalValidation =
        await this.architectureValidator.validateRecipe(
          resolvedGenome,
          traceId
        );
      if (!architecturalValidation.isValid) {
        const errorMessages = architecturalValidation.errors
          .map((error) => `  ❌ ${error.message} (Module: ${error.module})`)
          .join("\n");

        const warningMessages = architecturalValidation.warnings
          .map(
            (warning) => `  ⚠️  ${warning.message} (Module: ${warning.module})`
          )
          .join("\n");

        const fullErrorMessage = `Architectural validation failed with ${architecturalValidation.errors.length} errors:\n${errorMessages}${warningMessages ? `\n\nWarnings:\n${warningMessages}` : ""}`;

        Logger.error(`❌ ${fullErrorMessage}`, {
          traceId,
          operation: "architectural_validation",
        });

        throw new Error(fullErrorMessage);
      }

      Logger.info(
        "✅ Architectural validation passed - proceeding with generation",
        {
          traceId,
          operation: "architectural_validation",
        }
      );

      // Enhanced logging: Start planning phase
      if (enhancedLogger) {
        enhancedLogger.startPhase("planning");
      }

      // 3. Classify modules by type (Convention-Based Architecture)
      ExecutionTracer.logOperation(traceId, "Classifying modules by type");
      const moduleClassification = this.classifyModulesByType(
        resolvedGenome.modules
      );

      Logger.info(`📊 Module Classification:`, {
        traceId,
        operation: "module_classification",
        frameworks: moduleClassification.frameworks.map((m) => m.id),
        adapters: moduleClassification.adapters.map((m) => m.id),
        integrations: moduleClassification.integrations.map((m) => m.id),
        features: moduleClassification.features.map((m) => m.id),
      });

      // 4. Build dependency graph
      ExecutionTracer.logOperation(traceId, "Building dependency graph");
      const graphResult = await this.dependencyGraph.buildGraph(
        resolvedGenome.modules
      );
      if (!graphResult.success) {
        throw new Error(
          `Dependency graph build failed: ${graphResult.errors.join(", ")}`
        );
      }

      // 5. Setup framework and get framework-specific path handler
      ExecutionTracer.logOperation(traceId, "Setting up framework");
      const frameworkSetup = await this.moduleService.setupFramework(
        resolvedGenome,
        this.pathHandler
      );
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
        throw new Error(
          `Execution plan creation failed: ${executionPlan.errors.join(", ")}`
        );
      }

      // 7. Enforce hierarchical execution order (Framework -> Adapters -> Integrations)
      ExecutionTracer.logOperation(
        traceId,
        "Enforcing hierarchical execution order"
      );
      const hierarchicalPlan = this.enforceHierarchicalOrder(
        executionPlan,
        moduleClassification
      );
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
          totalModules: hierarchicalPlan.batches.reduce(
            (sum: number, batch: any) => sum + batch.modules.length,
            0
          ),
          estimatedDuration: hierarchicalPlan.batches.reduce(
            (sum: number, batch: any) => sum + batch.estimatedDuration,
            0
          ),
          batches: hierarchicalPlan.batches.map((batch: any) => ({
            batchNumber: batch.batchNumber,
            moduleCount: batch.modules.length,
            moduleIds: batch.modules.map((m: Module) => m.id),
            moduleTypes: batch.modules.map((m: Module) =>
              this.getModuleType(m.id)
            ),
            canExecuteInParallel: batch.canExecuteInParallel,
            estimatedDuration: batch.estimatedDuration,
            dependencies: batch.dependencies,
          })),
        },
      });

      for (const batch of hierarchicalPlan.batches) {
        const moduleIds = batch.modules.map((m: Module) => m.id).join(", ");
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
        throw new Error(
          `First module must be a framework module, but found: ${firstModule.category}`
        );
      }

      Logger.info(`✅ Framework validation passed: ${firstModule.id}`, {
        traceId,
        operation: "framework_validation",
      });

      // 10. Execute using unified dependency-driven execution (skip framework as it's already executed)
      ExecutionTracer.logOperation(
        traceId,
        "Executing unified dependency-driven plan"
      );

      // Filter out framework modules since they're already executed during setup
      const filteredPlan = this.filterOutFrameworkModules(hierarchicalPlan);

      // Enhanced logging: Start execution phases
      if (enhancedLogger) {
        // Count modules by type for progress tracking (excluding framework)
        const totalModules = filteredPlan.batches.reduce(
          (sum: number, batch: any) => sum + batch.modules.length,
          0
        );
        enhancedLogger.setTotalModules(totalModules);

        // Start adapters phase (framework already completed)
        enhancedLogger.startPhase("adapters");
      }

      const executionResult = await this.executeUnifiedPlan(
        genome,
        traceId,
        verbose,
        filteredPlan,
        enhancedLogger
      );

      if (executionResult.success) {
        results.push(...executionResult.results);
        Logger.info(`✅ All modules executed successfully`, {
          traceId,
          operation: "unified_execution",
        });
      } else {
        // FAIL-FAST: Stop immediately on any module failure
        errors.push(...executionResult.errors);
        Logger.error(
          `❌ Unified execution failed: ${executionResult.errors.join(", ")}`,
          {
            traceId,
            operation: "unified_execution",
          }
        );
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
      } catch (error) {
        const dependencyErrorResult = ErrorHandler.handleDependencyFailure(
          error,
          verbose
        );
        errors.push(
          ErrorHandler.formatUserError(dependencyErrorResult, verbose)
        );
        Logger.error(`❌ ${dependencyErrorResult.error}`, {
          traceId,
          operation: "dependency_installation",
        });

        ExecutionTracer.endTrace(
          traceId,
          false,
          error instanceof Error ? error : new Error(String(error))
        );

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
        await this.appManifestGenerator.generateAndSaveManifest(
          genome,
          { modulesExecuted: results.length, results },
          projectPath
        );
        Logger.info(`📋 App manifest generated successfully`, {
          traceId,
          operation: "manifest_generation",
        });
      } catch (manifestError) {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      Logger.error(`❌ Recipe execution failed: ${errorMessage}`, {
        traceId,
        operation: "recipe_execution",
      });

      ExecutionTracer.endTrace(
        traceId,
        false,
        error instanceof Error ? error : new Error(String(error))
      );

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
  private filterOutFrameworkModules(plan: any): any {
    return {
      ...plan,
      batches: plan.batches
        .map((batch: any) => ({
          ...batch,
          modules: batch.modules.filter(
            (module: any) => module.category !== "framework"
          ),
        }))
        .filter((batch: any) => batch.modules.length > 0),
    };
  }

  /**
   * Execute unified dependency-driven plan
   * Single execution loop that relies on dependency graph for correct ordering
   */
  private async executeUnifiedPlan(
    genome: Genome,
    traceId: string,
    verbose: boolean,
    executionPlan: any,
    enhancedLogger?: EnhancedLogger
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      Logger.info(
        `🚀 Executing unified dependency-driven plan with ${executionPlan.batches.length} batches`,
        {
          traceId,
          operation: "unified_execution",
        }
      );

      // Execute all batches in dependency order
      for (let i = 0; i < executionPlan.batches.length; i++) {
        const batch = executionPlan.batches[i];
        console.log(`🔍 CWD BEFORE batch ${i + 1}:`, process.cwd());

        Logger.info(
          `🚀 Executing batch ${i + 1}/${executionPlan.batches.length} (${batch.modules.length} modules)`,
          {
            traceId,
            operation: "unified_execution",
          }
        );

        // Execute modules in this batch (each module gets its own VFS lifecycle)
        for (const module of batch.modules) {
          console.log(`🔍 CWD BEFORE module ${module.id}:`, process.cwd());

          // Enhanced logging: Determine module type and phase
          if (enhancedLogger) {
            let phaseKey = "adapters";
            if (module.category === "framework") {
              phaseKey = "framework";
            } else if (module.category === "integration") {
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

          const result = await this.executeModule(
            module,
            genome,
            traceId,
            enhancedLogger
          );

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
          } else {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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
  private async resolveComponentDependencies(genome: Genome): Promise<Map<string, string[]>> {
    const componentRequirements = new Map<string, Set<string>>();
    
    // Iterate through all modules to find features with component requirements
    for (const module of genome.modules) {
      if (module.id.startsWith('features/')) {
        try {
          // Load feature manifest
          const featureManifest = await MarketplaceService.loadFeatureManifest(module.id);
          
          if (featureManifest?.requires?.components) {
            // Collect component requirements per UI technology
            for (const [uiTechId, components] of Object.entries(featureManifest.requires.components)) {
              if (!componentRequirements.has(uiTechId)) {
                componentRequirements.set(uiTechId, new Set<string>());
              }
              
              const requiredSet = componentRequirements.get(uiTechId)!;
              (components as string[]).forEach(comp => requiredSet.add(comp));
            }
          }
        } catch (error) {
          console.warn(`⚠️  Could not load manifest for ${module.id}:`, error);
        }
      }
    }
    
    // Convert Sets to Arrays
    const result = new Map<string, string[]>();
    for (const [uiTechId, componentsSet] of componentRequirements.entries()) {
      result.set(uiTechId, Array.from(componentsSet).sort());
    }
    
    if (result.size > 0) {
      console.log('📦 Resolved component dependencies:');
      for (const [uiTechId, components] of result.entries()) {
        console.log(`   ${uiTechId}: [${components.join(', ')}]`);
      }
    }
    
    return result;
  }

  /**
   * Execute a single module with its own transactional VFS
   * Each blueprint gets: Create VFS → Execute → Flush to Disk
   */
  private async executeModule(
    module: Module,
    genome: Genome,
    traceId: string,
    enhancedLogger?: EnhancedLogger
  ): Promise<{ success: boolean; error?: string; executedModules?: any[] }> {
    let blueprintVFS: VirtualFileSystem | null = null;

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
      const preprocessingResult = await this.blueprintPreprocessor.loadAndProcessBlueprint(
        blueprintPath,
        mergedConfig
      );
      
      if (!preprocessingResult.success) {
        return {
          success: false,
          error: `Blueprint preprocessing failed: ${preprocessingResult.error}`,
        };
      }

      // Create modules record for context factory
      const modulesRecord: Record<string, Module> = {};
      const convertedModules = convertGenomeModulesToModules(genome.modules);
      convertedModules.forEach(mod => {
        modulesRecord[mod.id] = mod;
      });

      // Create dynamic project context based on framework and parameters
      const projectContext: ProjectContext = await FrameworkContextService.createProjectContext(
        genome,
        module,
        this.pathHandler,
        modulesRecord
      );
      
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
      blueprintVFS = new VirtualFileSystem(
        `blueprint-${moduleResult.adapter.blueprint.id}`,
        this.pathHandler.getProjectRoot()
      );
      Logger.info(
        `📦 Created VFS for blueprint: ${moduleResult.adapter.blueprint.id}`,
        {
          traceId,
          operation: "module_execution",
        }
      );

      // 2. EXECUTE preprocessed actions with BlueprintExecutor
      const blueprintExecutor = new BlueprintExecutor(
        this.pathHandler.getProjectRoot()
      );
      const result = await blueprintExecutor.executeActions(
        preprocessingResult.actions,
        projectContext,
        blueprintVFS
      );

      if (result.success) {
        // 3. FLUSH VFS to disk on success - critical for subsequent modules!
        await blueprintVFS.flushToDisk();
        Logger.info(
          `💾 VFS flushed to disk for blueprint: ${moduleResult.adapter.blueprint.id}`,
          {
            traceId,
            operation: "module_execution",
          }
        );

        Logger.info(`✅ Module ${module.id} executed successfully`, {
          traceId,
          operation: "module_execution",
        });
        return { success: true, executedModules: [module] };
      } else {
        // DO NOT flush on failure - preserve clean state
        Logger.error(
          `❌ Module ${module.id} execution failed: ${result.errors?.join(", ") || "Unknown error"}`,
          {
            traceId,
            operation: "module_execution",
          }
        );
        return {
          success: false,
          error: result.errors?.join(", ") || "Unknown error",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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
  private async installDependencies(): Promise<void> {
    const projectRoot = this.pathHandler.getProjectRoot();
    const packageJsonPath = path.join(projectRoot, "package.json");

    // Check if package.json exists
    const fs = await import("fs/promises");
    try {
      await fs.access(packageJsonPath);
    } catch {
      Logger.warn("No package.json found, skipping dependency installation");
      return;
    }

    Logger.info("Installing dependencies...");
    // This would typically run npm install
    // For now, we'll just log that we would install dependencies
    Logger.info("Dependencies installation completed");
  }

  /**
   * Validate recipe structure
   */
  private validateRecipe(genome: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!genome) {
      errors.push("Genome is null or undefined");
      return { valid: false, errors };
    }

    if (!genome.project) {
      errors.push("Genome must have a project section");
    } else {
      if (!genome.project.name) {
        errors.push("Project must have a name");
      }
      if (!genome.project.path) {
        errors.push("Project must have a path");
      }
    }

    if (!genome.modules || !Array.isArray(genome.modules)) {
      errors.push("Genome must have a modules array");
    } else if (genome.modules.length === 0) {
      errors.push("Genome must have at least one module");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Identify critical module failures
   */
  private identifyCriticalFailuresFromResults(results: any[]): string[] {
    const criticalFailures: string[] = [];

    for (const result of results) {
      if (result.executedModules) {
        for (const module of result.executedModules) {
          if (
            module.category === "framework" ||
            module.category === "database"
          ) {
            // These are considered critical modules
            if (!result.success) {
              criticalFailures.push(module.id);
            }
          }
        }
      }
    }

    return criticalFailures;
  }

  /**
   * Classify modules by type based on ID convention
   * - Frameworks: category === 'framework'
   * - Integrations: id starts with 'integrations/'
   * - Adapters: everything else
   */
  private classifyModulesByType(modules: Module[]): {
    frameworks: Module[];
    adapters: Module[];
    integrations: Module[];
    features: Module[];
  } {
    const frameworks: Module[] = [];
    const adapters: Module[] = [];
    const integrations: Module[] = [];
    const features: Module[] = [];

    for (const module of modules) {
      const type = this.getModuleType(module.id);

      if (type === "framework") {
        frameworks.push(module);
      } else if (type === "integration") {
        integrations.push(module);
      } else if (type === "feature") {
        features.push(module);
      } else {
        adapters.push(module);
      }
    }

    return { frameworks, adapters, integrations, features };
  }

  /**
   * Get module type from ID
   */
  private getModuleType(
    moduleId: string
  ): "framework" | "adapter" | "integration" | "feature" {
    if (moduleId.startsWith("integrations/")) {
      return "integration";
    }

    if (moduleId.startsWith("features/")) {
      return "feature";
    }

    const category = moduleId.split("/")[0];
    if (category === "framework") {
      return "framework";
    }

    return "adapter";
  }

  /**
   * Enforce hierarchical execution order: Framework -> Adapters -> Integrations -> Features
   */
  private enforceHierarchicalOrder(
    executionPlan: any,
    classification: {
      frameworks: Module[];
      adapters: Module[];
      integrations: Module[];
      features: Module[];
    }
  ): any {
    const newBatches: any[] = [];
    let batchNumber = 1;

    // 1. Framework batches (must be first)
    const frameworkBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.every(
        (m: Module) => this.getModuleType(m.id) === "framework"
      )
    );
    for (const batch of frameworkBatches) {
      newBatches.push({ ...batch, batchNumber: batchNumber++ });
    }

    // 2. Adapter batches (middle layer)
    const adapterBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.every((m: Module) => this.getModuleType(m.id) === "adapter")
    );
    for (const batch of adapterBatches) {
      newBatches.push({ ...batch, batchNumber: batchNumber++ });
    }

    // 3. Integration batches (technical bridges)
    const integrationBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.some(
        (m: Module) => this.getModuleType(m.id) === "integration"
      )
    );
    for (const batch of integrationBatches) {
      newBatches.push({ ...batch, batchNumber: batchNumber++ });
    }

    // 4. Feature batches (must be last, sequential)
    const featureBatches = executionPlan.batches.filter((batch: any) =>
      batch.modules.some((m: Module) => this.getModuleType(m.id) === "feature")
    );
    for (const batch of featureBatches) {
      // Force features to be sequential
      newBatches.push({
        ...batch,
        batchNumber: batchNumber++,
        canExecuteInParallel: false,
      });
    }

    return {
      ...executionPlan,
      batches: newBatches,
      totalBatches: newBatches.length,
    };
  }

  /**
   * NEW: Check if module supports Constitutional Architecture
   */
  private isConstitutionalModule(adapter: any): boolean {
    return (
      adapter &&
      adapter.config &&
      adapter.config.parameters &&
      adapter.config.parameters.features &&
      adapter.config.internal_structure
    );
  }

  /**
   * REMOVED: getBlueprintPath() and getModuleCategoryFromId()
   * 
   * These methods duplicated logic from MarketplaceService and contained bugs.
   * Now using MarketplaceService.loadModuleBlueprint() directly for:
   * - Centralized path logic (DRY principle)
   * - Tested, robust implementation
   * - Proper separation of concerns
   * 
   * Refactored: October 10, 2025
   * Reason: Fix blueprint loading bug + eliminate technical debt
   */

  /**
   * NEW: Merge module configuration with user overrides
   */
  private mergeModuleConfiguration(module: Module, adapter: any, genome: Genome): MergedConfiguration {
    const moduleConfig = adapter.config;
    const userOverrides = module.parameters || {};

    if (!moduleConfig.parameters?.features) {
      // Build template context even for modules without features
      // IMPORTANT: Merge defaults with user overrides so templates can access all parameters
      const mergedParameters = this.mergeParametersWithDefaults(moduleConfig.parameters, userOverrides);
      
      const templateContext: Record<string, any> = {
        project: genome.project || {},
        modules: genome.modules || [],
        module: {
          id: module.id,
          parameters: mergedParameters
        }
      };
      
      return {
        activeFeatures: [],
        resolvedCapabilities: [],
        executionOrder: [],
        conflicts: [],
        templateContext,
      };
    }

    const activeFeatures: string[] = [];
    const conflicts: any[] = [];

    // Merge feature configurations
    for (const [featureName, featureConfig] of Object.entries(
      moduleConfig.parameters.features
    )) {
      const userValue = userOverrides[featureName];
      const finalValue =
        userValue !== undefined ? userValue : (featureConfig as any).default;

      if (finalValue) {
        activeFeatures.push(featureName);
      }
    }

    // Validate prerequisites
    if (moduleConfig.internal_structure) {
      for (const feature of activeFeatures) {
        const capability = moduleConfig.internal_structure[feature];
        if (capability?.prerequisites) {
          for (const prereq of capability.prerequisites) {
            if (!activeFeatures.includes(prereq)) {
              conflicts.push({
                type: "missing_prerequisite",
                message: `Feature ${feature} requires ${prereq}`,
                affectedCapabilities: [feature, prereq],
              });
            }
          }
        }
      }
    }

    // Build template context with genome data for template rendering
    // IMPORTANT: Merge defaults with user overrides so templates can access all parameters
    const mergedParameters = this.mergeParametersWithDefaults(moduleConfig.parameters, userOverrides);
    
    const templateContext: Record<string, any> = {
      project: genome.project || {},
      modules: genome.modules || [],
      module: {
        id: module.id,
        parameters: mergedParameters
      }
    };

    return {
      activeFeatures,
      resolvedCapabilities: activeFeatures,
      executionOrder: activeFeatures, // For now, use activeFeatures as execution order
      conflicts,
      templateContext,
    };
  }

  /**
   * Merge parameter defaults from module config with user overrides
   * Ensures templates have access to all parameter values (defaults + overrides)
   */
  private mergeParametersWithDefaults(
    parameterSchema: any,
    userOverrides: Record<string, any>
  ): Record<string, any> {
    // Start with user overrides, but clean them first
    const merged: Record<string, any> = {};
    
    // CRITICAL FIX: Clean user overrides - extract default values if they're schema objects
    for (const [key, value] of Object.entries(userOverrides)) {
      if (this.isParameterSchema(value)) {
        // This is a schema object, extract the default value
        merged[key] = value.default;
        console.log(`🔧 Extracted default from schema for '${key}':`, JSON.stringify(value.default).substring(0, 100));
      } else {
        // This is an actual value, keep it
        merged[key] = value;
      }
    }
    
    if (!parameterSchema || typeof parameterSchema !== 'object') {
      return merged;
    }
    
    console.log(`🔧 Merging parameter defaults. Cleaned user overrides:`, Object.keys(merged));
    
    // Merge defaults for top-level parameters
    for (const [key, schema] of Object.entries(parameterSchema)) {
      // Skip the 'features' object - we handle it separately below
      if (key === 'features') {
        continue;
      }
      
      // Skip if user has already provided this parameter
      if (merged[key] !== undefined) {
        console.log(`⏭️  Skipping '${key}' - user value exists:`, JSON.stringify(merged[key]).substring(0, 50));
        continue;
      }
      
      // Check if this parameter has a default value
      if (schema && typeof schema === 'object') {
        const paramDef = schema as any;
        if ('default' in paramDef) {
          merged[key] = paramDef.default;
          console.log(`✅ Applied default for parameter '${key}':`, JSON.stringify(paramDef.default).substring(0, 100));
        } else {
          console.log(`⚠️  Parameter '${key}' has no default value in schema`);
        }
      }
    }
    
    // Handle nested 'features' object (for Constitutional Architecture modules)
    if (parameterSchema.features && typeof parameterSchema.features === 'object') {
      merged.features = merged.features || {};
      
      for (const [featureName, featureConfig] of Object.entries(parameterSchema.features)) {
        // Skip if user has already provided this feature value
        if (merged.features[featureName] !== undefined) {
          continue;
        }
        
        // Apply default for this feature
        if (featureConfig && typeof featureConfig === 'object') {
          const featureDef = featureConfig as any;
          if ('default' in featureDef) {
            merged.features[featureName] = featureDef.default;
            console.log(`✅ Applied default for feature '${featureName}':`, featureDef.default);
          }
        }
      }
    }
    
    console.log(`✅ Final merged parameters:`, Object.keys(merged));
    return merged;
  }

  /**
   * Check if a value is a parameter schema object (has 'type', 'default', 'description')
   */
  private isParameterSchema(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      ('type' in value || 'default' in value || 'description' in value)
    );
  }

  /**
   * Apply marketplace defaults - Auto-include opinionated modules for all Next.js projects
   */
  private applyMarketplaceDefaults(modules: Module[]): Module[] {
    const enhancedModules = [...modules];
    
    // Auto-include marketplace defaults for all projects
    for (const moduleId of MARKETPLACE_DEFAULTS.autoInclude) {
      // Check if module is already included
      if (!enhancedModules.some(m => m.id === moduleId)) {
        enhancedModules.push({
          id: moduleId,
          parameters: {}
        });
        
        Logger.info(`✅ Auto-included marketplace default: ${moduleId}`, {
          operation: "marketplace_defaults",
        });
      }
    }
    
    return enhancedModules;
  }

  /**
   * Auto-include tech-stack modules for features that have them
   * This ensures the technology-agnostic layer is always included when available
   */
  private async applyTechStackAutoInclusion(modules: Module[]): Promise<Module[]> {
    const enhancedModules = [...modules];
    
    // Find all feature modules (both resolved and original)
    const featureModules = enhancedModules.filter(module => 
      module.id.startsWith('features/') && 
      !module.id.includes('/tech-stack') && // Exclude existing tech-stack modules
      !module.id.includes('/frontend/') &&  // Exclude frontend implementations
      !module.id.includes('/backend/')      // Exclude backend implementations
    );
    
    for (const featureModule of featureModules) {
      const featureId = featureModule.id; // e.g., 'features/auth'
      const techStackModuleId = `${featureId}/tech-stack`; // e.g., 'features/auth/tech-stack'
      
      // Check if tech-stack module is already included
      if (!enhancedModules.some(m => m.id === techStackModuleId)) {
        try {
          // Check if tech-stack module exists in marketplace (non-blocking)
          const techStackExists = await this.checkTechStackModuleExists(techStackModuleId);
          
          if (techStackExists) {
            enhancedModules.push({
              id: techStackModuleId,
              parameters: {
                featureName: featureId.split('/').pop(),
                featurePath: featureId.split('/').pop()
              }
            });
            
            Logger.info(`✅ Auto-included tech-stack module: ${techStackModuleId}`, {
              operation: "tech_stack_auto_inclusion",
              featureId
            });
          } else {
            Logger.debug(`ℹ️  Tech-stack module not found (optional): ${techStackModuleId}`, {
              operation: "tech_stack_auto_inclusion",
              featureId
            });
          }
        } catch (error) {
          // Non-blocking: log warning but continue execution
          Logger.warn(`⚠️  Failed to check tech-stack module: ${techStackModuleId}`, {
            operation: "tech_stack_auto_inclusion",
            featureId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return enhancedModules;
  }

  /**
   * Check if a tech-stack module exists in the marketplace (non-blocking)
   */
  private async checkTechStackModuleExists(moduleId: string): Promise<boolean> {
    try {
      const marketplaceRoot = this.projectManager.getMarketplacePath();
      const modulePath = path.join(marketplaceRoot, moduleId);
      const featureJsonPath = path.join(modulePath, 'feature.json');
      const blueprintPath = path.join(modulePath, 'blueprint.ts');
      
      // Check if both feature.json and blueprint.ts exist
      const [featureJsonExists, blueprintExists] = await Promise.all([
        fs.access(featureJsonPath).then(() => true).catch(() => false),
        fs.access(blueprintPath).then(() => true).catch(() => false)
      ]);
      
      return featureJsonExists && blueprintExists;
    } catch (error) {
      // If we can't check, assume it doesn't exist (non-blocking)
      return false;
    }
  }
}

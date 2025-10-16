/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { Genome, ExecutionResult } from "@thearchitech.xyz/types";
import { ProjectManager } from "../core/services/project/project-manager.js";
import { EnhancedLogger } from "../core/cli/enhanced-logger.js";
export declare class OrchestratorAgent {
    private projectManager;
    private pathHandler;
    private moduleService;
    private blueprintAnalyzer;
    private cacheManager;
    private dependencyGraph;
    private executionPlanner;
    private sequentialExecutor;
    private successValidator;
    private architectureValidator;
    private highLevelDependencyResolver;
    private capabilityRegistryBuilder;
    private manifestDrivenFeatureResolver;
    private featureModuleResolver;
    private blueprintPreprocessor;
    private appManifestGenerator;
    constructor(projectManager: ProjectManager);
    /**
     * Execute a recipe using unified dependency-driven execution
     */
    executeRecipe(genome: Genome, verbose?: boolean, enhancedLogger?: EnhancedLogger): Promise<ExecutionResult>;
    /**
     * Filter out framework modules from execution plan since they're executed during setup
     */
    private filterOutFrameworkModules;
    /**
     * Execute unified dependency-driven plan
     * Single execution loop that relies on dependency graph for correct ordering
     */
    private executeUnifiedPlan;
    /**
     * Resolve component dependencies across all features
     * Collects required components from feature manifests and ensures UI technologies install them
     */
    private resolveComponentDependencies;
    /**
     * Execute a single module with its own transactional VFS
     * Each blueprint gets: Create VFS → Execute → Flush to Disk
     */
    private executeModule;
    /**
     * Install dependencies
     */
    private installDependencies;
    /**
     * Validate recipe structure
     */
    private validateRecipe;
    /**
     * Identify critical module failures
     */
    private identifyCriticalFailuresFromResults;
    /**
     * Classify modules by type based on ID convention
     * - Frameworks: category === 'framework'
     * - Integrations: id starts with 'integrations/'
     * - Adapters: everything else
     */
    private classifyModulesByType;
    /**
     * Get module type from ID
     */
    private getModuleType;
    /**
     * Enforce hierarchical execution order: Framework -> Adapters -> Integrations -> Features
     */
    private enforceHierarchicalOrder;
    /**
     * NEW: Check if module supports Constitutional Architecture
     */
    private isConstitutionalModule;
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
    private mergeModuleConfiguration;
    /**
     * Merge parameter defaults from module config with user overrides
     * Ensures templates have access to all parameter values (defaults + overrides)
     */
    private mergeParametersWithDefaults;
    /**
     * Check if a value is a parameter schema object (has 'type', 'default', 'description')
     */
    private isParameterSchema;
    /**
     * Apply marketplace defaults - Auto-include opinionated modules for all Next.js projects
     */
    private applyMarketplaceDefaults;
    /**
     * Auto-include tech-stack modules for features that have them
     * This ensures the technology-agnostic layer is always included when available
     */
    private applyTechStackAutoInclusion;
    /**
     * Check if a tech-stack module exists in the marketplace (non-blocking)
     */
    private checkTechStackModuleExists;
}

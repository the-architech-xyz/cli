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
    private architectureValidator;
    private semanticDependencyResolver;
    private manifestDrivenFeatureResolver;
    private featureModuleResolver;
    private blueprintPreprocessor;
    private appManifestGenerator;
    private moduleConfigService;
    private moduleClassifier;
    private moduleAutoInclusion;
    private componentDependencyResolver;
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
    /**
     * Resolve component dependencies (delegates to ComponentDependencyResolver)
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
     * Classify modules by type based on ID convention
     * - Frameworks: category === 'framework'
     * - Connectors: id starts with 'connectors/'
     * - Adapters: everything else
     */
    /**
     * Classify modules by type (delegates to ModuleClassifier)
     */
    private classifyModulesByType;
    /**
     * Get module type from ID (delegates to ModuleClassifier)
     */
    private getModuleType;
    /**
     * Enforce hierarchical execution order (delegates to ModuleClassifier)
     */
    private enforceHierarchicalOrder;
    /**
     * NEW: Check if module supports Constitutional Architecture
     */
    private isConstitutionalModule;
    /**
     * Merge module configuration with user overrides (delegates to ModuleConfigurationService)
     */
    private mergeModuleConfiguration;
    /**
     * Merge parameter defaults with user overrides (delegates to ModuleConfigurationService)
     */
    private mergeParametersWithDefaults;
    /**
     * Apply marketplace defaults (delegates to ModuleAutoInclusionService)
     */
    private applyMarketplaceDefaults;
    /**
     * Auto-include tech-stack modules (delegates to ModuleAutoInclusionService)
     */
    private applyTechStackAutoInclusion;
}

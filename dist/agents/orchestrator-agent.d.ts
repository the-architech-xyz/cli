/**
 * Orchestrator Agent
 *
 * Main orchestrator that coordinates all agents
 * Reads YAML recipe and delegates to appropriate agents
 */
import { ResolvedGenome, ExecutionResult, GenomeMarketplace, MarketplaceAdapter } from "@thearchitech.xyz/types";
import { ProjectManager } from "../core/services/project/project-manager.js";
import { EnhancedLogger } from "../core/cli/enhanced-logger.js";
interface OrchestratorExecutionOptions {
    marketplaceAdapter?: MarketplaceAdapter;
    marketplaceInfo?: GenomeMarketplace;
    pathOverrides?: Record<string, string>;
}
export declare class OrchestratorAgent {
    private projectManager;
    private pathHandler;
    private moduleService;
    private cacheManager;
    private blueprintPreprocessor;
    private appManifestGenerator;
    private moduleConfigService;
    private projectBootstrapService;
    constructor(projectManager: ProjectManager);
    /**
     * Execute a recipe using unified dependency-driven execution
     */
    executeRecipe(genome: ResolvedGenome, verbose?: boolean, enhancedLogger?: EnhancedLogger, options?: OrchestratorExecutionOptions): Promise<ExecutionResult>;
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
     * Execute a single module with its own transactional VFS
     * Each blueprint gets: Create VFS → Execute → Flush to Disk
     *
     * NEW: Supports dual execution contexts:
     * - Package execution (adapters, tech-stack)
     * - App execution (connectors, features frontend/backend)
     * - Root execution (single-app mode)
     */
    private executeModule;
    /**
     * Execute module in package context (adapters, tech-stack)
     */
    private executeInPackage;
    /**
     * Execute module in app context (connectors, features frontend/backend)
     */
    private executeInApp;
    /**
     * Execute module in root context (single-app mode or fallback)
     */
    private executeInRoot;
    /**
     * Ensure workspaces are configured in root package.json for monorepos
     */
    private ensureWorkspacesConfigured;
    /**
     * Install dependencies (monorepo-aware)
     * V2 COMPLIANCE: Detects package manager from genome or lock files
     */
    private installDependencies;
    /**
     * Detect package manager from genome, lock files, or pnpm-workspace.yaml
     * V2 COMPLIANCE: Checks genome monorepo config first, then lock files
     */
    private detectPackageManager;
    /**
     * Get install command for package manager
     */
    private getInstallCommand;
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
     * NEW: Check if module supports Constitutional Architecture
     */
    private isConstitutionalModule;
    /**
     * Load recipe books from genome marketplaces
     */
    private loadRecipeBooksFromGenome;
    /**
     * Merge module configuration with user overrides (delegates to ModuleConfigurationService)
     */
    private mergeModuleConfiguration;
    /**
     * Type guard for platforms object
     */
    private isValidPlatforms;
}
export {};

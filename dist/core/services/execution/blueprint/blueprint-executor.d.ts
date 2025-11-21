/**
 * Blueprint Executor - Intelligent Foreman
 *
 * Implements the Executor-Centric architecture:
 * - Analyzes blueprints to determine VFS need
 * - Creates VFS only when necessary
 * - Delegates actions to specialized handlers
 * - Manages VFS lifecycle
 */
import { Blueprint, BlueprintExecutionResult, BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
export declare class BlueprintExecutor {
    private modifierRegistry;
    private actionHandlerRegistry;
    constructor(projectRoot: string);
    /**
     * Expand path keys to multiple actions based on pre-computed mappings
     *
     * NEW: Uses PathService.getMapping() to get all paths for a key.
     * If a key has multiple paths (semantic expansion), creates one action per path.
     *
     * Simple Model:
     * - Extract path key from template (e.g., "${paths.apps.frontend.components}")
     * - Get all paths from PathService.getMapping(key)
     * - If 1 path → 1 action (no expansion)
     * - If 2+ paths → multiple actions (one per path)
     *
     * This replaces the old hardcoded semantic detection logic.
     */
    private expandPathKey;
    /**
     * Check if a path key is semantic (has multiple paths in pre-computed mappings or is defined as semantic)
     *
     * NEW: First checks if key has multiple mappings (already expanded).
     * If not, checks path-keys.json to see if it's defined as semantic.
     * This ensures semantic keys are detected even if mappings haven't been generated yet.
     */
    private isSemanticPathKey;
    /**
     * Validate blueprint paths against marketplace path-keys.json
     * This provides type safety - blueprints can only use path keys defined in the marketplace
     *
     * NOTE: Semantic path keys (apps.frontend.*, apps.backend.*, etc.) are skipped here
     * because they need to be expanded first. They will be validated after expansion.
     */
    validateBlueprintPaths(blueprint: {
        actions?: BlueprintAction[];
    }, context: ProjectContext): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Expand forEach actions into individual actions
     */
    private expandForEachActions;
    /**
     * Resolve a forEach path (e.g., "module.parameters.components") to get the array of items
     */
    private resolveForEachPath;
    /**
     * Create an expanded action by replacing {{item}} placeholders with the actual item value
     */
    private createExpandedAction;
    private enforcePathKeyContractOnAction;
    /**
     * Intelligent VFS Pre-loader: Automatically analyze blueprint to determine which files need to be loaded
     *
     * This method implements the "Intelligent VFS Pre-loader" doctrine:
     * - Automatically detects files from action analysis
     * - Always includes default files (package.json)
     * - Supports contextualFiles as escape hatch
     * - Handles forEach actions recursively
     *
     * @param actions - Blueprint actions to analyze
     * @param context - Project context
     * @param blueprint - Optional blueprint (for contextualFiles)
     * @returns Array of unique file paths to pre-load
     */
    private analyzeAndPreloadRequiredFiles;
    /**
     * @deprecated Use analyzeAndPreloadRequiredFiles instead
     * Kept for backward compatibility
     */
    private analyzeFilesToLoad;
    /**
     * Initialize the modifier registry with available modifiers
     */
    private initializeModifiers;
    /**
     * Execute a list of actions directly (for preprocessed blueprints)
     *
     * This method is used when blueprints have been preprocessed into static action arrays.
     * It skips the blueprint analysis and directly executes the provided actions.
     */
    executeActions(actions: BlueprintAction[], context: ProjectContext, vfs: VirtualFileSystem): Promise<BlueprintExecutionResult>;
    /**
     * Execute a blueprint with per-blueprint transactional VFS
     * Each blueprint receives its own dedicated VFS instance from OrchestratorAgent
     *
     * Flow:
     * 1. Analyze blueprint to identify files to pre-load
     * 2. Pre-populate VFS with existing files from disk
     * 3. Execute all actions on the VFS (in-memory)
     * 4. Return to OrchestratorAgent (VFS flush happens there after successful execution)
     *
     * Note: Blueprint type safety is enforced at compile-time by the marketplace,
     * so no runtime validation is needed.
     */
    executeBlueprint(blueprint: Blueprint, context: ProjectContext, vfs: VirtualFileSystem): Promise<BlueprintExecutionResult>;
    /**
     * Evaluate action condition to determine if action should execute
     *
     * Conditions are processed as templates using Handlebars-style syntax:
     * - {{#if variable}} - evaluates truthiness of variable
     * - Returns true if no condition specified (always execute)
     * - Returns false if condition evaluates to false/undefined
     */
    private evaluateActionCondition;
    /**
     * Get nested value from context using dot notation (e.g., 'module.parameters.reactVersion')
     */
    private getNestedValueFromContext;
}

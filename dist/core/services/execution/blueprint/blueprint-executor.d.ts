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
    private blueprintAnalyzer;
    constructor(projectRoot: string);
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

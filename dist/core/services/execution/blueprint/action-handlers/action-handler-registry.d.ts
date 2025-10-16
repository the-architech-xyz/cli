/**
 * Action Handler Registry
 *
 * Manages all specialized action handlers and dispatches actions to the appropriate handler.
 * This is the central dispatcher in the Executor-Centric architecture.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
export declare class ActionHandlerRegistry {
    private handlers;
    constructor(modifierRegistry: ModifierRegistry);
    /**
     * Initialize all action handlers
     */
    private initializeHandlers;
    /**
     * Register a new action handler
     */
    registerHandler(handler: BaseActionHandler): void;
    registerHandler(actionType: string, handler: BaseActionHandler): void;
    /**
     * Get handler for a specific action type
     */
    getHandler(actionType: string): BaseActionHandler | null;
    /**
     * Handle an action by dispatching to the appropriate handler
     */
    handleAction(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Get all supported action types
     */
    getSupportedActionTypes(): string[];
    /**
     * Check if an action type is supported
     */
    isActionTypeSupported(actionType: string): boolean;
}

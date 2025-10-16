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
import { CreateFileHandler } from './create-file-handler.js';
import { EnhanceFileHandler } from './enhance-file-handler.js';
import { InstallPackagesHandler } from './install-packages-handler.js';
import { RunCommandHandler } from './run-command-handler.js';
import { AddEnvVarHandler } from './add-env-var-handler.js';
import { AddScriptHandler } from './add-script-handler.js';
import { AddDependencyHandler } from './add-dependency-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';

export class ActionHandlerRegistry {
  private handlers: Map<string, BaseActionHandler> = new Map();

  constructor(modifierRegistry: ModifierRegistry) {
    this.initializeHandlers(modifierRegistry);
  }

  /**
   * Initialize all action handlers
   */
  private initializeHandlers(modifierRegistry: ModifierRegistry): void {
    // Create EnhanceFileHandler first
    const enhanceFileHandler = new EnhanceFileHandler(modifierRegistry);
    
    // Register all specialized handlers
    this.registerHandler(new CreateFileHandler(enhanceFileHandler));
    this.registerHandler(enhanceFileHandler);
    this.registerHandler(new InstallPackagesHandler(modifierRegistry));
    this.registerHandler(new RunCommandHandler());
    this.registerHandler(new AddEnvVarHandler());
    this.registerHandler(new AddScriptHandler(modifierRegistry));
    this.registerHandler(new AddDependencyHandler(modifierRegistry));
    
    // Map ADD_DEV_DEPENDENCY to the same handler as ADD_DEPENDENCY
    this.registerHandler('ADD_DEV_DEPENDENCY', new AddDependencyHandler(modifierRegistry));
  }

  /**
   * Register a new action handler
   */
  registerHandler(handler: BaseActionHandler): void;
  registerHandler(actionType: string, handler: BaseActionHandler): void;
  registerHandler(handlerOrType: BaseActionHandler | string, handler?: BaseActionHandler): void {
    if (typeof handlerOrType === 'string') {
      // String-based registration
      this.handlers.set(handlerOrType, handler!);
    } else {
      // Handler-based registration
      const actionType = handlerOrType.getSupportedActionType();
      this.handlers.set(actionType, handlerOrType);
    }
  }

  /**
   * Get handler for a specific action type
   */
  getHandler(actionType: string): BaseActionHandler | null {
    return this.handlers.get(actionType) || null;
  }

  /**
   * Handle an action by dispatching to the appropriate handler
   */
  async handleAction(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs?: VirtualFileSystem
  ): Promise<ActionResult> {
    const handler = this.getHandler(action.type);
    
    if (!handler) {
      return { 
        success: false, 
        error: `No handler found for action type: ${action.type}` 
      };
    }

    try {
      return await handler.handle(action, context, projectRoot, vfs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: `Handler execution error: ${errorMessage}` 
      };
    }
  }

  /**
   * Get all supported action types
   */
  getSupportedActionTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if an action type is supported
   */
  isActionTypeSupported(actionType: string): boolean {
    return this.handlers.has(actionType);
  }
}

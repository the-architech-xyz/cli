/**
 * Base Action Handler
 * 
 * Abstract base class for all specialized action handlers.
 * Implements the "Specialized Workers" pattern in the Executor-Centric architecture.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';

export interface ActionResult {
  success: boolean;
  files?: string[];
  error?: string | undefined;
  message?: string;
}

export abstract class BaseActionHandler {
  /**
   * Handle a specific action type
   */
  abstract handle(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs?: VirtualFileSystem
  ): Promise<ActionResult>;

  /**
   * Get the action type this handler supports
   */
  abstract getSupportedActionType(): string;

  /**
   * Check if this handler can handle the given action
   */
  canHandle(action: BlueprintAction): boolean {
    return action.type === this.getSupportedActionType();
  }

  /**
   * Validate action parameters
   */
  protected validateAction(action: BlueprintAction): { valid: boolean; error?: string } {
    if (!action.type) {
      return { valid: false, error: 'Action type is required' };
    }
    return { valid: true };
  }

  /**
   * Process template strings with context
   */
  protected processTemplate(template: string, context: ProjectContext): string {
    // Simple template processing - replace {{variable}} with context values
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getContextValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get value from context by key path (e.g., 'project.name' -> context.project.name)
   */
  private getContextValue(context: ProjectContext, keyPath: string): any {
    const keys = keyPath.split('.');
    let value: any = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
}

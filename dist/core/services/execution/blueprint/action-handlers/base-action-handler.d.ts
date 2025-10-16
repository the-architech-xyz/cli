/**
 * Base Action Handler
 *
 * Abstract base class for all specialized action handlers.
 * Implements the "Specialized Workers" pattern in the Executor-Centric architecture.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
export interface ActionResult {
    success: boolean;
    files?: string[];
    error?: string | undefined;
    message?: string;
}
export declare abstract class BaseActionHandler {
    /**
     * Handle a specific action type
     */
    abstract handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Get the action type this handler supports
     */
    abstract getSupportedActionType(): string;
    /**
     * Check if this handler can handle the given action
     */
    canHandle(action: BlueprintAction): boolean;
    /**
     * Validate action parameters
     */
    protected validateAction(action: BlueprintAction): {
        valid: boolean;
        error?: string;
    };
    /**
     * Process template strings with context
     */
    protected processTemplate(template: string, context: ProjectContext): string;
    /**
     * Get value from context by key path (e.g., 'project.name' -> context.project.name)
     */
    private getContextValue;
}

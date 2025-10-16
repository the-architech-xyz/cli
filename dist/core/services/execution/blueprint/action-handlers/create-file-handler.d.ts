/**
 * Create File Handler
 *
 * Handles CREATE_FILE actions in both VFS and Direct modes.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
export declare class CreateFileHandler extends BaseActionHandler {
    private enhanceFileHandler;
    constructor(enhanceFileHandler?: BaseActionHandler);
    getSupportedActionType(): string;
    handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Handle Delegation Merge: Transform CREATE_FILE into ENHANCE_FILE
     * Uses the intelligent Modifier system for AST-based merging
     */
    private handleDelegationMerge;
    /**
     * Parse JavaScript config content to extract properties
     */
    private parseJsConfigContent;
    /**
     * Load template content from file and render with merged context
     *
     * The absolute path to a template is always:
     * [MARKETPLACE_ROOT_PATH] + [RESOLVED_MODULE_ID] + templates/ + [TEMPLATE_FILENAME]
     *
     * Where RESOLVED_MODULE_ID is either:
     * - integrations/[shortId] for integration modules
     * - adapters/[shortId] for adapter modules
     */
    private loadTemplate;
    /**
     * Merge action context with global project context for template rendering
     */
    private mergeTemplateContext;
}

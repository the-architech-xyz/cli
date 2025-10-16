/**
 * Run Command Handler
 *
 * Handles RUN_COMMAND actions by executing shell commands.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
export declare class RunCommandHandler extends BaseActionHandler {
    private commandRunner;
    constructor();
    getSupportedActionType(): string;
    handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Ensures the target directory is clean for create-next-app
     * This prevents the "context conflict" issue where create-next-app
     * sees existing files and creates a subdirectory instead
     */
    private ensureCleanDirectory;
}

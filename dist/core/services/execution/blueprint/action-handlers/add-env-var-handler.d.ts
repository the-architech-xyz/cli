/**
 * Add Environment Variable Handler
 *
 * Handles ADD_ENV_VAR actions by adding environment variables to .env files.
 * This handler works in both Direct Mode and VFS Mode.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
export declare class AddEnvVarHandler extends BaseActionHandler {
    getSupportedActionType(): string;
    handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Add environment variable to VFS
     */
    private addEnvVarToVFS;
    /**
     * Add environment variable to disk
     */
    private addEnvVarToDisk;
}

/**
 * Add Script Handler
 *
 * Handles ADD_SCRIPT actions by adding scripts to package.json.
 * This handler REQUIRES VFS mode and uses the Modifier System.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
export declare class AddScriptHandler extends BaseActionHandler {
    private modifierRegistry;
    constructor(modifierRegistry: ModifierRegistry);
    getSupportedActionType(): string;
    handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
}

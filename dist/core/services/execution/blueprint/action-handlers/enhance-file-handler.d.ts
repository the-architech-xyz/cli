/**
 * Enhance File Handler
 *
 * Handles ENHANCE_FILE actions using the Modifier System.
 * This handler REQUIRES VFS mode and is a "Specialized Worker" in the Executor-Centric architecture.
 */
import { BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
export declare class EnhanceFileHandler extends BaseActionHandler {
    private modifierRegistry;
    constructor(modifierRegistry: ModifierRegistry);
    getSupportedActionType(): string;
    handle(action: BlueprintAction, context: ProjectContext, projectRoot: string, vfs?: VirtualFileSystem): Promise<ActionResult>;
    /**
     * Find alternative file with different extension
     * e.g., next.config.js -> next.config.ts
     */
    private findAlternativeFile;
}

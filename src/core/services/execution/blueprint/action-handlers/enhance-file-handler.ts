/**
 * Enhance File Handler
 * 
 * Handles ENHANCE_FILE actions using the Modifier System.
 * This handler REQUIRES VFS mode and is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';

export class EnhanceFileHandler extends BaseActionHandler {
  private modifierRegistry: ModifierRegistry;

  constructor(modifierRegistry: ModifierRegistry) {
    super();
    this.modifierRegistry = modifierRegistry;
  }

  getSupportedActionType(): string {
    return 'ENHANCE_FILE';
  }

  async handle(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs?: VirtualFileSystem
  ): Promise<ActionResult> {
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!action.path) {
      return { success: false, error: 'ENHANCE_FILE action missing path' };
    }

    if (!action.modifier) {
      return { success: false, error: 'ENHANCE_FILE action missing modifier' };
    }

    if (!vfs) {
      return { success: false, error: 'ENHANCE_FILE requires VFS mode' };
    }

    // Process template path
    const filePath = this.processTemplate(action.path, context);

    // Get the modifier from registry
    const modifier = this.modifierRegistry.get(action.modifier);
    if (!modifier) {
      return { success: false, error: `Unknown modifier: ${action.modifier}` };
    }

    try {
      // Check if file exists in VFS, if not create it (fallback: create)
      if (!vfs.fileExists(filePath)) {
        if (action.fallback === 'create') {
          // Create empty file for modifier to work with
          vfs.createFile(filePath, '{}');
          console.log(`  📝 Created file (fallback): ${filePath}`);
        } else {
          return { success: false, error: `File ${filePath} does not exist and no fallback specified` };
        }
      }

      // Execute the modifier
      console.log(`  🔧 Applying modifier '${action.modifier}' to ${filePath}`);
      const modifierResult = await modifier.execute(filePath, action.params || {}, context, vfs);

      if (!modifierResult.success) {
        return { success: false, error: `Modifier execution failed: ${modifierResult.error}` };
      }

      console.log(`  ✨ Enhanced file: ${filePath}`);
      return { 
        success: true, 
        files: [filePath],
        message: `File enhanced with ${action.modifier}: ${filePath}`
      };

    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Modifier execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'enhance_file', filePath: action.path, modifier: action.modifier }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}

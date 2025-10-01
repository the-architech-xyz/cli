/**
 * Add Script Handler
 * 
 * Handles ADD_SCRIPT actions by adding scripts to package.json.
 * This handler REQUIRES VFS mode and uses the Modifier System.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';

export class AddScriptHandler extends BaseActionHandler {
  private modifierRegistry: ModifierRegistry;

  constructor(modifierRegistry: ModifierRegistry) {
    super();
    this.modifierRegistry = modifierRegistry;
  }

  getSupportedActionType(): string {
    return 'ADD_SCRIPT';
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

    if (!vfs) {
      return { 
        success: false, 
        error: 'ADD_SCRIPT action requires VFS mode' 
      };
    }

    if (!action.name || !action.command) {
      return { 
        success: false, 
        error: 'ADD_SCRIPT action missing name or command' 
      };
    }

    const filePath = 'package.json';
    const scriptName = action.name;
    const scriptCommand = this.processTemplate(action.command, context);

    // Ensure package.json exists in VFS
    if (!vfs.fileExists(filePath)) {
      vfs.createFile(filePath, '{}');
    }

    const modifier = this.modifierRegistry.get('package-json-merger');
    if (!modifier) {
      return { 
        success: false, 
        error: 'Package.json merger modifier not found' 
      };
    }

    try {
      
      const params = {
        scripts: {
          [scriptName]: scriptCommand
        }
      };
      
      const modifierResult = await modifier.execute(filePath, params, context, vfs);

      if (!modifierResult.success) {
        return { 
          success: false, 
          error: `Script addition failed: ${modifierResult.error}` 
        };
      }

      return { 
        success: true, 
        message: `Added script: ${scriptName}`,
        files: [filePath]
      };
    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Failed to add script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'add_script', filePath, scriptName }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}

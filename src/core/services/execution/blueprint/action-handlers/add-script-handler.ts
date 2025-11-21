/**
 * Add Script Handler
 * 
 * Handles ADD_SCRIPT actions by adding scripts to package.json.
 * This handler REQUIRES VFS mode and uses the Modifier System.
 */

import { BlueprintAction, AddScriptAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { Logger } from '../../../infrastructure/logging/index.js';

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

    // Type guard to narrow the action type
    const scriptAction = action as AddScriptAction;
    
    if (!scriptAction.name || !scriptAction.command) {
      return { 
        success: false, 
        error: 'ADD_SCRIPT action missing name or command' 
      };
    }

    const filePath = 'package.json';
    
    const scriptName = scriptAction.name;
    const scriptCommand = this.processTemplate(scriptAction.command, context);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : String(error);
      
      Logger.error(
        `Failed to add script: ${errorMessage}`,
        {
          operation: 'add_script',
          filePath,
          scriptName,
          errorStack,
        },
        error instanceof Error ? error : undefined
      );
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
}

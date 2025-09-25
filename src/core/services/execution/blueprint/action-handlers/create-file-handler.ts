/**
 * Create File Handler
 * 
 * Handles CREATE_FILE actions in both VFS and Direct modes.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export class CreateFileHandler extends BaseActionHandler {
  getSupportedActionType(): string {
    return 'CREATE_FILE';
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
      return { success: false, error: 'CREATE_FILE action missing path' };
    }

    if (!action.content) {
      return { success: false, error: 'CREATE_FILE action missing content' };
    }

    // Process template path and content
    const filePath = this.processTemplate(action.path, context);
    const content = this.processTemplate(action.content, context);

    try {
      if (vfs) {
        // VFS mode: Create file in virtual file system
        vfs.createFile(filePath, content);
        console.log(`  📝 Created file (VFS): ${filePath}`);
      } else {
        // Direct mode: Create file directly on disk
        const fullPath = join(projectRoot, filePath);
        await fs.mkdir(dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`  📝 Created file (Direct): ${filePath}`);
      }

      return { 
        success: true, 
        files: [filePath],
        message: `File created: ${filePath}`
      };

    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'create_file', filePath: action.path }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}

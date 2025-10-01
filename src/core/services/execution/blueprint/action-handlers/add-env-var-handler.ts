/**
 * Add Environment Variable Handler
 * 
 * Handles ADD_ENV_VAR actions by adding environment variables to .env files.
 * This handler works in both Direct Mode and VFS Mode.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class AddEnvVarHandler extends BaseActionHandler {
  getSupportedActionType(): string {
    return 'ADD_ENV_VAR';
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

    if (!action.key || action.value === undefined || action.value === null) {
      return { 
        success: false, 
        error: 'ADD_ENV_VAR action missing key or value' 
      };
    }

    const envFilePath = action.path || '.env';
    const key = action.key;
    const value = this.processTemplate(action.value, context);

    try {
      if (vfs) {
        // VFS Mode - add to VFS
        await this.addEnvVarToVFS(vfs, envFilePath, key, value);
        console.log(`  🔧 VFS: Added env var ${key}=${value} to ${envFilePath}`);
      } else {
        // Direct Mode - write to disk
        await this.addEnvVarToDisk(projectRoot, envFilePath, key, value);
        console.log(`  🔧 Disk: Added env var ${key}=${value} to ${envFilePath}`);
      }

      return { 
        success: true, 
        message: `Added environment variable: ${key}`,
        files: [envFilePath]
      };
    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Failed to add environment variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'add_env_var', filePath: envFilePath, key }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }

  /**
   * Add environment variable to VFS
   */
  private async addEnvVarToVFS(vfs: VirtualFileSystem, filePath: string, key: string, value: string): Promise<void> {
    let content = '';
    
    // Read existing content if file exists
    if (vfs.fileExists(filePath)) {
      content = await vfs.readFile(filePath);
    }

    // Add or update the environment variable
    const lines = content.split('\n');
    const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));
    
    const newLine = `${key}=${value}`;
    
    if (keyIndex >= 0) {
      // Update existing variable
      lines[keyIndex] = newLine;
    } else {
      // Add new variable
      lines.push(newLine);
    }

    // Write back to VFS
    vfs.writeFile(filePath, lines.join('\n'));
  }

  /**
   * Add environment variable to disk
   */
  private async addEnvVarToDisk(projectRoot: string, filePath: string, key: string, value: string): Promise<void> {
    const fullPath = join(projectRoot, filePath);
    let content = '';
    
    try {
      // Read existing content if file exists
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, start with empty content
      content = '';
    }

    // Add or update the environment variable
    const lines = content.split('\n');
    const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));
    
    const newLine = `${key}=${value}`;
    
    if (keyIndex >= 0) {
      // Update existing variable
      lines[keyIndex] = newLine;
    } else {
      // Add new variable
      lines.push(newLine);
    }

    // Write back to disk
    await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');
  }
}

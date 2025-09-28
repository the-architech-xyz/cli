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
import { TemplateService } from '../../../file-system/template/template-service.js';
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

    // Handle both content and template properties
    let content: string;
    if (action.template) {
      // Load and process template
      try {
        const templateContent = await this.loadTemplate(action.template, projectRoot);
        content = TemplateService.processTemplate(templateContent, context);
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to load template ${action.template}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    } else if (action.content) {
      // Process inline content
      content = this.processTemplate(action.content, context);
    } else {
      return { success: false, error: 'CREATE_FILE action missing content or template' };
    }

    // Process template path
    const filePath = this.processTemplate(action.path, context);

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

  /**
   * Load template content from file
   */
  private async loadTemplate(templatePath: string, projectRoot: string): Promise<string> {
    // Template paths are relative to the marketplace directory
    // The projectRoot is ./test-full-app, so we need to go up to find marketplace
    const marketplacePath = join(projectRoot, '..', '..', 'marketplace');
    const fullTemplatePath = join(marketplacePath, templatePath);
    
    try {
      const content = await fs.readFile(fullTemplatePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Template file not found: ${fullTemplatePath}`);
    }
  }
}

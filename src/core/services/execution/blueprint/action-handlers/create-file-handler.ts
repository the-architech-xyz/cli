/**
 * Create File Handler
 * 
 * Handles CREATE_FILE actions in both VFS and Direct modes.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ProjectContext, ConflictResolution, MergeInstructions } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { TemplateService } from '../../../file-system/template/template-service.js';
import { MarketplaceService } from '../../../marketplace/marketplace-service.js';
import { promises as fs } from 'fs';
import { join, dirname, resolve as pathResolve } from 'path';

export class CreateFileHandler extends BaseActionHandler {
  private enhanceFileHandler: BaseActionHandler | null = null;

  constructor(enhanceFileHandler?: BaseActionHandler) {
    super();
    this.enhanceFileHandler = enhanceFileHandler || null;
  }

  getSupportedActionType(): string {
    return 'CREATE_FILE';
  }

  async handle(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs: VirtualFileSystem
  ): Promise<ActionResult> {
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!action.path) {
      return { success: false, error: 'CREATE_FILE action missing path' };
    }

    // Process template path using TemplateService for full path variable support
    const filePath = TemplateService.processTemplate(action.path, context);

    // Check if file already exists in VFS
    const fileExists = vfs.fileExists(filePath);
    
    if (fileExists) {
      console.log(`🔄 File already exists: ${filePath}, applying conflict resolution...`);
      
      // Apply conflict resolution strategy
      const conflictResolution = action.conflictResolution || { strategy: 'error' };
      
      switch (conflictResolution.strategy) {
        case 'skip':
          console.log(`  ⏭️ Skipping file creation: ${filePath}`);
          return { 
            success: true, 
            files: [filePath],
            message: `File skipped (already exists): ${filePath}`
          };
          
        case 'replace':
          console.log(`  🔄 Replacing existing file: ${filePath}`);
          // Continue with normal file creation (will overwrite)
          break;
          
        case 'merge':
          console.log(`  🔀 Merging with existing file: ${filePath}`);
          return await this.handleDelegationMerge(action, context, projectRoot, vfs, filePath);
          
        case 'error':
        default:
          return { 
            success: false, 
            error: `File already exists: ${filePath}` 
          };
      }
    }

    // Handle both content and template properties
    let content: string;
    if (action.template) {
      // Load and process template
      try {
        const templateContent = await this.loadTemplate(action.template, projectRoot, context);
        content = TemplateService.processTemplate(templateContent, context);
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to load template ${action.template}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    } else if (action.content) {
      // Process inline content using TemplateService for full template support
      content = TemplateService.processTemplate(action.content, context);
    } else {
      return { success: false, error: 'CREATE_FILE action missing content or template' };
    }

    try {
      // Create file in VFS (unified VFS mode)
      vfs.createFile(filePath, content);
      console.log(`  📝 Created file: ${filePath}`);

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
   * Handle Delegation Merge: Transform CREATE_FILE into ENHANCE_FILE
   * Uses the intelligent Modifier system for AST-based merging
   */
  private async handleDelegationMerge(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs: VirtualFileSystem,
    filePath: string
  ): Promise<ActionResult> {
    try {
      // Check if mergeInstructions is defined
      if (!action.mergeInstructions) {
        return {
          success: false,
          error: 'Smart merge requires mergeInstructions to be defined'
        };
      }

      // Get new content from template or content
      let newContent: string;
      if (action.template) {
        const templateContent = await this.loadTemplate(action.template, projectRoot, context);
        newContent = TemplateService.processTemplate(templateContent, context);
      } else if (action.content) {
        newContent = TemplateService.processTemplate(action.content, context);
      } else {
        return {
          success: false,
          error: 'Smart merge requires content or template'
        };
      }

      // For js-config-merger, we need to parse the content to extract properties
      let targetProperties: any = null;
      if (action.mergeInstructions.modifier === 'js-config-merger') {
        try {
          // Parse the JavaScript content to extract the config object
          targetProperties = await this.parseJsConfigContent(newContent, action.mergeInstructions.params?.exportName || 'default');
        } catch (error) {
          return {
            success: false,
            error: `Failed to parse JavaScript config content: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      // Dynamically construct ENHANCE_FILE action
      const enhanceAction: BlueprintAction = {
        type: 'ENHANCE_FILE',
        path: filePath,
        modifier: action.mergeInstructions.modifier || 'js-config-merger',
        params: {
          ...action.mergeInstructions.params,
          content: newContent,
          targetProperties: targetProperties,
          strategy: action.mergeInstructions.strategy || 'deep-merge'
        }
      };

      // Get EnhanceFileHandler and delegate
      if (!this.enhanceFileHandler) {
        return {
          success: false,
          error: 'ENHANCE_FILE handler not available for delegation merge'
        };
      }

      // Delegate to EnhanceFileHandler
      const result = await this.enhanceFileHandler.handle(enhanceAction, context, projectRoot, vfs);

      if (result.success) {
        console.log(`  🔀 Delegation merge completed: ${filePath}`);
        return {
          success: true,
          files: [filePath],
          message: `File merged via delegation: ${filePath}`
        };
      } else {
        return {
          success: false,
          error: `Delegation merge failed: ${result.error}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Delegation merge error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse JavaScript config content to extract properties
   */
  private async parseJsConfigContent(content: string, exportName: string): Promise<any> {
    try {
      // For now, let's use a simple approach: evaluate the JavaScript content
      // This is safe because we're only parsing our own template content
      const vm = await import('vm');
      const context = { module: { exports: {} }, exports: {} };
      
      // Create a safe context for evaluation
      const sandbox: any = {
        module: { exports: {} },
        exports: {},
        require: () => ({}), // Mock require function
        console: { log: () => {} } // Mock console
      };
      
      // Evaluate the content
      vm.createContext(sandbox);
      vm.runInContext(content, sandbox);
      
      // Extract the config object based on export type
      if (exportName === 'default') {
        return sandbox.module.exports.default || sandbox.module.exports;
      } else if (exportName === 'module.exports') {
        return sandbox.module.exports;
      } else {
        return sandbox.module.exports[exportName] || sandbox.module.exports;
      }
    } catch (error) {
      // If evaluation fails, try to parse as JSON (for simple configs)
      try {
        return JSON.parse(content);
      } catch {
        throw new Error(`Failed to parse JavaScript config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Load template content from file
   * 
   * The absolute path to a template is always:
   * [MARKETPLACE_ROOT_PATH] + [RESOLVED_MODULE_ID] + templates/ + [TEMPLATE_FILENAME]
   * 
   * Where RESOLVED_MODULE_ID is either:
   * - integrations/[shortId] for integration modules
   * - adapters/[shortId] for adapter modules
   */
  private async loadTemplate(templatePath: string, projectRoot: string, context: ProjectContext): Promise<string> {
    const moduleId = context.module.id;
    return await MarketplaceService.loadTemplate(moduleId, templatePath);
  }

}

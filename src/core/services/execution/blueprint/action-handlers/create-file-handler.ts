/**
 * Create File Handler
 * 
 * Handles CREATE_FILE actions in both VFS and Direct modes.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ConflictResolution, MergeInstructions, CreateFileAction, BlueprintActionType, ModifierType } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
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
    // Type guard to narrow the action type
    const createAction = action as CreateFileAction & { context?: Record<string, any> };
    
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    if (!createAction.path) {
      return { success: false, error: 'CREATE_FILE action missing path' };
    }

    // Process template path using TemplateService for full path variable support
    const filePath = TemplateService.processTemplate(createAction.path, context);

    // Handle both content and template properties first
    let content: string;
    if (createAction.template) {
      // Load and process template with action context
      try {
        content = await this.loadTemplate(createAction.template, projectRoot, context, createAction.context);
      } catch (error) {
        return { 
          success: false, 
          error: `Failed to load template ${createAction.template}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    } else if (createAction.content) {
      // Process inline content using TemplateService for full template support
      content = TemplateService.processTemplate(createAction.content, context);
    } else {
      return { success: false, error: 'CREATE_FILE action missing content or template' };
    }

    // Check if file already exists in VFS
    const fileExists = vfs.fileExists(filePath);
    
    if (fileExists) {
      console.log(`🔄 File already exists: ${filePath}, applying conflict resolution...`);
      
      // Apply conflict resolution strategy - default to 'replace' for CREATE_FILE actions
      const conflictResolution = createAction.conflictResolution || { strategy: 'replace', priority: 1 };
      
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
          // Use writeFile for replacement instead of createFile
          try {
            vfs.writeFile(filePath, content);
            return { 
              success: true, 
              files: [filePath],
              message: `File replaced: ${filePath}`
            };
          } catch (error) {
            return { 
              success: false, 
              error: `Failed to replace file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
          
        case 'merge':
          console.log(`  🔀 Merging with existing file: ${filePath}`);
          return await this.handleDelegationMerge(action, context, projectRoot, vfs, filePath, createAction);
          
        case 'error':
        default:
          return { 
            success: false, 
            error: `File already exists: ${filePath}` 
          };
      }
    }

    try {
      // Create file in VFS (unified VFS mode)
      vfs.createFile(filePath, content);

      return { 
        success: true, 
        files: [filePath],
        message: `File created: ${filePath}`
      };

    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'create_file', filePath: createAction.path }
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
    filePath: string,
    createAction: CreateFileAction
  ): Promise<ActionResult> {
    try {
      // Check if mergeInstructions is defined
      if (!createAction.mergeInstructions) {
        return {
          success: false,
          error: 'Smart merge requires mergeInstructions to be defined'
        };
      }

      // Get new content from template or content
      let newContent: string;
      if (createAction.template) {
        newContent = await this.loadTemplate(createAction.template, projectRoot, context, (createAction as any).context);
      } else if (createAction.content) {
        newContent = TemplateService.processTemplate(createAction.content, context);
      } else {
        return {
          success: false,
          error: 'Smart merge requires content or template'
        };
      }

      // For js-config-merger, we need to parse the content to extract properties
      let targetProperties: any = null;
      if (createAction.mergeInstructions.modifier === 'js-config-merger') {
        try {
          // Parse the JavaScript content to extract the config object
          targetProperties = await this.parseJsConfigContent(newContent, createAction.mergeInstructions.params?.exportName || 'default');
        } catch (error) {
          return {
            success: false,
            error: `Failed to parse JavaScript config content: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }

      // Dynamically construct ENHANCE_FILE action
      const enhanceAction: BlueprintAction = {
        type: BlueprintActionType.ENHANCE_FILE,

        path: filePath,
        modifier: (createAction.mergeInstructions.modifier as ModifierType) || ModifierType.JS_CONFIG_MERGER,
        params: {
          ...createAction.mergeInstructions.params,
          content: newContent,
          targetProperties: targetProperties,
          strategy: createAction.mergeInstructions.strategy || 'deep-merge'
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
   * Load template content from file and render with merged context
   * 
   * The absolute path to a template is always:
   * [MARKETPLACE_ROOT_PATH] + [RESOLVED_MODULE_ID] + templates/ + [TEMPLATE_FILENAME]
   * 
   * Where RESOLVED_MODULE_ID is either:
   * - integrations/[shortId] for integration modules
   * - adapters/[shortId] for adapter modules
   */
  private async loadTemplate(templatePath: string, projectRoot: string, context: ProjectContext, actionContext?: Record<string, any>): Promise<string> {
    const moduleId = context.module.id;
    const templateContent = await MarketplaceService.loadTemplate(moduleId, templatePath);
    
    // Merge action context with global context for template rendering
    const mergedContext = this.mergeTemplateContext(context, actionContext);
    
    // Render template with merged context
    return TemplateService.processTemplate(templateContent, mergedContext);
  }

  /**
   * Merge action context with global project context for template rendering
   */
  private mergeTemplateContext(projectContext: ProjectContext, actionContext?: Record<string, any>): ProjectContext {
    if (!actionContext) {
      return projectContext;
    }

    // Create a deep copy of the project context to avoid mutations
    const mergedContext = JSON.parse(JSON.stringify(projectContext));
    
    // Merge action context into the global context
    // Action context takes precedence over global context
    Object.assign(mergedContext, actionContext);
    
    // Ensure features array is properly merged
    if (actionContext.features && Array.isArray(actionContext.features)) {
      mergedContext.features = actionContext.features;
    }
    
    return mergedContext;
  }

}

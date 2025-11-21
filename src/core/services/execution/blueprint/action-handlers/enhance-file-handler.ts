/**
 * Enhance File Handler
 * 
 * Handles ENHANCE_FILE actions using the Modifier System.
 * This handler REQUIRES VFS mode and is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, EnhanceFileAction, AvailableModifier } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { Logger } from '../../../infrastructure/logging/index.js';
import { TemplateService } from '../../../file-system/template/template-service.js';

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

    // Type guard to narrow the action type
    const enhanceAction = action as EnhanceFileAction;
    
    if (!enhanceAction.path) {
      return { success: false, error: 'ENHANCE_FILE action missing path' };
    }

    if (!enhanceAction.modifier) {
      return { success: false, error: 'ENHANCE_FILE action missing modifier' };
    }

    if (!vfs) {
      return { success: false, error: 'ENHANCE_FILE requires VFS mode' };
    }

    // CRITICAL FIX: Use TemplateService for full path variable support
    const originalPath = enhanceAction.path;
    const filePath = TemplateService.processTemplate(enhanceAction.path, context);
    
    if (originalPath !== filePath) {
      console.log(`  🔄 Path resolved: ${originalPath} → ${filePath}`);
    }

    // Get the modifier from registry
    const modifier = this.modifierRegistry.get(enhanceAction.modifier as AvailableModifier);
    if (!modifier) {
      return { success: false, error: `Unknown modifier: ${enhanceAction.modifier}` };
    }

    try {
      // Check if file exists in VFS, if not try smart fallback
      let actualFilePath = filePath;
      if (!vfs.fileExists(filePath)) {
        // Try smart fallback: check for alternative extensions
        const fallbackPath = this.findAlternativeFile(filePath, vfs);
        if (fallbackPath) {
          actualFilePath = fallbackPath;
          console.log(`  🔄 Using alternative file: ${fallbackPath} (instead of ${filePath})`);
        } else if (enhanceAction.fallback === 'create' || !enhanceAction.fallback) {
          // CRITICAL FIX: Use RESOLVED filePath, not original
          // The filePath was already resolved via TemplateService.processTemplate above
          vfs.createFile(filePath, '');
          console.log(`  📝 Created file (fallback): ${filePath}`);
        } else {
          return { success: false, error: `File ${filePath} does not exist and no fallback specified` };
        }
      }

      // Execute the modifier
      console.log(`  🔧 Applying modifier '${enhanceAction.modifier}' to ${actualFilePath}`);
      const modifierResult = await modifier.execute(actualFilePath, enhanceAction.params || {}, context, vfs);

      if (!modifierResult.success) {
        return { success: false, error: `Modifier execution failed: ${modifierResult.error}` };
      }

      console.log(`  ✨ Enhanced file: ${actualFilePath}`);
      return { 
        success: true, 
        files: [actualFilePath],
        message: `File enhanced with ${enhanceAction.modifier}: ${actualFilePath}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : String(error);
      
      Logger.error(
        `Modifier execution error: ${errorMessage}`,
        {
          operation: 'enhance_file',
          filePath: enhanceAction.path,
          modifier: enhanceAction.modifier,
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

  /**
   * Find alternative file with different extension
   * e.g., next.config.js -> next.config.ts
   */
  private findAlternativeFile(originalPath: string, vfs: VirtualFileSystem): string | null {
    const pathParts = originalPath.split('.');
    if (pathParts.length < 2) return null;
    
    const extension = pathParts.pop();
    const basePath = pathParts.join('.');
    
    // Define common extension alternatives
    const extensionAlternatives: { [key: string]: string[] } = {
      'js': ['ts', 'mjs', 'cjs'],
      'ts': ['js', 'mts', 'cts'],
      'mjs': ['js', 'ts'],
      'cjs': ['js', 'ts'],
      'mts': ['ts', 'js'],
      'cts': ['ts', 'js']
    };
    
    const alternatives = extensionAlternatives[extension || ''] || [];
    
    for (const altExt of alternatives) {
      const alternativePath = `${basePath}.${altExt}`;
      if (vfs.fileExists(alternativePath)) {
        return alternativePath;
      }
    }
    
    return null;
  }
}

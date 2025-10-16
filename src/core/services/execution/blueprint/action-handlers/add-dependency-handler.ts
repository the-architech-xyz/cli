/**
 * Add Dependency Handler
 * 
 * Handles ADD_DEPENDENCY and ADD_DEV_DEPENDENCY actions by adding dependencies to package.json.
 * This handler REQUIRES VFS mode and uses the Modifier System.
 */

import { BlueprintAction, AddDependencyAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';

export class AddDependencyHandler extends BaseActionHandler {
  private modifierRegistry: ModifierRegistry;

  constructor(modifierRegistry: ModifierRegistry) {
    super();
    this.modifierRegistry = modifierRegistry;
  }

  getSupportedActionType(): string {
    return 'ADD_DEPENDENCY';
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
        error: 'ADD_DEPENDENCY action requires VFS mode' 
      };
    }

    // Type guard to narrow the action type
    const dependencyAction = action as AddDependencyAction;
    
    if (!dependencyAction.packages || dependencyAction.packages.length === 0) {
      return { 
        success: false, 
        error: 'ADD_DEPENDENCY action missing packages array' 
      };
    }

    const filePath = 'package.json';
    const packages = dependencyAction.packages;
    const isDevDependency = dependencyAction.isDev || false;

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
      const dependencyType = isDevDependency ? 'devDependencies' : 'dependencies';
      console.log(`  📦 VFS: Adding ${dependencyType} for packages: ${packages.join(', ')}`);
      
      // Convert packages array to object with latest version
      const packageObj: Record<string, string> = {};
      packages.forEach(pkg => {
        packageObj[pkg] = 'latest';
      });
      
      const params = {
        [dependencyType]: packageObj
      };
      
      const modifierResult = await modifier.execute(filePath, params, context, vfs);

      if (!modifierResult.success) {
        return { 
          success: false, 
          error: `Dependency addition failed: ${modifierResult.error}` 
        };
      }

      console.log(`  ✅ VFS: ${dependencyType} for packages ${packages.join(', ')} added to ${filePath}`);
      return { 
        success: true, 
        message: `Added ${dependencyType}: ${packages.join(', ')}`,
        files: [filePath]
      };
    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Failed to add dependency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'add_dependency', filePath, packages: packages.join(', ') }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}

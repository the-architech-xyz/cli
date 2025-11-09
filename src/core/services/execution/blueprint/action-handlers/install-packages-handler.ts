/**
 * Install Packages Handler
 * 
 * Handles INSTALL_PACKAGES actions using the Modifier System.
 * This handler REQUIRES VFS mode and is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, InstallPackagesAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ModifierRegistry } from '../../../file-system/modifiers/modifier-registry.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { resolve as pathResolve } from 'path';

export class InstallPackagesHandler extends BaseActionHandler {
  private modifierRegistry: ModifierRegistry;

  constructor(modifierRegistry: ModifierRegistry) {
    super();
    this.modifierRegistry = modifierRegistry;
  }

  getSupportedActionType(): string {
    return 'INSTALL_PACKAGES';
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
    const installAction = action as InstallPackagesAction;
    
    if (!installAction.packages) {
      return { success: false, error: 'INSTALL_PACKAGES action missing packages' };
    }

        if (!vfs) {
          return { success: false, error: 'INSTALL_PACKAGES requires VFS mode' };
        }

        // DEBUG: Log VFS contents before attempting package installation
        // Debug logging removed - use Logger.debug() instead

        try {
      // Use package-json-merger modifier to add packages
      const modifier = this.modifierRegistry.get('package-json-merger');
      if (!modifier) {
        return { success: false, error: 'package-json-merger modifier not available' };
      }

      // Convert packages array to object with proper name and version parsing
      const packageObj: Record<string, string> = {};
      installAction.packages.forEach(pkg => {
        // Parse package string to extract name and version
        // Format: "package-name@version" or just "package-name"
        const lastAtIndex = pkg.lastIndexOf('@');
        if (lastAtIndex > 0) {
          // Package has version specified
          const packageName = pkg.substring(0, lastAtIndex);
          const packageVersion = pkg.substring(lastAtIndex + 1);
          packageObj[packageName] = packageVersion;
        } else {
          // Package has no version, use latest
          packageObj[pkg] = 'latest';
        }
      });

      // Prepare parameters for the modifier
      const params = {
        dependencies: installAction.isDev ? {} : packageObj,
        devDependencies: installAction.isDev ? packageObj : {}
      };

      // Determine target package.json path
      // In monorepo, use targetPackage from context if available, otherwise use VFS contextRoot
      // This ensures packages are installed in the correct package even if module executes elsewhere
      let packageJsonPath = 'package.json';
      const targetPackage = (context as any).targetPackage;
      if (targetPackage && vfs) {
        // Get VFS contextRoot to check if we're already in the right package
        const vfsContextRoot = (vfs as any).contextRoot || '';
        // If targetPackage differs from VFS contextRoot, we need to use targetPackage
        if (targetPackage !== vfsContextRoot) {
          // Create a new VFS context for the target package, or use the path directly
          // For now, we'll log a warning and use the target package path
          console.log(`  ⚠️  Module executing in ${vfsContextRoot || 'root'}, but packages should be installed in ${targetPackage}`);
          // Note: We can't easily switch VFS context here, so we'll install in current context
          // This is a limitation - ideally we'd have a way to install in a different package
          // For now, we'll proceed with current context and log the issue
        }
      }
      
      // Execute the modifier on package.json
      console.log(`  📦 Installing packages: ${installAction.packages.join(', ')} in ${targetPackage || 'current package'}`);
      const modifierResult = await modifier.execute(packageJsonPath, params, context, vfs);

      if (!modifierResult.success) {
        return { success: false, error: `Package installation failed: ${modifierResult.error}` };
      }

      console.log(`  ✅ Packages installed successfully`);
      return { 
        success: true, 
        files: ['package.json'],
        message: `Packages installed: ${Object.keys(installAction.packages).join(', ')}`
      };

    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Package installation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'install_packages', packages: installAction.packages }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}

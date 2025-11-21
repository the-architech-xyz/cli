/**
 * Install Packages Handler
 *
 * Handles INSTALL_PACKAGES actions using the Modifier System.
 * This handler REQUIRES VFS mode and is a "Specialized Worker" in the Executor-Centric architecture.
 */
import { BaseActionHandler } from './base-action-handler.js';
import { Logger } from '../../../infrastructure/logging/index.js';
import * as path from 'path';
export class InstallPackagesHandler extends BaseActionHandler {
    modifierRegistry;
    constructor(modifierRegistry) {
        super();
        this.modifierRegistry = modifierRegistry;
    }
    getSupportedActionType() {
        return 'INSTALL_PACKAGES';
    }
    async handle(action, context, projectRoot, vfs) {
        const validation = this.validateAction(action);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        // Type guard to narrow the action type
        const installAction = action;
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
            const packageObj = {};
            installAction.packages.forEach(pkg => {
                // Parse package string to extract name and version
                // Format: "package-name@version" or just "package-name"
                const lastAtIndex = pkg.lastIndexOf('@');
                if (lastAtIndex > 0) {
                    // Package has version specified
                    const packageName = pkg.substring(0, lastAtIndex);
                    const packageVersion = pkg.substring(lastAtIndex + 1);
                    packageObj[packageName] = packageVersion;
                }
                else {
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
            // In monorepo, use targetPackage from context if available
            // VFS now always uses project root, so package.json path is relative to project root
            let packageJsonPath = 'package.json';
            const targetPackage = context.targetPackage;
            const targetApp = context.targetApp; // For app execution context
            // Priority: targetPackage > targetApp > root
            if (targetPackage && targetPackage !== 'root' && vfs) {
                // VFS projectRoot is always the project root, so we can use targetPackage directly
                // The package.json path will be resolved relative to project root
                packageJsonPath = path.join(targetPackage, 'package.json');
                console.log(`  📦 Installing packages in ${targetPackage}`);
            }
            else if (targetApp && vfs) {
                // If executing in app context, install to app's package.json
                const appPath = `apps/${targetApp}`;
                packageJsonPath = path.join(appPath, 'package.json');
                console.log(`  📦 Installing packages in app: ${targetApp} (${appPath})`);
            }
            else if (!targetPackage || targetPackage === 'root') {
                // If no targetPackage or it's 'root', warn but still install in root
                // This should be rare - most modules should have a targetPackage or targetApp
                Logger.warn(`Installing packages in root package.json (no targetPackage or targetApp set for module)`, {
                    moduleId: context.moduleId,
                    packages: installAction.packages,
                    hasTargetPackage: !!targetPackage,
                    hasTargetApp: !!targetApp
                });
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : String(error);
            Logger.error(`Package installation error: ${errorMessage}`, {
                operation: 'install_packages',
                packages: installAction.packages,
                errorStack,
            }, error instanceof Error ? error : undefined);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
}
//# sourceMappingURL=install-packages-handler.js.map
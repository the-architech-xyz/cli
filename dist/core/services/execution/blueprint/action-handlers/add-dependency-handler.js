/**
 * Add Dependency Handler
 *
 * Handles ADD_DEPENDENCY and ADD_DEV_DEPENDENCY actions by adding dependencies to package.json.
 * This handler REQUIRES VFS mode and uses the Modifier System.
 */
import { BaseActionHandler } from './base-action-handler.js';
import { Logger } from '../../../infrastructure/logging/index.js';
export class AddDependencyHandler extends BaseActionHandler {
    modifierRegistry;
    constructor(modifierRegistry) {
        super();
        this.modifierRegistry = modifierRegistry;
    }
    getSupportedActionType() {
        return 'ADD_DEPENDENCY';
    }
    async handle(action, context, projectRoot, vfs) {
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
        const dependencyAction = action;
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
            const packageObj = {};
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : String(error);
            Logger.error(`Failed to add dependency: ${errorMessage}`, {
                operation: 'add_dependency',
                filePath,
                packages: packages.join(', '),
                errorStack,
            }, error instanceof Error ? error : undefined);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
}
//# sourceMappingURL=add-dependency-handler.js.map
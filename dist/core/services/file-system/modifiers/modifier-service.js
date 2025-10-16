/**
 * Modifier Service
 *
 * Centralized service for all file modification operations.
 * Handles package.json merging, tsconfig enhancement, and other file modifications.
 */
// import { ModifierDefinition } from '@thearchitech.xyz/types'; // Not available in current types
import * as fs from 'fs/promises';
import merge from 'deepmerge';
export class BaseModifier {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
}
/**
 * Package.json Merger Modifier
 */
export class PackageJsonMerger extends BaseModifier {
    async execute(filePath, params, context) {
        try {
            const { dependencies, devDependencies, scripts } = params;
            // Read existing package.json
            const existingContent = await fs.readFile(filePath, 'utf-8');
            const existing = JSON.parse(existingContent);
            // Merge dependencies
            if (dependencies) {
                existing.dependencies = { ...existing.dependencies, ...dependencies };
            }
            if (devDependencies) {
                existing.devDependencies = { ...existing.devDependencies, ...devDependencies };
            }
            if (scripts) {
                existing.scripts = { ...existing.scripts, ...scripts };
            }
            // Write back
            await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
            return { success: true, message: 'Package.json merged successfully' };
        }
        catch (error) {
            return { success: false, error: `Failed to merge package.json: ${error}` };
        }
    }
}
/**
 * TSConfig Enhancer Modifier
 */
export class TSConfigEnhancer extends BaseModifier {
    async execute(filePath, params, context) {
        try {
            const { compilerOptions, include, exclude } = params;
            // Read existing tsconfig.json
            const existingContent = await fs.readFile(filePath, 'utf-8');
            const existing = JSON.parse(existingContent);
            // Merge compiler options
            if (compilerOptions) {
                existing.compilerOptions = merge(existing.compilerOptions || {}, compilerOptions);
            }
            if (include) {
                existing.include = [...(existing.include || []), ...include];
            }
            if (exclude) {
                existing.exclude = [...(existing.exclude || []), ...exclude];
            }
            // Write back
            await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
            return { success: true, message: 'TSConfig enhanced successfully' };
        }
        catch (error) {
            return { success: false, error: `Failed to enhance tsconfig.json: ${error}` };
        }
    }
}
// ModifierRegistry is now in modifier-registry.ts
//# sourceMappingURL=modifier-service.js.map
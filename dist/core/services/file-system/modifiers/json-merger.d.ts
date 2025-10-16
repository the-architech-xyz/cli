/**
 * JSON Merger Modifier
 *
 * Performs deep merge on any JSON file (package.json, tsconfig.json, etc.)
 * This is a generic version that works with any JSON structure.
 *
 * Use Cases:
 * - Merging package.json (dependencies, scripts)
 * - Merging tsconfig.json (paths, compilerOptions)
 * - Merging any JSON configuration file
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export interface JsonMergerParams extends ModifierParams {
    merge: Record<string, any>;
    strategy?: 'deep' | 'shallow';
    arrayMergeStrategy?: 'concat' | 'replace' | 'unique';
}
export declare class JsonMergerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: JsonMergerParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Check if value is a plain object
     */
    private isObject;
}

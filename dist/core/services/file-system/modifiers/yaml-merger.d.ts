/**
 * YAML Merger Modifier
 *
 * Performs deep merge on YAML files (docker-compose.yml, etc.)
 * This is a generic version that works with any YAML structure.
 *
 * Use Cases:
 * - Merging docker-compose.yml files
 * - Merging any YAML configuration file
 * - Combining YAML configurations from templates
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export interface YamlMergerParams extends ModifierParams {
    mergePath: string;
    strategy?: 'deep' | 'shallow';
    arrayMergeStrategy?: 'concat' | 'replace' | 'unique';
}
export declare class YamlMergerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: YamlMergerParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Check if value is a plain object
     */
    private isObject;
    /**
     * Process template strings with context
     */
    private processTemplate;
    /**
     * Get value from context by key path (e.g., 'project.name' -> context.project.name)
     */
    private getContextValue;
}

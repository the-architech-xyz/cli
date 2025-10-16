/**
 * JavaScript Config Merger Modifier
 *
 * Intelligently deep-merges properties into JavaScript/TypeScript configuration objects.
 * Uses AST-based merging to preserve code structure and formatting while adding new properties.
 *
 * Supports:
 * - export default {...}
 * - module.exports = {...}
 * - export const config = {...}
 * - Deep merging of nested objects and arrays
 * - Preserving existing code style and comments
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class JsConfigMergerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Parse config content to extract properties to merge
     */
    private parseConfigContent;
    /**
     * Find the appropriate export declaration
     */
    private findExportDeclaration;
    /**
     * Extract object literal from export declaration
     */
    private extractObjectLiteral;
    /**
     * Convert AST object literal to plain JavaScript object
     */
    private astToObject;
    /**
     * Convert AST value to plain JavaScript object
     */
    private astValueToObject;
    /**
     * Perform AST-based merge of configuration
     */
    private mergeConfigAst;
    /**
     * Merge properties into the AST object literal
     */
    private mergeProperties;
    /**
     * Check if we should deep merge based on types and strategy
     */
    private shouldDeepMerge;
    /**
     * Deep merge a property
     */
    private deepMergeProperty;
    /**
     * Deep merge two objects
     */
    private deepMergeObjects;
    /**
     * Generate JavaScript config content from object
     */
    private generateConfigContent;
    /**
     * Convert object to JavaScript string representation
     */
    private objectToJavaScript;
    /**
     * Create AST value from JavaScript object
     */
    private createAstValue;
}

/**
 * TypeScript Module Enhancer Modifier
 *
 * Enhances TypeScript modules by:
 * - Adding imports (named, default, namespace, type imports)
 * - Appending top-level statements (functions, constants, interfaces, types)
 *
 * This is essential for integration modules that need to extend existing TypeScript files
 * with new functionality without replacing the entire file.
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class TsModuleEnhancerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
    /**
     * Add imports to the source file
     */
    private addImports;
    /**
     * Append statements to the source file
     */
    private appendStatements;
}

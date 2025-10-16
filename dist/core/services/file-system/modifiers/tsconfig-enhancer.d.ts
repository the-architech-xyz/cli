/**
 * TypeScript Config Enhancer Modifier
 *
 * Enhances tsconfig.json with additional compiler options, paths, and includes.
 * This is essential for proper TypeScript configuration in Next.js projects.
 */
import { BaseModifier, ModifierParams, ModifierResult } from './base-modifier.js';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
export declare class TsconfigEnhancerModifier extends BaseModifier {
    getDescription(): string;
    getSupportedFileTypes(): string[];
    getParamsSchema(): any;
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
    private enhanceTsconfig;
    private mergeCompilerOptions;
    private mergePaths;
    private mergeArray;
}

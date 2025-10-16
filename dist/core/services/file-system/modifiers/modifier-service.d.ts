/**
 * Modifier Service
 *
 * Centralized service for all file modification operations.
 * Handles package.json merging, tsconfig enhancement, and other file modifications.
 */
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { FileModificationEngine } from '../file-engine/file-modification-engine.js';
export interface ModifierParams {
    [key: string]: any;
}
export interface ModifierResult {
    success: boolean;
    message?: string;
    error?: string;
}
export declare abstract class BaseModifier {
    protected engine: FileModificationEngine;
    constructor(engine: FileModificationEngine);
    /**
     * Execute the modifier on the specified file
     */
    abstract execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
}
/**
 * Package.json Merger Modifier
 */
export declare class PackageJsonMerger extends BaseModifier {
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
}
/**
 * TSConfig Enhancer Modifier
 */
export declare class TSConfigEnhancer extends BaseModifier {
    execute(filePath: string, params: ModifierParams, context: ProjectContext): Promise<ModifierResult>;
}

/**
 * Base Modifier - Abstract Base Class for All Modifiers
 *
 * Provides a standardized interface and common functionality for all modifiers.
 * All specific modifiers should extend this class to ensure consistency.
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
    /**
     * Get the JSON schema for parameter validation
     */
    abstract getParamsSchema(): any;
    /**
     * Get human-readable description of what this modifier does
     */
    abstract getDescription(): string;
    /**
     * Get list of file types this modifier supports
     */
    abstract getSupportedFileTypes(): string[];
    /**
     * Validate parameters against the schema
     */
    validateParams(params: ModifierParams): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Check if this modifier supports the given file type
     */
    supportsFileType(filePath: string): boolean;
    /**
     * Read file content from VFS or disk
     */
    protected readFile(filePath: string): Promise<string>;
    /**
     * Write file content to VFS
     */
    protected writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Modify TypeScript file using AST
     */
    protected modifyTsFile(filePath: string, modificationFunction: (sourceFile: any) => void): Promise<ModifierResult>;
    /**
     * Merge JSON content
     */
    protected mergeJsonFile(filePath: string, contentToMerge: any): Promise<ModifierResult>;
}

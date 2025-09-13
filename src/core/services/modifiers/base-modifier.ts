/**
 * Base Modifier - Abstract Base Class for All Modifiers
 * 
 * Provides a standardized interface and common functionality for all modifiers.
 * All specific modifiers should extend this class to ensure consistency.
 */

import { ProjectContext } from '../../../types/agent.js';
import { FileModificationEngine } from '../file-engine/file-modification-engine.js';

export interface ModifierParams {
  [key: string]: any;
}

export interface ModifierResult {
  success: boolean;
  message?: string;
  error?: string;
}

export abstract class BaseModifier {
  protected engine: FileModificationEngine;

  constructor(engine: FileModificationEngine) {
    this.engine = engine;
  }

  /**
   * Execute the modifier on the specified file
   */
  abstract execute(
    filePath: string, 
    params: ModifierParams, 
    context: ProjectContext
  ): Promise<ModifierResult>;

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
  validateParams(params: ModifierParams): { valid: boolean; errors: string[] } {
    const schema = this.getParamsSchema();
    const errors: string[] = [];

    // Basic validation - can be enhanced with a proper JSON schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in params)) {
          errors.push(`Required parameter '${field}' is missing`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if this modifier supports the given file type
   */
  supportsFileType(filePath: string): boolean {
    const supportedTypes = this.getSupportedFileTypes();
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    if (!extension) return false;
    
    return supportedTypes.includes(extension) || supportedTypes.includes('*');
  }

  /**
   * Read file content from VFS or disk
   */
  protected async readFile(filePath: string): Promise<string> {
    return await this.engine.readFile(filePath);
  }

  /**
   * Write file content to VFS
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    await this.engine.createFile(filePath, content);
  }

  /**
   * Modify TypeScript file using AST
   */
  protected async modifyTsFile(
    filePath: string,
    modificationFunction: (sourceFile: any) => void
  ): Promise<ModifierResult> {
    try {
      const result = await this.engine.modifyTsFile(filePath, modificationFunction);
      
      if (result.success) {
        return {
          success: true,
          message: `Successfully modified ${filePath}`
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error during modification'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Merge JSON content
   */
  protected async mergeJsonFile(
    filePath: string,
    contentToMerge: any
  ): Promise<ModifierResult> {
    try {
      const result = await this.engine.mergeJsonFile(filePath, contentToMerge);
      
      if (result.success) {
        return {
          success: true,
          message: `Successfully merged JSON content into ${filePath}`
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error during JSON merge'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}


/**
 * Pure Modifier Base Interface
 * 
 * Defines the contract for all pure modifiers in the system.
 * Pure modifiers are structural transformers that know HOW to transform code
 * but are completely agnostic to WHAT business logic they're applying.
 */

export interface PureModifier {
  /**
   * Transform a file using the provided parameters
   * @param filePath - Path to the file to transform
   * @param params - Parameters containing the transformation instructions
   */
  transform(filePath: string, params: any): Promise<void>;
  
  /**
   * Validate that the provided parameters are correct for this modifier
   * @param params - Parameters to validate
   * @returns true if valid, false otherwise
   */
  validateParams(params: any): boolean;
  
  /**
   * Get the name of this modifier
   */
  getName(): string;
  
  /**
   * Get the description of what this modifier does
   */
  getDescription(): string;
}

/**
 * Base class for all pure modifiers
 * Provides common functionality and error handling
 */
export abstract class BasePureModifier implements PureModifier {
  abstract transform(filePath: string, params: any): Promise<void>;
  abstract validateParams(params: any): boolean;
  abstract getName(): string;
  abstract getDescription(): string;
  
  /**
   * Common error handling for all modifiers
   */
  protected handleError(error: Error, filePath: string, modifierName: string): never {
    throw new Error(
      `Pure Modifier Error: ${modifierName} failed to transform ${filePath}\n` +
      `Error: ${error.message}\n` +
      `Stack: ${error.stack}`
    );
  }
  
  /**
   * Validate that a file exists and is readable
   */
  protected async validateFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
    } catch (error) {
      throw new Error(`File not found or not readable: ${filePath}`);
    }
  }
  
  /**
   * Read file content safely
   */
  protected async readFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }
  
  /**
   * Write file content safely
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }
}

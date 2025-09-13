/**
 * Pure Modifier Registry
 * 
 * Central registry for all pure modifiers in the system.
 * Manages registration, validation, and execution of pure modifiers.
 */

import { PureModifier, BasePureModifier } from './pure-modifier.js';
import { Logger } from '../logging/logger.js';

export class PureModifierRegistry {
  private modifiers: Map<string, PureModifier> = new Map();
  private logger: Logger;
  
  constructor() {
    this.logger = Logger;
  }
  
  /**
   * Register a pure modifier
   * @param modifier - The modifier to register
   */
  register(modifier: PureModifier): void {
    const name = modifier.getName();
    
    if (this.modifiers.has(name)) {
      Logger.warn(`Modifier ${name} is already registered. Overwriting.`);
    }
    
    this.modifiers.set(name, modifier);
    Logger.info(`Registered pure modifier: ${name}`);
  }
  
  /**
   * Get a modifier by name
   * @param name - Name of the modifier
   * @returns The modifier or undefined if not found
   */
  get(name: string): PureModifier | undefined {
    return this.modifiers.get(name);
  }
  
  /**
   * Check if a modifier is registered
   * @param name - Name of the modifier
   * @returns true if registered, false otherwise
   */
  has(name: string): boolean {
    return this.modifiers.has(name);
  }
  
  /**
   * Execute a modifier on a file
   * @param name - Name of the modifier
   * @param filePath - Path to the file to transform
   * @param params - Parameters for the transformation
   */
  async execute(name: string, filePath: string, params: any): Promise<void> {
    const modifier = this.modifiers.get(name);
    
    if (!modifier) {
      const availableModifiers = Array.from(this.modifiers.keys()).join(', ');
      throw new Error(
        `Pure Modifier '${name}' not found. Available modifiers: ${availableModifiers}`
      );
    }
    
    // Validate parameters
    if (!modifier.validateParams(params)) {
      throw new Error(`Invalid parameters for modifier '${name}': ${JSON.stringify(params)}`);
    }
    
    Logger.info(`Executing modifier '${name}' on file: ${filePath}`);
    
    try {
      await modifier.transform(filePath, params);
      Logger.info(`Successfully executed modifier '${name}' on file: ${filePath}`);
    } catch (error) {
      Logger.error(`Failed to execute modifier '${name}' on file: ${filePath}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all registered modifiers
   * @returns Array of all registered modifiers
   */
  getAllModifiers(): PureModifier[] {
    return Array.from(this.modifiers.values());
  }
  
  /**
   * Get all modifier names
   * @returns Array of all modifier names
   */
  getAllModifierNames(): string[] {
    return Array.from(this.modifiers.keys());
  }
  
  /**
   * Clear all registered modifiers
   */
  clear(): void {
    this.modifiers.clear();
    Logger.info('Cleared all modifiers from registry');
  }
  
  /**
   * Get registry statistics
   * @returns Object with registry statistics
   */
  getStats(): { totalModifiers: number; modifierNames: string[] } {
    return {
      totalModifiers: this.modifiers.size,
      modifierNames: Array.from(this.modifiers.keys())
    };
  }
}

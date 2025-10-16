/**
 * Modifier Registry - Central Registry for All Modifiers
 * 
 * Manages the registration and retrieval of file modification modifiers.
 * This is the central hub that connects the BlueprintOrchestrator with
 * specific modifier implementations.
 */

import { AvailableModifier } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';

// Simple modifier interface for now
interface ModifierDefinition {
  execute: (filePath: string, params: any, context: ProjectContext, vfs?: any) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export class ModifierRegistry {
  private modifiers: Map<string, ModifierDefinition> = new Map();

  // Index signature to satisfy the interface
  [key: string]: ModifierDefinition | any;

  /**
   * Register a new modifier (Type-Safe)
   */
  register(name: AvailableModifier, definition: ModifierDefinition): void {
    this.modifiers.set(name, definition);
  }

  /**
   * Get a modifier by name (Type-Safe)
   */
  get(name: AvailableModifier): ModifierDefinition | null {
    return this.modifiers.get(name) || null;
  }

  /**
   * List all registered modifier names
   */
  list(): string[] {
    return Array.from(this.modifiers.keys());
  }

  /**
   * Check if a modifier exists
   */
  has(name: string): boolean {
    return this.modifiers.has(name);
  }

  /**
   * Get all registered modifiers
   */
  getAll(): Map<string, ModifierDefinition> {
    return new Map(this.modifiers);
  }

  /**
   * Clear all modifiers (useful for testing)
   */
  clear(): void {
    this.modifiers.clear();
  }

  /**
   * Get modifier count
   */
  size(): number {
    return this.modifiers.size;
  }
}

// Singleton instance
let registryInstance: ModifierRegistry | null = null;

/**
 * Get the global modifier registry instance
 */
export function getModifierRegistry(): ModifierRegistry {
  if (!registryInstance) {
    registryInstance = new ModifierRegistry();
  }
  return registryInstance;
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetModifierRegistry(): void {
  registryInstance = null;
}

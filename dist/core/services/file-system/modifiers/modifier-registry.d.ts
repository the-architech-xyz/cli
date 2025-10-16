/**
 * Modifier Registry - Central Registry for All Modifiers
 *
 * Manages the registration and retrieval of file modification modifiers.
 * This is the central hub that connects the BlueprintOrchestrator with
 * specific modifier implementations.
 */
import { AvailableModifier } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
interface ModifierDefinition {
    execute: (filePath: string, params: any, context: ProjectContext, vfs?: any) => Promise<{
        success: boolean;
        error?: string;
        message?: string;
    }>;
}
export declare class ModifierRegistry {
    private modifiers;
    [key: string]: ModifierDefinition | any;
    /**
     * Register a new modifier (Type-Safe)
     */
    register(name: AvailableModifier, definition: ModifierDefinition): void;
    /**
     * Get a modifier by name (Type-Safe)
     */
    get(name: AvailableModifier): ModifierDefinition | null;
    /**
     * List all registered modifier names
     */
    list(): string[];
    /**
     * Check if a modifier exists
     */
    has(name: string): boolean;
    /**
     * Get all registered modifiers
     */
    getAll(): Map<string, ModifierDefinition>;
    /**
     * Clear all modifiers (useful for testing)
     */
    clear(): void;
    /**
     * Get modifier count
     */
    size(): number;
}
/**
 * Get the global modifier registry instance
 */
export declare function getModifierRegistry(): ModifierRegistry;
/**
 * Reset the global registry (useful for testing)
 */
export declare function resetModifierRegistry(): void;
export {};

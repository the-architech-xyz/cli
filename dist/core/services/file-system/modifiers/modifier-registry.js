/**
 * Modifier Registry - Central Registry for All Modifiers
 *
 * Manages the registration and retrieval of file modification modifiers.
 * This is the central hub that connects the BlueprintOrchestrator with
 * specific modifier implementations.
 */
export class ModifierRegistry {
    modifiers = new Map();
    /**
     * Register a new modifier (Type-Safe)
     */
    register(name, definition) {
        this.modifiers.set(name, definition);
    }
    /**
     * Get a modifier by name (Type-Safe)
     */
    get(name) {
        return this.modifiers.get(name) || null;
    }
    /**
     * List all registered modifier names
     */
    list() {
        return Array.from(this.modifiers.keys());
    }
    /**
     * Check if a modifier exists
     */
    has(name) {
        return this.modifiers.has(name);
    }
    /**
     * Get all registered modifiers
     */
    getAll() {
        return new Map(this.modifiers);
    }
    /**
     * Clear all modifiers (useful for testing)
     */
    clear() {
        this.modifiers.clear();
    }
    /**
     * Get modifier count
     */
    size() {
        return this.modifiers.size;
    }
}
// Singleton instance
let registryInstance = null;
/**
 * Get the global modifier registry instance
 */
export function getModifierRegistry() {
    if (!registryInstance) {
        registryInstance = new ModifierRegistry();
    }
    return registryInstance;
}
/**
 * Reset the global registry (useful for testing)
 */
export function resetModifierRegistry() {
    registryInstance = null;
}
//# sourceMappingURL=modifier-registry.js.map
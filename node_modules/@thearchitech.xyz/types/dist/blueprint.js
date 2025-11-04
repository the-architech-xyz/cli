/**
 * Blueprint Types
 *
 * Type definitions for dynamic blueprint architecture
 */
/**
 * Type guard to check if a blueprint module is dynamic
 */
export function isDynamicBlueprint(module) {
    return typeof module.default === 'function';
}
/**
 * Type guard to check if a blueprint module is legacy
 */
export function isLegacyBlueprint(module) {
    return typeof module.blueprint === 'object' && Array.isArray(module.blueprint.actions);
}

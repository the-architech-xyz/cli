/**
 * Modifier Type Definitions
 *
 * This is the SINGLE SOURCE OF TRUTH for all available modifiers in The Architech.
 * Any modifier referenced in a blueprint MUST be listed here to ensure type safety.
 */
// Re-export ModifierType for backward compatibility
export { ModifierType } from './modifier-types.js';
/**
 * Type guard to check if a string is a valid modifier name
 */
export function isValidModifier(value) {
    const validModifiers = [
        'package-json-merger',
        'tsconfig-enhancer',
        'css-enhancer',
        'js-config-merger',
        'ts-module-enhancer',
        'json-merger',
        'js-export-wrapper',
        'jsx-children-wrapper',
        'yaml-merger',
        'dockerignore-merger',
        'dockerfile-merger',
        'env-merger',
        'readme-merger',
        'ts-interface-merger',
        'ts-import-merger',
        'css-class-merger',
        'html-attribute-merger'
    ];
    return validModifiers.includes(value);
}

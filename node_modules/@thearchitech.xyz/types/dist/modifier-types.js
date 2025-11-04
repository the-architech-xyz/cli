/**
 * Modifier Type Enums
 *
 * Type-safe enums for all modifier types currently implemented in the CLI.
 * This provides compile-time validation and IntelliSense for modifier types.
 */
/**
 * Supported Modifier Types
 *
 * Only includes modifiers that have corresponding implementations in the CLI.
 * Add new modifier types here when new modifiers are implemented.
 */
export var ModifierType;
(function (ModifierType) {
    ModifierType["PACKAGE_JSON_MERGER"] = "package-json-merger";
    ModifierType["TSCONFIG_ENHANCER"] = "tsconfig-enhancer";
    ModifierType["JS_CONFIG_MERGER"] = "js-config-merger";
    ModifierType["JS_EXPORT_WRAPPER"] = "js-export-wrapper";
    ModifierType["JSON_MERGER"] = "json-merger";
    ModifierType["JSX_CHILDREN_WRAPPER"] = "jsx-children-wrapper";
    ModifierType["TS_MODULE_ENHANCER"] = "ts-module-enhancer";
    ModifierType["YAML_MERGER"] = "yaml-merger";
    ModifierType["ENV_MERGER"] = "env-merger";
    ModifierType["CSS_ENHANCER"] = "css-enhancer";
    ModifierType["DOCKERFILE_MERGER"] = "dockerfile-merger";
    ModifierType["DOCKERIGNORE_MERGER"] = "dockerignore-merger";
})(ModifierType || (ModifierType = {}));
/**
 * Type guard to check if a string is a valid modifier type
 */
export function isValidModifierType(value) {
    return Object.values(ModifierType).includes(value);
}
/**
 * Get all supported modifier types
 */
export function getSupportedModifierTypes() {
    return Object.values(ModifierType);
}

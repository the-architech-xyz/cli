/**
 * Fallback Strategy Enums
 *
 * Type-safe enums for fallback strategies used by different action types.
 * Each action type may have different fallback options.
 */
/**
 * Fallback strategies for ENHANCE_FILE action
 */
export var EnhanceFileFallbackStrategy;
(function (EnhanceFileFallbackStrategy) {
    EnhanceFileFallbackStrategy["CREATE"] = "create";
    EnhanceFileFallbackStrategy["SKIP"] = "skip";
    EnhanceFileFallbackStrategy["ERROR"] = "error"; // Error if file doesn't exist (implicit)
})(EnhanceFileFallbackStrategy || (EnhanceFileFallbackStrategy = {}));
/**
 * Fallback strategies for CREATE_FILE action
 */
export var CreateFileFallbackStrategy;
(function (CreateFileFallbackStrategy) {
    CreateFileFallbackStrategy["OVERWRITE"] = "overwrite";
    CreateFileFallbackStrategy["SKIP"] = "skip";
    CreateFileFallbackStrategy["ERROR"] = "error"; // Error if file exists
})(CreateFileFallbackStrategy || (CreateFileFallbackStrategy = {}));
/**
 * Type guard to check if a string is a valid ENHANCE_FILE fallback strategy
 */
export function isValidEnhanceFileFallback(value) {
    return Object.values(EnhanceFileFallbackStrategy).includes(value);
}
/**
 * Type guard to check if a string is a valid CREATE_FILE fallback strategy
 */
export function isValidCreateFileFallback(value) {
    return Object.values(CreateFileFallbackStrategy).includes(value);
}

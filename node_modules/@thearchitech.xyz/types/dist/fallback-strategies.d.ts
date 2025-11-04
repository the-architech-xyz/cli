/**
 * Fallback Strategy Enums
 *
 * Type-safe enums for fallback strategies used by different action types.
 * Each action type may have different fallback options.
 */
/**
 * Fallback strategies for ENHANCE_FILE action
 */
export declare enum EnhanceFileFallbackStrategy {
    CREATE = "create",
    SKIP = "skip",
    ERROR = "error"
}
/**
 * Fallback strategies for CREATE_FILE action
 */
export declare enum CreateFileFallbackStrategy {
    OVERWRITE = "overwrite",
    SKIP = "skip",
    ERROR = "error"
}
/**
 * Type guard to check if a string is a valid ENHANCE_FILE fallback strategy
 */
export declare function isValidEnhanceFileFallback(value: string): value is EnhanceFileFallbackStrategy;
/**
 * Type guard to check if a string is a valid CREATE_FILE fallback strategy
 */
export declare function isValidCreateFileFallback(value: string): value is CreateFileFallbackStrategy;

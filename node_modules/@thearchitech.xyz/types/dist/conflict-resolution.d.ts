/**
 * Conflict Resolution Enums
 *
 * Type-safe enums for conflict resolution strategies.
 */
/**
 * Conflict resolution strategies
 */
export declare enum ConflictResolutionStrategy {
    ERROR = "error",
    SKIP = "skip",
    REPLACE = "replace",
    MERGE = "merge"
}
/**
 * Merge strategies for conflict resolution
 */
export declare enum ConflictMergeStrategy {
    JSON = "json",
    CSS = "css",
    JS = "js",
    APPEND = "append"
}
/**
 * Type guard to check if a string is a valid conflict resolution strategy
 */
export declare function isValidConflictResolutionStrategy(value: string): value is ConflictResolutionStrategy;
/**
 * Type guard to check if a string is a valid conflict merge strategy
 */
export declare function isValidConflictMergeStrategy(value: string): value is ConflictMergeStrategy;

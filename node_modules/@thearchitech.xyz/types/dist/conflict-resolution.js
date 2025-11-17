/**
 * Conflict Resolution Enums
 *
 * Type-safe enums for conflict resolution strategies.
 */
/**
 * Conflict resolution strategies
 */
export var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["ERROR"] = "error";
    ConflictResolutionStrategy["SKIP"] = "skip";
    ConflictResolutionStrategy["REPLACE"] = "replace";
    ConflictResolutionStrategy["MERGE"] = "merge";
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * Merge strategies for conflict resolution
 */
export var ConflictMergeStrategy;
(function (ConflictMergeStrategy) {
    ConflictMergeStrategy["JSON"] = "json";
    ConflictMergeStrategy["CSS"] = "css";
    ConflictMergeStrategy["JS"] = "js";
    ConflictMergeStrategy["APPEND"] = "append";
})(ConflictMergeStrategy || (ConflictMergeStrategy = {}));
/**
 * Type guard to check if a string is a valid conflict resolution strategy
 */
export function isValidConflictResolutionStrategy(value) {
    return Object.values(ConflictResolutionStrategy).includes(value);
}
/**
 * Type guard to check if a string is a valid conflict merge strategy
 */
export function isValidConflictMergeStrategy(value) {
    return Object.values(ConflictMergeStrategy).includes(value);
}

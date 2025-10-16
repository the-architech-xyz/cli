/**
 * Blueprint Conflict Resolution Validator
 *
 * Validates that blueprints have proper conflict resolution strategies
 * to prevent "file already exists" errors during execution.
 */
import { Blueprint } from '@thearchitech.xyz/types';
export interface ConflictValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    missingConflictResolution: number;
}
export declare class BlueprintConflictValidator {
    /**
     * Validate a blueprint for conflict resolution completeness
     */
    validateBlueprint(blueprint: Blueprint): ConflictValidationResult;
    /**
     * Determine the appropriate conflict resolution strategy based on module type and file path
     */
    private getSuggestedConflictResolution;
    /**
     * Validate multiple blueprints and return aggregated results
     */
    validateBlueprints(blueprints: Blueprint[]): ConflictValidationResult;
}

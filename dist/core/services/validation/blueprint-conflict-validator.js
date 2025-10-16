/**
 * Blueprint Conflict Resolution Validator
 *
 * Validates that blueprints have proper conflict resolution strategies
 * to prevent "file already exists" errors during execution.
 */
import { BlueprintActionType } from '@thearchitech.xyz/types';
export class BlueprintConflictValidator {
    /**
     * Validate a blueprint for conflict resolution completeness
     */
    validateBlueprint(blueprint) {
        const errors = [];
        const warnings = [];
        let missingConflictResolution = 0;
        // Check all CREATE_FILE actions
        for (let i = 0; i < blueprint.actions.length; i++) {
            const action = blueprint.actions[i];
            if (action && action.type === BlueprintActionType.CREATE_FILE) {
                const createAction = action; // Type assertion for CREATE_FILE action
                if (!createAction?.conflictResolution) {
                    const suggestion = this.getSuggestedConflictResolution(blueprint.id, createAction.path);
                    errors.push(`Action ${i}: CREATE_FILE for '${createAction.path}' is missing conflictResolution property. ` +
                        `Suggestion: ${suggestion}`);
                    missingConflictResolution++;
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            missingConflictResolution
        };
    }
    /**
     * Determine the appropriate conflict resolution strategy based on module type and file path
     */
    getSuggestedConflictResolution(blueprintId, filePath) {
        const isAdapter = blueprintId.includes('adapter') || blueprintId.includes('core');
        const isIntegration = blueprintId.includes('integration');
        const isFeature = blueprintId.includes('feature');
        // Component files that should be replaceable by integrations
        const componentFiles = [
            'src/components/',
            'src/lib/',
            'src/hooks/',
            'src/utils/',
            'src/types/'
        ];
        // Configuration files that should be merged or replaced
        const configFiles = [
            'package.json',
            'tsconfig.json',
            'next.config.',
            'tailwind.config.',
            'eslint.config.',
            'drizzle.config.',
            '.env'
        ];
        const isComponentFile = componentFiles.some(pattern => filePath.includes(pattern));
        const isConfigFile = configFiles.some(pattern => filePath.includes(pattern));
        if (isAdapter) {
            if (isComponentFile) {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.SKIP, priority: 0 }';
            }
            else if (isConfigFile) {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.MERGE, priority: 0 }';
            }
            else {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.REPLACE, priority: 0 }';
            }
        }
        else if (isIntegration) {
            if (isComponentFile) {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.REPLACE, priority: 1 }';
            }
            else if (isConfigFile) {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.MERGE, priority: 1 }';
            }
            else {
                return 'conflictResolution: { strategy: ConflictResolutionStrategy.REPLACE, priority: 1 }';
            }
        }
        else if (isFeature) {
            return 'conflictResolution: { strategy: ConflictResolutionStrategy.REPLACE, priority: 2 }';
        }
        return 'conflictResolution: { strategy: ConflictResolutionStrategy.REPLACE }';
    }
    /**
     * Validate multiple blueprints and return aggregated results
     */
    validateBlueprints(blueprints) {
        const allErrors = [];
        const allWarnings = [];
        let totalMissingConflictResolution = 0;
        for (const blueprint of blueprints) {
            const result = this.validateBlueprint(blueprint);
            if (!result.valid) {
                allErrors.push(`Blueprint ${blueprint.id}: ${result.errors.join('; ')}`);
            }
            allWarnings.push(...result.warnings);
            totalMissingConflictResolution += result.missingConflictResolution;
        }
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings,
            missingConflictResolution: totalMissingConflictResolution
        };
    }
}
//# sourceMappingURL=blueprint-conflict-validator.js.map
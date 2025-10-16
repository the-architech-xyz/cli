/**
 * Architecture Validator Service
 *
 * Integrates with the SmartArchitectureValidator to perform pre-execution validation
 */
import { Genome } from '@thearchitech.xyz/marketplace';
interface ValidationError {
    type: 'FILE_OWNERSHIP_VIOLATION' | 'CREATE_CONFLICT' | 'MISSING_DEPENDENCY' | 'INVALID_PATH';
    module: string;
    message: string;
    details: {
        file?: string;
        expectedOwner?: string;
        actualOwner?: string;
        conflictingModules?: string[];
    };
}
interface ValidationWarning {
    type: 'MISSING_ARTIFACTS' | 'DEPRECATED_ACTION' | 'UNUSED_TEMPLATE';
    module: string;
    message: string;
    details: {
        file?: string;
        suggestion?: string;
    };
}
interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export declare class ArchitectureValidator {
    private artifactCache;
    /**
     * Validate the recipe for architectural compliance
     */
    validateRecipe(genome: Genome, traceId: string): Promise<ValidationResult>;
    /**
     * Validate file ownership - ensure integrators only enhance files owned by their dependencies
     */
    private validateFileOwnership;
    /**
     * Detect conflicts where multiple modules try to create the same file
     */
    private detectCreateConflicts;
    /**
     * Validate module dependencies
     */
    private validateDependencies;
    /**
     * Load artifacts for all modules in the genome
     */
    private loadModuleArtifacts;
    /**
     * Create mock artifacts for testing
     */
    private loadRealArtifacts;
    private getEmptyArtifacts;
    /**
     * Get module type from module ID
     */
    private getModuleType;
    /**
     * Extract dependencies from a module
     */
    private extractDependencies;
    /**
     * Get adapter dependencies for a module
     */
    private getAdapterDependencies;
    /**
     * Clear the artifact cache
     */
    clearCache(): void;
}
export {};

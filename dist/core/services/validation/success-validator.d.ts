/**
 * Success Validator
 *
 * Final quality gate that validates the output of a successful generation
 * Ensures that generated projects are not just "created" but "ready to use"
 */
export interface ValidationResult {
    isSuccess: boolean;
    errors: string[];
    warnings: string[];
    details: {
        filesValidated: number;
        filesMissing: string[];
        buildSuccess: boolean;
        buildErrors: string[];
        installSuccess: boolean;
        installErrors: string[];
    };
}
export interface FileValidationResult {
    exists: boolean;
    isFile: boolean;
    size: number;
    error?: string;
}
export declare class SuccessValidator {
    constructor();
    /**
     * Main validation method that performs all post-generation checks
     */
    validate(projectPath: string, expectedFiles: string[]): Promise<ValidationResult>;
    /**
     * Validate that expected files actually exist on disk
     */
    private validateFileExistence;
    /**
     * Validate a single file
     */
    private validateFile;
    /**
     * Validate that the project can be built successfully
     * This is the ultimate test - the project must be functional
     */
    private validateBuild;
    /**
     * Get validation summary for logging
     */
    getValidationSummary(result: ValidationResult): string;
}

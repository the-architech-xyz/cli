/**
 * Genome Validator Service
 *
 * Validates the entire genome before execution to ensure:
 * - All modules exist in the marketplace
 * - All dependencies are satisfied
 * - All parameters are valid according to schemas
 * - No conflicts between modules
 */
import { Module } from '@thearchitech.xyz/types';
import { Genome } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface GenomeValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    validatedModules: Module[];
    executionOrder: Module[];
}
export declare class GenomeValidator {
    private moduleService;
    private moduleValidator;
    private dependencyResolver;
    private parameterValidator;
    private conflictValidator;
    private crossFeatureValidator;
    constructor(moduleService: ModuleService);
    /**
     * Validate entire genome before execution
     */
    validateGenome(genome: Genome): Promise<GenomeValidationResult>;
    /**
     * Convert ModuleConfig to Module
     */
    private convertModuleConfigToModule;
    /**
     * Validate project structure
     */
    private validateProject;
    /**
     * Validate blueprint conflict resolution for all modules
     */
    private validateBlueprintConflicts;
}

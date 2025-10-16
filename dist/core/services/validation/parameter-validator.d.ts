/**
 * Parameter Validator Service
 *
 * Validates module parameters against adapter.json schemas to ensure:
 * - Parameter types are correct
 * - Required parameters are provided
 * - Enum values are valid
 * - Parameter constraints are satisfied
 */
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface ParameterValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class ParameterValidator {
    private moduleService;
    constructor(moduleService: ModuleService);
    /**
     * Validate module parameters against schema
     */
    validateParameters(module: Module): Promise<ParameterValidationResult>;
    /**
     * Validate a single parameter against its schema
     */
    private validateParameter;
}

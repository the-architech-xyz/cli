/**
 * Module Validator Service
 *
 * Validates individual modules to ensure:
 * - Module exists in the marketplace
 * - Module ID format is correct
 * - Module category is valid
 * - Module version is compatible
 */
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface ModuleValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    adapter?: any;
}
export declare class ModuleValidator {
    private moduleService;
    constructor(moduleService: ModuleService);
    /**
     * Validate a single module
     */
    validateModule(module: Module): Promise<ModuleValidationResult>;
    /**
     * Validate module structure
     */
    private validateModuleStructure;
    /**
     * Validate module exists in marketplace
     */
    private validateModuleExistence;
    /**
     * Validate module version compatibility
     */
    private validateModuleVersion;
    /**
     * Check if module supports Constitutional Architecture
     */
    private isConstitutionalModule;
    /**
     * Validate Constitutional Architecture structure
     */
    private validateConstitutionalArchitecture;
}

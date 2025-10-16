/**
 * Cross-Feature Prerequisite Validator
 *
 * Validates that when a feature enables a capability that requires another feature,
 * that required feature is present in the genome.
 *
 * Example: teams-billing requires payments/frontend/shadcn
 */
import { Genome } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export interface CrossFeatureValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface CrossFeatureRequirement {
    sourceModule: string;
    sourceCapability: string;
    requiredFeatures: string[];
    requiredCapabilities: string[];
}
export declare class CrossFeatureValidator {
    private moduleService;
    constructor(moduleService: ModuleService);
    /**
     * Validate cross-feature prerequisites for entire genome
     */
    validateGenome(genome: Genome): Promise<CrossFeatureValidationResult>;
    /**
     * Check if a capability is enabled for a module
     */
    private isCapabilityEnabled;
    /**
     * Check if required capabilities are available in genome
     */
    private checkCapabilitiesAvailable;
    /**
     * Load module configuration
     */
    private loadModuleConfig;
}

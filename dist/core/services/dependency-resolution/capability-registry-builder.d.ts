/**
 * Capability Registry Builder
 *
 * Builds the capability registry by scanning the marketplace
 */
import { CapabilityRegistry } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
export declare class CapabilityRegistryBuilder {
    private moduleService;
    constructor(moduleService: ModuleService);
    /**
     * Build capability registry from marketplace
     */
    buildRegistry(): Promise<CapabilityRegistry>;
    /**
     * Scan marketplace for all modules
     */
    private scanMarketplace;
    /**
     * Load module configuration
     */
    private loadModuleConfig;
    /**
     * Check if directory exists
     */
    private directoryExists;
    /**
     * Check if path is a directory
     */
    private isDirectory;
    /**
     * Get mock configuration for testing
     */
    private getMockConfig;
    /**
     * Calculate confidence for a module capability
     */
    private calculateConfidence;
    /**
     * Detect capability conflicts
     */
    private detectCapabilityConflicts;
}

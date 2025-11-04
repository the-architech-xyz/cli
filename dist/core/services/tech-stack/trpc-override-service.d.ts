/**
 * tRPC Override Service
 *
 * Centralized service for detecting and applying tRPC overrides
 * Automatically detects when tRPC is chosen and generates tRPC hooks for all compatible features
 */
import { Module } from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';
export interface TRPCOverrideConfig {
    enabled: boolean;
    features: string[];
    routerPath?: string;
}
export declare class TRPCOverrideService {
    private marketplaceRoot;
    private logger;
    constructor(marketplaceRoot: string, logger: typeof Logger);
    /**
     * Detect if tRPC should be used based on modules
     */
    detectTRPCUsage(modules: Module[]): Promise<TRPCOverrideConfig>;
    /**
     * Find features that support tRPC overrides
     */
    private findTRPCSupportedFeatures;
    /**
     * Extract feature name from module ID
     */
    private extractFeatureName;
    /**
     * Check if a feature supports tRPC overrides
     */
    private featureSupportsTRPC;
    /**
     * Apply tRPC overrides to modules
     */
    applyTRPCOverrides(modules: Module[], config: TRPCOverrideConfig, context: any): Promise<Module[]>;
    /**
     * Generate tRPC override blueprint for a specific feature
     */
    generateTRPCOverrideBlueprint(featureId: string, context: any): Promise<any[]>;
}

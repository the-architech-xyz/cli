/**
 * Feature Module Resolver
 *
 * This service processes feature modules in the genome and resolves them
 * into their backend/frontend implementations using the manifest system.
 *
 * This maintains the rich parameter system while leveraging manifest-driven resolution.
 */
import { Module } from '@thearchitech.xyz/types';
import { ManifestDrivenFeatureResolver } from './manifest-driven-feature-resolver.js';
export interface FeatureModuleResolutionResult {
    resolvedModules: Module[];
    originalFeatureModule: Module;
    backendImplementation?: string;
    frontendImplementation?: string;
}
export declare class FeatureModuleResolver {
    private manifestResolver;
    constructor(manifestResolver: ManifestDrivenFeatureResolver);
    /**
     * Process all modules and resolve feature modules using manifests
     */
    resolveFeatureModules(modules: Module[]): Promise<Module[]>;
    /**
     * Check if a module is a feature module that needs resolution
     * Only modules that DON'T exist directly in the marketplace need manifest resolution
     */
    private isFeatureModule;
    /**
     * Resolve a single feature module using manifest
     */
    private resolveFeatureModule;
    /**
     * Extract feature ID from module ID
     * Examples:
     *   'features/auth' -> 'auth'
     *   'features/auth/frontend/shadcn' -> 'auth'
     *   'features/architech-welcome/shadcn' -> 'architech-welcome'
     */
    private extractFeatureId;
    /**
     * Apply feature module parameters to resolved implementation modules
     */
    private applyFeatureParameters;
    /**
     * Apply backend-specific parameter mappings
     */
    private applyBackendParameters;
    /**
     * Apply frontend-specific parameter mappings
     */
    private applyFrontendParameters;
}

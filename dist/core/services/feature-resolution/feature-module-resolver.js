/**
 * Feature Module Resolver
 *
 * This service processes feature modules in the genome and resolves them
 * into their backend/frontend implementations using the manifest system.
 *
 * This maintains the rich parameter system while leveraging manifest-driven resolution.
 */
import { Logger } from '../infrastructure/logging/index.js';
import { extractProjectStackFromModules } from './manifest-driven-feature-resolver.js';
export class FeatureModuleResolver {
    manifestResolver;
    constructor(manifestResolver) {
        this.manifestResolver = manifestResolver;
    }
    /**
     * Process all modules and resolve feature modules using manifests
     */
    async resolveFeatureModules(modules) {
        const resolvedModules = [];
        const projectStack = extractProjectStackFromModules(modules);
        for (const module of modules) {
            if (this.isFeatureModule(module)) {
                try {
                    const resolution = await this.resolveFeatureModule(module, projectStack);
                    resolvedModules.push(...resolution.resolvedModules);
                    Logger.info(`✅ Resolved feature module: ${module.id}`, {
                        operation: 'feature_module_resolution',
                        featureId: module.id,
                        backendImpl: resolution.backendImplementation,
                        frontendImpl: resolution.frontendImplementation,
                        resolvedModulesCount: resolution.resolvedModules.length
                    });
                }
                catch (error) {
                    Logger.error(`❌ Failed to resolve feature module: ${module.id}`, {
                        operation: 'feature_module_resolution',
                        featureId: module.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    throw error;
                }
            }
            else {
                // Keep non-feature modules as-is
                resolvedModules.push(module);
            }
        }
        return resolvedModules;
    }
    /**
     * Check if a module is a feature module
     */
    isFeatureModule(module) {
        return module.id.startsWith('features/');
    }
    /**
     * Resolve a single feature module using manifest
     */
    async resolveFeatureModule(featureModule, projectStack) {
        const featureId = this.extractFeatureId(featureModule.id);
        // Resolve using manifest
        const resolvedFeature = await this.manifestResolver.resolveFeature(featureId, projectStack);
        // Apply feature module parameters to resolved implementations
        const resolvedModules = this.applyFeatureParameters(resolvedFeature.modules, featureModule.parameters);
        return {
            resolvedModules,
            originalFeatureModule: featureModule,
            backendImplementation: resolvedFeature.backendImplementation?.moduleId,
            frontendImplementation: resolvedFeature.frontendImplementation?.moduleId
        };
    }
    /**
     * Extract feature ID from module ID
     * Examples:
     *   'features/auth' -> 'auth'
     *   'features/auth/frontend/shadcn' -> 'auth'
     *   'features/architech-welcome/shadcn' -> 'architech-welcome'
     */
    extractFeatureId(moduleId) {
        const withoutPrefix = moduleId.replace('features/', '');
        const parts = withoutPrefix.split('/');
        // Return first part (the feature name)
        return parts[0] || withoutPrefix;
    }
    /**
     * Apply feature module parameters to resolved implementation modules
     */
    applyFeatureParameters(resolvedModules, featureParameters) {
        return resolvedModules.map(module => {
            // Merge feature parameters with module parameters
            const enhancedModule = {
                ...module,
                parameters: {
                    ...module.parameters,
                    ...featureParameters
                }
            };
            // Apply specific parameter mappings based on feature type
            if (module.id.includes('/backend/')) {
                enhancedModule.parameters = this.applyBackendParameters(enhancedModule.parameters, featureParameters);
            }
            else if (module.id.includes('/frontend/')) {
                enhancedModule.parameters = this.applyFrontendParameters(enhancedModule.parameters, featureParameters);
            }
            return enhancedModule;
        });
    }
    /**
     * Apply backend-specific parameter mappings
     */
    applyBackendParameters(moduleParams, featureParams) {
        const enhanced = { ...moduleParams };
        // Map feature parameters to backend implementation parameters
        if (featureParams.backend) {
            enhanced.implementation = featureParams.backend;
        }
        if (featureParams.features) {
            enhanced.features = {
                ...enhanced.features,
                ...featureParams.features
            };
        }
        // Map authentication-specific parameters
        if (featureParams.providers) {
            enhanced.providers = featureParams.providers;
        }
        if (featureParams.session) {
            enhanced.session = featureParams.session;
        }
        if (featureParams.csrf !== undefined) {
            enhanced.csrf = featureParams.csrf;
        }
        if (featureParams.rateLimit !== undefined) {
            enhanced.rateLimit = featureParams.rateLimit;
        }
        return enhanced;
    }
    /**
     * Apply frontend-specific parameter mappings
     */
    applyFrontendParameters(moduleParams, featureParams) {
        const enhanced = { ...moduleParams };
        // Map feature parameters to frontend implementation parameters
        if (featureParams.frontend) {
            enhanced.implementation = featureParams.frontend;
        }
        if (featureParams.features) {
            enhanced.features = {
                ...enhanced.features,
                ...featureParams.features
            };
        }
        // Map UI-specific parameters
        if (featureParams.theme) {
            enhanced.theme = featureParams.theme;
        }
        return enhanced;
    }
}
//# sourceMappingURL=feature-module-resolver.js.map
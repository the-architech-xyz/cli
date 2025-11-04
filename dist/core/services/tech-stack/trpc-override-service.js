/**
 * tRPC Override Service
 *
 * Centralized service for detecting and applying tRPC overrides
 * Automatically detects when tRPC is chosen and generates tRPC hooks for all compatible features
 */
import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class TRPCOverrideService {
    marketplaceRoot;
    logger;
    constructor(marketplaceRoot, logger) {
        this.marketplaceRoot = marketplaceRoot;
        this.logger = logger;
    }
    /**
     * Detect if tRPC should be used based on modules
     */
    async detectTRPCUsage(modules) {
        Logger.info('🔍 Detecting tRPC usage in modules', {
            operation: 'trpc_detection',
            modulesCount: modules.length
        });
        // Check if tRPC adapter is present
        const hasTRPCAdapter = modules.some(module => module.id === 'data-fetching/trpc' ||
            module.id === 'adapters/data-fetching/trpc');
        if (!hasTRPCAdapter) {
            Logger.debug('ℹ️  tRPC adapter not found, skipping tRPC overrides', {
                operation: 'trpc_detection'
            });
            return { enabled: false, features: [] };
        }
        // Find features that support tRPC overrides
        const supportedFeatures = await this.findTRPCSupportedFeatures(modules);
        Logger.info(`🎯 tRPC detected, supported features: ${supportedFeatures.join(', ')}`, {
            operation: 'trpc_detection',
            features: supportedFeatures
        });
        return {
            enabled: true,
            features: supportedFeatures,
            routerPath: '${paths.lib}/trpc/router.ts'
        };
    }
    /**
     * Find features that support tRPC overrides
     */
    async findTRPCSupportedFeatures(modules) {
        const supportedFeatures = [];
        // Check for tech-stack modules that can be overridden
        const techStackModules = modules.filter(module => module.id.startsWith('features/') &&
            module.id.endsWith('/tech-stack') &&
            !module.id.includes('/overrides/'));
        for (const module of techStackModules) {
            const featureName = this.extractFeatureName(module.id);
            if (featureName && await this.featureSupportsTRPC(featureName)) {
                supportedFeatures.push(featureName);
            }
        }
        return supportedFeatures;
    }
    /**
     * Extract feature name from module ID
     */
    extractFeatureName(moduleId) {
        // Examples:
        // 'features/auth/tech-stack' -> 'auth'
        // 'features/payments/tech-stack' -> 'payments'
        const parts = moduleId.split('/');
        if (parts.length >= 2 && parts[0] === 'features') {
            return parts[1] || null;
        }
        return null;
    }
    /**
     * Check if a feature supports tRPC overrides
     */
    async featureSupportsTRPC(featureName) {
        // Check if the feature has a tech-stack layer
        const techStackPath = path.join(this.marketplaceRoot, 'features', featureName, 'tech-stack');
        try {
            await fs.access(techStackPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Apply tRPC overrides to modules
     */
    async applyTRPCOverrides(modules, config, context) {
        if (!config.enabled) {
            return modules;
        }
        Logger.info(`🎯 Applying tRPC overrides to ${config.features.length} features`, {
            operation: 'trpc_override_application',
            features: config.features
        });
        const enhancedModules = [...modules];
        for (const feature of config.features) {
            // Check if tRPC override already exists
            const existingOverride = enhancedModules.find(module => module.id === `features/${feature}/tech-stack/overrides/trpc`);
            if (existingOverride) {
                Logger.debug(`ℹ️  tRPC override already exists for ${feature}`, {
                    operation: 'trpc_override_application',
                    feature
                });
                continue;
            }
            // Check if SDK override exists (SDK takes priority over tRPC)
            const hasSDKOverride = enhancedModules.some(module => module.id.startsWith(`features/${feature}/tech-stack/overrides/`) &&
                !module.id.includes('/trpc'));
            if (hasSDKOverride) {
                Logger.debug(`ℹ️  SDK override exists for ${feature}, skipping tRPC override`, {
                    operation: 'trpc_override_application',
                    feature
                });
                continue;
            }
            // Add tRPC override module
            const trpcOverrideModule = {
                id: `features/${feature}/tech-stack/overrides/trpc`,
                category: 'feature',
                parameters: {
                    feature,
                    routerPath: config.routerPath
                },
                features: {
                    trpc: true,
                    override: true
                },
                externalFiles: [],
                config: undefined
            };
            enhancedModules.push(trpcOverrideModule);
            Logger.info(`✅ Added tRPC override for ${feature}`, {
                operation: 'trpc_override_application',
                feature,
                moduleId: trpcOverrideModule.id
            });
        }
        return enhancedModules;
    }
    /**
     * Generate tRPC override blueprint for a specific feature
     */
    async generateTRPCOverrideBlueprint(featureId, context) {
        Logger.info(`🔧 Generating tRPC override blueprint for ${featureId}`, {
            operation: 'trpc_blueprint_generation',
            feature: featureId
        });
        // Use the shared tRPC override blueprint
        const sharedBlueprintPath = path.join(this.marketplaceRoot, 'features', '_shared', 'tech-stack', 'overrides', 'trpc', 'blueprint.ts');
        try {
            const blueprintModule = await import(sharedBlueprintPath);
            const generateBlueprint = blueprintModule.default;
            const config = {
                parameters: {
                    feature: featureId,
                    routerPath: '${paths.lib}/trpc/router.ts'
                }
            };
            return generateBlueprint(config);
        }
        catch (error) {
            Logger.error(`Failed to generate tRPC blueprint for ${featureId}`, {
                operation: 'trpc_blueprint_generation',
                feature: featureId,
                error: error.message
            });
            return [];
        }
    }
}
//# sourceMappingURL=trpc-override-service.js.map
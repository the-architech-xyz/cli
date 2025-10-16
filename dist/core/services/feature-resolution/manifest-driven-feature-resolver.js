/**
 * Manifest-Driven Feature Resolver
 *
 * This is the new, simplified FeatureResolver that follows the definitive doctrine:
 * "The Marketplace is the Source of Truth, the CLI is a Blind Executor"
 *
 * The resolver fetches feature manifests from the marketplace and uses them
 * to resolve abstract features into concrete implementations.
 */
import { Logger } from '../infrastructure/logging/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
// ============================================================================
// MAIN CLASS
// ============================================================================
export class ManifestDrivenFeatureResolver {
    moduleService;
    marketplacePath;
    manifestCache = new Map();
    constructor(moduleService, marketplacePath) {
        this.moduleService = moduleService;
        this.marketplacePath = marketplacePath;
    }
    /**
     * Resolve a feature using manifest-based approach
     */
    async resolveFeature(featureId, projectStack) {
        Logger.debug(`Resolving feature using manifest: ${featureId}`, {
            operation: 'manifest_feature_resolution',
            featureId,
            projectStack
        });
        // 1. Fetch feature manifest
        const manifest = await this.fetchFeatureManifest(featureId);
        // 2. Find matching implementations
        const backendImplementation = this.findMatchingImplementation(manifest.implementations, 'backend', projectStack);
        const frontendImplementation = this.findMatchingImplementation(manifest.implementations, 'frontend', projectStack);
        // 3. Convert implementations to modules
        const modules = [];
        if (backendImplementation) {
            const backendModule = await this.convertImplementationToModule(backendImplementation);
            modules.push(backendModule);
        }
        if (frontendImplementation) {
            const frontendModule = await this.convertImplementationToModule(frontendImplementation);
            modules.push(frontendModule);
        }
        const resolvedFeature = {
            featureId,
            manifest,
            backendImplementation,
            frontendImplementation,
            modules
        };
        Logger.debug(`Resolved feature using manifest: ${featureId}`, {
            operation: 'manifest_feature_resolution',
            featureId,
            hasBackend: !!backendImplementation,
            hasFrontend: !!frontendImplementation,
            modulesCount: modules.length
        });
        return resolvedFeature;
    }
    /**
     * Convert resolved feature to modules (for backward compatibility)
     */
    convertToModules(resolvedFeature) {
        return resolvedFeature.modules;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    /**
     * Fetch feature manifest from marketplace
     */
    async fetchFeatureManifest(featureId) {
        // Check cache first
        if (this.manifestCache.has(featureId)) {
            return this.manifestCache.get(featureId);
        }
        // Try local marketplace first (for development)
        const localManifestPath = path.join(this.marketplacePath, 'dist', 'features', `${featureId}.manifest.json`);
        try {
            const manifestContent = await fs.readFile(localManifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            // Cache the manifest
            this.manifestCache.set(featureId, manifest);
            Logger.debug(`Fetched manifest from local marketplace: ${featureId}`, {
                operation: 'manifest_fetch',
                featureId,
                source: 'local'
            });
            return manifest;
        }
        catch (error) {
            Logger.warn(`Failed to fetch local manifest: ${featureId}`, {
                operation: 'manifest_fetch',
                featureId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        // TODO: In production, fetch from remote marketplace
        // const remoteManifest = await this.fetchRemoteManifest(featureId);
        // return remoteManifest;
        throw new Error(`Feature manifest not found: ${featureId}`);
    }
    /**
     * Find matching implementation based on project stack
     */
    findMatchingImplementation(implementations, type, projectStack) {
        const filteredImpls = implementations.filter(impl => impl.type === type);
        if (filteredImpls.length === 0) {
            return undefined;
        }
        // Find best match based on stack overlap
        const targetStack = type === 'backend' ? projectStack.backend : projectStack.frontend;
        let bestMatch;
        let bestScore = 0;
        for (const impl of filteredImpls) {
            const score = this.calculateStackMatchScore(impl.stack, targetStack);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = impl;
            }
        }
        // If no good match found, use the first available implementation
        if (!bestMatch && filteredImpls.length > 0) {
            bestMatch = filteredImpls[0];
            Logger.warn(`Using fallback implementation for ${type}: ${bestMatch.moduleId}`, {
                operation: 'implementation_matching',
                featureId: bestMatch.moduleId.split('/')[1],
                type,
                reason: 'no_stack_match'
            });
        }
        return bestMatch;
    }
    /**
     * Calculate how well an implementation matches the project stack
     */
    calculateStackMatchScore(implStack, projectStack) {
        let score = 0;
        const projectStackLower = projectStack.map(s => s.toLowerCase());
        const implStackLower = implStack.map(s => s.toLowerCase());
        // Exact matches get highest score
        for (const implTech of implStackLower) {
            if (projectStackLower.includes(implTech)) {
                score += 2;
            }
        }
        // Partial matches get lower score
        for (const implTech of implStackLower) {
            for (const projTech of projectStackLower) {
                if (implTech.includes(projTech) || projTech.includes(implTech)) {
                    score += 1;
                }
            }
        }
        return score;
    }
    /**
     * Convert implementation to module
     */
    async convertImplementationToModule(implementation) {
        const moduleId = implementation.moduleId;
        try {
            // Read the existing module configuration (feature.json)
            const configPath = path.join(this.marketplacePath, moduleId, 'feature.json');
            let configContent;
            if (await this.fileExists(configPath)) {
                configContent = await fs.readFile(configPath, 'utf-8');
            }
            else {
                throw new Error(`No feature.json configuration file found for ${moduleId}`);
            }
            const config = JSON.parse(configContent);
            // Create a module that matches the CLI's expectations
            const module = {
                id: moduleId,
                category: implementation.type === 'backend' ? 'capability' : 'feature',
                config: {
                    ...config,
                    id: moduleId,
                    category: implementation.type === 'backend' ? 'capability' : 'feature',
                    blueprint: config.blueprint || 'blueprint.ts', // Reference to blueprint file
                    capabilities: config.capabilities || {},
                    prerequisites: config.prerequisites || {}
                },
                parameters: implementation.parameters || {},
                features: {}
            };
            Logger.debug(`Converted implementation to module: ${moduleId}`, {
                operation: 'implementation_conversion',
                moduleId,
                type: implementation.type,
                configPath: configPath,
                capabilities: Object.keys(config.capabilities || {}).length
            });
            return module;
        }
        catch (error) {
            Logger.error(`Failed to convert implementation to module: ${moduleId}`, {
                operation: 'implementation_conversion',
                moduleId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Clear manifest cache (useful for testing)
     */
    clearCache() {
        this.manifestCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.manifestCache.size,
            keys: Array.from(this.manifestCache.keys())
        };
    }
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Extract project stack from genome modules
 */
export function extractProjectStackFromModules(modules) {
    const stack = {
        backend: [],
        frontend: [],
        database: [],
        ui: []
    };
    for (const module of modules) {
        const moduleId = module.id.toLowerCase();
        // Backend technologies
        if (moduleId.includes('nextjs'))
            stack.backend.push('nextjs');
        if (moduleId.includes('express'))
            stack.backend.push('express');
        if (moduleId.includes('better-auth'))
            stack.backend.push('better-auth');
        if (moduleId.includes('stripe'))
            stack.backend.push('stripe');
        if (moduleId.includes('resend'))
            stack.backend.push('resend');
        // Frontend technologies
        if (moduleId.includes('shadcn')) {
            stack.frontend.push('shadcn');
            stack.ui?.push('shadcn');
        }
        if (moduleId.includes('mui')) {
            stack.frontend.push('mui');
            stack.ui?.push('mui');
        }
        if (moduleId.includes('nextjs'))
            stack.frontend.push('nextjs');
        // Database technologies
        if (moduleId.includes('postgresql'))
            stack.database?.push('postgresql');
        if (moduleId.includes('drizzle'))
            stack.database?.push('drizzle');
        if (moduleId.includes('prisma'))
            stack.database?.push('prisma');
    }
    // Remove duplicates
    stack.backend = [...new Set(stack.backend)];
    stack.frontend = [...new Set(stack.frontend)];
    stack.database = [...new Set(stack.database || [])];
    stack.ui = [...new Set(stack.ui || [])];
    return stack;
}
//# sourceMappingURL=manifest-driven-feature-resolver.js.map
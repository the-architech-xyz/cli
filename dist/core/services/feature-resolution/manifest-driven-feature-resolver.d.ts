/**
 * Manifest-Driven Feature Resolver
 *
 * This is the new, simplified FeatureResolver that follows the definitive doctrine:
 * "The Marketplace is the Source of Truth, the CLI is a Blind Executor"
 *
 * The resolver fetches feature manifests from the marketplace and uses them
 * to resolve abstract features into concrete implementations.
 */
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
interface FeatureImplementation {
    type: 'backend' | 'frontend';
    stack: string[];
    moduleId: string;
    capabilities: string[];
    dependencies: string[];
    parameters?: Record<string, any>;
    constraints?: Record<string, any>;
}
interface FeatureManifest {
    id: string;
    name: string;
    description: string;
    contract?: string;
    implementations: FeatureImplementation[];
    defaultStack?: {
        backend?: string[];
        frontend?: string[];
    };
    version: string;
    lastGenerated: string;
}
interface ProjectStack {
    backend: string[];
    frontend: string[];
    database?: string[];
    ui?: string[];
}
interface ResolvedFeature {
    featureId: string;
    manifest: FeatureManifest;
    backendImplementation?: FeatureImplementation;
    frontendImplementation?: FeatureImplementation;
    modules: Module[];
}
export declare class ManifestDrivenFeatureResolver {
    private moduleService;
    private marketplacePath;
    private manifestCache;
    constructor(moduleService: ModuleService, marketplacePath: string);
    /**
     * Resolve a feature using manifest-based approach
     */
    resolveFeature(featureId: string, projectStack: ProjectStack): Promise<ResolvedFeature>;
    /**
     * Convert resolved feature to modules (for backward compatibility)
     */
    convertToModules(resolvedFeature: ResolvedFeature): Module[];
    /**
     * Fetch feature manifest from marketplace
     */
    private fetchFeatureManifest;
    /**
     * Find matching implementation based on project stack
     */
    private findMatchingImplementation;
    /**
     * Calculate how well an implementation matches the project stack
     */
    private calculateStackMatchScore;
    /**
     * Convert implementation to module
     */
    private convertImplementationToModule;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Clear manifest cache (useful for testing)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
/**
 * Extract project stack from genome modules
 */
export declare function extractProjectStackFromModules(modules: Module[]): ProjectStack;
export {};

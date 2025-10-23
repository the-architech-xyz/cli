/**
 * Module Auto-Inclusion Service
 *
 * Handles automatic inclusion of marketplace defaults and tech-stack modules.
 */
import { Module } from '@thearchitech.xyz/marketplace';
export declare class ModuleAutoInclusionService {
    /**
     * Apply marketplace defaults - Auto-include opinionated modules for all projects
     */
    applyMarketplaceDefaults(modules: Module[], marketplaceDefaults: {
        autoInclude: readonly string[];
    }): Module[];
    /**
     * Auto-include tech-stack modules for features that have them
     * This ensures the technology-agnostic layer is always included when available
     */
    applyTechStackAutoInclusion(modules: Module[], marketplaceRoot: string): Promise<Module[]>;
    /**
     * Auto-include required adapters from connector/feature dependencies
     * This ensures connectors can import from their required adapters
     */
    applyAdapterRequirements(modules: Module[], marketplaceRoot: string): Promise<Module[]>;
    /**
     * Load module metadata (connector.json, adapter.json, or feature.json)
     */
    private loadModuleMetadata;
    /**
     * Check if a tech-stack module exists in the marketplace (non-blocking)
     */
    private checkTechStackModuleExists;
}

/**
 * Module Auto-Inclusion Service
 *
 * Handles automatic inclusion of marketplace defaults and tech-stack modules.
 */
import { Logger } from '../infrastructure/logging/index.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class ModuleAutoInclusionService {
    /**
     * Apply marketplace defaults - Auto-include opinionated modules for all projects
     */
    applyMarketplaceDefaults(modules, marketplaceDefaults) {
        const enhancedModules = [...modules];
        // Auto-include marketplace defaults for all projects
        for (const moduleId of marketplaceDefaults.autoInclude) {
            // Check if module is already included
            if (!enhancedModules.some(m => m.id === moduleId)) {
                enhancedModules.push({
                    id: moduleId,
                    parameters: {}
                });
                Logger.info(`✅ Auto-included marketplace default: ${moduleId}`, {
                    operation: "marketplace_defaults",
                });
            }
        }
        return enhancedModules;
    }
    /**
     * Auto-include tech-stack modules for features that have them
     * This ensures the technology-agnostic layer is always included when available
     */
    async applyTechStackAutoInclusion(modules, marketplaceRoot) {
        const enhancedModules = [...modules];
        // Extract base feature IDs from frontend/backend implementations
        // e.g., 'features/emailing/frontend/shadcn' → 'features/emailing'
        // e.g., 'features/emailing/backend/resend-nextjs' → 'features/emailing'
        const baseFeatureIds = new Set();
        for (const module of enhancedModules) {
            if (module.id.startsWith('features/') && !module.id.includes('/tech-stack')) {
                const parts = module.id.split('/');
                // Extract base feature ID from full path
                // features/emailing/frontend/shadcn → ['features', 'emailing', 'frontend', 'shadcn']
                if (parts.length >= 2) {
                    const baseFeatureId = `${parts[0]}/${parts[1]}`; // 'features/emailing'
                    baseFeatureIds.add(baseFeatureId);
                }
            }
        }
        // For each base feature, check if tech-stack exists and auto-include it
        for (const baseFeatureId of baseFeatureIds) {
            const techStackModuleId = `${baseFeatureId}/tech-stack`; // 'features/emailing/tech-stack'
            // Skip if tech-stack already included
            if (enhancedModules.some(m => m.id === techStackModuleId)) {
                Logger.debug(`ℹ️  Tech-stack module already included: ${techStackModuleId}`, {
                    operation: "tech_stack_auto_inclusion",
                    baseFeatureId
                });
                continue;
            }
            try {
                // Check if tech-stack module exists in marketplace
                const techStackExists = await this.checkTechStackModuleExists(techStackModuleId, marketplaceRoot);
                if (techStackExists) {
                    enhancedModules.push({
                        id: techStackModuleId,
                        parameters: {
                            featureName: baseFeatureId.split('/').pop(),
                            featurePath: baseFeatureId.split('/').pop()
                        }
                    });
                    Logger.info(`✅ Auto-included tech-stack module: ${techStackModuleId}`, {
                        operation: "tech_stack_auto_inclusion",
                        baseFeatureId
                    });
                }
                else {
                    Logger.debug(`ℹ️  Tech-stack module not found (optional): ${techStackModuleId}`, {
                        operation: "tech_stack_auto_inclusion",
                        baseFeatureId
                    });
                }
            }
            catch (error) {
                // Non-blocking: log warning but continue execution
                Logger.warn(`⚠️  Failed to check tech-stack module: ${techStackModuleId}`, {
                    operation: "tech_stack_auto_inclusion",
                    baseFeatureId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return enhancedModules;
    }
    /**
     * Auto-include required adapters from connector/feature dependencies
     * This ensures connectors can import from their required adapters
     */
    async applyAdapterRequirements(modules, marketplaceRoot) {
        const enhancedModules = [...modules];
        const processedModules = new Set();
        // Process modules iteratively (may need multiple passes for transitive dependencies)
        let addedNewModules = true;
        let iteration = 0;
        const MAX_ITERATIONS = 10; // Prevent infinite loops
        while (addedNewModules && iteration < MAX_ITERATIONS) {
            addedNewModules = false;
            iteration++;
            for (const module of [...enhancedModules]) {
                // Skip if already processed
                if (processedModules.has(module.id))
                    continue;
                try {
                    // Load module metadata (connector.json, adapter.json, or feature.json)
                    const metadata = await this.loadModuleMetadata(module.id, marketplaceRoot);
                    if (metadata?.requires && Array.isArray(metadata.requires)) {
                        for (const requiredId of metadata.requires) {
                            // Skip framework modules (they're always in genome already)
                            if (requiredId.startsWith('framework/'))
                                continue;
                            // Check if required module already included
                            if (!enhancedModules.some(m => m.id === requiredId)) {
                                // AUTO-INCLUDE IT!
                                enhancedModules.push({
                                    id: requiredId,
                                    parameters: {}
                                });
                                Logger.info(`✅ Auto-included required adapter: ${requiredId}`, {
                                    operation: "adapter_requirements",
                                    requiredBy: module.id
                                });
                                addedNewModules = true;
                            }
                        }
                    }
                }
                catch (error) {
                    // Non-blocking: log warning but continue
                    Logger.warn(`⚠️  Could not load metadata for ${module.id}:`, {
                        operation: "adapter_requirements",
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                processedModules.add(module.id);
            }
        }
        if (iteration >= MAX_ITERATIONS) {
            Logger.warn(`⚠️  Adapter requirements resolution stopped after ${MAX_ITERATIONS} iterations`, {
                operation: "adapter_requirements"
            });
        }
        return enhancedModules;
    }
    /**
     * Load module metadata (connector.json, adapter.json, or feature.json)
     */
    async loadModuleMetadata(moduleId, marketplaceRoot) {
        // Try different metadata file patterns
        const possiblePaths = [
            path.join(marketplaceRoot, moduleId, 'connector.json'),
            path.join(marketplaceRoot, moduleId, 'adapter.json'),
            path.join(marketplaceRoot, moduleId, 'feature.json'),
        ];
        for (const metadataPath of possiblePaths) {
            try {
                const content = await fs.readFile(metadataPath, 'utf8');
                return JSON.parse(content);
            }
            catch {
                // Try next path
                continue;
            }
        }
        return null;
    }
    /**
     * Check if a tech-stack module exists in the marketplace (non-blocking)
     */
    async checkTechStackModuleExists(moduleId, marketplaceRoot) {
        try {
            const modulePath = path.join(marketplaceRoot, moduleId);
            const featureJsonPath = path.join(modulePath, 'feature.json');
            const blueprintPath = path.join(modulePath, 'blueprint.ts');
            // Check if both feature.json and blueprint.ts exist
            const [featureExists, blueprintExists] = await Promise.all([
                fs.access(featureJsonPath).then(() => true).catch(() => false),
                fs.access(blueprintPath).then(() => true).catch(() => false)
            ]);
            return featureExists && blueprintExists;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=module-auto-inclusion.js.map
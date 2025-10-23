/**
 * Component Dependency Resolver Service
 *
 * Resolves component dependencies from feature manifests.
 */
import { Logger } from '../infrastructure/logging/index.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
export class ComponentDependencyResolver {
    /**
     * Resolve component dependencies from all features in the genome
     */
    async resolveComponentDependencies(genome) {
        const componentRequirements = new Map();
        // Iterate through all modules to find features with component requirements
        for (const module of genome.modules) {
            if (module.id.startsWith('features/')) {
                try {
                    // Load feature manifest
                    const featureManifest = await MarketplaceService.loadFeatureManifest(module.id);
                    if (featureManifest?.requires?.components) {
                        // Collect component requirements per UI technology
                        for (const [uiTechId, components] of Object.entries(featureManifest.requires.components)) {
                            if (!componentRequirements.has(uiTechId)) {
                                componentRequirements.set(uiTechId, new Set());
                            }
                            const requiredSet = componentRequirements.get(uiTechId);
                            components.forEach(comp => requiredSet.add(comp));
                        }
                    }
                }
                catch (error) {
                    Logger.warn(`⚠️  Could not load manifest for ${module.id}:`, { error });
                }
            }
        }
        // Convert Sets to Arrays
        const result = new Map();
        for (const [uiTechId, componentsSet] of componentRequirements.entries()) {
            result.set(uiTechId, Array.from(componentsSet).sort());
        }
        if (result.size > 0) {
            Logger.debug('📦 Resolved component dependencies:', {
                dependencies: Array.from(result.entries()).map(([uiTechId, components]) => `${uiTechId}: [${components.join(', ')}]`).join(', ')
            });
        }
        return result;
    }
}
//# sourceMappingURL=component-dependency-resolver.js.map
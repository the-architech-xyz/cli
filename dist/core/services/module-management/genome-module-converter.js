/**
 * Genome Module Converter
 *
 * Converts TypedGenomeModule (from marketplace) to Module (expected by CLI)
 * This bridges the gap between genome authoring types and execution types.
 */
/**
 * Convert GenomeModule to Module format expected by CLI
 *
 * Preserves metadata like targetPackage from genome module definitions
 */
export function convertGenomeModuleToModule(genomeModule) {
    // Extract category from module ID (e.g., 'framework/nextjs' -> 'framework')
    const category = extractCategoryFromModuleId(genomeModule.id);
    const metadataModule = genomeModule;
    const module = {
        id: genomeModule.id,
        category,
        parameters: genomeModule.parameters || {},
        parameterSchema: metadataModule.parameterSchema,
        parameterDefaults: metadataModule.parameterDefaults,
        parameterMetadata: metadataModule.parameterMetadata,
        features: genomeModule.features || {},
        externalFiles: genomeModule.externalFiles || [],
        config: genomeModule.config,
        source: metadataModule.source,
        manifest: metadataModule.manifest,
        blueprint: metadataModule.blueprint,
        templates: metadataModule.templates,
        marketplace: metadataModule.marketplace,
        resolved: metadataModule.resolved
    };
    // Preserve targetPackage if present in genome module
    // This allows MonorepoPackageResolver to use it as a fallback if genome lookup fails
    if (genomeModule.targetPackage) {
        module.targetPackage = genomeModule.targetPackage;
    }
    return module;
}
/**
 * Convert array of GenomeModule to array of Module
 */
export function convertGenomeModulesToModules(genomeModules) {
    return genomeModules.map(convertGenomeModuleToModule);
}
/**
 * Extract category from module ID
 * Examples:
 * - 'framework/nextjs' -> 'framework'
 * - 'ui/shadcn-ui' -> 'ui'
 * - 'features/auth/backend/better-auth-nextjs' -> 'features'
 */
function extractCategoryFromModuleId(moduleId) {
    const parts = moduleId.split('/');
    return parts[0] || 'unknown';
}
//# sourceMappingURL=genome-module-converter.js.map
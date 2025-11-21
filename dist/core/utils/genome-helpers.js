/**
 * Genome Helper Functions
 *
 * Type-safe helper functions for accessing Genome/ResolvedGenome properties.
 * These functions handle backward compatibility and provide type-safe access
 * to project structure, framework, and apps.
 */
/**
 * Get the project framework, checking new structure (apps) first, then legacy (framework).
 * Returns undefined if no framework is found.
 */
export function getProjectFramework(genome) {
    // Check new structure first (apps array)
    if (genome.project.apps && genome.project.apps.length > 0) {
        const preferred = genome.project.apps.find(a => a.type === 'web') || genome.project.apps[0];
        return preferred?.framework;
    }
    // Fallback to legacy structure (direct framework property)
    return genome.project.framework;
}
/**
 * Get the project structure type, defaulting to 'single-app' if not specified.
 */
export function getProjectStructure(genome) {
    return genome.project.structure || 'single-app';
}
/**
 * Get the project apps array, returning empty array if not specified.
 *
 * Accepts both Genome and ResolvedGenome for flexibility.
 */
export function getProjectApps(genome) {
    return genome.project.apps || [];
}
/**
 * Get the project monorepo configuration, returning undefined if not specified.
 */
export function getProjectMonorepo(genome) {
    return genome.project.monorepo;
}
/**
 * Check if the project is a monorepo structure.
 */
export function isMonorepo(genome) {
    return getProjectStructure(genome) === 'monorepo';
}
/**
 * Get project metadata properties with type safety.
 * Returns undefined if property doesn't exist.
 */
export function getProjectProperty(genome, key) {
    return genome.project[key];
}
//# sourceMappingURL=genome-helpers.js.map
/**
 * Path Override Validation
 *
 * Validates user-defined path overrides against marketplace path key definitions.
 * Ensures type safety and prevents invalid path key usage.
 */
/**
 * Validate path overrides against marketplace path key definitions
 *
 * @param overrides - User-defined path overrides from genome.project.paths
 * @param marketplacePathKeys - Path key definitions from marketplace
 * @param projectStructure - Current project structure (for structure-specific validation)
 * @returns Validation result with errors and warnings
 */
export async function validatePathOverrides(overrides, marketplacePathKeys, projectStructure) {
    const errors = [];
    const warnings = [];
    // Create a set of valid path keys for quick lookup
    const validKeys = new Set();
    const keyDefinitions = new Map();
    for (const keyDef of marketplacePathKeys.pathKeys) {
        validKeys.add(keyDef.key);
        keyDefinitions.set(keyDef.key, keyDef);
        // Also add wildcard patterns if needed (e.g., 'apps.web.*')
        if (keyDef.key.includes('.')) {
            const parts = keyDef.key.split('.');
            for (let i = 1; i < parts.length; i++) {
                const wildcardKey = parts.slice(0, i).join('.') + '.*';
                if (!validKeys.has(wildcardKey)) {
                    validKeys.add(wildcardKey);
                }
            }
        }
    }
    // Validate each override
    for (const [key, value] of Object.entries(overrides)) {
        // Check if key is defined in marketplace
        const keyDef = keyDefinitions.get(key);
        if (!keyDef) {
            // Check if it matches a wildcard pattern
            const matchesWildcard = Array.from(validKeys).some(validKey => {
                if (validKey.endsWith('.*')) {
                    const prefix = validKey.slice(0, -2);
                    return key.startsWith(prefix + '.');
                }
                return false;
            });
            if (!matchesWildcard) {
                const suggestions = getSuggestions(key, Array.from(validKeys));
                errors.push({
                    key,
                    message: `Path key '${key}' is not defined in marketplace '${marketplacePathKeys.marketplace}'. ` +
                        `Valid keys: ${Array.from(validKeys).slice(0, 10).join(', ')}${validKeys.size > 10 ? '...' : ''}. ` +
                        (suggestions.length > 0 ? `Did you mean: ${suggestions.slice(0, 3).join(', ')}?` : '')
                });
            }
            else {
                // Matches wildcard but not explicitly defined - warning only
                warnings.push({
                    key,
                    message: `Path key '${key}' matches a wildcard pattern but is not explicitly defined. ` +
                        `Consider using a defined key from the marketplace.`
                });
            }
        }
        else {
            // Key is defined - check structure compatibility
            if (projectStructure && keyDef.structure) {
                if (keyDef.structure !== 'both' && keyDef.structure !== projectStructure) {
                    warnings.push({
                        key,
                        message: `Path key '${key}' is defined for '${keyDef.structure}' structure, ` +
                            `but project is '${projectStructure}'. This may cause issues.`
                    });
                }
            }
            // Check if key is deprecated
            if (keyDef.deprecated) {
                warnings.push({
                    key,
                    message: `Path key '${key}' is deprecated. ` +
                        (keyDef.replacement ? `Use '${keyDef.replacement}' instead.` : 'Consider using an alternative.')
                });
            }
            // Validate value is not empty
            if (!value || value.trim() === '') {
                errors.push({
                    key,
                    message: `Path override for '${key}' cannot be empty.`
                });
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Get suggestions for misspelled path keys using Levenshtein distance
 */
function getSuggestions(input, validKeys) {
    const distances = validKeys.map(key => ({
        key,
        distance: levenshteinDistance(input, key)
    }));
    distances.sort((a, b) => a.distance - b.distance);
    // Return keys with distance <= 3 (reasonable typo distance)
    return distances
        .filter(d => d.distance <= 3)
        .map(d => d.key)
        .slice(0, 5);
}
/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

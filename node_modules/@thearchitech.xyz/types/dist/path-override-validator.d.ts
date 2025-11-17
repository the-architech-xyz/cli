/**
 * Path Override Validation
 *
 * Validates user-defined path overrides against marketplace path key definitions.
 * Ensures type safety and prevents invalid path key usage.
 */
import type { MarketplacePathKeys } from './path-keys.js';
export interface PathOverrideValidationResult {
    valid: boolean;
    errors: Array<{
        key: string;
        message: string;
    }>;
    warnings: Array<{
        key: string;
        message: string;
    }>;
}
/**
 * Validate path overrides against marketplace path key definitions
 *
 * @param overrides - User-defined path overrides from genome.project.paths
 * @param marketplacePathKeys - Path key definitions from marketplace
 * @param projectStructure - Current project structure (for structure-specific validation)
 * @returns Validation result with errors and warnings
 */
export declare function validatePathOverrides(overrides: Record<string, string>, marketplacePathKeys: MarketplacePathKeys, projectStructure?: 'monorepo' | 'single-app'): Promise<PathOverrideValidationResult>;

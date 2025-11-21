/**
 * Path Mapping Generator
 *
 * Pre-computes all path mappings before blueprint execution.
 * This is the SINGLE SOURCE OF TRUTH for path resolution.
 *
 * Architecture:
 * 1. Loads path-keys.json from marketplace
 * 2. For each key, resolves to array of concrete paths based on genome
 * 3. Applies user overrides (highest priority)
 * 4. Returns complete mappings: { key: string[] }
 *
 * Simple Model:
 * - Path Key → Array of paths
 * - 1 path = generate 1 file
 * - 2+ paths = generate multiple files
 */
import type { ResolvedGenome, MarketplaceAdapter, RecipeBook } from '@thearchitech.xyz/types';
type PathMappings = Record<string, string[]>;
export declare class PathMappingGenerator {
    /**
     * Generate complete path mappings before blueprint execution
     *
     * This analyzes the genome and generates mappings for ALL path keys
     * defined in the marketplace's path-keys.json.
     *
     * Strategy:
     * 1. Use marketplace adapter's resolvePathDefaults() to get base paths (single values)
     * 2. Override with recipe book packageStructure.directory (if available)
     * 3. Expand semantic keys to multiple paths based on resolveToApps metadata
     * 4. Apply user overrides (highest priority)
     *
     * @param genome - Resolved genome with apps and packages
     * @param marketplaceAdapters - Map of marketplace name to adapter
     * @param recipeBooks - Optional map of marketplace name to recipe book
     * @returns Complete path mappings: { key: string[] }
     */
    static generateMappings(genome: ResolvedGenome, marketplaceAdapters: Map<string, MarketplaceAdapter>, recipeBooks?: Map<string, RecipeBook>): Promise<PathMappings>;
    /**
     * Expand semantic key to multiple paths
     *
     * Semantic keys expand based on resolveToApps metadata:
     * - apps.frontend.components → apps.web.components, apps.mobile.components
     * - apps.all.components → all apps
     *
     * Uses basePaths from marketplace adapter to get concrete paths.
     */
    private static expandSemanticKey;
    /**
     * Compute app path when not in basePaths (fallback)
     *
     * Example: apps.web.components → "apps/web/src/components/"
     */
    private static computeAppPath;
    /**
     * Resolve package key to path
     *
     * Example: packages.auth.src → ["packages/auth/src/"]
     */
    private static resolvePackageKey;
    /**
     * Resolve workspace key to path
     *
     * Example: workspace.root → ["./"]
     */
    private static resolveWorkspaceKey;
}
export {};

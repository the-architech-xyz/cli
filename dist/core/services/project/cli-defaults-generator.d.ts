/**
 * CLI Defaults Generator
 *
 * Generates universal defaults that work for any project:
 * - .gitignore
 * - Root tsconfig.json
 * - Basic package.json scripts
 *
 * These are CLI-generated (not marketplace modules) because they're universal.
 */
import type { RecipeBook } from '@thearchitech.xyz/types';
export declare class CliDefaultsGenerator {
    /**
     * Generate all universal CLI defaults
     *
     * V2 COMPLIANCE: Accepts framework and recipe books for framework-specific scripts
     */
    static generateDefaults(projectRoot: string, projectName: string, structure: 'monorepo' | 'single-app', framework?: string, recipeBooks?: Map<string, RecipeBook>): Promise<void>;
    /**
     * Generate .gitignore (universal)
     */
    private static generateGitignore;
    /**
     * Generate root tsconfig.json (universal base)
     */
    private static generateRootTsconfig;
    /**
     * Generate basic package.json scripts (universal)
     *
     * V2 COMPLIANCE: For monorepo, uses 'turbo' (monorepo tool, not framework-specific).
     * For single-app, framework scripts should come from framework adapter.
     *
     * @param projectRoot - Project root directory
     * @param structure - Project structure ('monorepo' | 'single-app')
     * @param framework - Optional framework name for single-app (to get framework-specific scripts)
     * @param recipeBooks - Optional recipe books for framework scripts
     */
    private static generatePackageJsonScripts;
    /**
     * Get framework scripts from recipe book
     */
    private static getFrameworkScriptsFromRecipeBook;
}

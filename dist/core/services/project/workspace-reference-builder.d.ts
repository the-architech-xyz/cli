/**
 * Workspace Reference Builder
 *
 * Builds workspace dependencies for app package.json files.
 * Adds workspace:* protocol references to all relevant packages.
 */
import { Genome, ResolvedGenome } from '@thearchitech.xyz/types';
export interface WorkspaceDependency {
    packageName: string;
    version: string;
}
export declare class WorkspaceReferenceBuilder {
    /**
     * Build workspace dependencies for an app
     *
     * @param appName - App name (e.g., "web", "mobile", "api")
     * @param appPath - App path (e.g., "apps/web")
     * @param genome - Genome with monorepo configuration
     * @param packageManager - Package manager ("npm", "pnpm", "yarn")
     * @param appDependencies - Optional: specific dependencies from app.dependencies in genome (filters packages)
     * @returns Map of workspace dependencies
     */
    static buildWorkspaceDependencies(appName: string, appPath: string, genome: Genome | ResolvedGenome, packageManager?: string, appDependencies?: string[]): Record<string, string>;
    /**
     * Get relative path for npm file: protocol
     *
     * @param appPath - App path (e.g., "apps/web")
     * @param packagePath - Package path (e.g., "packages/auth")
     * @returns Relative path for file: protocol
     */
    private static getRelativePathForNpm;
    /**
     * Get all packages that should be referenced by apps
     *
     * @param genome - Genome with monorepo configuration
     * @returns Array of package names
     */
    static getAllPackages(genome: Genome | ResolvedGenome): string[];
    /**
     * Add workspace dependencies to an existing package.json
     *
     * @param packageJson - Existing package.json object
     * @param workspaceDeps - Workspace dependencies to add
     * @returns Updated package.json
     */
    static addWorkspaceDependencies(packageJson: Record<string, any>, workspaceDeps: Record<string, string>): Record<string, any>;
}

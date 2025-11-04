/**
 * Project Manager Service
 *
 * Manages project structure, initialization, and state
 */
import { PathService } from '../path/path-service.js';
import { ProjectConfig } from '@thearchitech.xyz/types';
export declare class ProjectManager {
    private pathHandler;
    private projectConfig;
    constructor(projectConfig: ProjectConfig);
    /**
     * Get path handler instance
     */
    getPathHandler(): PathService;
    /**
     * Get project configuration
     */
    getProjectConfig(): ProjectConfig;
    /**
     * Get marketplace path
     * @deprecated Use MarketplaceRegistry.getCoreMarketplacePath() instead
     */
    getMarketplacePath(): string;
    /**
     * Initialize project structure (minimal - only project root)
     */
    initializeProject(): Promise<void>;
    /**
     * Initialize monorepo structure
     */
    initializeMonorepoStructure(monorepoConfig: any): Promise<void>;
    /**
     * Create root package.json for workspace
     */
    private createRootPackageJson;
    /**
     * Generate monorepo tool configuration
     */
    private generateMonorepoToolConfig;
    /**
     * Generate turbo.json configuration
     */
    private generateTurboConfig;
    /**
     * Generate nx.json configuration
     */
    private generateNxConfig;
    /**
     * Generate pnpm-workspace.yaml configuration
     */
    private generatePnpmWorkspaceConfig;
    /**
     * Initialize project with full structure (for monorepos or non-framework projects)
     */
    initializeProjectWithStructure(): Promise<void>;
    /**
     * Create basic project structure
     */
    private createBasicStructure;
    /**
     * Create package.json if it doesn't exist
     */
    ensurePackageJson(): Promise<void>;
    /**
     * Create tsconfig.json if it doesn't exist
     */
    ensureTsConfig(): Promise<void>;
    /**
     * Create .env.example if it doesn't exist
     */
    ensureEnvExample(): Promise<void>;
    /**
     * Create README.md if it doesn't exist
     */
    ensureReadme(): Promise<void>;
    /**
     * Initialize all basic project files
     */
    initializeBasicFiles(): Promise<void>;
    /**
     * Get project status
     */
    getProjectStatus(): Promise<{
        exists: boolean;
        hasPackageJson: boolean;
        hasTsConfig: boolean;
        hasEnvExample: boolean;
        hasReadme: boolean;
    }>;
    /**
     * Detect monorepo structure and configuration
     */
    detectMonorepoStructure(): Promise<MonorepoStructure>;
    /**
     * Detect packages in Turborepo
     */
    private detectTurboPackages;
    /**
     * Detect packages in Nx
     */
    private detectNxPackages;
    /**
     * Detect packages in pnpm workspaces
     */
    private detectPnpmPackages;
    /**
     * Expand workspace globs to actual package paths
     */
    private expandWorkspaceGlobs;
    /**
     * Read package.json
     */
    private readPackageJson;
}
export interface MonorepoStructure {
    isMonorepo: boolean;
    tool: 'turborepo' | 'nx' | 'pnpm-workspaces' | 'yarn-workspaces' | 'none';
    packages: string[];
    rootDir: string;
}

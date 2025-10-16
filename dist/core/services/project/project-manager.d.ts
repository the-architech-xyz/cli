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
     */
    getMarketplacePath(): string;
    /**
     * Initialize project structure (minimal - only project root)
     */
    initializeProject(): Promise<void>;
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
}

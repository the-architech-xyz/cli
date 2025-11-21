/**
 * Structure Initialization Layer
 *
 * Analyzes genome (capabilities, apps, modules) and initializes the complete
 * project structure (single-app or monorepo) BEFORE module execution.
 *
 * This layer ensures that:
 * - All required packages are created based on capabilities
 * - Package structure is initialized (package.json, tsconfig, etc.)
 * - Genome is updated with created packages
 */
import type { ResolvedGenome, RecipeBook, PackageDependencies } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
export interface PackageStructure {
    name: string;
    path: string;
    type: 'app' | 'package';
    purpose: string;
}
export interface StructureInitializationResult {
    success: boolean;
    packages: PackageStructure[];
    error?: string;
}
export declare class StructureInitializationLayer {
    private pathHandler;
    private recipeBooks?;
    constructor(pathHandler: PathService, recipeBooks?: Map<string, RecipeBook>);
    /**
     * Initialize project structure based on genome
     */
    initialize(genome: ResolvedGenome, dependencyMap?: Map<string, PackageDependencies>): Promise<StructureInitializationResult>;
    /**
     * Initialize single app structure
     */
    private initializeSingleApp;
    /**
     * Initialize monorepo structure based on capabilities and apps
     */
    private initializeMonorepo;
    /**
     * Resolve which packages will actually be used by modules
     * Uses MonorepoPackageResolver to predict module placement
     */
    private resolveUsedPackages;
    /**
     * Determine required packages based on capabilities, apps, and modules
     * Now also considers which packages will actually be used
     */
    private determineRequiredPackages;
    /**
     * Check if capabilities require shared code
     */
    private hasSharedCode;
    /**
     * Determine if a capability needs its own dedicated package
     */
    private capabilityNeedsPackage;
    /**
     * Get package name for a capability
     */
    private getCapabilityPackageName;
    /**
     * Extract package name from app package path
     */
    private extractPackageName;
    /**
     * Get package type (app or package)
     */
    private getPackageType;
    /**
     * Merge required packages with explicit config
     * Explicit config takes precedence
     */
    private mergePackages;
    /**
     * Initialize a package (create package.json, tsconfig, src/, etc.)
     */
    private initializePackage;
    /**
     * Get packageStructure from recipe book for a given package name
     *
     * @param packageName - Package name (e.g., "auth", "db", "ui")
     * @returns PackageStructure from recipe book or undefined
     */
    private getPackageStructureFromRecipeBook;
    /**
     * Determine package configuration (dependencies, scripts, etc.) based on package name and genome
     *
     * NOW RECIPE BOOK DRIVEN:
     * - Uses packageStructure from recipe book when available
     * - Falls back to minimal defaults when recipe book not available
     * - No hardcoded package-specific configs
     */
    private determinePackageConfig;
    /**
     * Create index.ts placeholder for package
     */
    private createPackageIndex;
    /**
     * Get package purpose description
     */
    private getPackagePurpose;
    /**
     * Create root package.json for single-app project
     */
    private createRootPackageJsonForSingleApp;
    /**
     * Create minimal root package.json WITHOUT workspaces property
     * This prevents create-next-app from detecting workspace and generating workspace:* references
     * The workspaces property will be added by the monorepo/turborepo module after apps are created
     */
    private createRootPackageJsonMinimal;
    /**
     * Calculate relative path between app and package (for file: protocol fallback)
     */
    private calculateRelativePath;
    /**
     * Resolve app dependencies from genome to workspace references
     *
     * @param appDeps - Array of dependency names from genome (e.g., ['auth', 'database'])
     * @param genome - Genome with monorepo configuration
     * @param appPath - App path (e.g., 'apps/web')
     * @param packageManager - Package manager ('npm', 'pnpm', 'yarn')
     * @returns Map of workspace dependencies (e.g., {'@project/auth': 'workspace:*'})
     */
    private resolveAppDependenciesToWorkspaceRefs;
    /**
     * Generate monorepo tool configuration
     */
    private generateMonorepoToolConfig;
}

/**
 * Workspace Reference Builder
 * 
 * Builds workspace dependencies for app package.json files.
 * Adds workspace:* protocol references to all relevant packages.
 */

import { Genome, ResolvedGenome } from '@thearchitech.xyz/types';
import { getProjectApps, getProjectMonorepo } from '../../utils/genome-helpers.js';
import { Logger } from '../infrastructure/logging/logger.js';

export interface WorkspaceDependency {
  packageName: string;  // e.g., "@synap/auth"
  version: string;      // "workspace:*" or "file:../auth"
}

export class WorkspaceReferenceBuilder {
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
  static buildWorkspaceDependencies(
    appName: string,
    appPath: string,
    genome: Genome | ResolvedGenome,
    packageManager: string = 'npm',
    appDependencies?: string[]
  ): Record<string, string> {
    // Type assertion: getProjectMonorepo accepts both Genome and ResolvedGenome
    const monorepoConfig = getProjectMonorepo(genome as ResolvedGenome);
    if (!monorepoConfig || !monorepoConfig.packages) {
      return {};
    }

    const projectName = (genome.project as any)?.name || genome.project?.name || 'project';
    const packages = monorepoConfig.packages;
    const workspaceDeps: Record<string, string> = {};

    // Get all apps from genome to dynamically detect app names
    const apps = getProjectApps(genome);
    const appNames = apps.map((app: any) => app.id || app.type).filter(Boolean);
    
    // Get package names - filter by app.dependencies if provided
    let packageNames: string[];
    if (appDependencies && appDependencies.length > 0) {
      // Only include packages listed in app.dependencies
      packageNames = appDependencies.filter(
        depName => packages[depName] && depName !== appName && !appNames.includes(depName)
      );
    } else {
      // Fallback: include all packages (excluding apps)
      packageNames = Object.keys(packages).filter(
        pkgName => pkgName !== appName && !appNames.includes(pkgName)
      );
    }

    // Use workspace:* for all modern package managers (npm 7+, yarn, pnpm)
    // npm 7+ supports workspace:* protocol, so we use it for all modern package managers
    const useWorkspaceProtocol = ['pnpm', 'yarn', 'npm'].includes(packageManager);

    for (const packageName of packageNames) {
      const packagePath = packages[packageName];
      if (!packagePath || typeof packagePath !== 'string') {
        continue;
      }

      // Build package scope name (e.g., "@synap/auth")
      const packageScope = `@${projectName}`;
      const scopedPackageName = `${packageScope}/${packageName}`;

      // Determine workspace reference
      let workspaceRef: string;
      if (useWorkspaceProtocol) {
        // Use workspace:* for all modern package managers
        workspaceRef = 'workspace:*';
      } else {
        // Fallback: use file: protocol with relative path (for npm < 7 or unknown package managers)
        workspaceRef = this.getRelativePathForNpm(appPath, packagePath);
      }

      workspaceDeps[scopedPackageName] = workspaceRef;
    }

    Logger.debug(`📦 Built workspace dependencies for ${appName}`, {
      operation: 'workspace_reference_builder',
      appName,
      packageManager,
      dependencies: Object.keys(workspaceDeps),
      useWorkspaceProtocol,
      filteredByAppDeps: !!appDependencies
    });

    return workspaceDeps;
  }

  /**
   * Get relative path for npm file: protocol
   * 
   * @param appPath - App path (e.g., "apps/web")
   * @param packagePath - Package path (e.g., "packages/auth")
   * @returns Relative path for file: protocol
   */
  private static getRelativePathForNpm(appPath: string, packagePath: string): string {
    // Both paths are relative to project root
    // From apps/web to packages/auth: ../../packages/auth
    // From apps/web to apps/api: ../api
    
    const appParts = appPath.split('/');
    const packageParts = packagePath.split('/');
    
    // Remove common prefix
    let commonDepth = 0;
    for (let i = 0; i < Math.min(appParts.length, packageParts.length); i++) {
      if (appParts[i] === packageParts[i]) {
        commonDepth++;
      } else {
        break;
      }
    }
    
    // Calculate relative path
    const upLevels = appParts.length - commonDepth;
    const downPath = packageParts.slice(commonDepth).join('/');
    
    if (upLevels === 0) {
      return `file:./${downPath}`;
    }
    
    const upPath = '../'.repeat(upLevels);
    return `file:${upPath}${downPath}`;
  }

  /**
   * Get all packages that should be referenced by apps
   * 
   * @param genome - Genome with monorepo configuration
   * @returns Array of package names
   */
  static getAllPackages(genome: Genome | ResolvedGenome): string[] {
    // Type assertion: getProjectMonorepo accepts both Genome and ResolvedGenome
    const monorepoConfig = getProjectMonorepo(genome as ResolvedGenome);
    if (!monorepoConfig || !monorepoConfig.packages) {
      return [];
    }

    // Get all apps from genome to dynamically detect app names
    const apps = getProjectApps(genome);
    const appNames = apps.map((app: any) => app.id || app.type).filter(Boolean);
    
    const packages = monorepoConfig.packages;
    // Filter out apps (dynamic detection, not hardcoded)
    return Object.keys(packages).filter(
      pkgName => !appNames.includes(pkgName)
    );
  }

  /**
   * Add workspace dependencies to an existing package.json
   * 
   * @param packageJson - Existing package.json object
   * @param workspaceDeps - Workspace dependencies to add
   * @returns Updated package.json
   */
  static addWorkspaceDependencies(
    packageJson: Record<string, any>,
    workspaceDeps: Record<string, string>
  ): Record<string, any> {
    return {
      ...packageJson,
      dependencies: {
        ...(packageJson.dependencies || {}),
        ...workspaceDeps
      }
    };
  }
}


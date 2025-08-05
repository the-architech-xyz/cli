/**
 * Structure Service - Centralized Project Structure Management
 * 
 * Single source of truth for all project structure decisions.
 * Provides clean, consistent APIs for agents and plugins to get paths and structure info.
 */

import * as path from 'path';
import fsExtra from 'fs-extra';
import { Logger } from '../../types/agents.js';

export type ProjectStructure = 'single-app' | 'monorepo';
export type UserPreference = 'quick-prototype' | 'scalable-monorepo';

export interface StructureInfo {
  type: ProjectStructure;
  userPreference: UserPreference;
  isMonorepo: boolean;
  isSingleApp: boolean;
  modules: string[];
  template: string;
}

export interface PathInfo {
  root: string;
  src: string;
  app: string;
  components: string;
  lib: string;
  types: string;
  public: string;
  packages: Record<string, string>;
  apps: Record<string, string>;
  config: string;
}

export class StructureService {
  private logger?: Logger;

  constructor(logger?: Logger) {
    if (logger) {
      this.logger = logger;
    }
  }

  // ============================================================================
  // STRUCTURE DETECTION & VALIDATION
  // ============================================================================

  /**
   * Detect project structure from existing project
   */
  async detectStructure(projectPath: string): Promise<StructureInfo> {
    const hasTurboJson = await fsExtra.pathExists(path.join(projectPath, 'turbo.json'));
    const hasAppsDir = await fsExtra.pathExists(path.join(projectPath, 'apps'));
    const hasPackagesDir = await fsExtra.pathExists(path.join(projectPath, 'packages'));
    
    if (hasTurboJson && hasAppsDir && hasPackagesDir) {
      return {
        type: 'monorepo',
        userPreference: 'scalable-monorepo',
        isMonorepo: true,
        isSingleApp: false,
        modules: ['ui', 'db', 'auth'],
        template: 'nextjs-14'
      };
    } else {
      return {
        type: 'single-app',
        userPreference: 'quick-prototype',
        isMonorepo: false,
        isSingleApp: true,
        modules: [],
        template: 'nextjs-14'
      };
    }
  }

  /**
   * Create structure info from user preference
   */
  createStructureInfo(userPreference: UserPreference, template: string = 'nextjs-14'): StructureInfo {
    const isMonorepo = userPreference === 'scalable-monorepo';
    
    return {
      type: isMonorepo ? 'monorepo' : 'single-app',
      userPreference,
      isMonorepo,
      isSingleApp: !isMonorepo,
      modules: isMonorepo ? ['ui', 'db', 'auth'] : [],
      template
    };
  }

  /**
   * Validate structure info
   */
  validateStructureInfo(info: StructureInfo): boolean {
    return (
      (info.type === 'monorepo' && info.userPreference === 'scalable-monorepo') ||
      (info.type === 'single-app' && info.userPreference === 'quick-prototype')
    );
  }

  // ============================================================================
  // PATH RESOLUTION - Single Source of Truth
  // ============================================================================

  /**
   * Get all paths for a project based on structure and framework
   */
  getPaths(projectPath: string, structure: StructureInfo, framework?: string): PathInfo {
    const paths: PathInfo = {
      root: projectPath,
      src: '',
      app: '',
      components: '',
      lib: '',
      types: '',
      public: '',
      packages: {},
      apps: {},
      config: ''
    };

    if (structure.isMonorepo) {
      // Monorepo structure - always uses src/app for consistency
      paths.src = path.join(projectPath, 'apps', 'web', 'src');
      paths.app = path.join(paths.src, 'app');
      paths.components = path.join(paths.src, 'components');
      paths.lib = path.join(paths.src, 'lib');
      paths.types = path.join(paths.src, 'types');
      paths.public = path.join(projectPath, 'apps', 'web', 'public');
      paths.config = path.join(projectPath, 'apps', 'web');

      // Package paths
      paths.packages = {
        ui: path.join(projectPath, 'packages', 'ui'),
        db: path.join(projectPath, 'packages', 'db'),
        auth: path.join(projectPath, 'packages', 'auth'),
        config: path.join(projectPath, 'packages', 'config')
      };

      // App paths
      paths.apps = {
        web: path.join(projectPath, 'apps', 'web')
      };
    } else {
      // Single app structure - framework-aware
      // Framework-specific path handling
      if (framework === 'nextjs') {
        // Next.js App Router prefers root directories, no src/
        paths.src = ''; // No src directory for Next.js App Router
        paths.app = path.join(projectPath, 'app');
        paths.components = path.join(projectPath, 'components');
        paths.lib = path.join(projectPath, 'lib');
        paths.types = path.join(projectPath, 'types');
      } else {
        // Other frameworks use src/ structure
        paths.src = path.join(projectPath, 'src');
        paths.app = path.join(paths.src, 'app');
        paths.components = path.join(paths.src, 'components');
        paths.lib = path.join(paths.src, 'lib');
        paths.types = path.join(paths.src, 'types');
      }
      
      paths.public = path.join(projectPath, 'public');
      paths.config = projectPath;

      // For single app, packages are virtual (same as lib)
      paths.packages = {
        ui: path.join(paths.lib, 'ui'),
        db: path.join(paths.lib, 'db'),
        auth: path.join(paths.lib, 'auth'),
        config: path.join(paths.lib, 'config')
      };

      // For single app, apps is just the root
      paths.apps = {
        web: projectPath
      };
    }

    return paths;
  }

  /**
   * Get path for a specific module/package
   */
  getModulePath(projectPath: string, structure: StructureInfo, moduleName: string): string {
    const paths = this.getPaths(projectPath, structure);
    return paths.packages[moduleName] || path.join(paths.lib, moduleName);
  }

  /**
   * Get path for a specific app
   */
  getAppPath(projectPath: string, structure: StructureInfo, appName: string = 'web'): string {
    const paths = this.getPaths(projectPath, structure);
    return paths.apps[appName] || paths.root;
  }

  /**
   * Get unified interface path for a module
   */
  getUnifiedInterfacePath(projectPath: string, structure: StructureInfo, moduleName: string): string {
    const paths = this.getPaths(projectPath, structure);
    
    if (structure.isMonorepo) {
      // In monorepo, unified interfaces are in packages/moduleName
      return paths.packages[moduleName] || path.join(projectPath, 'packages', moduleName);
    } else {
      // In single app, unified interfaces are in src/lib/moduleName
      return path.join(paths.lib, moduleName);
    }
  }

  // ============================================================================
  // STRUCTURE TRANSFORMATION
  // ============================================================================

  /**
   * Transform single app to monorepo structure
   */
  async transformToMonorepo(projectPath: string): Promise<void> {
    this.logger?.info('Transforming single app to monorepo structure...');

    // Create monorepo directories
    await fsExtra.ensureDir(path.join(projectPath, 'apps'));
    await fsExtra.ensureDir(path.join(projectPath, 'packages'));

    // Move src to apps/web/src
    const srcPath = path.join(projectPath, 'src');
    const webSrcPath = path.join(projectPath, 'apps', 'web', 'src');
    
    if (await fsExtra.pathExists(srcPath)) {
      // Check if destination already exists
      if (await fsExtra.pathExists(webSrcPath)) {
        this.logger?.warn('apps/web/src already exists, merging contents...');
        // Copy contents instead of moving
        await fsExtra.copy(srcPath, webSrcPath, { overwrite: true });
        await fsExtra.remove(srcPath);
      } else {
        await fsExtra.move(srcPath, webSrcPath);
      }
    }

    // Move public to apps/web/public
    const publicPath = path.join(projectPath, 'public');
    const webPublicPath = path.join(projectPath, 'apps', 'web', 'public');
    
    if (await fsExtra.pathExists(publicPath)) {
      // Check if destination already exists
      if (await fsExtra.pathExists(webPublicPath)) {
        this.logger?.warn('apps/web/public already exists, merging contents...');
        // Copy contents instead of moving
        await fsExtra.copy(publicPath, webPublicPath, { overwrite: true });
        await fsExtra.remove(publicPath);
      } else {
        await fsExtra.move(publicPath, webPublicPath);
      }
    }

    // Create package directories
    const packages = ['ui', 'db', 'auth', 'config'];
    for (const pkg of packages) {
      await fsExtra.ensureDir(path.join(projectPath, 'packages', pkg));
    }

    // Move lib contents to appropriate packages
    const libPath = path.join(webSrcPath, 'lib');
    if (await fsExtra.pathExists(libPath)) {
      for (const pkg of packages) {
        const pkgLibPath = path.join(libPath, pkg);
        const pkgPath = path.join(projectPath, 'packages', pkg);
        
        if (await fsExtra.pathExists(pkgLibPath)) {
          // Check if destination already exists
          if (await fsExtra.pathExists(pkgPath)) {
            this.logger?.warn(`packages/${pkg} already exists, merging contents...`);
            // Copy contents instead of moving
            await fsExtra.copy(pkgLibPath, pkgPath, { overwrite: true });
            await fsExtra.remove(pkgLibPath);
          } else {
            // Move existing lib/module to packages/module
            await fsExtra.move(pkgLibPath, pkgPath);
          }
        }
      }
    }

    this.logger?.success('Successfully transformed to monorepo structure');
  }

  /**
   * Transform monorepo to single app structure
   */
  async transformToSingleApp(projectPath: string): Promise<void> {
    this.logger?.info('Transforming monorepo to single app structure...');

    const webAppPath = path.join(projectPath, 'apps', 'web');
    
    if (!await fsExtra.pathExists(webAppPath)) {
      throw new Error('Web app not found in monorepo structure');
    }

    // Move apps/web/src to root src
    const webSrcPath = path.join(webAppPath, 'src');
    const rootSrcPath = path.join(projectPath, 'src');
    
    if (await fsExtra.pathExists(webSrcPath)) {
      await fsExtra.move(webSrcPath, rootSrcPath);
    }

    // Move apps/web/public to root public
    const webPublicPath = path.join(webAppPath, 'public');
    const rootPublicPath = path.join(projectPath, 'public');
    
    if (await fsExtra.pathExists(webPublicPath)) {
      await fsExtra.move(webPublicPath, rootPublicPath);
    }

    // Move package contents to lib
    const libPath = path.join(rootSrcPath, 'lib');
    await fsExtra.ensureDir(libPath);

    const packages = ['ui', 'db', 'auth', 'config'];
    for (const pkg of packages) {
      const pkgPath = path.join(projectPath, 'packages', pkg);
      const pkgLibPath = path.join(libPath, pkg);
      
      if (await fsExtra.pathExists(pkgPath)) {
        await fsExtra.move(pkgPath, pkgLibPath);
      }
    }

    // Clean up monorepo directories
    await fsExtra.remove(path.join(projectPath, 'apps'));
    await fsExtra.remove(path.join(projectPath, 'packages'));

    this.logger?.success('Successfully transformed to single app structure');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if a path exists in the project
   */
  async pathExists(projectPath: string, structure: StructureInfo, relativePath: string): Promise<boolean> {
    const fullPath = path.join(projectPath, relativePath);
    return await fsExtra.pathExists(fullPath);
  }

  /**
   * Get relative path from project root
   */
  getRelativePath(projectPath: string, fullPath: string): string {
    return path.relative(projectPath, fullPath);
  }

  /**
   * Ensure directory exists for a module
   */
  async ensureModuleDirectory(projectPath: string, structure: StructureInfo, moduleName: string): Promise<string> {
    const modulePath = this.getModulePath(projectPath, structure, moduleName);
    await fsExtra.ensureDir(modulePath);
    return modulePath;
  }

  /**
   * Get structure description for display
   */
  getStructureDescription(structure: StructureInfo): string {
    if (structure.isMonorepo) {
      return 'Scalable monorepo with apps and packages';
    } else {
      return 'Quick prototype single application';
    }
  }
}

// Export singleton instance
export const structureService = new StructureService(); 
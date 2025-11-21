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

import type { Genome, ResolvedGenome, PackageStructure as PackageStructureType, RecipeBook, PackageDependencies, FrameworkApp } from '@thearchitech.xyz/types';
import { PathService } from '../path/path-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { getProjectStructure, getProjectMonorepo, getProjectApps } from '../../utils/genome-helpers.js';
import { PackageJsonGenerator } from './package-json-generator.js';
import { WorkspaceReferenceBuilder } from './workspace-reference-builder.js';
import { CliDefaultsGenerator } from './cli-defaults-generator.js';
import * as path from 'path';
import * as fs from 'fs/promises';

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

export class StructureInitializationLayer {
  private pathHandler: PathService;
  private recipeBooks?: Map<string, RecipeBook>;

  constructor(pathHandler: PathService, recipeBooks?: Map<string, RecipeBook>) {
    this.pathHandler = pathHandler;
    this.recipeBooks = recipeBooks;
  }

  /**
   * Initialize project structure based on genome
   */
  async initialize(genome: ResolvedGenome, dependencyMap?: Map<string, PackageDependencies>): Promise<StructureInitializationResult> {
    console.log(`[StructureInitializationLayer] 🔨 initialize() called`);
    
    // Debug: Log genome structure
    const projectStructure = getProjectStructure(genome);
    const hasMonorepo = !!getProjectMonorepo(genome);
    const hasApps = getProjectApps(genome).length > 0;
    
    console.log(`[StructureInitializationLayer] Structure: ${projectStructure}, hasMonorepo: ${hasMonorepo}, hasApps: ${hasApps}`);
    
    Logger.info(`🔍 Structure detection: structure=${projectStructure}, hasMonorepo=${!!hasMonorepo}, hasApps=${!!hasApps}`, {
      operation: 'structure_initialization',
      projectStructure,
      monorepo: hasMonorepo,
      apps: hasApps
    });
    
    const structure = projectStructure || 'single-app';
    
    console.log(`[StructureInitializationLayer] Initializing ${structure} structure`);
    
    Logger.info(`📁 Initializing ${structure} structure for project: ${genome.project.name}`, {
      operation: 'structure_initialization'
    });
    
    if (structure === 'single-app') {
      console.log(`[StructureInitializationLayer] Calling initializeSingleApp()`);
      return this.initializeSingleApp(genome, dependencyMap);
    } else if (structure === 'monorepo') {
      console.log(`[StructureInitializationLayer] Calling initializeMonorepo()`);
    const result = await this.initializeMonorepo(genome, dependencyMap);
    console.log(`[StructureInitializationLayer] initializeMonorepo() completed: success=${result.success}, packages=${result.packages.length}`);
    console.log(`[StructureInitializationLayer] Packages created:`, result.packages.map(p => `${p.name} → ${p.path}`));
    return result;
    }
    
    console.log(`[StructureInitializationLayer] ❌ Unknown structure: ${structure}`);
    
    return {
      success: false,
      packages: [],
      error: `Unknown structure: ${structure}`
    };
  }

  /**
   * Initialize single app structure
   */
  private async initializeSingleApp(genome: Genome, dependencyMap?: Map<string, PackageDependencies>): Promise<StructureInitializationResult> {
    const projectRoot = this.pathHandler.getProjectRoot();
    
    // Create basic single app structure
    const directories = [
      path.join(projectRoot, 'src'),
      path.join(projectRoot, 'src/lib'),
      path.join(projectRoot, 'public'),
      path.join(projectRoot, 'scripts')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Create root package.json for single-app project
    await this.createRootPackageJsonForSingleApp(genome);
    
    Logger.info('✅ Single app structure initialized', {
      operation: 'structure_initialization'
    });
    
    return {
      success: true,
      packages: []
    };
  }

  /**
   * Initialize monorepo structure based on capabilities and apps
   */
  private async initializeMonorepo(genome: ResolvedGenome, dependencyMap?: Map<string, PackageDependencies>): Promise<StructureInitializationResult> {
    Logger.info('📁 Initializing monorepo structure based on capabilities and apps', {
      operation: 'structure_initialization'
    });
    
    const projectRoot = this.pathHandler.getProjectRoot();
    const monorepoConfig = getProjectMonorepo(genome);
    const apps = getProjectApps(genome);
    const capabilities = (genome as any).capabilities || {};
    // ResolvedGenome guarantees modules is always an array
    const modules = genome.modules;
    
    Logger.info(`🔍 Monorepo initialization details:`, {
      operation: 'structure_initialization',
      projectRoot,
      hasMonorepoConfig: !!monorepoConfig,
      monorepoPackages: monorepoConfig?.packages,
      appsCount: apps.length,
      capabilitiesCount: Object.keys(capabilities).length,
      modulesCount: modules.length,
      apps: apps.map((a: any) => ({ id: a.id, type: a.type, package: a.package }))
    });
    
    // Determine required packages based on capabilities, apps, and modules
    // FIRST: Resolve actual target packages for all modules to know which packages will be used
    const usedPackages = await this.resolveUsedPackages(genome, modules);
    
    Logger.info(`📦 Packages that will receive content:`, {
      operation: 'structure_initialization',
      usedPackages: Array.from(usedPackages),
      usedPackagesCount: usedPackages.size,
      usedPackagesList: Array.from(usedPackages).join(', ')
    });
    
    // THEN: Determine required packages based on capabilities, apps, and modules
    const requiredPackages = this.determineRequiredPackages(apps, capabilities, modules, usedPackages, genome);
    
    Logger.info(`📦 Required packages determined:`, {
      operation: 'structure_initialization',
      requiredPackages,
      requiredPackagesCount: Object.keys(requiredPackages).length,
      requiredPackagesList: Object.entries(requiredPackages).map(([name, path]) => `${name} → ${path}`).join(', ')
    });
    
    // Merge with explicit packages from config (explicit takes precedence)
    // Filter out undefined values from packages to match Record<string, string> type
    const explicitPackages = monorepoConfig?.packages || {};
    const filteredPackages: Record<string, string> = {};
    for (const [key, value] of Object.entries(explicitPackages)) {
      if (value !== undefined) {
        filteredPackages[key] = value;
      }
    }
    const finalPackages = this.mergePackages(
      requiredPackages,
      filteredPackages
    );
    
    Logger.info(`📦 Determined ${Object.keys(finalPackages).length} packages to create`, {
      packages: Object.keys(finalPackages),
      packageDetails: Object.entries(finalPackages).map(([name, path]) => `${name} → ${path}`),
      operation: 'structure_initialization'
    });
    
    // Create package directories and initialize them
    const createdPackages: PackageStructure[] = [];
    
    for (const [packageName, packagePath] of Object.entries(finalPackages)) {
      const fullPath = path.join(projectRoot, packagePath);
      
      Logger.info(`🔨 Creating package directory: ${packagePath}`, {
        operation: 'structure_initialization',
        packageName,
        packagePath,
        fullPath
      });
      
      // Create package directory
      await fs.mkdir(fullPath, { recursive: true });
      
      const packageType = this.getPackageType(packageName);
      
      Logger.debug(`📦 Package type for '${packageName}': ${packageType}`, {
        operation: 'structure_initialization',
        packageName,
        packageType
      });
      
      // Only initialize packages (not apps) - apps will be created by their framework adapters
      if (packageType === 'package') {
        // Get packageStructure from recipe book if available
        const packageStructure = this.getPackageStructureFromRecipeBook(packageName);
        Logger.info(`📦 Initializing package '${packageName}' (has recipe book: ${!!packageStructure})`, {
          operation: 'structure_initialization',
          packageName,
          packagePath,
          hasRecipeBook: !!packageStructure
        });
        await this.initializePackage(packageName, packagePath, fullPath, genome, packageStructure);
        Logger.info(`✅ Created and initialized package: ${packagePath}`, {
          package: packageName,
          path: packagePath,
          operation: 'structure_initialization',
          usesRecipeBook: !!packageStructure
        });
      } else {
        // For apps, check if they have a framework
        // CRITICAL: If app has a framework, DON'T create package.json here
        // Framework adapters (bootstrap) will create it using the framework CLI
        // This prevents conflicts with framework initialization (e.g., create-next-app)
        const appPackageJsonPath = path.join(fullPath, 'package.json');
        
        try {
          // Find app configuration from genome
          // V2 COMPLIANCE: Apps have id field set from V2GenomeHandler.buildApps()
          const apps = getProjectApps(genome);
          // Try multiple lookup strategies to find the app
          let app = apps.find((a) => a.id === packageName);
          if (!app) {
            app = apps.find((a) => a.type === packageName);
          }
          if (!app) {
            // Try matching by package path (e.g., "apps/mobile" -> "mobile")
            app = apps.find((a) => {
              if (a.package) {
                const appPackageName = this.extractPackageName(a.package, a.type);
                return appPackageName === packageName;
              }
              return false;
            });
          }
          
          // Check if app has a framework
          const appFramework = app ? ((app as any).framework || (app as FrameworkApp).framework) : undefined;
          
          if (app && appFramework) {
            // App has a framework - skip package.json creation
            // Framework adapter will create it during bootstrap
            Logger.info(`⏭️  Skipping package.json creation for app ${packageName} (framework: ${appFramework}) - framework adapter will create it`, {
              package: packageName,
              path: packagePath,
              framework: appFramework,
              operation: 'structure_initialization'
            });
            // Continue to next package - don't create package.json
          } else if (app) {
            // Get project name
            const projectName = (genome.project as any)?.name || genome.project?.name || 'project';
            
            // Resolve app dependencies from genome to workspace refs
            // V2 COMPLIANCE: Get dependencies from V2Genome metadata if available
            // V2Genome apps have dependencies array in the original config
            let appDeps: string[] = [];
            // Try to get from app object first (if preserved during conversion)
            if ('dependencies' in app && Array.isArray((app as FrameworkApp & { dependencies?: string[] }).dependencies)) {
              appDeps = (app as FrameworkApp & { dependencies?: string[] }).dependencies || [];
            } else if (genome.metadata && 'originalGenome' in genome.metadata) {
              // Try to get from original V2Genome if stored in metadata
              const originalGenome = (genome.metadata as { originalGenome?: { apps?: Record<string, { dependencies?: string[] }> } }).originalGenome;
              if (originalGenome?.apps?.[app.id]?.dependencies) {
                appDeps = originalGenome.apps[app.id]?.dependencies || [];
              }
            }
            
            // If still no dependencies, log but continue (workspace deps will be empty)
            if (appDeps.length === 0) {
              Logger.debug(`App ${packageName} has no dependencies specified, creating package.json without workspace deps`, {
                package: packageName,
                appId: app.id,
                operation: 'structure_initialization'
              });
            }
            
            const monorepoConfig = getProjectMonorepo(genome);
            // V2 COMPLIANCE: Get package manager from monorepo config or modules
            let packageManager = 'pnpm';
            if (monorepoConfig && typeof monorepoConfig === 'object') {
              // Try to get from monorepo config first
              if ('packageManager' in monorepoConfig) {
                packageManager = (monorepoConfig as { packageManager?: string }).packageManager || 'pnpm';
              } else {
                // Fallback: check modules for turborepo package manager
                const turborepoModule = genome.modules?.find((m) => 
                  m.id === 'monorepo/turborepo' || m.id === 'adapters/monorepo/turborepo'
                );
                if (turborepoModule && 'parameters' in turborepoModule && turborepoModule.parameters) {
                  packageManager = (turborepoModule.parameters as { packageManager?: string }).packageManager || 'pnpm';
                }
              }
            }
            
            const workspaceDeps = this.resolveAppDependenciesToWorkspaceRefs(
              appDeps,
              genome,
              packagePath,
              packageManager
            );
            
            // Generate app package.json using PackageJsonGenerator
            // V2 COMPLIANCE: Pass recipe books for framework scripts
            // Note: This is for apps WITHOUT frameworks (framework apps skip this entirely)
            const appPackageJson = PackageJsonGenerator.generateAppPackageJson(
              packageName,
              'unknown', // No framework - this app doesn't have one
              projectName,
              workspaceDeps,
              this.recipeBooks
            );
            
            await fs.writeFile(
              appPackageJsonPath,
              JSON.stringify(appPackageJson, null, 2) + '\n',
              'utf-8'
            );
            
            Logger.info(`📱 Created app package.json with framework dependencies: ${packagePath}`, {
              package: packageName,
              path: packagePath,
              framework: appFramework,
              dependenciesCount: Object.keys(appPackageJson.dependencies || {}).length,
              operation: 'structure_initialization'
            });
          } else {
            // Fallback: create minimal package.json if app not found
            // CRITICAL: Always create package.json for apps, even if not found in genome
            // This ensures modules can install dependencies in app package.json files
            Logger.warn(`⚠️ App ${packageName} not found in genome, creating minimal package.json`, {
              package: packageName,
              path: packagePath,
              availableApps: apps.map((a) => ({ id: a.id, type: a.type, package: a.package })),
              operation: 'structure_initialization'
            });
            
            const appPackageJson = {
              name: `@${(genome.project as any)?.name || genome.project?.name || 'project'}/${packageName}`,
              version: '1.0.0',
              private: true,
              scripts: {},
              dependencies: {},
              devDependencies: {
                'typescript': '^5.0.0',
                '@types/node': '^20.0.0'
              }
            };
            
            await fs.writeFile(
              appPackageJsonPath,
              JSON.stringify(appPackageJson, null, 2) + '\n',
              'utf-8'
            );
            
            Logger.info(`📱 Created minimal app package.json: ${packagePath}`, {
              package: packageName,
              path: packagePath,
              operation: 'structure_initialization'
            });
          }
        } catch (error) {
          // CRITICAL: If app package.json creation fails, log error but don't fail silently
          // The file MUST exist for modules to install dependencies
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.error(`❌ Failed to create package.json for app ${packageName}: ${errorMessage}`, {
            package: packageName,
            path: packagePath,
            operation: 'structure_initialization',
            error: errorMessage
          });
          
          // Still try to create a minimal package.json as last resort
          try {
            const minimalPackageJson = {
              name: packageName,
              version: '1.0.0',
              private: true,
              scripts: {},
              dependencies: {},
              devDependencies: {}
            };
            await fs.writeFile(
              appPackageJsonPath,
              JSON.stringify(minimalPackageJson, null, 2) + '\n',
              'utf-8'
            );
            Logger.info(`📱 Created emergency minimal package.json for app ${packageName}`, {
              package: packageName,
              path: packagePath,
              operation: 'structure_initialization'
            });
          } catch (fallbackError) {
            // If even the fallback fails, this is a critical error
            Logger.error(`❌ CRITICAL: Failed to create emergency package.json for app ${packageName}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`, {
              package: packageName,
              path: packagePath,
              operation: 'structure_initialization',
              originalError: errorMessage,
              fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            });
            // Re-throw to fail fast - app package.json is required
            throw new Error(`Failed to create package.json for app ${packageName} at ${packagePath}: ${errorMessage}`);
          }
        }
      }
      
      createdPackages.push({
        name: packageName,
        path: packagePath,
        type: packageType,
        purpose: this.getPackagePurpose(packageName, capabilities, modules)
      });
    }
    
    // Create root package.json for workspace WITHOUT workspaces property initially
    // This prevents create-next-app and similar tools from detecting the workspace
    // and generating workspace:* protocol references (which npm doesn't support)
    // The workspaces property will be added later by the monorepo/turborepo module
    await this.createRootPackageJsonMinimal(finalPackages, monorepoConfig);
    
        // Generate monorepo tool configuration
        await this.generateMonorepoToolConfig(finalPackages, monorepoConfig, genome);
    
    // CRITICAL: Update genome.project.monorepo.packages with created packages
    // This ensures the rest of the system knows about the packages
    if (!genome.project.monorepo) {
      (genome.project as any).monorepo = {};
    }
    (genome.project as any).monorepo.packages = finalPackages;
    
    Logger.info(`✅ Monorepo structure initialized with ${createdPackages.length} packages`, {
      packages: createdPackages.map(p => `${p.name} (${p.path})`),
      operation: 'structure_initialization'
    });
    
    // Generate CLI defaults after structure is created
    // V2 COMPLIANCE: Pass recipe books for framework scripts (if single-app)
    await CliDefaultsGenerator.generateDefaults(
      projectRoot,
      genome.project.name,
      'monorepo',
      undefined, // Framework not needed for monorepo root scripts (uses turbo)
      this.recipeBooks
    );
    
    return {
      success: true,
      packages: createdPackages
    };
  }

  /**
   * Resolve which packages will actually be used by modules
   * Uses MonorepoPackageResolver to predict module placement
   */
  private async resolveUsedPackages(genome: ResolvedGenome, modules: any[]): Promise<Set<string>> {
    const usedPackages = new Set<string>();
    
    console.log(`[resolveUsedPackages] Starting resolution for ${modules.length} modules`);
    console.log(`[resolveUsedPackages] this.recipeBooks: ${this.recipeBooks ? 'exists' : 'null/undefined'}`);
    console.log(`[resolveUsedPackages] this.recipeBooks?.size: ${this.recipeBooks?.size || 0}`);
    
    // Import resolver dynamically to avoid circular dependencies (ESM import)
    const { MonorepoPackageResolver } = await import('./monorepo-package-resolver.js');
    
    for (const module of modules) {
      try {
        const moduleId = typeof module === 'string' ? module : module.id;
        console.log(`[resolveUsedPackages] Resolving package for module: ${moduleId}`);
        console.log(`[resolveUsedPackages] Passing recipeBooks to resolver: ${!!this.recipeBooks && this.recipeBooks.size > 0}`);
        
        // Pass recipe books to resolver if available
        const targetPackage = MonorepoPackageResolver.resolveTargetPackage(
          module as any,
          genome,
          this.recipeBooks
        );
        
        console.log(`[resolveUsedPackages] Module ${moduleId} → targetPackage: ${targetPackage || 'null'}`);
        
        if (targetPackage) {
          usedPackages.add(targetPackage);
          Logger.info(`📦 Module ${moduleId} will use package: ${targetPackage}`, {
            operation: 'structure_initialization',
            moduleId,
            targetPackage
          });
        } else {
          Logger.warn(`⚠️ Module ${moduleId} has no target package`, {
            operation: 'structure_initialization',
            moduleId
          });
        }
      } catch (error) {
        const moduleId = typeof module === 'string' ? module : (module as any).id;
        console.log(`[resolveUsedPackages] ❌ Error resolving package for ${moduleId}:`, error instanceof Error ? error.message : String(error));
        // If resolution fails, we'll still create packages based on capabilities
        Logger.warn(`⚠️ Failed to resolve target package for module: ${moduleId}`, {
          operation: 'structure_initialization',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`[resolveUsedPackages] Final used packages:`, Array.from(usedPackages));
    
    return usedPackages;
  }

  /**
   * Determine required packages based on capabilities, apps, and modules
   * Now also considers which packages will actually be used
   */
  private determineRequiredPackages(
    apps: any[],
    capabilities: Record<string, any>,
    modules: any[],
    usedPackages: Set<string>,
    genome: ResolvedGenome
  ): Record<string, string> {
    const packages: Record<string, string> = {};
    
    // CRITICAL: Normalize database package names to prevent duplicates
    // Get recipe book's choice for database package (may be 'db' with directory 'packages/db')
    const dbPackageStructure = this.getPackageStructureFromRecipeBook('database');
    const normalizedDbPath = dbPackageStructure?.directory || 'packages/database';
    const normalizedDbName = dbPackageStructure?.name || 'database';
    
    // 1. Packages from apps (always required)
    for (const app of apps) {
      if (app.package) {
        const packageName = this.extractPackageName(app.package, app.type);
        packages[packageName] = app.package;
      } else {
        // Auto-generate package path if not specified
        const packageName = app.id || app.type;
        if (app.type === 'web') {
          packages[packageName] = `apps/${packageName}`;
        } else if (app.type === 'api') {
          packages[packageName] = `packages/${packageName}`;
        } else if (app.type === 'mobile') {
          packages[packageName] = `apps/${packageName}`;
        }
      }
    }
    
    // 2. Packages based on capabilities
    // V2 COMPLIANCE: Capabilities map to granular packages (packages/auth, packages/payments, etc.)
    // No longer create monolithic packages/shared
    // Packages are created from genome.packages or module resolution
    
    // 2.5. Packages from genome.packages (source of truth)
    // Create packages that are explicitly declared in genome, even if no modules target them yet
    // This ensures packages like 'payments' are created when declared in genome.packages
    if ((genome as any).packages) {
      for (const [packageName] of Object.entries((genome as any).packages)) {
        // Check if packageStructure exists in recipe book
        const packageStructure = this.getPackageStructureFromRecipeBook(packageName);
        
        if (packageStructure) {
          // Package should be created (has structure in recipe book)
          const packagePath = packageStructure.directory;
          const normalizedName = packageStructure.name || packageName;
          
          // Skip if already exists (by name or path)
          const existingByName = packages[normalizedName];
          const existingByPath = Object.entries(packages).find(([_, path]) => path === packagePath);
          
          if (!existingByName && !existingByPath) {
            // Normalize database package names
            if ((normalizedName === 'database' && packages.db) || (normalizedName === 'db' && packages.database)) {
              Logger.debug(`📦 Skipping duplicate database package from genome: ${normalizedName}`, {
                operation: 'structure_initialization',
                packageName: normalizedName
              });
              continue;
            }
            
            packages[normalizedName] = packagePath;
            Logger.debug(`📦 Added package from genome.packages: ${normalizedName} (${packagePath})`, {
              operation: 'structure_initialization',
              packageName: normalizedName,
              source: 'genome.packages',
              hasPackageStructure: true
            });
          } else {
            Logger.debug(`📦 Package from genome.packages already exists: ${normalizedName}`, {
              operation: 'structure_initialization',
              packageName: normalizedName,
              existingByName: !!existingByName,
              existingByPath: existingByPath ? existingByPath[0] : null
            });
          }
        } else {
          Logger.debug(`📦 Package ${packageName} in genome.packages but no packageStructure in recipe book, skipping`, {
            operation: 'structure_initialization',
            packageName
          });
        }
      }
    }
    
    // 3. Add packages that will actually be used by modules (from resolved target packages)
    // This ensures we create packages that will receive content
    // Uses normalizedDbPath and normalizedDbName from function start
    for (const usedPackage of Array.from(usedPackages)) {
      // Normalize database package paths to recipe book's choice
      let normalizedPackage = usedPackage;
      if (usedPackage === 'packages/database' && normalizedDbPath === 'packages/db') {
        normalizedPackage = 'packages/db';
        Logger.debug(`📦 Normalizing database package: packages/database -> packages/db (from recipe book)`, {
          operation: 'structure_initialization'
        });
      } else if (usedPackage === 'packages/db' && normalizedDbPath === 'packages/database') {
        normalizedPackage = 'packages/database';
        Logger.debug(`📦 Normalizing database package: packages/db -> packages/database (from recipe book)`, {
          operation: 'structure_initialization'
        });
      }
      
      // Extract package name from normalized path
      const parts = normalizedPackage.split('/');
      const packageName = parts.length > 0 ? parts[parts.length - 1] : null;
      if (packageName) {
        // Check if this package already exists (by name or path)
        const existingByName = packages[packageName];
        const existingByPath = Object.entries(packages).find(([_, path]) => path === normalizedPackage);
        
        if (existingByName || existingByPath) {
          // Package already exists - skip
          Logger.debug(`📦 Package ${normalizedPackage} already exists, skipping duplicate`, {
            operation: 'structure_initialization',
            packageName,
            existingByName: !!existingByName,
            existingByPath: existingByPath ? existingByPath[0] : null
          });
          continue;
        }
        
        // Check if we're trying to create both 'database' and 'db' packages
        // Standardize on the recipe book's choice
        if ((packageName === 'database' && packages.db) || (packageName === 'db' && packages.database)) {
          Logger.debug(`📦 Skipping duplicate database package: ${packageName} (already have ${packageName === 'database' ? 'db' : 'database'})`, {
            operation: 'structure_initialization',
            packageName
          });
          continue;
        }
        
        packages[packageName] = normalizedPackage;
        Logger.debug(`📦 Added package from module resolution: ${packageName} (${normalizedPackage})`, {
          operation: 'structure_initialization',
          packageName,
          packagePath: normalizedPackage
        });
      }
    }
    
    // 4. Packages based on capabilities (only if they will be used)
    // Skip creating packages for capabilities that won't receive content
    // Uses normalizedDbPath and normalizedDbName from function start
    for (const [capabilityId, capabilityConfig] of Object.entries(capabilities)) {
      let packageName = this.getCapabilityPackageName(capabilityId);
      let packagePath = `packages/${packageName}`;
      
      // Normalize database package to recipe book's choice
      if (packageName === 'database' && normalizedDbPath !== 'packages/database') {
        packageName = normalizedDbName;
        packagePath = normalizedDbPath;
        Logger.debug(`📦 Normalizing database capability package: packages/database -> ${normalizedDbPath} (from recipe book)`, {
          operation: 'structure_initialization',
          capabilityId
        });
      }
      
      // Only add if this package will actually be used OR if it's explicitly needed
      // Check both original and normalized paths
      const willBeUsed = usedPackages.has(packagePath) || 
                        (packageName === 'database' && usedPackages.has('packages/db')) ||
                        (packageName === 'db' && usedPackages.has('packages/database'));
      
      if (willBeUsed) {
        if (!packages[packageName] && !packages.database && !packages.db) {
          packages[packageName] = packagePath;
          Logger.debug(`📦 Added package from capability (will be used): ${packageName} (${packagePath})`, {
            operation: 'structure_initialization',
            capabilityId,
            packageName,
            packagePath
          });
        }
      } else {
        // Check if this capability really needs its own package
        const needsPackage = this.capabilityNeedsPackage(capabilityId, capabilityConfig, modules);
        if (needsPackage && !packages[packageName] && !packages.database && !packages.db) {
          // Only add if it's a critical package (like database, ui)
          const criticalPackages = ['database', 'ui'];
          if (criticalPackages.includes(this.getCapabilityPackageName(capabilityId))) {
            packages[packageName] = packagePath;
            Logger.debug(`📦 Added critical package from capability: ${packageName} (${packagePath})`, {
              operation: 'structure_initialization',
              capabilityId,
              packageName,
              packagePath
            });
          }
        }
      }
    }
    
    // 5. Ensure required packages are always created (apps, ui, database)
    // V2 COMPLIANCE: No packages/shared - use granular packages instead
    // Packages are created from genome.packages or module resolution
    
    // UI package is always created if UI modules exist
    const hasUIModules = modules.some(m => {
      const id = typeof m === 'string' ? m : m.id;
      return id?.includes('ui/') || id?.includes('tamagui') || id?.includes('shadcn');
    });
    if (hasUIModules && !packages.ui) {
      packages.ui = 'packages/ui';
    }
    
    // Database package is always created if database modules exist
    // Check recipe book first to get the correct directory (may be "packages/db" or "packages/database")
    const hasDatabaseModules = modules.some(m => {
      const id = typeof m === 'string' ? m : m.id;
      return id?.includes('database/') || id?.includes('db/') || id?.includes('drizzle') || id?.includes('prisma');
    });
    if (hasDatabaseModules && !packages.database && !packages.db) {
      // Check recipe book for database package structure
      const dbPackageStructure = this.getPackageStructureFromRecipeBook('database');
      if (dbPackageStructure?.directory) {
        // Use recipe book directory (e.g., "packages/db")
        const dbPackageName = dbPackageStructure.name || 'database';
        packages[dbPackageName] = dbPackageStructure.directory;
        Logger.debug(`📦 Added database package from recipe book: ${dbPackageName} (${dbPackageStructure.directory})`, {
          operation: 'structure_initialization',
          packageName: dbPackageName,
          directory: dbPackageStructure.directory
        });
      } else {
        // Fallback: use standard "packages/database"
        packages.database = 'packages/database';
        Logger.debug(`📦 Added database package (fallback): database (packages/database)`, {
          operation: 'structure_initialization'
        });
      }
    } else if (hasDatabaseModules && (packages.database || packages.db)) {
      Logger.debug(`📦 Database package already exists, skipping duplicate`, {
        operation: 'structure_initialization',
        existingPackages: { database: packages.database, db: packages.db }
      });
    }
    
    return packages;
  }

  /**
   * Check if capabilities require shared code
   */
  private hasSharedCode(capabilities: Record<string, any>): boolean {
    // Capabilities that typically need shared code (tech-stack, schemas, types)
    const sharedCapabilities = [
      'auth', 'payments', 'teams-management', 'emailing',
      'monitoring', 'ai-chat', 'synap', 'semantic-search',
      'projects', 'web3', 'waitlist', 'architech-welcome'
    ];
    
    return Object.keys(capabilities).some(key => 
      sharedCapabilities.includes(key)
    );
  }

  /**
   * Determine if a capability needs its own dedicated package
   */
  private capabilityNeedsPackage(
    capabilityId: string,
    capabilityConfig: any,
    modules: any[]
  ): boolean {
    // Capabilities that typically need their own package
    const packageCapabilities = [
      'auth', 'payments', 'database', 'emailing', 'teams-management'
    ];
    
    if (!packageCapabilities.includes(capabilityId)) {
      return false;
    }
    
    // Check if there are modules for this capability that would benefit from a dedicated package
    const hasCapabilityModules = modules.some(m => 
      m.id?.includes(capabilityId) || 
      m.id?.includes(`adapters/${capabilityId}/`) ||
      m.id?.includes(`features/${capabilityId}/`)
    );
    
    return hasCapabilityModules;
  }

  /**
   * Get package name for a capability
   */
  private getCapabilityPackageName(capabilityId: string): string {
    // Map capability IDs to package names
    const mapping: Record<string, string> = {
      'auth': 'auth',
      'payments': 'payments',
      'database': 'database',
      'emailing': 'emailing',
      'teams-management': 'teams',
      'monitoring': 'monitoring',
      'ai-chat': 'ai',
      'projects': 'projects'
    };
    
    return mapping[capabilityId] || capabilityId;
  }

  /**
   * Extract package name from app package path
   */
  private extractPackageName(packagePath: string, appType: string): string {
    // Extract from path like "apps/web" -> "web"
    const parts = packagePath.split('/');
    return parts[parts.length - 1] || appType;
  }

  /**
   * Get package type (app or package)
   */
  private getPackageType(packageName: string): 'app' | 'package' {
    if (packageName === 'web' || packageName === 'mobile' || packageName === 'api') {
      return 'app';
    }
    return 'package';
  }

  /**
   * Merge required packages with explicit config
   * Explicit config takes precedence
   */
  private mergePackages(
    required: Record<string, string>,
    explicit: Record<string, string>
  ): Record<string, string> {
    // Explicit config takes precedence, but we keep required packages that aren't explicit
    return { ...required, ...explicit };
  }

  /**
   * Initialize a package (create package.json, tsconfig, src/, etc.)
   */
  private async initializePackage(
    packageName: string,
    packagePath: string,
    fullPath: string,
    genome: Genome,
    packageStructure?: PackageStructureType
  ): Promise<void> {
    // Create src directory
    await fs.mkdir(path.join(fullPath, 'src'), { recursive: true });
    
    // Get project name from genome (fallback to 'project')
    const projectName = (genome.project as any)?.name || genome.project?.name || 'project';
    
    // Use PackageJsonGenerator if packageStructure is available, otherwise fallback
    let packageJson;
    if (packageStructure) {
      // Use PackageJsonGenerator with recipe book metadata
      packageJson = PackageJsonGenerator.generatePackageJson(
        packageName,
        packageStructure,
        projectName,
        genome,
        packagePath
      );
    } else {
      // Fallback to legacy method for backward compatibility
      const packageConfig = this.determinePackageConfig(packageName, packagePath, genome);
      packageJson = {
        name: `@${projectName}/${packageName}`, // Use project name instead of @repo
        version: '1.0.0',
        private: true,
        main: 'src/index.ts',
        types: 'src/index.ts',
        scripts: packageConfig.scripts || {},
        dependencies: packageConfig.dependencies || {},
        devDependencies: packageConfig.devDependencies || {},
        ...packageConfig.extra
      };
    }
    
    await fs.writeFile(
      path.join(fullPath, 'package.json'),
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    Logger.info(`📦 Created package.json for ${packageName}`, {
      operation: 'structure_initialization',
      packageName,
      packagePath,
      packageNameFull: packageJson.name,
      hasDependencies: Object.keys(packageJson.dependencies || {}).length > 0,
      usesRecipeBook: !!packageStructure
    });
    
    // Create tsconfig.json for TypeScript packages
    const tsconfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    await fs.writeFile(
      path.join(fullPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2) + '\n'
    );
    
    // Create index.ts placeholder
    // ResolvedGenome guarantees modules is always an array
    await this.createPackageIndex(packageName, fullPath, (genome as any).capabilities || {}, genome.modules);
  }

  /**
   * Get packageStructure from recipe book for a given package name
   * 
   * @param packageName - Package name (e.g., "auth", "db", "ui")
   * @returns PackageStructure from recipe book or undefined
   */
  private getPackageStructureFromRecipeBook(packageName: string): PackageStructureType | undefined {
    if (!this.recipeBooks || this.recipeBooks.size === 0) {
      return undefined;
    }

    // Search all recipe books for this package
    for (const recipeBook of Array.from(this.recipeBooks.values())) {
      // Try direct lookup first
      let packageRecipe = recipeBook.packages[packageName];
      
      // If not found, try searching by packageStructure.name (e.g., "db" package has name "db" in recipe book "database")
      if (!packageRecipe) {
        for (const [recipePackageId, recipe] of Object.entries(recipeBook.packages)) {
          const structure = (recipe as any).packageStructure;
          if (structure && structure.name === packageName) {
            packageRecipe = recipe as any;
            Logger.debug(`✅ Found packageStructure by name match: ${recipePackageId} → ${packageName}`, {
              operation: 'structure_initialization',
              packageName,
              recipePackageId
            });
            break;
          }
        }
      }
      
      if (packageRecipe && packageRecipe.packageStructure) {
        Logger.debug(`✅ Found packageStructure in recipe book for: ${packageName}`, {
          operation: 'structure_initialization',
          packageName
        });
        return packageRecipe.packageStructure;
      }
    }

    return undefined;
  }

  /**
   * Determine package configuration (dependencies, scripts, etc.) based on package name and genome
   * 
   * NOW RECIPE BOOK DRIVEN:
   * - Uses packageStructure from recipe book when available
   * - Falls back to minimal defaults when recipe book not available
   * - No hardcoded package-specific configs
   */
  private determinePackageConfig(
    packageName: string,
    packagePath: string,
    genome: Genome
  ): {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    extra?: Record<string, any>;
  } {
    const isMonorepo = genome.project.structure === 'monorepo';
    const monorepoConfig = genome.project.monorepo;
    
    // Base TypeScript dependencies for all packages (minimal default)
    const baseDevDependencies: Record<string, string> = {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0'
    };
    
    // Try to get packageStructure from recipe book
    const packageStructure = this.getPackageStructureFromRecipeBook(packageName);
    
    // Build config from recipe book or use minimal defaults
    const baseConfig: {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
      extra?: Record<string, any>;
    } = packageStructure
      ? {
          // Use dependencies from recipe book
          dependencies: packageStructure.dependencies || {},
          // Use devDependencies from recipe book, merge with base
          devDependencies: {
            ...baseDevDependencies,
            ...(packageStructure.devDependencies || {})
          },
          // Use scripts from recipe book, add defaults if missing
          scripts: {
            'build': 'tsc',
            'dev': 'tsc --watch',
            ...(packageStructure.scripts || {})
          }
        }
      : {
          // Fallback: minimal defaults (no package-specific logic)
          dependencies: {},
          devDependencies: baseDevDependencies,
          scripts: {
            'build': 'tsc',
            'dev': 'tsc --watch'
          }
        };
    
    // Add workspace references if monorepo
    // IMPORTANT: Format depends on package manager
    // - npm: uses file: protocol (doesn't support workspace:*)
    // - pnpm/yarn: uses workspace:* protocol
    if (isMonorepo && monorepoConfig) {
      const workspaceDeps: Record<string, string> = {};
      
      // Detect package manager from genome or monorepo config
      // Check if turborepo module has packageManager parameter
      const turborepoModule = genome.modules?.find((m: any) => 
        m.id === 'monorepo/turborepo' || m.id === 'adapters/monorepo/turborepo'
      );
      const packageManager = (turborepoModule as any)?.parameters?.packageManager || 'npm';
      
      // Use WorkspaceReferenceBuilder for apps (dynamic detection, not hardcoded)
      // Check if this is an app by looking at genome.apps
      const apps = getProjectApps(genome as ResolvedGenome);
      const isApp = apps.some((app: any) => {
        const appPackageName = app.id || app.type;
        return appPackageName === packageName;
      });
      
      if (isApp) {
        // Get app dependencies from genome to filter workspace deps
        const appConfig = apps.find((app: any) => {
          const appPackageName = app.id || app.type;
          return appPackageName === packageName;
        });
        const appDeps = (appConfig as any)?.dependencies || [];
        
        const appWorkspaceDeps = WorkspaceReferenceBuilder.buildWorkspaceDependencies(
          packageName,
          packagePath,
          genome,
          packageManager,
          appDeps
        );
        Object.assign(workspaceDeps, appWorkspaceDeps);
      }
      
      if (Object.keys(workspaceDeps).length > 0) {
        baseConfig.dependencies = {
          ...baseConfig.dependencies,
          ...workspaceDeps
        };
      }
    }
    
    return baseConfig;
  }

  /**
   * Create index.ts placeholder for package
   */
  private async createPackageIndex(
    packageName: string,
    fullPath: string,
    capabilities: Record<string, any>,
    modules: any[]
  ): Promise<void> {
    const srcPath = path.join(fullPath, 'src');
    
    // Try to read existing files to generate exports
    let exports: string[] = [];
    try {
      const files = await fs.readdir(srcPath);
      for (const file of files) {
        // Skip index.ts and directories
        if (file === 'index.ts' || file.includes('.')) {
          const filePath = path.join(srcPath, file);
          try {
            const stats = await fs.stat(filePath);
            if (stats.isFile() && file.endsWith('.ts')) {
              const baseName = file.replace('.ts', '');
              // Generate export based on file name
              if (baseName !== 'index') {
                exports.push(`export * from './${baseName}';`);
              }
            }
          } catch {
            // Skip if can't stat
          }
        }
      }
      
      // Also check for subdirectories (like db/, tamagui/, etc.)
      for (const file of files) {
        const filePath = path.join(srcPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isDirectory()) {
            // Check if directory has index.ts
            const dirIndexPath = path.join(filePath, 'index.ts');
            try {
              await fs.access(dirIndexPath);
              exports.push(`export * from './${file}';`);
            } catch {
              // No index.ts in directory, skip
            }
          }
        } catch {
          // Skip if can't stat
        }
      }
    } catch {
      // If src directory doesn't exist yet, create empty exports
      // Files will be generated later by blueprints
    }
    
    // If no exports found, create placeholder that will be populated later
    if (exports.length === 0) {
      exports.push('// Exports will be added by blueprints');
    }
    
    const indexContent = `/**
 * ${packageName} package
 * 
 * ${this.getPackagePurpose(packageName, capabilities, modules)}
 */

${exports.join('\n')}
`;
    
    await fs.writeFile(
      path.join(srcPath, 'index.ts'),
      indexContent
    );
  }

  /**
   * Get package purpose description
   */
  private getPackagePurpose(
    packageName: string,
    capabilities: Record<string, any>,
    modules: any[]
  ): string {
    if (packageName === 'shared') {
      const capabilityNames = Object.keys(capabilities);
      if (capabilityNames.length > 0) {
        return `Shared code for capabilities: ${capabilityNames.join(', ')}`;
      }
      return 'Shared code and utilities';
    }
    if (packageName === 'web') {
      return 'Web application';
    }
    if (packageName === 'api') {
      return 'API server';
    }
    if (packageName === 'mobile') {
      return 'Mobile application';
    }
    return 'Package';
  }

  /**
   * Create root package.json for single-app project
   */
  private async createRootPackageJsonForSingleApp(genome: Genome): Promise<void> {
    const projectRoot = this.pathHandler.getProjectRoot();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    // Check if package.json already exists
    try {
      await fs.access(packageJsonPath);
      Logger.debug('package.json already exists, skipping creation', {
        operation: 'structure_initialization'
      });
      return;
    } catch {
      // File doesn't exist, create it
    }
    
    // Create minimal package.json for single-app
    const packageJson: any = {
      name: genome.project.name || 'my-app',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      }
    };
    
    // Add description if available
    if (genome.project.description) {
      packageJson.description = genome.project.description;
    }
    
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
      'utf-8'
    );
    
    Logger.info('✅ Created root package.json for single-app project', {
      operation: 'structure_initialization',
      path: packageJsonPath
    });
  }

  /**
   * Create minimal root package.json WITHOUT workspaces property
   * This prevents create-next-app from detecting workspace and generating workspace:* references
   * The workspaces property will be added by the monorepo/turborepo module after apps are created
   */
  private async createRootPackageJsonMinimal(
    packages: Record<string, string>,
    monorepoConfig: any
  ): Promise<void> {
    const projectRoot = this.pathHandler.getProjectRoot();
    
    // Create minimal package.json WITHOUT workspaces to avoid workspace detection
    // during framework setup (create-next-app, etc.)
    const packageJson: any = {
      name: (this.pathHandler as any).projectName || 'monorepo',
      version: '1.0.0',
      private: true,
      // NOTE: workspaces property is intentionally omitted here
      // It will be added by the monorepo/turborepo module after apps are created
      scripts: {
        dev: 'turbo run dev',
        build: 'turbo run build',
        lint: 'turbo run lint'
      },
      devDependencies: {}
    };
    
    // Add monorepo tool as dev dependency
    if (monorepoConfig?.tool === 'turborepo') {
      packageJson.devDependencies['turbo'] = 'latest';
    }
    
    await fs.writeFile(
      path.join(projectRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    Logger.info('📄 Created minimal root package.json (without workspaces)', {
      operation: 'structure_initialization'
    });
  }

  /**
   * Calculate relative path between app and package (for file: protocol fallback)
   */
  private calculateRelativePath(appPath: string, packagePath: string): string {
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
   * Resolve app dependencies from genome to workspace references
   * 
   * @param appDeps - Array of dependency names from genome (e.g., ['auth', 'database'])
   * @param genome - Genome with monorepo configuration
   * @param appPath - App path (e.g., 'apps/web')
   * @param packageManager - Package manager ('npm', 'pnpm', 'yarn')
   * @returns Map of workspace dependencies (e.g., {'@project/auth': 'workspace:*'})
   */
  private resolveAppDependenciesToWorkspaceRefs(
    appDeps: string[],
    genome: ResolvedGenome,
    appPath: string,
    packageManager: string
  ): Record<string, string> {
    const projectName = (genome.project as any)?.name || genome.project?.name || 'project';
    const monorepoConfig = getProjectMonorepo(genome);
    const packages = monorepoConfig?.packages || {};
    const workspaceDeps: Record<string, string> = {};
    
    // Use workspace:* for all modern package managers (npm 7+, yarn, pnpm)
    const useWorkspaceProtocol = ['pnpm', 'yarn', 'npm'].includes(packageManager);
    
    for (const depName of appDeps) {
      // Find package path from monorepo packages
      const packagePath = packages[depName];
      if (packagePath) {
        const scopedName = `@${projectName}/${depName}`;
        
        if (useWorkspaceProtocol) {
          workspaceDeps[scopedName] = 'workspace:*';
        } else {
          // Fallback: use relative path (shouldn't happen for modern package managers)
          const relativePath = this.calculateRelativePath(appPath, packagePath);
          workspaceDeps[scopedName] = relativePath;
        }
      }
    }
    
    return workspaceDeps;
  }

  /**
   * Generate monorepo tool configuration
   */
  private async generateMonorepoToolConfig(
    packages: Record<string, string>,
    monorepoConfig: any,
    genome?: Genome
  ): Promise<void> {
    const projectRoot = this.pathHandler.getProjectRoot();
    const tool = monorepoConfig?.tool || 'turborepo';
    
    // Detect package manager from genome
    let packageManager = 'npm';
    if (genome && 'modules' in genome) {
      const modules = (genome as any).modules || [];
      const turborepoModule = modules.find((m: any) => 
        m.id === 'monorepo/turborepo' || m.id === 'adapters/monorepo/turborepo'
      );
      packageManager = (turborepoModule as any)?.parameters?.packageManager || 'npm';
    }
    
    if (tool === 'turborepo') {
      const turboConfig = {
        $schema: 'https://turbo.build/schema.json',
        pipeline: {
          build: {
            dependsOn: ['^build'],
            outputs: ['.next/**', '!.next/cache/**', 'dist/**']
          },
          dev: {
            cache: false,
            persistent: true
          },
          lint: {
            dependsOn: ['^lint']
          }
        }
      };
      
      await fs.writeFile(
        path.join(projectRoot, 'turbo.json'),
        JSON.stringify(turboConfig, null, 2) + '\n'
      );
      
      Logger.info('📄 Created turbo.json', {
        operation: 'structure_initialization'
      });
    }
    
    // Generate pnpm-workspace.yaml if package manager is pnpm
    if (packageManager === 'pnpm') {
      const workspaceYamlPath = path.join(projectRoot, 'pnpm-workspace.yaml');
      const packagePaths = Object.values(packages).filter(Boolean);
      const workspaceConfig = `packages:
${packagePaths.map(pkg => `  - '${pkg}'`).join('\n')}
`;
      
      await fs.writeFile(workspaceYamlPath, workspaceConfig);
      Logger.info('📦 Created pnpm-workspace.yaml', {
        operation: 'structure_initialization',
        packages: packagePaths
      });
    }
  }
}


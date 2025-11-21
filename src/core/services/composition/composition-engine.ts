/**
 * Composition Engine
 * 
 * The V2 Composition Engine is the "brain" of the CLI that:
 * 1. Loads recipe books from marketplaces
 * 2. Expands packages into modules using recipes
 * 3. Resolves dependencies using prerequisites
 * 4. Generates lock file for reproducible builds
 */

import type {
  V2Genome,
  LockFile,
  RecipeBook,
  ModuleWithPrerequisites,
  MarketplaceAdapter,
  PackageDependencies,
} from '@thearchitech.xyz/types';
import { RecipeExpander } from './recipe-expander.js';
import { DependencyResolver } from './dependency-resolver.js';
import { LockFileService } from './lock-file-service.js';
import { DependencyResolverService } from '../dependency/dependency-resolver-service.js';
import { createHash } from 'crypto';

export interface Logger {
  info: (msg: string, meta?: any) => void;
  debug: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
}

export class CompositionEngine {
  private recipeExpander: RecipeExpander;
  private dependencyResolver: DependencyResolver;
  private lockFileService: LockFileService;
  private logger: Logger;
  private marketplaceAdapters: Map<string, MarketplaceAdapter>;

  constructor(
    marketplaceAdapters: Map<string, MarketplaceAdapter>,
    logger: Logger,
    projectRoot?: string
  ) {
    this.marketplaceAdapters = marketplaceAdapters;
    this.logger = logger;
    this.recipeExpander = new RecipeExpander(logger);
    this.dependencyResolver = new DependencyResolver(logger);
    this.lockFileService = new LockFileService(logger);
  }

  /**
   * Resolve a V2 genome into a lock file
   * 
   * @param genome - V2 genome from user
   * @param projectRoot - Root directory for lock file operations (optional)
   * @param forceRegenerate - Force regeneration even if lock file exists (default: false)
   * @returns Lock file with resolved modules and execution plan
   */
  async resolve(
    genome: V2Genome,
    projectRoot?: string,
    forceRegenerate: boolean = false
  ): Promise<LockFile> {
    this.logger.info('Starting composition engine resolution', {
      marketplaces: Object.keys(genome.marketplaces).length,
      packages: Object.keys(genome.packages).length,
      apps: Object.keys(genome.apps).length,
      forceRegenerate
    });

    // Check for existing lock file if projectRoot is provided
    if (projectRoot && !forceRegenerate) {
      const isValid = await this.lockFileService.isLockFileValid(projectRoot, genome);
      if (isValid) {
        const existingLockFile = await this.lockFileService.readLockFile(projectRoot);
        if (existingLockFile) {
          // CRITICAL: Check if framework modules are in the lock file
          // If not, force regeneration to include them
          const frameworkModulesInLockFile = existingLockFile.modules.filter(m => m.id.startsWith('adapters/framework/'));
          const expectedFrameworkPackages = Object.values(genome.apps)
            .map(app => (app as { framework?: string }).framework)
            .filter((f): f is string => !!f);
          
          const missingFrameworkModules = expectedFrameworkPackages.filter(framework => {
            const expectedModuleId = `adapters/framework/${framework}`;
            return !frameworkModulesInLockFile.some(m => m.id === expectedModuleId);
          });
          
          if (missingFrameworkModules.length > 0) {
            this.logger.warn('Existing lock file missing framework modules, forcing regeneration', {
              missingFrameworks: missingFrameworkModules,
              existingFrameworkModules: frameworkModulesInLockFile.map(m => m.id),
              expectedFrameworks: expectedFrameworkPackages
            });
            // Force regeneration to include framework modules
            // Continue to full resolution below (don't return)
          } else {
            this.logger.info('Reusing existing lock file', {
              genomeHash: existingLockFile.genomeHash,
              resolvedAt: existingLockFile.resolvedAt,
              moduleCount: existingLockFile.modules.length,
              frameworkModules: frameworkModulesInLockFile.map(m => m.id)
            });
            return existingLockFile;
          }
        }
      }
    }

    // Step 1: Load recipe books from all marketplaces
    const recipeBooks = await this.loadRecipeBooks(genome);
    this.logger.debug('Recipe books loaded', {
      marketplaceCount: recipeBooks.size
    });

    // Step 2: Collect all packages from all apps
    const allPackages = this.collectPackagesFromApps(genome);
    const frameworkPackages = Object.keys(allPackages).filter(pkg => {
      // Check if this is a framework package by looking at apps
      return Object.values(genome.apps).some(app => (app as { framework?: string }).framework === pkg);
    });
    this.logger.info('Packages collected from apps', {
      packageCount: Object.keys(allPackages).length,
      frameworkPackages,
      allPackages: Object.keys(allPackages)
    });

    // Step 3: Expand packages into modules
    const modules = await this.recipeExpander.expand(allPackages, recipeBooks);
    this.logger.info('Packages expanded to modules', {
      moduleCount: modules.length,
      frameworkModules: modules.filter(m => m.id.startsWith('adapters/framework/')).map(m => m.id),
      allModuleIds: modules.map(m => m.id)
    });

    // Step 4: Enrich modules with prerequisites from manifest
    const enrichedModules = await this.enrichModulesWithPrerequisites(
      modules,
      genome
    );

    // Step 5: Build dependency graph
    const graph = this.dependencyResolver.buildGraph(enrichedModules);

    // Step 6: Detect cycles
    this.dependencyResolver.detectCycles(graph);

    // Step 7: Topological sort for execution order
    const executionPlan = this.dependencyResolver.topologicalSort(graph);

    // Step 8: Resolve dependencies
    this.logger.info('🔍 Resolving module dependencies...');

    // Validate dependencies early (fail fast)
    // DependencyResolverService accepts (Module | ModuleWithPrerequisites)[]
    const validation = await DependencyResolverService.validateDependencies(
      enrichedModules,
      genome,
      this.marketplaceAdapters
    );

    if (!validation.valid) {
      throw new Error(
        `Missing required dependencies:\n${validation.missing.join('\n')}\n\n` +
        `Please add the missing packages to your genome.packages configuration.`
      );
    }

    // Resolve dependencies for all modules
    // DependencyResolverService accepts Module[] | ModuleWithPrerequisites[]
    // V2 COMPLIANCE: Pass recipe books for capability resolution
    const dependencyMap = await DependencyResolverService.resolveDependencies(
      enrichedModules,
      genome,
      this.marketplaceAdapters,
      recipeBooks
    );

    this.logger.info('✅ Dependencies resolved', {
      targetsWithDeps: dependencyMap.size
    });

    // Step 9: Generate lock file
    const lockFile = await this.generateLockFile(
      genome,
      enrichedModules,
      executionPlan,
      recipeBooks,
      dependencyMap
    );

    const frameworkModulesInLockFile = lockFile.modules.filter(m => m.id.startsWith('adapters/framework/'));
    this.logger.info('Composition engine resolution complete', {
      modulesResolved: lockFile.modules.length,
      executionPlanLength: lockFile.executionPlan.length,
      frameworkModulesInLockFile: frameworkModulesInLockFile.map(m => m.id),
      allModuleIds: lockFile.modules.map(m => m.id)
    });

    // Write lock file to disk if projectRoot is provided
    if (projectRoot) {
      await this.lockFileService.writeLockFile(projectRoot, lockFile);
    }

    return lockFile;
  }

  /**
   * Load recipe books from all marketplaces
   */
  private async loadRecipeBooks(
    genome: V2Genome
  ): Promise<Map<string, RecipeBook>> {
    const recipeBooks = new Map<string, RecipeBook>();

    for (const [marketplaceName, marketplaceConfig] of Object.entries(
      genome.marketplaces
    )) {
      const adapter = this.marketplaceAdapters.get(marketplaceName);
      if (!adapter) {
        throw new Error(`Marketplace adapter not found: ${marketplaceName}`);
      }

      if (!adapter.loadRecipeBook) {
        throw new Error(
          `Marketplace adapter does not support loadRecipeBook: ${marketplaceName}`
        );
      }

      const recipeBook = await adapter.loadRecipeBook();
      recipeBooks.set(marketplaceName, recipeBook);

      this.logger.debug(`Recipe book loaded for marketplace: ${marketplaceName}`, {
        packageCount: Object.keys(recipeBook.packages).length
      });
    }

    return recipeBooks;
  }

  /**
   * Collect all packages from all apps (deduplicated)
   */
  private collectPackagesFromApps(
    genome: V2Genome
  ): Record<string, { from: string; provider?: string; parameters?: Record<string, any> }> {
    const allPackages: Record<string, { from: string; provider?: string; parameters?: Record<string, any> }> = {};

    // Start with packages declared at workspace level
    for (const [packageName, packageConfig] of Object.entries(genome.packages)) {
      allPackages[packageName] = packageConfig;
    }

    // Add packages from all apps
    for (const [appName, appConfig] of Object.entries(genome.apps)) {
      const app = appConfig as { dependencies?: string[]; framework?: string; parameters?: Record<string, any> };
      
      // CRITICAL: Add framework package from app.framework
      // Framework packages expand to framework adapter modules (e.g., adapters/framework/nextjs)
      if (app.framework) {
        const frameworkPackageName = app.framework; // e.g., 'nextjs', 'expo', 'hono'
        if (!allPackages[frameworkPackageName]) {
          // Framework packages are implicit - they come from the marketplace
          // Use the first marketplace as default (or check if framework package is explicitly defined)
          const frameworkPackageConfig = genome.packages[frameworkPackageName];
          if (frameworkPackageConfig) {
            allPackages[frameworkPackageName] = frameworkPackageConfig;
          } else {
            // Infer marketplace from first marketplace (fallback)
            const firstMarketplace = Object.keys(genome.marketplaces)[0];
            if (firstMarketplace) {
              allPackages[frameworkPackageName] = {
                from: firstMarketplace,
                // Pass app parameters to framework package (e.g., typescript, tailwind, etc.)
                parameters: app.parameters || {}
              };
              this.logger.debug(`Added implicit framework package: ${frameworkPackageName}`, {
                appName,
                framework: app.framework,
                marketplace: firstMarketplace
              });
            } else {
              throw new Error(`Framework package ${frameworkPackageName} not found in genome.packages and no marketplace available`);
            }
          }
        }
      }
      
      // Add explicit dependencies from app.dependencies
      for (const depPackageName of app.dependencies || []) {
        // If package not already defined, infer from genome.packages or use default
        if (!allPackages[depPackageName]) {
          // Try to find in genome.packages
          const packageConfig = genome.packages[depPackageName];
          if (packageConfig) {
            allPackages[depPackageName] = packageConfig;
          } else {
            // Infer marketplace from first marketplace (fallback)
            const firstMarketplace = Object.keys(genome.marketplaces)[0];
            if (firstMarketplace) {
              allPackages[depPackageName] = {
                from: firstMarketplace
              };
            } else {
              throw new Error(`Package ${depPackageName} not found in genome.packages and no marketplace available`);
            }
          }
        }
      }
    }

    return allPackages;
  }

  /**
   * Enrich modules with prerequisites from marketplace manifest
   */
  private async enrichModulesWithPrerequisites(
    modules: ModuleWithPrerequisites[],
    genome: V2Genome
  ): Promise<ModuleWithPrerequisites[]> {
    const enriched: ModuleWithPrerequisites[] = [];

    for (const module of modules) {
      const adapter = this.marketplaceAdapters.get(module.source.marketplace);
      if (!adapter) {
        this.logger.warn(`Adapter not found for module ${module.id}, skipping prerequisites`);
        enriched.push(module);
        continue;
      }

      // Load manifest to get prerequisites
      const manifest = await adapter.loadManifest();
      
      // Handle different manifest structures
      let allModules: Array<{ id: string; prerequisites?: string[] }> = [];
      if (manifest.modules) {
        if (Array.isArray(manifest.modules)) {
          allModules = manifest.modules;
        } else {
          // Structure: { adapters: [], connectors: [], features: [] }
          const modulesObj = manifest.modules as Record<string, unknown>;
          allModules = [
            ...(Array.isArray(modulesObj.adapters) ? modulesObj.adapters : []),
            ...(Array.isArray(modulesObj.connectors) ? modulesObj.connectors : []),
            ...(Array.isArray(modulesObj.features) ? modulesObj.features : [])
          ];
        }
      }

      const manifestModule = allModules.find(m => m.id === module.id);
      if (manifestModule && manifestModule.prerequisites) {
        enriched.push({
          ...module,
          prerequisites: manifestModule.prerequisites
        });
      } else {
        enriched.push(module);
      }
    }

    return enriched;
  }

  /**
   * Generate lock file from resolved modules
   */
  private async generateLockFile(
    genome: V2Genome,
    modules: ModuleWithPrerequisites[],
    executionPlan: string[],
    recipeBooks: Map<string, RecipeBook>,
    dependencyMap?: Map<string, PackageDependencies>
  ): Promise<LockFile> {
    // Generate genome hash for reproducibility
    const genomeHash = this.lockFileService.computeGenomeHash(genome);

    // Resolve marketplaces
    const resolvedMarketplaces: Record<string, {
      type: 'npm' | 'git' | 'local';
      package?: string;
      version?: string;
      url?: string;
      ref?: string;
      integrity: string;
    }> = {};
    for (const [name, config] of Object.entries(genome.marketplaces)) {
      const marketplaceConfig = config as {
        type: 'npm' | 'git' | 'local';
        package?: string;
        url?: string;
        ref?: string;
        path?: string;
      };
      const integrity = this.computeIntegrity(JSON.stringify(marketplaceConfig));
      resolvedMarketplaces[name] = {
        type: marketplaceConfig.type,
        package: marketplaceConfig.package,
        url: marketplaceConfig.url,
        ref: marketplaceConfig.ref,
        integrity: integrity
      };
    }

    // Create lock file modules
    const lockFileModules = modules.map(module => ({
      id: module.id,
      version: module.version,
      source: module.source,
      integrity: this.computeModuleIntegrity(module),
      prerequisites: module.prerequisites || []
    }));

    // Convert dependency map to plain object for storage
    const dependenciesMetadata = dependencyMap 
      ? Object.fromEntries(dependencyMap)
      : undefined;

    return {
      version: '1.0.0',
      genomeHash,
      resolvedAt: new Date().toISOString(),
      marketplaces: resolvedMarketplaces,
      modules: lockFileModules,
      executionPlan,
      ...(dependenciesMetadata && { dependencies: dependenciesMetadata })
    };
  }


  /**
   * Compute integrity hash for a module
   */
  private computeModuleIntegrity(module: ModuleWithPrerequisites): string {
    const data = `${module.id}@${module.version}:${JSON.stringify(module.source)}`;
    const hash = createHash('sha256').update(data).digest('hex');
    return `sha256:${hash}`;
  }

  /**
   * Compute integrity hash for arbitrary data
   */
  private computeIntegrity(data: string): string {
    const hash = createHash('sha256').update(data).digest('hex');
    return `sha256:${hash}`;
  }
}


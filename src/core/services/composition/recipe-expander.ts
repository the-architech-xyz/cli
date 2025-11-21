/**
 * Recipe Expander
 * 
 * Expands business packages into technical modules using recipe books.
 * Handles recursive package dependencies and prevents infinite loops.
 */

import type {
  RecipeBook,
  PackageConfig,
  ModuleReference,
  ModuleWithPrerequisites,
} from '@thearchitech.xyz/types';

export interface Logger {
  info: (msg: string, meta?: any) => void;
  debug: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
}

export class RecipeExpander {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Expand packages into modules using recipe books
   * 
   * @param packages - Package configurations from genome
   * @param recipeBooks - Map of marketplace name -> recipe book
   * @returns Array of modules with their prerequisites
   */
  async expand(
    packages: Record<string, PackageConfig>,
    recipeBooks: Map<string, RecipeBook>
  ): Promise<ModuleWithPrerequisites[]> {
    const visitedPackages = new Set<string>();
    const modules = new Map<string, ModuleWithPrerequisites>();

    this.logger.debug('Starting package expansion', { packageCount: Object.keys(packages).length });

    for (const [packageName, packageConfig] of Object.entries(packages)) {
      await this.expandPackageRecursive(
        packageName,
        packageConfig,
        recipeBooks,
        visitedPackages,
        modules
      );
    }

    this.logger.info('Package expansion complete', {
      packagesExpanded: Object.keys(packages).length,
      modulesResolved: modules.size
    });

    return Array.from(modules.values());
  }

  /**
   * Recursively expand a package and its dependencies
   */
  private async expandPackageRecursive(
    packageName: string,
    packageConfig: PackageConfig,
    recipeBooks: Map<string, RecipeBook>,
    visitedPackages: Set<string>,
    modules: Map<string, ModuleWithPrerequisites>
  ): Promise<void> {
    // Prevent infinite recursion
    if (visitedPackages.has(packageName)) {
      this.logger.debug(`Package ${packageName} already visited, skipping`);
      return;
    }

    visitedPackages.add(packageName);

    // Find recipe book for this package's marketplace
    const recipeBook = recipeBooks.get(packageConfig.from);
    if (!recipeBook) {
      throw new Error(
        `Recipe book not found for marketplace: ${packageConfig.from}`
      );
    }

    // Find package recipe
    const packageRecipe = recipeBook.packages[packageName];
    if (!packageRecipe) {
      throw new Error(
        `Recipe not found for package: ${packageName} in marketplace: ${packageConfig.from}`
      );
    }

    // Determine provider (use specified or default)
    const provider = packageConfig.provider || packageRecipe.defaultProvider;
    const providerRecipe = packageRecipe.providers[provider];
    
    if (!providerRecipe) {
      throw new Error(
        `Provider "${provider}" not found for package "${packageName}" in marketplace "${packageConfig.from}". ` +
        `Available providers: ${Object.keys(packageRecipe.providers).join(', ')}`
      );
    }

    this.logger.debug(`Expanding package ${packageName} with provider ${provider}`, {
      moduleCount: providerRecipe.modules.length,
      dependencies: providerRecipe.dependencies.packages
    });

    // Add modules from this package
    for (const moduleRef of providerRecipe.modules) {
      if (!modules.has(moduleRef.id)) {
        modules.set(moduleRef.id, {
          id: moduleRef.id,
          version: moduleRef.version,
          source: {
            marketplace: packageConfig.from,
            type: 'local' // TODO: Determine from marketplace config
          },
          prerequisites: [], // Will be populated from manifest
          parameters: packageConfig.parameters || {}
        });
      }
    }

    // Recursively expand dependencies
    for (const depPackageName of providerRecipe.dependencies.packages) {
      // Find dependency package config (may be in genome or use default)
      // For now, assume it's in the same marketplace with default provider
      const depPackageConfig: PackageConfig = {
        from: packageConfig.from,
        provider: undefined // Use default
      };

      await this.expandPackageRecursive(
        depPackageName,
        depPackageConfig,
        recipeBooks,
        visitedPackages,
        modules
      );
    }
  }
}


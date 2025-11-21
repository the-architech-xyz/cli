/**
 * Dependency Resolver Service
 * 
 * Resolves all module dependencies for the entire project.
 * Maps abstract capabilities to concrete npm packages based on genome.
 */

import type {
  Module,
  ModuleDependencies,
  PackageDependencies,
  V2Genome,
  MarketplaceAdapter,
  ModuleWithPrerequisites,
  RecipeBook,
  MarketplaceManifest,
  MarketplaceManifestModule,
  FrameworkApp
} from '@thearchitech.xyz/types';
import { CapabilityResolver } from './capability-resolver.js';
import { Logger } from '../infrastructure/logging/index.js';

export class DependencyResolverService {
  /**
   * Resolve dependencies for all modules in execution plan
   * Returns map of package/app → dependencies to install
   * 
   * V2 COMPLIANCE: Accepts recipe books for capability resolution
   */
  static async resolveDependencies(
    modules: (Module | ModuleWithPrerequisites)[],
    genome: V2Genome,
    marketplaceAdapters: Map<string, MarketplaceAdapter>,
    recipeBooks?: Map<string, RecipeBook>
  ): Promise<Map<string, PackageDependencies>> {
    const dependencyMap = new Map<string, PackageDependencies>();

    for (const module of modules) {
      // Load module dependencies from metadata
      const moduleDeps = await this.loadModuleDependencies(
        module,
        marketplaceAdapters
      );
      if (!moduleDeps) continue;

      // Resolve abstract capabilities to concrete packages
      const resolved = this.resolveModuleDependencies(moduleDeps, genome, recipeBooks);

      // Determine target (package or app)
      const target = this.getTargetForModule(module);

      // Skip if target is empty (module doesn't have a clear target)
      if (!target) {
        Logger.debug(`Skipping dependency resolution for module without target: ${module.id}`, {
          moduleId: module.id
        });
        continue;
      }

      // Merge into target's dependencies
      this.mergeDependencies(dependencyMap, target, resolved);
    }

    return dependencyMap;
  }

  /**
   * Load module dependencies from metadata
   */
  private static async loadModuleDependencies(
    module: Module | ModuleWithPrerequisites,
    marketplaceAdapters: Map<string, MarketplaceAdapter>
  ): Promise<ModuleDependencies | null> {
    // Try to get from module.config first (if available - only Module has config)
    if ('config' in module && module.config?.dependencies) {
      return module.config.dependencies as ModuleDependencies;
    }

    // Load from schema.json via marketplace adapter (all modules use schema.json)
    const marketplaceName = ('source' in module && module.source && 'marketplace' in module.source)
      ? module.source.marketplace
      : (module.source && typeof module.source === 'object' && 'marketplace' in module.source)
        ? (module.source as { marketplace?: string }).marketplace || ''
        : '';
    if (!marketplaceName) {
      return null;
    }
    const adapter = marketplaceAdapters.get(marketplaceName);
    if (!adapter) {
      const moduleId = 'id' in module ? module.id : (typeof module === 'object' && module && 'id' in module) ? (module as { id: string }).id : '';
      Logger.warn(`Adapter not found for module ${moduleId}, skipping dependencies`, {
        marketplace: marketplaceName,
        moduleId
      });
      return null;
    }

    try {
      const manifest = await adapter.loadManifest() as MarketplaceManifest;
      
      // Find module in manifest
      let moduleMetadata: MarketplaceManifestModule | undefined;
      if (manifest.modules) {
        // MarketplaceManifest.modules is always an array
        const allModules: MarketplaceManifestModule[] = Array.isArray(manifest.modules)
          ? manifest.modules
          : [];
        moduleMetadata = allModules.find((m: MarketplaceManifestModule) => m.id === module.id);
      }

      if (moduleMetadata?.dependencies) {
        // dependencies in manifest is string[], but we need ModuleDependencies
        // For now, return null and let blueprints handle dependencies via INSTALL_PACKAGES
        return null;
      }
    } catch (error) {
      const moduleId = 'id' in module ? module.id : (typeof module === 'object' && module && 'id' in module) ? (module as { id: string }).id : '';
      Logger.warn(`Failed to load dependencies for module ${moduleId}: ${error}`, {
        moduleId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return null;
  }

  /**
   * Resolve module dependencies using genome and recipe books
   * 
   * V2 COMPLIANCE: Passes recipe books to CapabilityResolver
   */
  private static resolveModuleDependencies(
    moduleDeps: ModuleDependencies,
    genome: V2Genome,
    recipeBooks?: Map<string, RecipeBook>
  ): PackageDependencies {
    const resolved: PackageDependencies = {
      runtime: {},
      dev: {},
      workspace: {}
    };

    // Resolve required capabilities
    for (const capability of moduleDeps.required || []) {
      const dep = CapabilityResolver.resolve(capability, genome, recipeBooks);
      if (!dep) {
        throw new Error(
          `Required capability '${capability}' not found in genome. ` +
          `Module requires this capability but it's not declared in genome.packages.`
        );
      }
      resolved.runtime[dep.npmPackage] = dep.version;
    }

    // Resolve optional capabilities (warn if missing)
    for (const capability of moduleDeps.optional || []) {
      const dep = CapabilityResolver.resolve(capability, genome, recipeBooks);
      if (!dep) {
        Logger.warn(`Optional capability '${capability}' not in genome, skipping`, {
          capability
        });
        continue;
      }
      resolved.runtime[dep.npmPackage] = dep.version;
    }

    // Add direct dependencies (no resolution needed)
    for (const pkg of moduleDeps.direct || []) {
      resolved.runtime[pkg] = 'latest';
    }

    // Add dev dependencies
    for (const pkg of moduleDeps.dev || []) {
      resolved.dev[pkg] = 'latest';
    }

    // Handle framework-specific dependencies
    // Check if any app uses the framework
    if (moduleDeps.framework) {
      for (const [framework, packages] of Object.entries(moduleDeps.framework)) {
        // Check if any app uses this framework
        // V2Genome.apps is Record<string, AppConfig>
        const usesFramework = Object.values(genome.apps || {}).some(
          (app) => app.framework === framework
        );
        if (usesFramework) {
          for (const pkg of packages) {
            resolved.runtime[pkg] = 'latest';
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Determine target package/app for module
   */
  private static getTargetForModule(module: Module | ModuleWithPrerequisites): string {
    // Check if module has targetPackage (from recipe book)
    if ('config' in module && module.config?.targetPackage) {
      return `packages/${module.config.targetPackage}`;
    }

    // Check if module targets specific apps
    if ('config' in module && module.config?.targetApps && module.config.targetApps.length > 0) {
      // For now, use first app (can be enhanced to support multiple)
      return `apps/${module.config.targetApps[0]}`;
    }

    // Try to infer from module ID pattern
    // e.g., "adapters/auth/better-auth" -> "packages/auth"
    // e.g., "features/auth/frontend" -> check if it targets apps
    const moduleId = module.id || '';
    
    // For adapters, try to infer package from ID
    if (moduleId.startsWith('adapters/')) {
      const parts = moduleId.split('/');
      if (parts.length >= 2) {
        const capability = parts[1]; // e.g., "auth", "database", "ui"
        // Check if this capability exists in genome
        // For now, return a reasonable default
        return `packages/${capability}`;
      }
    }
    
    // For features, they typically target apps or shared
    if (moduleId.startsWith('features/')) {
      // Features usually target apps, but we don't know which app
      // Log a warning and skip (dependencies will be handled by INSTALL_PACKAGES actions)
      Logger.warn(`Cannot determine target for feature module: ${moduleId}. Dependencies should be installed via INSTALL_PACKAGES actions.`, {
        moduleId
      });
      // Return empty string to skip dependency resolution for this module
      return '';
    }

    // Default: skip (don't add to root)
    // Dependencies should be installed via INSTALL_PACKAGES actions in blueprints
    Logger.warn(`Cannot determine target for module: ${moduleId}. Skipping dependency resolution.`, {
      moduleId
    });
    return '';
  }

  /**
   * Merge dependencies into target's dependency map
   */
  private static mergeDependencies(
    dependencyMap: Map<string, PackageDependencies>,
    target: string,
    resolved: PackageDependencies
  ): void {
    const existing = dependencyMap.get(target) || {
      runtime: {},
      dev: {},
      workspace: {}
    };

    dependencyMap.set(target, {
      runtime: { ...existing.runtime, ...resolved.runtime },
      dev: { ...existing.dev, ...resolved.dev },
      workspace: { ...existing.workspace, ...resolved.workspace }
    });
  }

  /**
   * Validate all required dependencies exist in genome
   * Call this early (before execution) to fail fast
   */
  static async validateDependencies(
    modules: (Module | ModuleWithPrerequisites)[],
    genome: V2Genome,
    marketplaceAdapters: Map<string, MarketplaceAdapter>
  ): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const module of modules) {
      const moduleDeps = await this.loadModuleDependencies(module, marketplaceAdapters);
      if (!moduleDeps?.required) continue;

      for (const capability of moduleDeps.required) {
        if (!genome.packages[capability]) {
          missing.push(`${module.id} requires '${capability}'`);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}


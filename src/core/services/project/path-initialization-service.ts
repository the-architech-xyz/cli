/**
 * Path Initialization Service
 * 
 * Centralized service for initializing all project paths before module execution.
 * This ensures paths are available during blueprint preprocessing and execution.
 * 
 * Path initialization order:
 * 1. Framework paths (from adapter config)
 * 2. Monorepo paths (from genome structure)
 * 3. Smart paths (auth_config, payment_config, etc.)
 * 4. Marketplace paths
 */

import { PathService } from '../path/path-service.js';
import { Genome, ResolvedGenome, PathKey } from '@thearchitech.xyz/types';
import type { AdapterConfig, GenomeMarketplace, MarketplaceAdapter } from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/logger.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { getProjectApps, getProjectProperty } from '../../utils/genome-helpers.js';
import * as path from 'path';
import * as fs from 'fs/promises';

interface PathInitializationOptions {
  marketplaceAdapter?: MarketplaceAdapter;
  marketplaceInfo?: GenomeMarketplace;
  runtimeOverrides?: Record<string, string>;
}


export class PathInitializationService {
  /**
   * Initialize all paths for the project
   * This should be called ONCE before any module execution
   */
  static async initializePaths(
    genome: ResolvedGenome,
    pathHandler: PathService,
    frameworkAdapter?: AdapterConfig,
    options?: PathInitializationOptions
  ): Promise<void> {
    const context = options ?? {};
    const marketplaceName = context.marketplaceInfo?.name ?? 'core';

    Logger.info('📁 Initializing project paths', {
      operation: 'path_initialization',
      structure: genome.project.structure,
      marketplace: marketplaceName,
      hasFrameworkAdapter: !!frameworkAdapter
    });

    if (frameworkAdapter?.paths) {
      pathHandler.mergeFrameworkPaths(frameworkAdapter.paths);
      Logger.debug('✅ Merged framework paths', {
        operation: 'path_initialization',
        pathCount: Object.keys(frameworkAdapter.paths).length
      });
    }

    if (context.marketplaceAdapter?.loadPathKeys) {
      try {
        await context.marketplaceAdapter.loadPathKeys();
      } catch (error) {
        Logger.warn('⚠️ Failed to load marketplace path keys', {
          operation: 'path_initialization',
          marketplace: marketplaceName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    let adapterProvidedDefaults = false;

    if (context.marketplaceAdapter?.resolvePathDefaults) {
      try {
        const workspaceRoot = pathHandler.hasPath(PathKey.WORKSPACE_ROOT)
          ? pathHandler.getPath(PathKey.WORKSPACE_ROOT)
          : undefined;

        const defaults = await context.marketplaceAdapter.resolvePathDefaults({
          genome,
          project: genome.project,
          workspaceRoot,
          overrides: context.runtimeOverrides
        });
        if (defaults && typeof defaults === 'object') {
          this.applyPaths(pathHandler, defaults, { overwrite: true });
          adapterProvidedDefaults = Object.keys(defaults).length > 0;
          Logger.debug('✅ Applied marketplace path defaults', {
            operation: 'path_initialization',
            marketplace: marketplaceName,
            pathCount: Object.keys(defaults).length
          });
        }
      } catch (error) {
        Logger.warn('⚠️ Failed to resolve marketplace path defaults', {
          operation: 'path_initialization',
          marketplace: marketplaceName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (!adapterProvidedDefaults) {
      Logger.warn('⚠️ Marketplace adapter did not supply path defaults; using legacy CLI fallbacks.', {
        operation: 'path_initialization',
        marketplace: marketplaceName
      });

      const workspacePaths = this.computeWorkspacePaths();
      this.applyPaths(pathHandler, workspacePaths, { overwrite: false });
      Logger.debug('✅ Registered workspace paths (legacy fallback)', {
        operation: 'path_initialization',
        pathCount: Object.keys(workspacePaths).length
      });

      if (genome.project.structure === 'monorepo') {
        const monorepoPaths = this.computeMonorepoPaths(genome);
        this.applyPaths(pathHandler, monorepoPaths, { overwrite: false });
        Logger.debug('✅ Registered monorepo paths (legacy fallback)', {
          operation: 'path_initialization',
          pathCount: Object.keys(monorepoPaths).length
        });
      } else {
        const singleAppPaths = this.computeSingleAppPaths();
        this.applyPaths(pathHandler, singleAppPaths, { overwrite: false });
        Logger.debug('✅ Registered single-app paths (legacy fallback)', {
          operation: 'path_initialization',
          pathCount: Object.keys(singleAppPaths).length
        });
      }
    } else {
      Logger.debug('✅ Marketplace adapter provided complete path defaults; skipping legacy fallbacks.', {
        operation: 'path_initialization',
        marketplace: marketplaceName
      });
    }

    const marketplacePaths = await this.computeMarketplacePaths(genome, context.marketplaceInfo);
    this.applyPaths(pathHandler, marketplacePaths, { overwrite: true });
    Logger.debug('✅ Registered marketplace paths', {
      operation: 'path_initialization',
      pathCount: Object.keys(marketplacePaths).length
    });

    if (context.runtimeOverrides && Object.keys(context.runtimeOverrides).length > 0) {
      this.applyPaths(pathHandler, context.runtimeOverrides, { overwrite: true });
      Logger.debug('✅ Applied runtime path overrides', {
        operation: 'path_initialization',
        pathCount: Object.keys(context.runtimeOverrides).length
      });
    }

    this.validatePaths(pathHandler);

    Logger.info('✅ Path initialization complete', {
      operation: 'path_initialization',
      totalPaths: pathHandler.getAvailablePaths().length
    });
  }

  private static computeWorkspacePaths(): Record<string, string> {
    return {
      [PathKey.WORKSPACE_ROOT]: './',
      [PathKey.WORKSPACE_SCRIPTS]: './scripts/',
      [PathKey.WORKSPACE_DOCS]: './docs/',
      [PathKey.WORKSPACE_ENV]: './.env',
      [PathKey.WORKSPACE_CONFIG]: './config/'
    };
  }

  private static computeSingleAppPaths(): Record<string, string> {
    return {
      [PathKey.APPS_WEB_ROOT]: './',
      [PathKey.APPS_WEB_SRC]: './src/',
      [PathKey.APPS_WEB_APP]: './src/app/',
      [PathKey.APPS_WEB_COMPONENTS]: './src/components/',
      [PathKey.APPS_WEB_PUBLIC]: './public/',
      [PathKey.APPS_WEB_MIDDLEWARE]: './src/middleware/',
      [PathKey.APPS_WEB_SERVER]: './src/server/',
      [PathKey.APPS_WEB_COLLECTIONS]: './src/collections/',

      [PathKey.APPS_API_ROOT]: './src/',
      [PathKey.APPS_API_SRC]: './src/server/',
      [PathKey.APPS_API_ROUTES]: './src/server/api/',

      [PathKey.PACKAGES_SHARED_ROOT]: './src/',
      [PathKey.PACKAGES_SHARED_SRC]: './src/lib/',
      [PathKey.PACKAGES_SHARED_COMPONENTS]: './src/lib/components/',
      [PathKey.PACKAGES_SHARED_HOOKS]: './src/lib/hooks/',
      [PathKey.PACKAGES_SHARED_PROVIDERS]: './src/lib/providers/',
      [PathKey.PACKAGES_SHARED_STORES]: './src/lib/stores/',
      [PathKey.PACKAGES_SHARED_TYPES]: './src/lib/types/',
      [PathKey.PACKAGES_SHARED_UTILS]: './src/lib/utils/',
      [PathKey.PACKAGES_SHARED_SCRIPTS]: './scripts/',
      [PathKey.PACKAGES_SHARED_ROUTES]: './src/lib/routes/',
      [PathKey.PACKAGES_SHARED_JOBS]: './src/lib/jobs/',

      [PathKey.PACKAGES_DATABASE_ROOT]: './src/lib/database/',
      [PathKey.PACKAGES_DATABASE_SRC]: './src/lib/database/',

      [PathKey.PACKAGES_UI_ROOT]: './src/lib/ui/',
      [PathKey.PACKAGES_UI_SRC]: './src/lib/ui/'
    };
  }

  /**
   * Compute monorepo-specific paths
   */
  private static computeMonorepoPaths(genome: ResolvedGenome): Record<string, string> {
    const pkgs = (genome.project.monorepo as any)?.packages || {};
    const apps = getProjectApps(genome);

    const apiApp = apps.find((a: any) => a.type === 'api' || a.framework === 'hono');
    const webApp = apps.find((a: any) => a.type === 'web');

    const apiPath = apiApp?.package || pkgs.api || './apps/api/';
    const webPath = webApp?.package || pkgs.web || './apps/web/';
    const sharedPath = pkgs.shared || './packages/shared/';
    const databasePath = pkgs.database || './packages/database/';
    const uiPath = pkgs.ui || './packages/ui/';

    const paths: Record<string, string> = {
      [PathKey.APPS_WEB_ROOT]: this.cleanBasePath(webPath),
      [PathKey.APPS_WEB_SRC]: this.joinPath(webPath, 'src/'),
      [PathKey.APPS_WEB_APP]: this.joinPath(webPath, 'src/app/'),
      [PathKey.APPS_WEB_COMPONENTS]: this.joinPath(webPath, 'src/components/'),
      [PathKey.APPS_WEB_PUBLIC]: this.joinPath(webPath, 'public/'),
      [PathKey.APPS_WEB_MIDDLEWARE]: this.joinPath(webPath, 'src/middleware/'),
      [PathKey.APPS_WEB_SERVER]: this.joinPath(webPath, 'src/server/'),
      [PathKey.APPS_WEB_COLLECTIONS]: this.joinPath(webPath, 'src/collections/'),

      [PathKey.APPS_API_ROOT]: this.cleanBasePath(apiPath),
      [PathKey.APPS_API_SRC]: this.joinPath(apiPath, 'src/'),
      [PathKey.APPS_API_ROUTES]: this.joinPath(apiPath, 'src/routes/'),

      [PathKey.PACKAGES_SHARED_ROOT]: this.cleanBasePath(sharedPath),
      [PathKey.PACKAGES_SHARED_SRC]: this.joinPath(sharedPath, 'src/'),
      [PathKey.PACKAGES_SHARED_COMPONENTS]: this.joinPath(sharedPath, 'src/components/'),
      [PathKey.PACKAGES_SHARED_HOOKS]: this.joinPath(sharedPath, 'src/hooks/'),
      [PathKey.PACKAGES_SHARED_PROVIDERS]: this.joinPath(sharedPath, 'src/providers/'),
      [PathKey.PACKAGES_SHARED_STORES]: this.joinPath(sharedPath, 'src/stores/'),
      [PathKey.PACKAGES_SHARED_TYPES]: this.joinPath(sharedPath, 'src/types/'),
      [PathKey.PACKAGES_SHARED_UTILS]: this.joinPath(sharedPath, 'src/utils/'),
      [PathKey.PACKAGES_SHARED_SCRIPTS]: this.joinPath(sharedPath, 'src/scripts/'),
      [PathKey.PACKAGES_SHARED_ROUTES]: this.joinPath(sharedPath, 'src/routes/'),
      [PathKey.PACKAGES_SHARED_JOBS]: this.joinPath(sharedPath, 'src/jobs/'),

      [PathKey.PACKAGES_DATABASE_ROOT]: this.cleanBasePath(databasePath),
      [PathKey.PACKAGES_DATABASE_SRC]: this.joinPath(databasePath, 'src/'),

      [PathKey.PACKAGES_UI_ROOT]: this.cleanBasePath(uiPath),
      [PathKey.PACKAGES_UI_SRC]: this.joinPath(uiPath, 'src/')
    };

    return paths;
  }

  private static applyPaths(
    pathHandler: PathService,
    paths?: Record<string, string | null | undefined>,
    options: { overwrite?: boolean } = {}
  ): void {
    if (!paths) {
      return;
    }

    const overwrite = options.overwrite ?? true;

    for (const [key, value] of Object.entries(paths)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (!overwrite && pathHandler.hasPath(key)) {
        continue;
      }
      pathHandler.setPath(key, value);
    }
  }

  private static cleanBasePath(raw: string): string {
    if (!raw) {
      return '';
    }
    let normalized = raw.trim();
    if (normalized === '.') {
      normalized = './';
    }
    if (!normalized.startsWith('./') && !normalized.startsWith('/')) {
      normalized = normalized.replace(/^\/+/, '');
      normalized = `./${normalized}`;
    }
    normalized = normalized.replace(/\/\/+/g, '/');
    if (!normalized.endsWith('/')) {
      normalized = `${normalized}/`;
    }
    return normalized;
  }

  private static joinPath(base: string, subPath: string): string {
    if (!subPath) {
      return this.cleanBasePath(base);
    }

    const baseNormalized = this.cleanBasePath(base);
    const trimmedSub = subPath.replace(/^\.?\/+/, '');
    const combined = `${baseNormalized}${trimmedSub}`;
    return this.ensureTrailingSlash(combined);
  }

  private static ensureTrailingSlash(value: string): string {
    if (!value || value.endsWith('/') || /\.\w+$/.test(value)) {
      return value;
    }
    return `${value}/`;
  }

  private static normalizeMarketplaceKey(name?: string): string {
    if (!name) {
      return 'custom';
    }
    const sanitized = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return sanitized ? sanitized.toLowerCase() : 'custom';
  }

  /**
   * Compute marketplace paths
   * SINGLE SOURCE OF TRUTH for marketplace UI framework detection
   */
  private static async computeMarketplacePaths(
    genome: ResolvedGenome,
    marketplaceInfo?: GenomeMarketplace
  ): Promise<Record<string, string>> {
    const paths: Record<string, string> = {};

    if (marketplaceInfo) {
      const key = this.normalizeMarketplaceKey(marketplaceInfo.name);
      if (marketplaceInfo.root) {
        paths[`marketplace.${key}.root`] = marketplaceInfo.root;
      }
      if (marketplaceInfo.manifest) {
        paths[`marketplace.${key}.manifest`] = marketplaceInfo.manifest;
      }
      if (marketplaceInfo.adapter) {
        paths[`marketplace.${key}.adapter`] = marketplaceInfo.adapter;
      }
    }

    try {
      const coreMarketplacePath = await MarketplaceRegistry.getCoreMarketplacePath();
      paths['core.path'] = coreMarketplacePath;
    } catch (error) {
      Logger.warn('⚠️ Failed to resolve core marketplace path', {
        operation: 'path_initialization',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const activeUI = this.determineActiveUIFramework(genome);
    if (activeUI) {
      console.log('[path-init] active UI framework', activeUI);
      try {
        const rawMarketplacePath = await MarketplaceRegistry.getUIMarketplacePath(activeUI);
        const uiMarketplacePath = await this.resolveUIRoot(rawMarketplacePath);
        if (uiMarketplacePath) {
          paths['ui.marketplace'] = uiMarketplacePath;
          // Maintain legacy key for backward compatibility
          paths['ui.path'] = uiMarketplacePath;
          console.log('[path-init] ui marketplace path', uiMarketplacePath);
        }
        Logger.debug('✅ Registered UI marketplace', {
          operation: 'marketplace_initialization',
          framework: activeUI,
          path: uiMarketplacePath
        });
      } catch (error) {
        Logger.warn('⚠️ Failed to resolve UI marketplace path', {
          operation: 'marketplace_initialization',
          framework: activeUI,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return paths;
  }

  private static determineActiveUIFramework(genome: ResolvedGenome): string | null {
    const explicit = this.extractExplicitUIFramework(genome);
    if (explicit) {
      console.log('[path-init] explicit ui framework', explicit);
      return explicit;
    }

    // ResolvedGenome guarantees modules is always an array
    const modules = genome.modules;
    console.log('[path-init] modules for UI framework detection', modules.map(module =>
      typeof module === 'string' ? module : module?.id || '<unknown>'
    ));
    const loweredIds = modules
      .map(module => (typeof module === 'string' ? module : module?.id) || '')
      .map(id => id.toLowerCase());

    const hasTamaguiModule = loweredIds.some(id => id.includes('tamagui'));
    const hasShadcnModule = loweredIds.some(id => id.includes('shadcn'));
    const hasMantineModule = loweredIds.some(id => id.includes('mantine'));

    const apps = getProjectApps(genome);
    const hasMobileApp = apps.some(
      (app) => app?.type === 'mobile' || app?.framework === 'expo' || app?.framework === 'react-native'
    );

    if (hasTamaguiModule || hasMobileApp) {
      return 'tamagui';
    }

    if (hasShadcnModule) {
      return 'shadcn';
    }

    if (hasMantineModule) {
      return 'mantine';
    }

    return null;
  }

  private static extractExplicitUIFramework(genome: ResolvedGenome): string | null {
    const optionsFramework = (genome as any)?.options?.uiFramework;
    if (typeof optionsFramework === 'string' && optionsFramework.trim()) {
      return optionsFramework.trim().toLowerCase();
    }

    // Note: uiFramework is not in ProjectConfig type, but may exist in some genomes
    const projectFramework = getProjectProperty(genome, 'uiFramework' as keyof ResolvedGenome['project']) as string | undefined;
    if (typeof projectFramework === 'string' && projectFramework.trim()) {
      return projectFramework.trim().toLowerCase();
    }

    return null;
  }

  private static async resolveUIRoot(basePath: string): Promise<string> {
    if (!basePath) {
      return basePath;
    }

    try {
      const uiDir = path.join(basePath, 'ui');
      const stats = await fs.stat(uiDir);
      if (stats.isDirectory()) {
        return uiDir;
      }
    } catch {
      // ignore, fall back to base path
    }

    return basePath;
  }

  /**
   * Validate paths (check for conflicts, normalize, etc.)
   */
  private static validatePaths(pathHandler: PathService): void {
    const paths = pathHandler.getAvailablePaths();
    const pathMap: Record<string, string> = {};

    // Collect all paths and check for conflicts
    for (const key of paths) {
      try {
        const value = pathHandler.getPath(key);
        if (pathMap[value] && pathMap[value] !== key) {
          Logger.warn(`Path conflict detected: ${key} and ${pathMap[value]} both point to ${value}`, {
            operation: 'path_validation'
          });
        }
        pathMap[value] = key;
      } catch (error) {
        // Path doesn't exist, skip
      }
    }

    Logger.debug('✅ Path validation complete', {
      operation: 'path_validation',
      pathCount: paths.length
    });
  }
}


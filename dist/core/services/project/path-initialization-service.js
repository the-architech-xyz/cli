/**
 * Path Initialization Service
 *
 * @deprecated This service is deprecated in favor of PathMappingGenerator.
 * Path generation is now handled by PathMappingGenerator.generateMappings() in OrchestratorAgent.
 *
 * This service is kept for backward compatibility and still handles:
 * - Framework path merging
 * - Marketplace path key loading
 * - User override validation
 * - Marketplace UI detection
 *
 * However, path defaults resolution is now redundant since PathMappingGenerator handles it.
 *
 * DOCTRINE: The CLI does NOT compute paths. All paths come from the marketplace adapter.
 *
 * Path initialization order:
 * 1. Framework paths (from adapter config)
 * 2. Marketplace path defaults (from adapter.resolvePathDefaults() - REQUIRED)
 * 3. Marketplace paths (UI marketplace detection)
 * 4. Runtime overrides (user-provided)
 *
 * The service will FAIL FAST if the marketplace adapter does not provide path defaults.
 */
import { PathKey } from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/logger.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { getProjectApps, getProjectProperty } from '../../utils/genome-helpers.js';
import { validatePathOverrides } from '@thearchitech.xyz/types';
import * as path from 'path';
import * as fs from 'fs/promises';
export class PathInitializationService {
    /**
     * Initialize all paths for the project
     * This should be called ONCE before any module execution
     *
     * @deprecated Path generation is now handled by PathMappingGenerator.generateMappings().
     * This method is kept for backward compatibility and still handles:
     * - Framework path merging
     * - Marketplace path key loading
     * - User override validation
     * - Marketplace UI detection
     *
     * However, the path defaults resolution part is redundant since PathMappingGenerator
     * already generates mappings from adapter.resolvePathDefaults().
     */
    static async initializePaths(genome, pathHandler, frameworkAdapter, options) {
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
            }
            catch (error) {
                Logger.warn('⚠️ Failed to load marketplace path keys', {
                    operation: 'path_initialization',
                    marketplace: marketplaceName,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        // CRITICAL: Path defaults MUST come from marketplace adapter
        // The CLI no longer computes paths itself - this is marketplace responsibility
        if (!context.marketplaceAdapter?.resolvePathDefaults) {
            throw new Error(`Marketplace adapter must provide resolvePathDefaults() method. ` +
                `The CLI no longer computes paths - this is marketplace responsibility. ` +
                `Marketplace: ${marketplaceName}`);
        }
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
            if (!defaults || typeof defaults !== 'object' || Object.keys(defaults).length === 0) {
                throw new Error(`Marketplace adapter resolvePathDefaults() returned empty or invalid path defaults. ` +
                    `Marketplace: ${marketplaceName}`);
            }
            this.applyPaths(pathHandler, defaults, { overwrite: true });
            Logger.info('✅ Applied marketplace path defaults', {
                operation: 'path_initialization',
                marketplace: marketplaceName,
                pathCount: Object.keys(defaults).length
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`❌ Failed to resolve marketplace path defaults: ${errorMessage}`, {
                operation: 'path_initialization',
                marketplace: marketplaceName
            });
            throw new Error(`Path initialization failed: ${errorMessage}. ` +
                `Marketplace adapter must provide valid path defaults via resolvePathDefaults().`);
        }
        const marketplacePaths = await this.computeMarketplacePaths(genome, context.marketplaceInfo);
        this.applyPaths(pathHandler, marketplacePaths, { overwrite: true });
        Logger.debug('✅ Registered marketplace paths', {
            operation: 'path_initialization',
            pathCount: Object.keys(marketplacePaths).length
        });
        // Extract and validate user path overrides from genome
        const userPathOverrides = genome.project.paths || {};
        if (Object.keys(userPathOverrides).length > 0) {
            // Validate overrides against marketplace path keys
            if (context.marketplaceAdapter?.loadPathKeys) {
                try {
                    const pathKeys = await context.marketplaceAdapter.loadPathKeys();
                    if (pathKeys) {
                        const validation = await validatePathOverrides(userPathOverrides, pathKeys, genome.project.structure);
                        if (!validation.valid) {
                            Logger.warn('⚠️ Path override validation found errors', {
                                operation: 'path_initialization',
                                errors: validation.errors
                            });
                        }
                        if (validation.warnings.length > 0) {
                            Logger.warn('⚠️ Path override validation warnings', {
                                operation: 'path_initialization',
                                warnings: validation.warnings
                            });
                        }
                    }
                }
                catch (error) {
                    Logger.warn('⚠️ Failed to validate path overrides', {
                        operation: 'path_initialization',
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            // Set user overrides in PathService (takes precedence over adapter paths)
            pathHandler.setUserOverrides(userPathOverrides);
            Logger.info('✅ Applied user path overrides', {
                operation: 'path_initialization',
                overrideCount: Object.keys(userPathOverrides).length
            });
        }
        // Apply runtime overrides (from options, lowest priority)
        if (context.runtimeOverrides && Object.keys(context.runtimeOverrides).length > 0) {
            // Runtime overrides are merged into user overrides (they're both user-provided)
            const mergedOverrides = { ...userPathOverrides, ...context.runtimeOverrides };
            pathHandler.setUserOverrides(mergedOverrides);
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
    // REMOVED: computeWorkspacePaths, computeMonorepoPaths, computeSingleAppPaths
    // These methods were CLI fallbacks that violated the "CLI is dumb, Marketplace is smart" doctrine.
    // Path computation is now the exclusive responsibility of the marketplace adapter via resolvePathDefaults().
    // If a marketplace adapter does not provide path defaults, the service will fail fast with a clear error.
    static applyPaths(pathHandler, paths, options = {}) {
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
    static cleanBasePath(raw) {
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
    static joinPath(base, subPath) {
        if (!subPath) {
            return this.cleanBasePath(base);
        }
        const baseNormalized = this.cleanBasePath(base);
        const trimmedSub = subPath.replace(/^\.?\/+/, '');
        const combined = `${baseNormalized}${trimmedSub}`;
        return this.ensureTrailingSlash(combined);
    }
    static ensureTrailingSlash(value) {
        if (!value || value.endsWith('/') || /\.\w+$/.test(value)) {
            return value;
        }
        return `${value}/`;
    }
    static normalizeMarketplaceKey(name) {
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
    static async computeMarketplacePaths(genome, marketplaceInfo) {
        const paths = {};
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
        }
        catch (error) {
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
            }
            catch (error) {
                Logger.warn('⚠️ Failed to resolve UI marketplace path', {
                    operation: 'marketplace_initialization',
                    framework: activeUI,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return paths;
    }
    static determineActiveUIFramework(genome) {
        const explicit = this.extractExplicitUIFramework(genome);
        if (explicit) {
            console.log('[path-init] explicit ui framework', explicit);
            return explicit;
        }
        // ResolvedGenome guarantees modules is always an array
        const modules = genome.modules;
        console.log('[path-init] modules for UI framework detection', modules.map(module => typeof module === 'string' ? module : module?.id || '<unknown>'));
        const loweredIds = modules
            .map(module => (typeof module === 'string' ? module : module?.id) || '')
            .map(id => id.toLowerCase());
        const hasTamaguiModule = loweredIds.some(id => id.includes('tamagui'));
        const hasShadcnModule = loweredIds.some(id => id.includes('shadcn'));
        const hasMantineModule = loweredIds.some(id => id.includes('mantine'));
        const apps = getProjectApps(genome);
        const hasMobileApp = apps.some((app) => app?.type === 'mobile' || app?.framework === 'expo' || app?.framework === 'react-native');
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
    static extractExplicitUIFramework(genome) {
        const optionsFramework = genome?.options?.uiFramework;
        if (typeof optionsFramework === 'string' && optionsFramework.trim()) {
            return optionsFramework.trim().toLowerCase();
        }
        // Note: uiFramework is not in ProjectConfig type, but may exist in some genomes
        const projectFramework = getProjectProperty(genome, 'uiFramework');
        if (typeof projectFramework === 'string' && projectFramework.trim()) {
            return projectFramework.trim().toLowerCase();
        }
        return null;
    }
    static async resolveUIRoot(basePath) {
        if (!basePath) {
            return basePath;
        }
        try {
            const uiDir = path.join(basePath, 'ui');
            const stats = await fs.stat(uiDir);
            if (stats.isDirectory()) {
                return uiDir;
            }
        }
        catch {
            // ignore, fall back to base path
        }
        return basePath;
    }
    /**
     * Validate paths (check for conflicts, normalize, etc.)
     */
    static validatePaths(pathHandler) {
        const paths = pathHandler.getAvailablePaths();
        const pathMap = {};
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
            }
            catch (error) {
                // Path doesn't exist, skip
            }
        }
        Logger.debug('✅ Path validation complete', {
            operation: 'path_validation',
            pathCount: paths.length
        });
    }
}
//# sourceMappingURL=path-initialization-service.js.map
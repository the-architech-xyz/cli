/**
 * Path Mapping Generator
 *
 * Pre-computes all path mappings before blueprint execution.
 * This is the SINGLE SOURCE OF TRUTH for path resolution.
 *
 * Architecture:
 * 1. Loads path-keys.json from marketplace
 * 2. For each key, resolves to array of concrete paths based on genome
 * 3. Applies user overrides (highest priority)
 * 4. Returns complete mappings: { key: string[] }
 *
 * Simple Model:
 * - Path Key → Array of paths
 * - 1 path = generate 1 file
 * - 2+ paths = generate multiple files
 */
import { PathService } from './path-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { getProjectApps } from '../../utils/genome-helpers.js';
import * as path from 'path';
export class PathMappingGenerator {
    /**
     * Generate complete path mappings before blueprint execution
     *
     * This analyzes the genome and generates mappings for ALL path keys
     * defined in the marketplace's path-keys.json.
     *
     * Strategy:
     * 1. Use marketplace adapter's resolvePathDefaults() to get base paths (single values)
     * 2. Override with recipe book packageStructure.directory (if available)
     * 3. Expand semantic keys to multiple paths based on resolveToApps metadata
     * 4. Apply user overrides (highest priority)
     *
     * @param genome - Resolved genome with apps and packages
     * @param marketplaceAdapters - Map of marketplace name to adapter
     * @param recipeBooks - Optional map of marketplace name to recipe book
     * @returns Complete path mappings: { key: string[] }
     */
    static async generateMappings(genome, marketplaceAdapters, recipeBooks) {
        const mappings = {};
        const apps = getProjectApps(genome);
        Logger.info('🔄 Generating path mappings', {
            operation: 'path_mapping_generation',
            appCount: apps.length,
            marketplaceCount: marketplaceAdapters.size,
            apps: apps.map((app) => `${app.id} (${app.type})`)
        });
        // 1. Get base paths from marketplace adapter (single values)
        // This uses the existing marketplace logic to compute paths
        const basePaths = {};
        for (const [marketplaceName, adapter] of marketplaceAdapters.entries()) {
            try {
                if (adapter.resolvePathDefaults) {
                    const pathDefaults = await adapter.resolvePathDefaults({
                        genome: genome, // Marketplace expects V1 Genome format
                        project: genome.project,
                        workspaceRoot: genome.project.path || './'
                    });
                    // Merge into basePaths (later marketplaces override earlier ones)
                    Object.assign(basePaths, pathDefaults);
                    Logger.debug(`✅ Loaded ${Object.keys(pathDefaults).length} base paths from ${marketplaceName}`, {
                        operation: 'path_mapping_generation',
                        marketplace: marketplaceName
                    });
                }
            }
            catch (error) {
                Logger.warn(`⚠️ Failed to get path defaults from ${marketplaceName}`, {
                    operation: 'path_mapping_generation',
                    marketplace: marketplaceName,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        // 2. Load path key definitions to check for semantic keys
        const allPathKeys = [];
        for (const [marketplaceName, adapter] of marketplaceAdapters.entries()) {
            try {
                if (adapter.loadPathKeys) {
                    const pathKeysResult = await adapter.loadPathKeys();
                    Logger.info(`📋 Loaded path keys from ${marketplaceName}`, {
                        operation: 'path_mapping_generation',
                        marketplace: marketplaceName,
                        hasPathKeys: !!pathKeysResult,
                        structure: pathKeysResult ? Object.keys(pathKeysResult).join(', ') : 'none',
                        pathKeysCount: pathKeysResult?.pathKeys?.length || 0,
                        semanticKeys: pathKeysResult?.pathKeys?.filter((k) => k.semantic === true).map((k) => k.key) || []
                    });
                    if (pathKeysResult?.pathKeys) {
                        allPathKeys.push(...pathKeysResult.pathKeys);
                    }
                    else if (Array.isArray(pathKeysResult)) {
                        // Handle case where pathKeys is directly an array
                        allPathKeys.push(...pathKeysResult);
                    }
                }
            }
            catch (error) {
                Logger.warn(`⚠️ Failed to load path keys from ${marketplaceName}`, {
                    operation: 'path_mapping_generation',
                    marketplace: marketplaceName,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        // Fallback: Load from PathService if no adapters provide path keys
        if (allPathKeys.length === 0) {
            try {
                const corePathKeys = await PathService.loadPathKeys('core');
                if (corePathKeys?.pathKeys) {
                    allPathKeys.push(...corePathKeys.pathKeys);
                    Logger.info(`✅ Loaded ${corePathKeys.pathKeys.length} path keys from PathService fallback`, {
                        operation: 'path_mapping_generation',
                        semanticKeys: corePathKeys.pathKeys.filter((k) => k.semantic === true).map((k) => k.key)
                    });
                }
            }
            catch (error) {
                Logger.warn('⚠️ Failed to load path keys from PathService', {
                    operation: 'path_mapping_generation',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        else {
            Logger.info(`✅ Loaded ${allPathKeys.length} path keys from adapters`, {
                operation: 'path_mapping_generation',
                semanticKeys: allPathKeys.filter(k => k.semantic === true).map(k => k.key)
            });
        }
        // 3. Override path keys with recipe book packageStructure.directory (if available)
        // This ensures path keys use recipe book's directory instead of hardcoded values
        if (recipeBooks && recipeBooks.size > 0) {
            for (const [marketplaceName, recipeBook] of recipeBooks.entries()) {
                if (recipeBook.packages) {
                    for (const [packageId, packageRecipe] of Object.entries(recipeBook.packages)) {
                        const packageStructure = packageRecipe.packageStructure;
                        if (packageStructure?.directory) {
                            const packageName = packageStructure.name || packageId;
                            const packageDir = packageStructure.directory;
                            // Override packages.database.* with recipe book's directory
                            // Recipe book defines database package with directory: "packages/db"
                            if (packageId === 'database') {
                                // Ensure root path ends with / for proper concatenation
                                basePaths['packages.database.root'] = packageDir.endsWith('/') ? packageDir : `${packageDir}/`;
                                basePaths['packages.database.src'] = path.join(packageDir, 'src/');
                                Logger.info(`✅ Overrode packages.database.* with recipe book: ${packageDir}`, {
                                    operation: 'path_mapping_generation',
                                    packageId,
                                    packageDir,
                                    marketplaceName
                                });
                            }
                            // Override packages.{packageName}.* with recipe book's directory
                            // This handles dynamic path keys like packages.auth.*, packages.ui.*
                            const dynamicRootKey = `packages.${packageName}.root`;
                            const dynamicSrcKey = `packages.${packageName}.src`;
                            // Always create path keys for packages defined in recipe book
                            // This ensures blueprints can use packages.auth.src, packages.ui.src, etc.
                            basePaths[dynamicRootKey] = packageDir;
                            basePaths[dynamicSrcKey] = path.join(packageDir, 'src/');
                            Logger.debug(`✅ Created/overrode packages.${packageName}.* from recipe book: ${packageDir}`, {
                                operation: 'path_mapping_generation',
                                packageId,
                                packageName,
                                packageDir,
                                marketplaceName
                            });
                        }
                    }
                }
            }
        }
        // 4. Convert base paths to mappings (single values → arrays)
        // For non-semantic keys, just wrap in array
        for (const [key, value] of Object.entries(basePaths)) {
            // Check if this key is semantic
            const keyDef = allPathKeys.find(def => def.key === key);
            if (keyDef && keyDef.semantic === true) {
                // Semantic key - expand to multiple paths
                const expandedPaths = this.expandSemanticKey(keyDef, genome, basePaths);
                mappings[key] = expandedPaths;
            }
            else {
                // Non-semantic key - single path
                mappings[key] = [value];
            }
        }
        // 5. Generate mappings for semantic keys that don't have base paths
        // (e.g., apps.frontend.components might not have a direct base path)
        const semanticKeys = allPathKeys.filter(k => k.semantic === true);
        Logger.debug(`🔍 Checking ${allPathKeys.length} path key definitions for semantic keys`, {
            operation: 'path_mapping_generation',
            totalPathKeys: allPathKeys.length,
            semanticKeys: semanticKeys.map(k => k.key)
        });
        for (const keyDef of semanticKeys) {
            if (!mappings[keyDef.key]) {
                Logger.info(`🔄 Processing semantic key '${keyDef.key}' (resolveToApps: ${JSON.stringify(keyDef.resolveToApps)})`, {
                    operation: 'path_mapping_generation',
                    key: keyDef.key
                });
                const expandedPaths = this.expandSemanticKey(keyDef, genome, basePaths);
                if (expandedPaths.length > 0) {
                    mappings[keyDef.key] = expandedPaths;
                    Logger.info(`✅ Expanded semantic key '${keyDef.key}' to ${expandedPaths.length} paths: ${expandedPaths.join(', ')}`, {
                        operation: 'path_mapping_generation',
                        key: keyDef.key,
                        paths: expandedPaths
                    });
                }
                else {
                    Logger.warn(`⚠️ Semantic key '${keyDef.key}' expanded to empty array`, {
                        operation: 'path_mapping_generation',
                        key: keyDef.key,
                        resolveToApps: keyDef.resolveToApps,
                        apps: apps.map((app) => `${app.id} (${app.type})`)
                    });
                }
            }
        }
        // 6. Apply user overrides (highest priority)
        // User overrides from genome.project.paths replace computed paths
        if (genome.project?.paths) {
            for (const [key, value] of Object.entries(genome.project.paths)) {
                // User override can be string (single path) or string[] (multiple paths)
                if (typeof value === 'string') {
                    mappings[key] = [value];
                }
                else if (Array.isArray(value)) {
                    mappings[key] = value;
                }
                Logger.debug(`✅ Applied user override for ${key}`, {
                    operation: 'path_mapping_generation',
                    key
                });
            }
        }
        const semanticMappings = Object.keys(mappings).filter(k => k.includes('.frontend.') || k.includes('.backend.') || k.includes('.all.'));
        Logger.info(`✅ Generated ${Object.keys(mappings).length} path mappings`, {
            operation: 'path_mapping_generation',
            mappingCount: Object.keys(mappings).length,
            semanticMappings,
            sampleMappings: Object.entries(mappings).slice(0, 5).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        });
        return mappings;
    }
    /**
     * Expand semantic key to multiple paths
     *
     * Semantic keys expand based on resolveToApps metadata:
     * - apps.frontend.components → apps.web.components, apps.mobile.components
     * - apps.all.components → all apps
     *
     * Uses basePaths from marketplace adapter to get concrete paths.
     */
    static expandSemanticKey(keyDef, genome, basePaths) {
        const key = keyDef.key;
        const resolveToApps = keyDef.resolveToApps;
        const apps = getProjectApps(genome);
        Logger.debug(`🔄 Expanding semantic key '${key}'`, {
            operation: 'path_mapping_generation',
            key,
            resolveToApps,
            appCount: apps.length,
            apps: apps.map((app) => `${app.id} (${app.type})`)
        });
        // Determine which apps to expand to
        let targetAppTypes = [];
        if (resolveToApps === 'all') {
            // All apps
            targetAppTypes = apps.map((app) => app.type);
        }
        else if (Array.isArray(resolveToApps)) {
            // Specific app types
            targetAppTypes = resolveToApps;
        }
        else {
            // No resolveToApps specified - try to infer from key pattern
            if (key.includes('.frontend.')) {
                targetAppTypes = ['web', 'mobile'];
            }
            else if (key.includes('.backend.')) {
                targetAppTypes = ['api'];
            }
            else if (key.includes('.all.')) {
                targetAppTypes = apps.map((app) => app.type);
            }
        }
        Logger.debug(`🎯 Target app types for '${key}': ${targetAppTypes.join(', ')}`, {
            operation: 'path_mapping_generation',
            key,
            targetAppTypes
        });
        // Resolve to concrete paths for each target app
        const paths = [];
        for (const appType of targetAppTypes) {
            // Find apps of this type
            const matchingApps = apps.filter((app) => app.type === appType);
            Logger.debug(`🔍 Found ${matchingApps.length} apps of type '${appType}'`, {
                operation: 'path_mapping_generation',
                key,
                appType,
                matchingApps: matchingApps.map((app) => app.id)
            });
            for (const app of matchingApps) {
                // Convert semantic key to specific key (e.g., apps.frontend.components → apps.web.components)
                const specificKey = key
                    .replace(/^apps\.frontend\./, `apps.${appType}.`)
                    .replace(/^apps\.backend\./, `apps.${appType}.`)
                    .replace(/^apps\.all\./, `apps.${appType}.`);
                Logger.debug(`🔑 Converting '${key}' → '${specificKey}' for app '${app.id}'`, {
                    operation: 'path_mapping_generation',
                    semanticKey: key,
                    specificKey,
                    appId: app.id,
                    appType
                });
                // Get path from basePaths (computed by marketplace adapter)
                const specificPath = basePaths[specificKey];
                if (specificPath) {
                    Logger.debug(`✅ Found path in basePaths: '${specificKey}' = '${specificPath}'`, {
                        operation: 'path_mapping_generation',
                        specificKey,
                        path: specificPath
                    });
                    paths.push(specificPath);
                }
                else {
                    // Fallback: compute path if not in basePaths
                    Logger.debug(`⚠️ Path '${specificKey}' not in basePaths, computing...`, {
                        operation: 'path_mapping_generation',
                        specificKey,
                        basePathKeys: Object.keys(basePaths).slice(0, 10)
                    });
                    const computedPath = this.computeAppPath(specificKey, appType, genome, app);
                    if (computedPath) {
                        Logger.debug(`✅ Computed path: '${specificKey}' = '${computedPath}'`, {
                            operation: 'path_mapping_generation',
                            specificKey,
                            path: computedPath
                        });
                        paths.push(computedPath);
                    }
                    else {
                        Logger.warn(`❌ Failed to compute path for '${specificKey}'`, {
                            operation: 'path_mapping_generation',
                            specificKey,
                            appType,
                            appId: app.id
                        });
                    }
                }
            }
        }
        Logger.info(`✅ Expanded '${key}' to ${paths.length} paths: ${paths.join(', ')}`, {
            operation: 'path_mapping_generation',
            key,
            pathCount: paths.length,
            paths
        });
        return paths;
    }
    /**
     * Compute app path when not in basePaths (fallback)
     *
     * Example: apps.web.components → "apps/web/src/components/"
     */
    static computeAppPath(key, appType, genome, app) {
        const appPackage = app.package || `apps/${appType}`;
        // Extract path suffix from key (e.g., "components" from "apps.web.components")
        const keyParts = key.split('.');
        const pathSuffix = keyParts.slice(2).join('/'); // Skip "apps" and appType
        // Build path based on key suffix
        let resolvedPath = '';
        if (pathSuffix === 'root') {
            resolvedPath = appPackage;
        }
        else if (pathSuffix === 'src') {
            resolvedPath = `${appPackage}/src`;
        }
        else if (pathSuffix === 'components') {
            resolvedPath = `${appPackage}/src/components`;
        }
        else if (pathSuffix === 'public') {
            resolvedPath = `${appPackage}/public`;
        }
        else if (pathSuffix === 'app') {
            // Next.js App Router
            resolvedPath = `${appPackage}/src/app`;
        }
        else if (pathSuffix === 'middleware') {
            // Next.js middleware
            resolvedPath = `${appPackage}/src/middleware`;
        }
        else if (pathSuffix === 'server') {
            // Next.js server
            resolvedPath = `${appPackage}/src/server`;
        }
        else if (pathSuffix === 'routes') {
            // API routes
            resolvedPath = `${appPackage}/src/routes`;
        }
        else {
            // Generic: apps.web.{suffix}
            resolvedPath = `${appPackage}/src/${pathSuffix}`;
        }
        // Normalize path (ensure trailing slash for directories)
        const normalizedPath = resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`;
        return normalizedPath;
    }
    /**
     * Resolve package key to path
     *
     * Example: packages.auth.src → ["packages/auth/src/"]
     */
    static resolvePackageKey(key, genome) {
        const keyParts = key.split('.');
        if (keyParts.length < 3) {
            return []; // Invalid key format
        }
        const packageName = keyParts[1]; // packages.{packageName}.src
        const pathSuffix = keyParts.slice(2).join('/'); // src, components, etc.
        const projectRoot = genome.project.path || './';
        const packagePath = `packages/${packageName}`;
        let resolvedPath = '';
        if (pathSuffix === 'root') {
            resolvedPath = packagePath;
        }
        else if (pathSuffix === 'src') {
            resolvedPath = `${packagePath}/src`;
        }
        else {
            // Generic: packages.{name}.{suffix}
            resolvedPath = `${packagePath}/src/${pathSuffix}`;
        }
        const normalizedPath = resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`;
        return [normalizedPath];
    }
    /**
     * Resolve workspace key to path
     *
     * Example: workspace.root → ["./"]
     */
    static resolveWorkspaceKey(key, projectRoot) {
        const keyParts = key.split('.');
        const pathSuffix = keyParts[1]; // workspace.{suffix}
        let resolvedPath = '';
        if (pathSuffix === 'root') {
            resolvedPath = projectRoot;
        }
        else if (pathSuffix === 'config') {
            resolvedPath = `${projectRoot}/config`;
        }
        else if (pathSuffix === 'docs') {
            resolvedPath = `${projectRoot}/docs`;
        }
        else if (pathSuffix === 'scripts') {
            resolvedPath = `${projectRoot}/scripts`;
        }
        else if (pathSuffix === 'env') {
            resolvedPath = `${projectRoot}/.env`;
        }
        else {
            // Generic: workspace.{suffix}
            resolvedPath = `${projectRoot}/${pathSuffix}`;
        }
        // Normalize path
        const normalizedPath = resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`;
        return [normalizedPath];
    }
}
//# sourceMappingURL=path-mapping-generator.js.map
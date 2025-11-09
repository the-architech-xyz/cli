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
import { Logger } from '../infrastructure/logging/logger.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class PathInitializationService {
    /**
     * Initialize all paths for the project
     * This should be called ONCE before any module execution
     */
    static async initializePaths(genome, pathHandler, frameworkAdapter) {
        Logger.info('📁 Initializing project paths', {
            operation: 'path_initialization',
            structure: genome.project.structure,
            hasFrameworkAdapter: !!frameworkAdapter
        });
        // 1. Start with framework paths (if any)
        if (frameworkAdapter?.paths) {
            pathHandler.mergeFrameworkPaths(frameworkAdapter.paths);
            Logger.debug('✅ Merged framework paths', {
                operation: 'path_initialization',
                pathCount: Object.keys(frameworkAdapter.paths).length
            });
        }
        // 2. Add monorepo paths (if monorepo structure)
        if (genome.project.structure === 'monorepo') {
            const monorepoPaths = this.computeMonorepoPaths(genome);
            for (const [key, value] of Object.entries(monorepoPaths)) {
                pathHandler.setPath(key, value);
            }
            Logger.debug('✅ Added monorepo paths', {
                operation: 'path_initialization',
                pathCount: Object.keys(monorepoPaths).length
            });
        }
        // 3. Add smart paths (auth_config, payment_config, etc.)
        const smartPaths = this.computeSmartPaths(genome, pathHandler);
        for (const [key, value] of Object.entries(smartPaths)) {
            pathHandler.setPath(key, value);
        }
        Logger.debug('✅ Added smart paths', {
            operation: 'path_initialization',
            pathCount: Object.keys(smartPaths).length
        });
        // 4. Add marketplace paths
        const marketplacePaths = await this.computeMarketplacePaths(genome);
        for (const [key, value] of Object.entries(marketplacePaths)) {
            pathHandler.setPath(key, value);
        }
        Logger.debug('✅ Added marketplace paths', {
            operation: 'path_initialization',
            pathCount: Object.keys(marketplacePaths).length
        });
        // 5. Validate paths
        this.validatePaths(pathHandler);
        Logger.info('✅ Path initialization complete', {
            operation: 'path_initialization',
            totalPaths: pathHandler.getAvailablePaths().length
        });
    }
    /**
     * Compute monorepo-specific paths
     */
    static computeMonorepoPaths(genome) {
        const pkgs = genome.project.monorepo?.packages || {};
        const apps = genome.project.apps || [];
        // Determine actual app and package locations
        const apiApp = apps.find((a) => a.type === 'api' || a.framework === 'hono');
        const webApp = apps.find((a) => a.type === 'web');
        const mobileApp = apps.find((a) => a.type === 'mobile');
        // Resolve package paths with proper structure
        const apiPath = apiApp?.package || pkgs.api || './apps/api/';
        const webPath = webApp?.package || pkgs.web || './apps/web/';
        const sharedPath = pkgs.shared || './packages/shared/';
        const databasePath = pkgs.database || './packages/database/';
        const uiPath = pkgs.ui || './packages/ui/';
        const mobilePath = mobileApp?.package || pkgs.mobile || './apps/mobile/';
        // Ensure paths end with / for consistency
        const normalizePath = (p) => p.endsWith('/') ? p : `${p}/`;
        // CRITICAL: Store paths as ABSOLUTE (with package prefix) for monorepo
        // This eliminates ambiguity - paths know their target package
        // VFS will handle normalization based on execution context
        // Helper to create absolute paths
        const absPath = (packagePath, subPath) => {
            // Remove leading ./ if present
            let cleanPackage = packagePath.replace(/^\.\//, '');
            // Ensure package path ends with / (for proper joining)
            if (!cleanPackage.endsWith('/')) {
                cleanPackage = cleanPackage + '/';
            }
            // Remove leading / from subPath if present (to avoid double slashes)
            const cleanSubPath = subPath.startsWith('/') ? subPath.substring(1) : subPath;
            // Join paths
            const joined = cleanPackage + cleanSubPath;
            // Only normalize (add trailing slash) if it's a directory path (ends with / or has no extension)
            // Don't normalize file paths (they have extensions)
            if (joined.endsWith('/') || !joined.match(/\.\w+$/)) {
                return normalizePath(joined);
            }
            return joined;
        };
        // Provide comprehensive path mapping for monorepo
        return {
            // App paths (absolute from project root)
            api: normalizePath(apiPath),
            web: normalizePath(webPath),
            mobile: normalizePath(mobilePath),
            // Package paths (absolute from project root)
            shared: normalizePath(sharedPath),
            database: normalizePath(databasePath),
            ui: normalizePath(uiPath),
            // Sub-paths (ABSOLUTE from project root WITH package prefix)
            // This ensures paths are unambiguous and resolve correctly regardless of execution context
            // NOTE: shared package does NOT use /src subfolder (cleaner structure)
            shared_library: absPath(sharedPath, "lib/"), // packages/shared/lib/
            api_src: absPath(apiPath, "src/"), // apps/api/src/
            api_routes: absPath(apiPath, "src/routes/"), // apps/api/src/routes/
            web_src: absPath(webPath, "src/"), // apps/web/src/
            web_app: absPath(webPath, "src/app/"), // apps/web/src/app/
            // Package-specific library paths (for modules targeting specific packages)
            // These allow blueprints to explicitly target their intended package
            ui_library: absPath(uiPath, "lib/"), // packages/ui/lib/
            database_library: absPath(databasePath, "lib/"), // packages/database/lib/
            // Framework paths for web app (absolute from project root)
            // Only set if webApp exists
            ...(webApp ? {
                components: absPath(webPath, "src/components/"), // apps/web/src/components/
                ui_components: absPath(webPath, "src/components/ui/"), // apps/web/src/components/ui/
                layouts: absPath(webPath, "src/components/layouts/"), // apps/web/src/components/layouts/
                providers: absPath(webPath, "src/components/providers/"), // apps/web/src/components/providers/
            } : {}),
            // Mobile app path (only set if mobileApp exists, otherwise empty string for type safety)
            mobile_app: mobileApp ? absPath(mobilePath, "app/") : '', // apps/mobile/app/ (Expo Router) or empty string
            // Framework adapter paths (absolute from project root)
            // These should match framework adapter.json paths but be absolute in monorepo
            source_root: webApp ? absPath(webPath, "src/") : './src/', // apps/web/src/ or ./src/
            app_root: webApp ? absPath(webPath, "src/app/") : './src/app/', // apps/web/src/app/ or ./src/app/
            // Legacy compatibility paths
            src: webApp ? absPath(webPath, "src/") : './src/', // Absolute for monorepo, relative for single-repo
            lib: absPath(sharedPath, "lib/"), // packages/shared/lib/ (no src/ subfolder) - DEPRECATED: Use package-specific paths
        };
    }
    /**
     * Compute smart paths (auth_config, payment_config, etc.)
     * These paths are computed based on project structure (single-app vs monorepo)
     */
    static computeSmartPaths(genome, pathHandler) {
        const isMonorepo = genome.project.structure === 'monorepo';
        if (isMonorepo) {
            // Smart paths are ABSOLUTE from project root (with package prefix)
            // Most smart paths go to packages/shared (auth, payment, email, etc.)
            // Server path goes to apps/web
            // tRPC router goes to apps/api
            // Get package paths for absolute path construction
            const monorepoConfig = genome.project.monorepo;
            const apps = genome.project.apps || [];
            const webApp = apps.find((a) => a.type === 'web');
            const apiApp = apps.find((a) => a.type === 'api');
            const pkgs = monorepoConfig?.packages || {};
            const sharedPath = pkgs.shared || './packages/shared/';
            const webPath = webApp?.package || pkgs.web || './apps/web/';
            const apiPath = apiApp?.package || pkgs.api || './apps/api/';
            // Helper to create absolute paths
            const absPath = (packagePath, subPath) => {
                // Remove leading ./ if present
                let cleanPackage = packagePath.replace(/^\.\//, '');
                // Ensure package path ends with / (for proper joining)
                if (!cleanPackage.endsWith('/')) {
                    cleanPackage = cleanPackage + '/';
                }
                // Remove leading / from subPath if present (to avoid double slashes)
                const cleanSubPath = subPath.startsWith('/') ? subPath.substring(1) : subPath;
                // Join paths
                const joined = cleanPackage + cleanSubPath;
                // Only normalize (add trailing slash) if it's a directory path (ends with / or has no extension)
                // Don't normalize file paths (they have extensions)
                if (joined.endsWith('/') || !joined.match(/\.\w+$/)) {
                    return joined.endsWith('/') ? joined : joined + '/';
                }
                return joined;
            };
            return {
                // Server path (for Next.js server components, tRPC, etc.)
                // Absolute: apps/web/src/server/
                server: absPath(webPath, "src/server/"),
                // tRPC paths (absolute)
                // Note: trpcRouter is a base path (no extension, no trailing slash) for building file paths
                trpcRouter: absPath(apiPath, "src/router").replace(/\/$/, ''), // apps/api/src/router (no trailing slash)
                trpcClient: absPath(sharedPath, "lib/trpc/client"), // packages/shared/lib/trpc/client/ (no src/)
                trpcServer: absPath(sharedPath, "lib/trpc/server"), // packages/shared/lib/trpc/server/ (no src/)
                // Shared code paths (absolute: packages/shared/... - no src/ subfolder)
                sharedSchemas: absPath(sharedPath, "schemas"),
                sharedTypes: absPath(sharedPath, "types"),
                sharedUtils: absPath(sharedPath, "utils"),
                // Auth paths (absolute: packages/shared/... - no src/ subfolder)
                // These are directory paths (config, hooks, types), so they should have trailing slashes
                auth_config: absPath(sharedPath, "auth/config"),
                authConfig: absPath(sharedPath, "auth/config"), // Alias for compatibility
                authHooks: absPath(sharedPath, "lib/auth/hooks"),
                authTypes: absPath(sharedPath, "auth/types"),
                // Payment paths (absolute: packages/shared/... - no src/ subfolder)
                payment_config: absPath(sharedPath, "payment/config"),
                paymentConfig: absPath(sharedPath, "payment/config"), // Alias for compatibility
                paymentHooks: absPath(sharedPath, "lib/payment/hooks"),
                paymentTypes: absPath(sharedPath, "payment/types"),
                // Teams paths (absolute: packages/shared/... - no src/ subfolder)
                teams_config: absPath(sharedPath, "teams/config"),
                teamsConfig: absPath(sharedPath, "teams/config"), // Alias for compatibility
                teamsHooks: absPath(sharedPath, "lib/teams/hooks"),
                teamsTypes: absPath(sharedPath, "teams/types"),
                // Email paths (absolute: packages/shared/... - no src/ subfolder)
                email_config: absPath(sharedPath, "email/config"),
                emailConfig: absPath(sharedPath, "email/config"), // Alias for compatibility
                emailHooks: absPath(sharedPath, "lib/email/hooks"),
                emailTypes: absPath(sharedPath, "email/types"),
                // Database paths (absolute: packages/shared/... - no src/ subfolder)
                database_config: absPath(sharedPath, "database/config"),
                databaseConfig: absPath(sharedPath, "database/config"), // Alias for compatibility
                databaseSchema: absPath(sharedPath, "database/schema"),
                databaseClient: absPath(sharedPath, "database/client"),
            };
        }
        else {
            // Single app paths
            return {
                // Server path (for Next.js server components, tRPC, etc.)
                server: './src/server/',
                // tRPC paths (single app)
                trpcRouter: './src/server/trpc/router',
                trpcClient: './src/lib/trpc/client',
                trpcServer: './src/lib/trpc/server',
                // Shared code paths (single app)
                sharedSchemas: './src/lib/schemas',
                sharedTypes: './src/lib/types',
                sharedUtils: './src/lib/utils',
                // Auth paths (use snake_case as standard)
                auth_config: './src/lib/auth/config',
                authConfig: './src/lib/auth/config', // Alias for compatibility
                authHooks: './src/lib/auth/hooks',
                authTypes: './src/lib/auth/types',
                // Payment paths
                payment_config: './src/lib/payment/config',
                paymentConfig: './src/lib/payment/config', // Alias for compatibility
                paymentHooks: './src/lib/payment/hooks',
                paymentTypes: './src/lib/payment/types',
                // Teams paths
                teams_config: './src/lib/teams/config',
                teamsConfig: './src/lib/teams/config', // Alias for compatibility
                teamsHooks: './src/lib/teams/hooks',
                teamsTypes: './src/lib/teams/types',
                // Email paths
                email_config: './src/lib/email/config',
                emailConfig: './src/lib/email/config', // Alias for compatibility
                emailHooks: './src/lib/email/hooks',
                emailTypes: './src/lib/email/types',
                // Database paths
                database_config: './src/lib/database/config',
                databaseConfig: './src/lib/database/config', // Alias for compatibility
                databaseSchema: './src/lib/database/schema',
                databaseClient: './src/lib/database/client',
            };
        }
    }
    /**
     * Compute marketplace paths
     * SINGLE SOURCE OF TRUTH for marketplace UI framework detection
     */
    static async computeMarketplacePaths(genome) {
        const paths = {};
        try {
            // Core marketplace path
            const coreMarketplacePath = await MarketplaceRegistry.getCoreMarketplacePath();
            paths['core.path'] = coreMarketplacePath;
            // UI Framework Detection (COMPLETE LOGIC - single source of truth)
            const uiFramework = await this.detectUIFramework(genome);
            if (uiFramework) {
                const uiMarketplacePath = await MarketplaceRegistry.getUIMarketplacePath(uiFramework);
                if (uiMarketplacePath) {
                    // Store UI framework and paths for later retrieval
                    paths['ui.framework'] = uiFramework;
                    paths['ui.path'] = uiMarketplacePath;
                    paths[`ui.path.${uiFramework}`] = uiMarketplacePath;
                    Logger.debug('✅ Detected UI framework', {
                        operation: 'marketplace_initialization',
                        uiFramework: uiFramework,
                        uiMarketplacePath: uiMarketplacePath
                    });
                }
            }
            else {
                Logger.debug('⚠️ No UI framework detected', {
                    operation: 'marketplace_initialization'
                });
            }
        }
        catch (error) {
            Logger.warn('Failed to compute marketplace paths', {
                operation: 'path_initialization',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return paths;
    }
    /**
     * Detect UI framework from genome
     * PRIORITY: Modules (explicit) > Genome options > Framework inference > Package.json
     *
     * This is the SINGLE SOURCE OF TRUTH for UI framework detection.
     * All other layers should read from PathService, not detect independently.
     */
    static async detectUIFramework(genome) {
        // 1. Check modules FIRST (highest priority - explicit declaration in genome)
        if (genome.modules) {
            for (const module of genome.modules) {
                const moduleId = module.id || '';
                if (moduleId.includes('ui/tamagui') || moduleId.includes('adapters/ui/tamagui') || moduleId.includes('connectors/ui/tamagui')) {
                    return 'tamagui';
                }
                if (moduleId.includes('ui/shadcn') || moduleId.includes('adapters/ui/shadcn') || moduleId.includes('connectors/ui/shadcn') || moduleId.includes('ui/shadcn-ui')) {
                    return 'shadcn';
                }
            }
        }
        // 2. Check genome parameters for explicit UI framework
        if (genome.options?.uiFramework) {
            return genome.options.uiFramework;
        }
        // 3. Check framework name for UI framework indicators (lowest priority - inference)
        const apps = genome.project.apps || [];
        const webApp = apps.find((a) => a.type === 'web');
        const framework = webApp?.framework || genome.project.framework;
        if (framework) {
            const frameworkLower = framework.toLowerCase();
            if (frameworkLower.includes('expo') || frameworkLower.includes('react-native')) {
                return 'tamagui';
            }
            if (frameworkLower.includes('nextjs') || frameworkLower.includes('next')) {
                return 'shadcn';
            }
        }
        // 4. Check project path for package.json (if project exists)
        const projectPath = genome.project.path || './';
        const packageJsonPath = path.join(projectPath, 'package.json');
        try {
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps['expo'] || deps['react-native']) {
                return 'tamagui';
            }
            if (deps['next'] || deps['react']) {
                return 'shadcn';
            }
        }
        catch {
            // Package.json not found yet (project being created) - continue
        }
        // 5. No UI framework detected
        return null;
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
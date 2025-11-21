/**
 * Framework Context Service
 *
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 *
 * This service is framework-agnostic and relies entirely on marketplace data.
 */
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { getProjectFramework, getProjectApps, getProjectProperty } from '../../utils/genome-helpers.js';
export class FrameworkContextService {
    /**
     * Create dynamic ProjectContext based on framework and parameters
     */
    static async createProjectContext(genome, module, pathHandler, modulesRecord) {
        try {
            // Get framework using type-safe helper (handles both new and legacy structures)
            const framework = getProjectFramework(genome);
            const frameworkModule = framework ? (modulesRecord[`adapters/framework/${framework}`] || modulesRecord[`framework/${framework}`]) : undefined;
            if (!frameworkModule) {
                Logger.warn(`Framework module not found: adapters/framework/${framework} or framework/${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Load framework configuration from marketplace
            const frameworkConfig = framework ? await this.loadFrameworkConfig(frameworkModule) : null;
            if (!frameworkConfig) {
                Logger.warn(`Framework configuration not found: ${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Create dynamic paths based on framework and parameters
            // NOTE: Path initialization is now handled centrally by PathInitializationService
            // before module execution, so we only need to resolve framework-specific paths
            // for the context object (not for pathHandler)
            const paths = framework ? await this.resolveFrameworkPaths(framework, frameworkModule?.parameters, frameworkConfig, genome) : {};
            // Create environment context
            const env = await this.createEnvironmentContext(genome, frameworkModule.parameters, frameworkConfig);
            // Create project context
            // NOTE: paths are now read from pathHandler (already initialized by PathInitializationService)
            // We need to convert flat dot-notation paths to nested structure for EJS templates
            // EJS templates expect: paths.packages.shared.src, not paths['packages.shared.src']
            const nestedPaths = this.buildNestedPathsObject(pathHandler);
            // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
            // Marketplace UI is initialized once by PathInitializationService and read-only after
            const marketplaceUI = pathHandler.getMarketplaceUI();
            const uiMarketplacePath = pathHandler.hasPath('ui.marketplace')
                ? pathHandler.getPath('ui.marketplace')
                : pathHandler.hasPath('ui.path')
                    ? pathHandler.getPath('ui.path')
                    : '';
            const context = {
                project: {
                    name: genome.project.name,
                    framework: framework || 'unknown',
                    path: genome.project.path || './',
                    description: getProjectProperty(genome, 'description'),
                    author: getProjectProperty(genome, 'author'),
                    version: getProjectProperty(genome, 'version'),
                    license: getProjectProperty(genome, 'license')
                },
                module: module,
                framework: framework || 'unknown',
                paths: nestedPaths,
                modules: modulesRecord,
                pathHandler: pathHandler,
                env: env,
                parameters: genome.options || {},
                // Add import path helper function
                importPath: (filePath) => PathService.resolveImportPath(filePath, context),
                // Add marketplace paths for template resolution
                // NOTE: Marketplace UI is initialized by PathInitializationService (single source of truth)
                marketplace: {
                    core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : '',
                    ui: {
                        ...marketplaceUI,
                        default: marketplaceUI.default || uiMarketplacePath || '',
                        root: uiMarketplacePath
                    }
                },
                // Initialize enriched properties (will be populated by OrchestratorAgent)
                params: {},
                platforms: { web: false, mobile: false },
            };
            Logger.info(`✅ Created dynamic context for framework: ${framework}`, {
                operation: 'framework_context_creation',
                framework: framework,
                pathCount: Object.keys(paths).length,
                envCount: Object.keys(env).length
            });
            return context;
        }
        catch (error) {
            Logger.error(`❌ Failed to create framework context: ${error}`, {
                operation: 'framework_context_creation',
                framework: getProjectFramework(genome) || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Fallback to basic context
            return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
        }
    }
    /**
     * Convert flat dot-notation path keys to nested object structure
     * Example: { 'packages.shared.src': './packages/shared/src' }
     *       -> { packages: { shared: { src: './packages/shared/src' } } }
     *
     * This is needed because EJS templates expect nested access like:
     * paths.packages.shared.src.payment.config
     *
     * NEW: Uses pre-computed mappings from PathService.getMappings()
     * For semantic keys with multiple paths, uses the first path (EJS expects single value)
     */
    static buildNestedPathsObject(pathHandler) {
        const nested = {};
        // Use pre-computed mappings (from PathMappingGenerator)
        const mappings = PathService.getMappings();
        // If mappings exist, use them (pre-computed model)
        if (Object.keys(mappings).length > 0) {
            for (const [key, paths] of Object.entries(mappings)) {
                if (paths.length > 0 && paths[0]) {
                    // For semantic keys with multiple paths, use first path for nested structure
                    // (EJS templates expect single value, not array)
                    // BlueprintExecutor will handle expansion during execution
                    const value = paths[0];
                    this.setNestedValue(nested, key, value);
                }
            }
        }
        else {
            // Fallback: Use pathHandler if mappings not available (backward compatibility)
            const allPathKeys = pathHandler.getAvailablePaths();
            for (const key of allPathKeys) {
                try {
                    const value = pathHandler.getPath(key);
                    this.setNestedValue(nested, key, value);
                }
                catch (error) {
                    // Skip paths that can't be retrieved
                    continue;
                }
            }
        }
        return nested;
    }
    /**
     * Set nested value in object using dot notation
     * Creates intermediate objects as needed
     * @private
     */
    static setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        // Navigate/create intermediate objects
        let current = obj;
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        // Set the final value
        current[lastKey] = value;
    }
    /**
     * Load framework configuration from marketplace
     */
    static async loadFrameworkConfig(frameworkModule) {
        try {
            if (!frameworkModule) {
                return null;
            }
            const adapterConfig = await MarketplaceService.loadModuleConfig(frameworkModule);
            if (!adapterConfig || !adapterConfig.context) {
                return null;
            }
            return adapterConfig.context;
        }
        catch (error) {
            Logger.error(`Failed to load framework config for ${frameworkModule?.id || '<unknown framework>'}: ${error}`);
            return null;
        }
    }
    /**
     * Resolve framework-specific paths
     */
    static async resolveFrameworkPaths(framework, params, config, genome // NOUVEAU: ajouter genome pour transformation
    ) {
        const basePaths = { ...config.pathResolution.basePaths };
        const resolvedPaths = {};
        // Process each path with parameter substitution
        for (const [key, pathTemplate] of Object.entries(basePaths)) {
            try {
                resolvedPaths[key] = await this.resolvePathTemplate(pathTemplate, params);
            }
            catch (error) {
                Logger.warn(`Failed to resolve path ${key}: ${error}`);
                resolvedPaths[key] = pathTemplate; // Fallback to original
            }
        }
        // Transform paths according to project structure (single-app vs monorepo)
        return this.transformPathsForStructure(resolvedPaths, genome);
    }
    /**
     * Transform framework adapter paths according to project structure
     * Single app: paths stay as-is
     * Monorepo: paths are moved to appropriate packages based on initialized structure
     */
    static transformPathsForStructure(frameworkPaths, genome) {
        const isMonorepo = genome.project.structure === 'monorepo';
        if (!isMonorepo || !genome.project.monorepo) {
            // Single app: return paths as-is
            return frameworkPaths;
        }
        const monorepoConfig = genome.project.monorepo;
        const pkgsRaw = monorepoConfig?.packages || {};
        // Filter out undefined values to ensure Record<string, string>
        const pkgs = {};
        for (const [key, value] of Object.entries(pkgsRaw)) {
            if (typeof value === 'string') {
                pkgs[key] = value;
            }
        }
        const sharedPkg = pkgs.shared || null;
        const webPkg = pkgs.web || null;
        const apiPkg = pkgs.api || null;
        const transformed = {};
        for (const [key, value] of Object.entries(frameworkPaths)) {
            // Determine target package based on path key and value
            const targetPackage = this.determineTargetPackageForPath(key, value, pkgs);
            if (targetPackage) {
                transformed[key] = this.transformPath(value, targetPackage);
            }
            else {
                // Keep path as-is (root-level paths like scripts/, public/, etc.)
                transformed[key] = value;
            }
        }
        return transformed;
    }
    /**
     * Determine which package a path should go to based on initialized structure
     */
    static determineTargetPackageForPath(key, value, packages) {
        // V2 COMPLIANCE: Paths map to granular packages, not packages/shared
        // Try to infer capability package from path key/value
        if (this.isSharedPath(key, value)) {
            // Map to granular package based on capability
            const capability = this.inferCapabilityFromPath(key, value);
            if (capability && packages[capability]) {
                return packages[capability];
            }
            // If no capability package found, return null (let path keys handle it)
            return null;
        }
        // Web app paths (components, pages, app routes)
        if (this.isWebPath(key, value)) {
            return packages.web || null;
        }
        // API paths (api routes, handlers)
        if (this.isApiPath(key, value)) {
            return packages.api || null;
        }
        // Root-level paths (scripts, public, etc.)
        return null;
    }
    /**
     * Check if path should go to a capability package (not packages/shared)
     *
     * V2 COMPLIANCE: Paths map to granular packages (packages/auth, packages/payments, etc.)
     */
    static isSharedPath(key, value) {
        // Path keys that indicate capability-specific code (not packages/shared)
        const capabilityKeys = [
            'auth_config', 'database_config', 'payment_config',
            'email_config', 'observability_config', 'state_config',
            'testing_config', 'blockchain_config', 'content_config'
        ];
        // Path patterns that indicate capability-specific code
        const capabilityPatterns = [
            'auth', 'database', 'db', 'payment', 'email',
            'observability', 'state', 'testing', 'blockchain', 'content'
        ];
        // Check key
        if (capabilityKeys.some(k => key.includes(k))) {
            return true;
        }
        // Check value pattern
        if (value.includes('lib/') && capabilityPatterns.some(p => value.includes(p))) {
            return true;
        }
        return false;
    }
    /**
     * Infer capability name from path key or value
     */
    static inferCapabilityFromPath(key, value) {
        // Map path patterns to capability names
        const capabilityMap = {
            'auth': 'auth',
            'database': 'database',
            'db': 'database',
            'payment': 'payments',
            'email': 'emailing',
            'observability': 'monitoring',
            'state': 'state',
            'testing': 'testing',
            'blockchain': 'blockchain',
            'content': 'content'
        };
        // Check key
        for (const [pattern, capability] of Object.entries(capabilityMap)) {
            if (key.includes(pattern)) {
                return capability;
            }
        }
        // Check value
        for (const [pattern, capability] of Object.entries(capabilityMap)) {
            if (value.includes(pattern)) {
                return capability;
            }
        }
        return null;
    }
    /**
     * Check if path should go to web app
     */
    static isWebPath(key, value) {
        const webKeys = ['components', 'ui_components', 'layouts', 'providers', 'pages_root'];
        const webPatterns = ['components', 'app/', 'pages/'];
        if (webKeys.includes(key)) {
            return true;
        }
        if (webPatterns.some(p => value.includes(p))) {
            return true;
        }
        return false;
    }
    /**
     * Check if path should go to API package
     */
    static isApiPath(key, value) {
        const apiKeys = ['api_routes', 'api_handlers'];
        const apiPatterns = ['api/'];
        if (apiKeys.includes(key)) {
            return true;
        }
        if (apiPatterns.some(p => value.includes(p))) {
            return true;
        }
        return false;
    }
    /**
     * Transform a path to target package
     */
    static transformPath(path, targetPackage) {
        // Remove leading './' if present
        const cleanPath = path.startsWith('./') ? path.slice(2) : path;
        // Handle src/lib/ paths (most common for shared code)
        if (cleanPath.startsWith('src/lib/')) {
            const rest = cleanPath.replace('src/lib/', '');
            return `${targetPackage}/src/${rest}`;
        }
        // Handle src/ paths (for components, etc.)
        if (cleanPath.startsWith('src/')) {
            return `${targetPackage}/${cleanPath}`;
        }
        // Handle app/ paths (for Next.js app router)
        if (cleanPath.startsWith('app/')) {
            return `${targetPackage}/${cleanPath}`;
        }
        // For other paths, prepend target package
        return `${targetPackage}/${cleanPath}`;
    }
    /**
     * Resolve path template with parameter substitution
     */
    static async resolvePathTemplate(template, params) {
        // Simple template resolution for now
        // TODO: Implement more sophisticated template engine if needed
        let resolved = template;
        // Replace {{param}} with actual values
        const paramRegex = /\{\{([^}]+)\}\}/g;
        resolved = resolved.replace(paramRegex, (match, expression) => {
            try {
                // Handle simple expressions like "srcDir ? 'src/' : ''"
                if (expression.includes('?')) {
                    return this.evaluateConditionalExpression(expression, params);
                }
                // Handle simple parameter substitution
                if (expression.includes('||')) {
                    const [param, fallback] = expression.split('||').map((s) => s.trim());
                    return params[param] || fallback.replace(/['"]/g, '');
                }
                // Direct parameter access
                return params[expression] || '';
            }
            catch (error) {
                Logger.warn(`Failed to resolve expression ${expression}: ${error}`);
                return match; // Return original if resolution fails
            }
        });
        return resolved;
    }
    /**
     * Evaluate conditional expressions like "srcDir ? 'src/' : ''"
     */
    static evaluateConditionalExpression(expression, params) {
        const parts = expression.split(/[?:]/).map((s) => s.trim());
        const condition = parts[0] || '';
        const trueValue = parts[1] || '';
        const falseValue = parts[2] || '';
        if (!condition) {
            return '';
        }
        const conditionValue = params[condition];
        const result = conditionValue ? trueValue : falseValue;
        // Remove quotes from result
        return result ? result.replace(/['"]/g, '') : '';
    }
    /**
     * Create environment context
     */
    static async createEnvironmentContext(genome, frameworkParams, config) {
        const baseEnv = { ...config.environment.default };
        const frameworkEnv = {};
        // Process framework-specific environment variables
        for (const [key, valueTemplate] of Object.entries(config.environment.frameworkSpecific)) {
            try {
                frameworkEnv[key] = await this.resolvePathTemplate(valueTemplate, frameworkParams);
            }
            catch (error) {
                Logger.warn(`Failed to resolve environment variable ${key}: ${error}`);
                frameworkEnv[key] = valueTemplate;
            }
        }
        return { ...baseEnv, ...frameworkEnv };
    }
    // NOTE: addSmartPaths has been moved to PathInitializationService
    // This method is no longer needed as paths are initialized centrally before module execution
    /**
     * Create fallback context when framework config is not available
     */
    static async createFallbackContext(genome, module, pathHandler, modulesRecord) {
        Logger.warn('Using fallback context configuration', {
            operation: 'framework_context_creation',
            framework: getProjectFramework(genome) || 'unknown'
        });
        // NOTE: Paths should already be initialized by PathInitializationService
        // This fallback only provides minimal paths if initialization somehow failed
        // Use PathKey enum values for consistency
        const { PathKey } = await import('@thearchitech.xyz/types');
        const basePaths = {
            [PathKey.APPS_WEB_APP]: './src/app/',
            [PathKey.APPS_WEB_COMPONENTS]: './src/components/',
            // V2 COMPLIANCE: Removed PACKAGES_SHARED_* - use granular packages
            [PathKey.WORKSPACE_SCRIPTS]: './scripts/',
            // V2 COMPLIANCE: Removed PACKAGES_SHARED_* - use granular packages
        };
        // Add monorepo-specific paths if monorepo structure detected (even in fallback)
        let paths = { ...basePaths };
        if (genome.project.structure === 'monorepo' && genome.project.monorepo) {
            const monorepoConfig = genome.project.monorepo;
            const pkgsRaw = monorepoConfig?.packages || {};
            // Filter out undefined values to ensure Record<string, string>
            const pkgs = {};
            for (const [key, value] of Object.entries(pkgsRaw)) {
                if (typeof value === 'string') {
                    pkgs[key] = value;
                }
            }
            const apps = getProjectApps(genome);
            const apiApp = apps.find((a) => a.type === 'api' || a.framework === 'hono');
            const webApp = apps.find((a) => a.type === 'web');
            const apiPath = apiApp?.package || pkgs.api || './apps/api/';
            const webPath = webApp?.package || pkgs.web || './apps/web/';
            // V2 COMPLIANCE: No packages/shared - use granular packages
            const databasePath = pkgs.database || pkgs.db || './packages/database/';
            const uiPath = pkgs.ui || './packages/ui/';
            const normalizePath = (p) => p.endsWith('/') ? p : `${p}/`;
            paths = {
                ...basePaths,
                [PathKey.APPS_API_ROOT]: normalizePath(apiPath),
                [PathKey.APPS_API_SRC]: `${normalizePath(apiPath)}src/`,
                [PathKey.APPS_API_ROUTES]: `${normalizePath(apiPath)}src/routes/`,
                [PathKey.APPS_WEB_ROOT]: normalizePath(webPath),
                [PathKey.APPS_WEB_SRC]: `${normalizePath(webPath)}src/`,
                [PathKey.APPS_WEB_APP]: `${normalizePath(webPath)}src/app/`,
                [PathKey.APPS_WEB_COMPONENTS]: `${normalizePath(webPath)}src/components/`,
                // V2 COMPLIANCE: Removed PACKAGES_SHARED_* - use granular packages
                [PathKey.PACKAGES_DATABASE_ROOT]: normalizePath(databasePath),
                [PathKey.PACKAGES_DATABASE_SRC]: `${normalizePath(databasePath)}src/`,
                [PathKey.PACKAGES_UI_ROOT]: normalizePath(uiPath),
                [PathKey.PACKAGES_UI_SRC]: `${normalizePath(uiPath)}src/`
            };
            // Add all resolved paths to PathService.pathMap for variable resolution
            for (const [key, value] of Object.entries(paths)) {
                if (typeof value === 'string') {
                    pathHandler.setPath(key, value);
                }
            }
        }
        // NOTE: Smart paths are now handled by PathInitializationService
        // We only need basic paths for fallback context
        // Convert flat paths to nested structure for EJS templates
        const nestedPaths = this.buildNestedPathsObject(pathHandler);
        // Get marketplace UI from PathService (SINGLE SOURCE OF TRUTH)
        // Marketplace UI is initialized once by PathInitializationService and read-only after
        const marketplaceUI = pathHandler.getMarketplaceUI();
        const uiMarketplacePath = pathHandler.hasPath('ui.marketplace')
            ? pathHandler.getPath('ui.marketplace')
            : pathHandler.hasPath('ui.path')
                ? pathHandler.getPath('ui.path')
                : '';
        const context = {
            project: {
                name: genome.project.name,
                path: genome.project.path || './',
                framework: getProjectFramework(genome) || 'unknown',
                description: getProjectProperty(genome, 'description'),
                author: getProjectProperty(genome, 'author'),
                version: getProjectProperty(genome, 'version'),
                license: getProjectProperty(genome, 'license')
            },
            module: module,
            framework: getProjectFramework(genome) || 'unknown',
            paths: nestedPaths,
            modules: modulesRecord,
            pathHandler: pathHandler,
            env: {
                APP_URL: 'http://localhost:3000',
                NODE_ENV: 'development'
            },
            marketplace: {
                core: pathHandler.hasPath('core.path') ? pathHandler.getPath('core.path') : '',
                ui: {
                    ...marketplaceUI,
                    default: marketplaceUI.default || uiMarketplacePath || '',
                    root: uiMarketplacePath
                }
            },
            // Initialize enriched properties (will be populated by OrchestratorAgent)
            params: {},
            platforms: { web: false, mobile: false },
        };
        // Add import path helper
        context.importPath = (filePath) => PathService.resolveImportPath(filePath, context);
        return context;
    }
}
//# sourceMappingURL=framework-context-service.js.map
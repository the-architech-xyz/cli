/**
 * Framework Context Service
 *
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 *
 * This service is framework-agnostic and relies entirely on marketplace data.
 */
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { MarketplaceRegistry } from '../marketplace/marketplace-registry.js';
import { Logger } from '../infrastructure/logging/logger.js';
import { ImportPathResolver } from '../path/import-path-resolver.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class FrameworkContextService {
    /**
     * Create dynamic ProjectContext based on framework and parameters
     */
    static async createProjectContext(genome, module, pathHandler, modulesRecord) {
        try {
            // Support new multi-app project model
            let framework = genome.project.framework;
            const apps = genome.project.apps;
            if (apps && apps.length > 0) {
                const preferred = apps.find(a => a.type === 'web') || apps[0];
                framework = preferred.framework;
            }
            const frameworkModule = framework ? (modulesRecord[`adapters/framework/${framework}`] || modulesRecord[`framework/${framework}`]) : undefined;
            if (!frameworkModule) {
                Logger.warn(`Framework module not found: adapters/framework/${framework} or framework/${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Load framework configuration from marketplace
            const frameworkConfig = framework ? await this.loadFrameworkConfig(framework) : null;
            if (!frameworkConfig) {
                Logger.warn(`Framework configuration not found: ${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Create dynamic paths based on framework and parameters
            let paths = framework ? await this.resolveFrameworkPaths(framework, frameworkModule?.parameters, frameworkConfig) : {};
            // Add monorepo-specific paths if monorepo structure detected
            if (genome.project.structure === 'monorepo' && genome.project.monorepo) {
                const pkgs = genome.project.monorepo.packages || {};
                // Provide sensible defaults when packages are missing
                paths = {
                    ...paths,
                    api: pkgs.api || './packages/api',
                    web: pkgs.web || './apps/web',
                    mobile: pkgs.mobile || './apps/mobile',
                    shared: pkgs.shared || './packages/shared',
                    ui: pkgs.ui || './packages/ui',
                };
            }
            // Add smart paths for common patterns
            const smartPaths = this.addSmartPaths(paths, genome);
            // Resolve marketplace paths (single source of truth: MarketplaceRegistry)
            const coreMarketplacePath = await MarketplaceRegistry.getCoreMarketplacePath();
            const uiFramework = await this.detectUIFramework(genome, framework);
            const uiMarketplacePaths = {};
            let defaultUIFramework = '';
            if (uiFramework) {
                defaultUIFramework = uiFramework;
                uiMarketplacePaths[uiFramework] = await MarketplaceRegistry.getUIMarketplacePath(uiFramework);
            }
            else {
                // Fallback: try to get available UI marketplaces
                const available = await MarketplaceRegistry.getAvailableUIMarketplaces();
                if (available.length > 0 && available[0]) {
                    defaultUIFramework = available[0];
                    uiMarketplacePaths[defaultUIFramework] = await MarketplaceRegistry.getUIMarketplacePath(defaultUIFramework);
                }
            }
            // Add marketplace paths to PathService.pathMap for variable resolution
            pathHandler.setPath('core.path', coreMarketplacePath);
            if (defaultUIFramework && uiMarketplacePaths[defaultUIFramework]) {
                const uiPath = uiMarketplacePaths[defaultUIFramework];
                if (uiPath) {
                    pathHandler.setPath('ui.path', uiPath);
                    pathHandler.setPath(`ui.path.${defaultUIFramework}`, uiPath);
                }
            }
            // Create environment context
            const env = await this.createEnvironmentContext(genome, frameworkModule.parameters, frameworkConfig);
            // Create project context
            const context = {
                project: {
                    name: genome.project.name,
                    framework: framework || genome.project.framework || 'unknown',
                    path: genome.project.path || './',
                    description: genome.project.description,
                    author: genome.project.author,
                    version: genome.project.version,
                    license: genome.project.license
                },
                module: module,
                framework: framework || 'unknown',
                paths: smartPaths,
                modules: modulesRecord,
                pathHandler: pathHandler,
                env: env,
                parameters: genome.options || {},
                // Add import path helper function
                importPath: (filePath) => ImportPathResolver.resolveImportPath(filePath, context),
                // Add marketplace paths for template resolution
                marketplace: {
                    core: coreMarketplacePath,
                    ui: {
                        default: defaultUIFramework,
                        ...uiMarketplacePaths
                    }
                },
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
                framework: genome.project.framework,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Fallback to basic context
            return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
        }
    }
    /**
     * Load framework configuration from marketplace
     */
    static async loadFrameworkConfig(framework) {
        try {
            const adapterPath = `adapters/framework/${framework}`;
            const adapterConfig = await MarketplaceService.loadModuleConfig(adapterPath);
            if (!adapterConfig || !adapterConfig.context) {
                return null;
            }
            return adapterConfig.context;
        }
        catch (error) {
            Logger.error(`Failed to load framework config for ${framework}: ${error}`);
            return null;
        }
    }
    /**
     * Resolve framework-specific paths
     */
    static async resolveFrameworkPaths(framework, params, config) {
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
        return resolvedPaths;
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
    /**
     * Add smart paths for common patterns
     * These paths are computed based on project structure (single-app vs monorepo)
     */
    static addSmartPaths(paths, genome) {
        const isMonorepo = genome.project.structure === 'monorepo';
        if (isMonorepo && genome.project.monorepo) {
            const pkgs = genome.project.monorepo.packages || {};
            const apiPkg = pkgs.api || './packages/api';
            const sharedPkg = pkgs.shared || './packages/shared';
            return {
                ...paths,
                // tRPC paths
                trpcRouter: `${apiPkg}/src/router`,
                trpcClient: './src/lib/trpc/client',
                trpcServer: './src/lib/trpc/server',
                // Shared code paths
                sharedSchemas: `${sharedPkg}/src/schemas`,
                sharedTypes: `${sharedPkg}/src/types`,
                sharedUtils: `${sharedPkg}/src/utils`,
                // Auth paths
                authConfig: `${sharedPkg}/src/auth/config`,
                authHooks: './src/lib/auth/hooks',
                authTypes: `${sharedPkg}/src/auth/types`,
                // Payment paths
                paymentConfig: `${sharedPkg}/src/payment/config`,
                paymentHooks: './src/lib/payment/hooks',
                paymentTypes: `${sharedPkg}/src/payment/types`,
                // Teams paths
                teamsConfig: `${sharedPkg}/src/teams/config`,
                teamsHooks: './src/lib/teams/hooks',
                teamsTypes: `${sharedPkg}/src/teams/types`,
                // Email paths
                emailConfig: `${sharedPkg}/src/email/config`,
                emailHooks: './src/lib/email/hooks',
                emailTypes: `${sharedPkg}/src/email/types`,
                // Database paths
                databaseConfig: `${sharedPkg}/src/database/config`,
                databaseSchema: `${sharedPkg}/src/database/schema`,
                databaseClient: `${sharedPkg}/src/database/client`,
            };
        }
        else {
            // Single app paths
            return {
                ...paths,
                // tRPC paths (single app)
                trpcRouter: './src/server/trpc/router',
                trpcClient: './src/lib/trpc/client',
                trpcServer: './src/lib/trpc/server',
                // Shared code paths (single app)
                sharedSchemas: './src/lib/schemas',
                sharedTypes: './src/lib/types',
                sharedUtils: './src/lib/utils',
                // Auth paths
                authConfig: './src/lib/auth/config',
                authHooks: './src/lib/auth/hooks',
                authTypes: './src/lib/auth/types',
                // Payment paths
                paymentConfig: './src/lib/payment/config',
                paymentHooks: './src/lib/payment/hooks',
                paymentTypes: './src/lib/payment/types',
                // Teams paths
                teamsConfig: './src/lib/teams/config',
                teamsHooks: './src/lib/teams/hooks',
                teamsTypes: './src/lib/teams/types',
                // Email paths
                emailConfig: './src/lib/email/config',
                emailHooks: './src/lib/email/hooks',
                emailTypes: './src/lib/email/types',
                // Database paths
                databaseConfig: './src/lib/database/config',
                databaseSchema: './src/lib/database/schema',
                databaseClient: './src/lib/database/client',
            };
        }
    }
    /**
     * Create fallback context when framework config is not available
     */
    static createFallbackContext(genome, module, pathHandler, modulesRecord) {
        Logger.warn('Using fallback context configuration', {
            operation: 'framework_context_creation',
            framework: (genome.project.apps && genome.project.apps[0]?.framework) || genome.project.framework || 'unknown'
        });
        const basePaths = {
            app_root: './',
            components: './src/components',
            shared_library: './src/lib',
            styles: './src/styles',
            scripts: './src/scripts',
            hooks: './src/hooks'
        };
        const smartPaths = this.addSmartPaths(basePaths, genome);
        const context = {
            project: {
                name: genome.project.name,
                path: genome.project.path || './',
                framework: (genome.project.apps && genome.project.apps[0]?.framework) || genome.project.framework || 'unknown',
                description: genome.project.description,
                author: genome.project.author,
                version: genome.project.version,
                license: genome.project.license
            },
            module: module,
            framework: (genome.project.apps && genome.project.apps[0]?.framework) || genome.project.framework || 'unknown',
            paths: smartPaths,
            modules: modulesRecord,
            pathHandler: pathHandler,
            env: {
                APP_URL: 'http://localhost:3000',
                NODE_ENV: 'development'
            }
        };
        // Add import path helper
        context.importPath = (filePath) => ImportPathResolver.resolveImportPath(filePath, context);
        return context;
    }
    /**
     * Detect UI framework from genome or project context
     */
    static async detectUIFramework(genome, framework) {
        // 1. Check genome parameters for explicit UI framework
        if (genome.options?.uiFramework) {
            return genome.options.uiFramework;
        }
        // 2. Check framework name for UI framework indicators
        if (framework) {
            const frameworkLower = framework.toLowerCase();
            if (frameworkLower.includes('expo') || frameworkLower.includes('react-native')) {
                return 'tamagui';
            }
            if (frameworkLower.includes('nextjs') || frameworkLower.includes('next')) {
                return 'shadcn';
            }
        }
        // 3. Check modules for UI framework indicators
        if (genome.modules) {
            for (const module of genome.modules) {
                const moduleId = module.id || '';
                if (moduleId.includes('shadcn') || moduleId.includes('ui/shadcn')) {
                    return 'shadcn';
                }
                if (moduleId.includes('tamagui') || moduleId.includes('ui/tamagui')) {
                    return 'tamagui';
                }
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
}
//# sourceMappingURL=framework-context-service.js.map
/**
 * Framework Context Service
 *
 * Loads framework-specific context configurations from the marketplace
 * and creates dynamic ProjectContext based on framework and user parameters.
 *
 * This service is framework-agnostic and relies entirely on marketplace data.
 */
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { Logger } from '../infrastructure/logging/logger.js';
export class FrameworkContextService {
    /**
     * Create dynamic ProjectContext based on framework and parameters
     */
    static async createProjectContext(genome, module, pathHandler, modulesRecord) {
        try {
            const framework = genome.project.framework;
            const frameworkModule = modulesRecord[`framework/${framework}`];
            if (!frameworkModule) {
                Logger.warn(`Framework module not found: framework/${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Load framework configuration from marketplace
            const frameworkConfig = await this.loadFrameworkConfig(framework);
            if (!frameworkConfig) {
                Logger.warn(`Framework configuration not found: ${framework}, using fallback configuration`);
                return this.createFallbackContext(genome, module, pathHandler, modulesRecord);
            }
            // Create dynamic paths based on framework and parameters
            const paths = await this.resolveFrameworkPaths(framework, frameworkModule.parameters, frameworkConfig);
            // Create environment context
            const env = await this.createEnvironmentContext(genome, frameworkModule.parameters, frameworkConfig);
            // Create project context
            const context = {
                project: {
                    ...genome.project,
                    path: genome.project.path || './'
                },
                module: module,
                framework: framework,
                paths: paths,
                modules: modulesRecord,
                pathHandler: pathHandler,
                env: env
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
            const adapterPath = `framework/${framework}`;
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
     * Create fallback context when framework config is not available
     */
    static createFallbackContext(genome, module, pathHandler, modulesRecord) {
        Logger.warn('Using fallback context configuration', {
            operation: 'framework_context_creation',
            framework: genome.project.framework
        });
        return {
            project: {
                ...genome.project,
                path: genome.project.path || './'
            },
            module: module,
            framework: genome.project.framework,
            paths: {
                app_root: './',
                components: './src/components',
                shared_library: './src/lib',
                styles: './src/styles',
                scripts: './src/scripts',
                hooks: './src/hooks'
            },
            modules: modulesRecord,
            pathHandler: pathHandler,
            env: {
                APP_URL: 'http://localhost:3000',
                NODE_ENV: 'development'
            }
        };
    }
}
//# sourceMappingURL=framework-context-service.js.map
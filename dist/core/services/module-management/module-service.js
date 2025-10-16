/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */
import { convertGenomeModulesToModules } from './genome-module-converter.js';
import { PathService } from '../path/path-service.js';
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { ErrorHandler } from '../infrastructure/error/index.js';
import { FrameworkContextService } from '../context/framework-context-service.js';
import { ErrorCode } from '../infrastructure/error/error-types.js';
import { Logger } from '../infrastructure/logging/index.js';
export class ModuleService {
    cacheManager;
    cache = new Map();
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    /**
     * Initialize the module service
     */
    async initialize() {
        Logger.info('🔧 Initializing Module Service...', {
            operation: 'module_service_init'
        });
        // Initialize cache manager
        await this.cacheManager.initialize();
        Logger.info('✅ Module Service initialized', {
            operation: 'module_service_init'
        });
    }
    /**
     * Setup framework and create decentralized path handler
     */
    async setupFramework(genome, pathHandler) {
        try {
            // 1. Identify framework module
            const frameworkModule = genome.modules.find(m => m.id.startsWith('framework/'));
            if (!frameworkModule) {
                const error = ErrorHandler.createError('No framework module found in recipe. Framework adapter is required.', { operation: 'framework_setup' }, ErrorCode.CONFIG_VALIDATION_ERROR, false);
                return { success: false, error: error.error };
            }
            Logger.info(`🏗️ Loading framework adapter: ${frameworkModule.id}`, {
                operation: 'framework_setup'
            });
            // 2. Load framework adapter
            const adapterId = frameworkModule.id.split('/').pop() || frameworkModule.id;
            const frameworkAdapter = await this.loadAdapter('framework', adapterId);
            if (!frameworkAdapter) {
                return {
                    success: false,
                    error: `Failed to load framework adapter: ${frameworkModule.id}`
                };
            }
            // 3. Create path service with framework configuration
            const pathService = new PathService(pathHandler.getProjectRoot(), pathHandler.getProjectName(), frameworkAdapter.config);
            Logger.info('📁 Framework paths configured', {
                operation: 'framework_setup',
                availablePaths: pathService.getAvailablePaths()
            });
            // 4. Execute framework blueprint to create initial project structure
            Logger.info('🏗️ Executing framework blueprint to create initial project structure', {
                operation: 'framework_setup'
            });
            const { BlueprintExecutor } = await import('../execution/blueprint/blueprint-executor.js');
            const { VirtualFileSystem } = await import('../file-system/file-engine/virtual-file-system.js');
            // Create project context for framework execution
            const projectContext = {
                project: genome.project,
                module: frameworkModule,
                framework: genome.project.framework,
                pathHandler: pathService
            };
            // Create VFS for framework execution
            const frameworkVFS = new VirtualFileSystem(`framework-${frameworkAdapter.blueprint.id}`, pathService.getProjectRoot());
            // Execute framework blueprint
            const blueprintExecutor = new BlueprintExecutor(pathService.getProjectRoot());
            const frameworkResult = await blueprintExecutor.executeBlueprint(frameworkAdapter.blueprint, projectContext, frameworkVFS);
            if (!frameworkResult.success) {
                return {
                    success: false,
                    error: `Framework blueprint execution failed: ${frameworkResult.errors?.join(', ') || 'Unknown error'}`
                };
            }
            // Flush VFS to disk to create initial project files
            await frameworkVFS.flushToDisk();
            Logger.info('✅ Framework setup completed - initial project structure created', {
                operation: 'framework_setup'
            });
            return {
                success: true,
                pathHandler: pathService
            };
        }
        catch (error) {
            const errorResult = ErrorHandler.handleAgentError(error, 'framework', 'setup');
            return {
                success: false,
                error: errorResult.error
            };
        }
    }
    /**
     * Load module (adapter or integration) based on convention
     */
    async loadModuleAdapter(module) {
        try {
            // Use dumb path translation - no intelligence needed
            const translatedPath = await PathService.resolveModuleId(module.id);
            // Try to load as any module type - completely dumb approach
            let moduleData = null;
            // Try loading based on path prefix first (more efficient)
            if (translatedPath.startsWith('features/')) {
                try {
                    const featureName = translatedPath.replace('features/', '');
                    moduleData = await this.loadFeature(featureName);
                }
                catch {
                    // Fall through to try other types
                }
            }
            if (!moduleData) {
                // Try loading as integration (covers connectors)
                try {
                    moduleData = await this.loadIntegration(translatedPath);
                }
                catch {
                    // Try loading as adapter
                    try {
                        const adapterPath = translatedPath.replace('adapters/', '');
                        const [category, adapterId] = adapterPath.split('/');
                        if (category && adapterId) {
                            moduleData = await this.loadAdapter(category, adapterId);
                        }
                    }
                    catch {
                        // All attempts failed
                    }
                }
            }
            if (!moduleData) {
                return {
                    success: false,
                    error: `Failed to load module: ${module.id}. Tried all module types.`
                };
            }
            return {
                success: true,
                adapter: {
                    config: moduleData.config,
                    blueprint: moduleData.blueprint
                }
            };
        }
        catch (error) {
            const errorResult = ErrorHandler.handleAgentError(error, module.category || 'unknown', 'load_module');
            return {
                success: false,
                error: errorResult.error
            };
        }
    }
    /**
     * Create project context for module execution
     */
    async createProjectContext(genome, pathHandler, module) {
        try {
            // Convert modules array to Record<string, Module>
            const modulesRecord = {};
            const convertedModules = convertGenomeModulesToModules(genome.modules);
            convertedModules.forEach(mod => {
                modulesRecord[mod.id] = mod;
            });
            const context = await FrameworkContextService.createProjectContext(genome, module, pathHandler, modulesRecord);
            return {
                success: true,
                context
            };
        }
        catch (error) {
            const errorResult = ErrorHandler.handleAgentError(error, module.category || 'unknown', 'create_context');
            return {
                success: false,
                error: errorResult.error
            };
        }
    }
    /**
     * Load integration from marketplace
     */
    async loadIntegration(integrationPath) {
        const cacheKey = integrationPath;
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            // Load module config and blueprint using centralized services
            const integrationJson = await MarketplaceService.loadModuleConfig(integrationPath);
            const blueprint = await MarketplaceService.loadModuleBlueprint(integrationPath);
            const integration = {
                config: integrationJson,
                blueprint: blueprint
            };
            // Cache the result
            this.cache.set(cacheKey, integration);
            return integration;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            Logger.error(`Failed to load integration ${integrationPath}`, {
                operation: 'load_integration',
                error: errorMessage,
                stack: errorStack,
                integrationPath
            });
            console.error(`Detailed error for integration ${integrationPath}:`, error);
            return null;
        }
    }
    /**
     * Load adapter from marketplace
     */
    async loadAdapter(category, adapterId) {
        const cacheKey = `${category}/${adapterId}`;
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            const moduleId = `${category}/${adapterId}`;
            // Load module config and blueprint using centralized services
            const adapterJson = await MarketplaceService.loadModuleConfig(moduleId);
            const blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
            const adapter = {
                config: adapterJson,
                blueprint: blueprint
            };
            // Cache the result
            this.cache.set(cacheKey, adapter);
            return adapter;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            Logger.error(`Failed to load adapter ${cacheKey}`, {
                operation: 'load_adapter',
                error: errorMessage,
                stack: errorStack,
                category,
                adapterId
            });
            console.error(`Detailed error for ${cacheKey}:`, error);
            return null;
        }
    }
    /**
     * Load feature from marketplace
     * Handles both direct feature references and subdirectory structure
     */
    async loadFeature(featureName) {
        const cacheKey = `features/${featureName}`;
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            // Try different feature path patterns
            const possiblePaths = [
                `features/${featureName}`, // Direct feature reference (e.g., features/architech-welcome)
                `features/${featureName}/frontend/shadcn`, // Subdirectory structure (e.g., features/auth/frontend/shadcn)
                `features/${featureName}/shadcn`, // Alternative subdirectory structure
                `features/${featureName}/nextjs`, // Another alternative
            ];
            let featureJson = null;
            let blueprint = null;
            let successfulPath = null;
            // Try each possible path until one works
            for (const moduleId of possiblePaths) {
                try {
                    featureJson = await MarketplaceService.loadModuleConfig(moduleId);
                    blueprint = await MarketplaceService.loadModuleBlueprint(moduleId);
                    successfulPath = moduleId;
                    break;
                }
                catch {
                    // Continue trying next path
                    continue;
                }
            }
            if (!featureJson || !blueprint) {
                throw new Error(`Feature not found: ${featureName}. Tried paths: ${possiblePaths.join(', ')}`);
            }
            const feature = {
                config: featureJson,
                blueprint: blueprint,
                path: successfulPath
            };
            // Cache the result
            this.cache.set(cacheKey, feature);
            return feature;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            Logger.error(`Failed to load feature ${featureName}`, {
                operation: 'load_feature',
                error: errorMessage,
                stack: errorStack,
                featureName
            });
            console.error(`Detailed error for feature ${featureName}:`, error);
            return null;
        }
    }
    /**
     * Get cached adapter
     */
    getCachedAdapter(category, adapterId) {
        const cacheKey = `${category}/${adapterId}`;
        return this.cache.get(cacheKey);
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
//# sourceMappingURL=module-service.js.map
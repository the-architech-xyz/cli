/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */
import { MarketplaceService } from '../marketplace/marketplace-service.js';
import { ErrorHandler } from '../infrastructure/error/index.js';
import { FrameworkContextService } from '../project/framework-context-service.js';
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
     * Load module resources (config + blueprint) using module metadata
     */
    async loadModuleAdapter(module) {
        try {
            const cacheKey = module.id;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                return {
                    success: true,
                    adapter: cached
                };
            }
            const config = await MarketplaceService.loadModuleConfig(module);
            const blueprint = await MarketplaceService.loadModuleBlueprint(module);
            const adapter = {
                config,
                blueprint
            };
            this.cache.set(cacheKey, adapter);
            return {
                success: true,
                adapter
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
            // ResolvedGenome guarantees modules is always an array
            const modules = genome.modules;
            const modulesRecord = {};
            modules.forEach((mod) => {
                modulesRecord[mod.id] = mod;
            });
            const targetModule = modulesRecord[module.id] || module;
            const context = await FrameworkContextService.createProjectContext(genome, targetModule, pathHandler, modulesRecord);
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
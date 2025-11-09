/**
 * Unified Module Service
 *
 * Consolidates ModuleFetcherService, ModuleLoaderService, and AdapterLoader
 * into a single, cohesive service for module management
 */
import { convertGenomeModulesToModules } from './genome-module-converter.js';
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
            // Convert modules array to Record<string, Module>
            const modulesRecord = {};
            const moduleIndex = this.getModuleIndex(genome);
            const convertedModules = convertGenomeModulesToModules(genome.modules || []);
            convertedModules.forEach((mod) => {
                const resolvedModule = this.resolveModuleDefinition(mod.id, mod, moduleIndex);
                if (resolvedModule) {
                    modulesRecord[mod.id] = resolvedModule;
                }
            });
            const targetModule = this.resolveModuleDefinition(module.id, module, moduleIndex) || module;
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
    getModuleIndex(genome) {
        return genome?.metadata?.moduleIndex || null;
    }
    resolveModuleDefinition(moduleId, existingModule, moduleIndex, parametersOverride) {
        const metadata = moduleIndex ? moduleIndex[moduleId] : undefined;
        if (!existingModule && !metadata) {
            return null;
        }
        const resolved = {
            ...(existingModule || { id: moduleId, parameters: {} }),
            id: moduleId,
            category: existingModule?.category || metadata?.category || metadata?.type || 'module',
            parameters: {
                ...(existingModule?.parameters || {}),
                ...(parametersOverride || {})
            },
            parameterSchema: existingModule?.parameterSchema || metadata?.parameters,
            features: existingModule?.features || {},
            externalFiles: existingModule?.externalFiles || [],
            source: existingModule?.source || metadata?.source,
            manifest: existingModule?.manifest || metadata?.manifest,
            blueprint: existingModule?.blueprint || metadata?.blueprint,
            templates: existingModule?.templates && existingModule.templates.length > 0
                ? existingModule.templates
                : metadata?.templates || [],
            marketplace: existingModule?.marketplace || metadata?.marketplace,
            resolved: existingModule?.resolved || metadata?.resolved
        };
        return resolved;
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
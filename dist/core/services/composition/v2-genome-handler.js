/**
 * V2 Genome Handler
 *
 * Handles V2 genome resolution and conversion to execution format.
 * Bridges V2 Composition Engine with V1 OrchestratorAgent.
 */
import { isV2Genome } from '@thearchitech.xyz/types';
import { CompositionEngine } from './composition-engine.js';
export class V2GenomeHandler {
    compositionEngine;
    logger;
    constructor(marketplaceAdapters, logger, projectRoot) {
        this.logger = logger;
        this.compositionEngine = new CompositionEngine(marketplaceAdapters, logger, projectRoot);
    }
    /**
     * Check if a genome is V2 format
     */
    static isV2Genome(genome) {
        return isV2Genome(genome);
    }
    /**
     * Resolve V2 genome to lock file
     */
    async resolveGenome(genome, projectRoot, forceRegenerate = false) {
        this.logger.info('Resolving V2 genome using Composition Engine', {
            marketplaces: Object.keys(genome.marketplaces).length,
            packages: Object.keys(genome.packages).length,
            apps: Object.keys(genome.apps).length
        });
        return await this.compositionEngine.resolve(genome, projectRoot, forceRegenerate);
    }
    /**
     * Convert LockFile to ResolvedGenome format for OrchestratorAgent
     *
     * This is a bridge function to allow OrchestratorAgent to work with V2 lock files
     * while maintaining backward compatibility with V1 ResolvedGenome format.
     */
    async convertLockFileToResolvedGenome(lockFile, originalGenome) {
        const frameworkModulesInLockFile = lockFile.modules.filter(m => m.id.startsWith('adapters/framework/'));
        this.logger.info('Converting lock file to ResolvedGenome format', {
            moduleCount: lockFile.modules.length,
            executionPlanLength: lockFile.executionPlan.length,
            frameworkModulesInLockFile: frameworkModulesInLockFile.map(m => m.id),
            allModuleIds: lockFile.modules.map(m => m.id)
        });
        // Convert lock file modules to ResolvedGenome modules
        // We need to get the marketplace root for source.root
        // Resolve paths relative to the genome file location (which is where the project will be)
        const marketplaceRoots = new Map();
        for (const [marketplaceName, marketplaceConfig] of Object.entries(originalGenome.marketplaces)) {
            if (marketplaceConfig.type === 'local' && marketplaceConfig.path) {
                // Store the relative path - it will be resolved by the marketplace adapter
                // The path is relative to the genome file, but we store it as-is
                // The marketplace adapter will resolve it correctly
                marketplaceRoots.set(marketplaceName, marketplaceConfig.path);
            }
        }
        // Build module index first to get resolved paths
        // CRITICAL: Include ALL modules from lock file, including framework modules
        // Framework modules are needed for bootstrap even though they're later stripped from modules array
        const moduleIndex = this.buildModuleIndex(lockFile.modules, originalGenome, marketplaceRoots);
        this.logger.debug('Module index built', {
            totalModules: Object.keys(moduleIndex).length,
            frameworkModulesInIndex: Object.keys(moduleIndex).filter(id => id.includes('framework')),
            sampleModuleIds: Object.keys(moduleIndex).slice(0, 10)
        });
        // Resolve marketplace paths to absolute paths
        // We need to resolve relative paths from the genome file location
        const resolvedMarketplaceRoots = new Map();
        for (const [marketplaceName, marketplaceConfig] of Object.entries(originalGenome.marketplaces)) {
            if (marketplaceConfig.type === 'local' && marketplaceConfig.path) {
                // For now, store relative path - it will be resolved by MarketplaceRegistry
                // The actual resolution happens in MarketplaceService based on source.root
                resolvedMarketplaceRoots.set(marketplaceName, marketplaceConfig.path);
            }
        }
        // CRITICAL: Filter out framework modules from the modules array
        // Framework modules are handled during bootstrap phase, not in regular module execution
        // They're still in moduleIndex for bootstrap lookup, but shouldn't execute as regular modules
        const frameworkModulesForBootstrap = [];
        const regularModules = [];
        for (const lockModule of lockFile.modules) {
            const marketplaceRoot = resolvedMarketplaceRoots.get(lockModule.source.marketplace) || '';
            const metadata = moduleIndex[lockModule.id];
            // Resolve manifest and blueprint paths
            // If they're relative, they'll be resolved by MarketplaceService using source.root
            // If they're absolute, use as-is
            const manifestPath = metadata?.manifest?.file || '';
            const blueprintPath = metadata?.blueprint?.file || '';
            const module = {
                id: lockModule.id,
                version: lockModule.version,
                category: this.inferCategory(lockModule.id),
                parameters: {}, // Will be populated from original genome
                source: {
                    root: marketplaceRoot, // Marketplace root path (relative, will be resolved)
                    marketplace: lockModule.source.marketplace
                },
                manifest: metadata?.manifest,
                blueprint: metadata?.blueprint,
                templates: (metadata?.templates || []).map(t => typeof t === 'string' ? { file: t } : t),
                resolved: {
                    root: marketplaceRoot,
                    // Store relative paths - MarketplaceService will resolve them using source.root
                    manifest: manifestPath,
                    blueprint: blueprintPath,
                    templates: (metadata?.templates || []).map(t => typeof t === 'string' ? t : t.file)
                }
            };
            // Separate framework modules from regular modules
            if (lockModule.id.startsWith('adapters/framework/')) {
                frameworkModulesForBootstrap.push(module);
                this.logger.debug('Framework module filtered from execution plan (will be handled by bootstrap)', {
                    moduleId: lockModule.id
                });
            }
            else {
                regularModules.push(module);
            }
        }
        this.logger.info('Filtered modules for execution', {
            totalModules: lockFile.modules.length,
            frameworkModules: frameworkModulesForBootstrap.length,
            regularModules: regularModules.length,
            frameworkModuleIds: frameworkModulesForBootstrap.map(m => m.id)
        });
        const modules = regularModules; // Only regular modules go into execution plan
        // Get parameters from original genome packages
        for (const module of modules) {
            // Find which package this module came from
            const packageName = this.findPackageForModule(module.id, originalGenome);
            if (packageName && originalGenome.packages[packageName]?.parameters) {
                module.parameters = originalGenome.packages[packageName].parameters || {};
            }
        }
        // Build ResolvedGenome structure
        const apps = this.buildApps(originalGenome);
        // Filter execution plan to exclude framework modules
        const filteredExecutionPlan = lockFile.executionPlan.filter(moduleId => !moduleId.startsWith('adapters/framework/'));
        this.logger.debug('Filtered execution plan', {
            originalPlanLength: lockFile.executionPlan.length,
            filteredPlanLength: filteredExecutionPlan.length,
            removedFrameworkModules: lockFile.executionPlan.filter(id => id.startsWith('adapters/framework/'))
        });
        const resolvedGenome = {
            version: '2.0.0',
            project: {
                name: originalGenome.workspace.name,
                description: originalGenome.workspace.description,
                structure: this.inferStructure(originalGenome),
                monorepo: this.inferMonorepo(originalGenome),
                apps: apps.length > 0 ? apps : undefined
            },
            modules,
            metadata: {
                version: '2.0.0',
                resolvedAt: lockFile.resolvedAt,
                genomeHash: lockFile.genomeHash,
                executionPlan: filteredExecutionPlan, // Use filtered plan without framework modules
                marketplaces: lockFile.marketplaces,
                moduleIndex: moduleIndex,
                dependencies: lockFile.dependencies // NEW: Pass dependencies from lock file (optional property)
            }
        };
        this.logger.debug('Converted lock file to ResolvedGenome', {
            moduleCount: resolvedGenome.modules.length,
            appCount: resolvedGenome.project.apps ? resolvedGenome.project.apps.length : 0
        });
        return resolvedGenome;
    }
    /**
     * Infer category from module ID (e.g., 'adapters/auth/better-auth' -> 'adapters')
     */
    inferCategory(moduleId) {
        const parts = moduleId.split('/');
        if (parts[0] === 'adapters' || parts[0] === 'connectors' || parts[0] === 'features') {
            return parts[0];
        }
        return 'modules';
    }
    /**
     * Infer type from module ID
     */
    inferType(moduleId) {
        if (moduleId.startsWith('adapters/'))
            return 'adapter';
        if (moduleId.startsWith('connectors/'))
            return 'connector';
        if (moduleId.startsWith('features/'))
            return 'feature';
        return 'module';
    }
    /**
     * Find which package a module belongs to by searching recipe books
     */
    findPackageForModule(moduleId, genome) {
        // This is a simplified version - in practice, we'd need to search recipe books
        // For now, try to infer from module ID patterns
        const parts = moduleId.split('/');
        if (parts.length >= 2) {
            const category = parts[1]; // e.g., 'auth', 'ui', 'database'
            if (category && genome.packages[category]) {
                return category;
            }
        }
        return null;
    }
    /**
     * Infer project structure from V2 genome
     *
     * A monorepo is detected if:
     * - Multiple apps exist, OR
     * - Any app has a package path (e.g., 'apps/web', 'apps/api') indicating monorepo structure
     */
    inferStructure(genome) {
        // Multiple apps = definitely monorepo
        if (Object.keys(genome.apps).length > 1) {
            return 'monorepo';
        }
        // Single app: check if it has a package path (monorepo indicator)
        const apps = Object.values(genome.apps);
        if (apps.length > 0 && apps[0]) {
            const app = apps[0];
            // If app has a package path like 'apps/web' or 'apps/api', it's a monorepo
            if (app.package && (app.package.startsWith('apps/') || app.package.startsWith('packages/'))) {
                return 'monorepo';
            }
        }
        // Default to single-app
        return 'single-app';
    }
    /**
     * Infer monorepo configuration
     */
    inferMonorepo(genome) {
        if (Object.keys(genome.apps).length <= 1) {
            return undefined;
        }
        return {
            tool: 'turborepo', // Default to turborepo for V2 genomes
            packages: {
                // Map apps to package paths
                ...Object.fromEntries(Object.entries(genome.apps).map(([key, app]) => [key, app.package]))
            }
        };
    }
    /**
     * Build apps configuration from V2 genome
     *
     * Converts V2 genome apps (Record<string, AppConfig>) to FrameworkApp[] format
     * required by ResolvedGenome.
     */
    buildApps(genome) {
        return Object.entries(genome.apps).map(([id, config]) => {
            // AppConfig.type is required in V2, but handle gracefully if missing
            // Type assertion needed because TypeScript doesn't see the type property in the interface
            const appConfig = config;
            const appType = appConfig.type || this.inferAppType(config.framework, id);
            return {
                id, // V2 genome key is the app ID
                type: appType, // Use explicit type or infer from framework
                framework: config.framework || 'nextjs',
                package: config.package,
                parameters: config.parameters || {}
            };
        });
    }
    /**
     * Infer app type from framework or app ID
     */
    inferAppType(framework, appId) {
        // Check framework first
        if (framework === 'expo' || framework === 'react-native') {
            return 'mobile';
        }
        if (framework === 'hono' || framework === 'express' || framework === 'fastify') {
            return 'api';
        }
        if (framework === 'nextjs' || framework === 'remix' || framework === 'vite') {
            return 'web';
        }
        // Fallback to app ID pattern
        if (appId === 'mobile' || appId?.includes('mobile')) {
            return 'mobile';
        }
        if (appId === 'api' || appId?.includes('api')) {
            return 'api';
        }
        // Default to web
        return 'web';
    }
    /**
     * Build module index from lock file modules
     */
    buildModuleIndex(lockModules, originalGenome, marketplaceRoots) {
        const index = {};
        for (const lockModule of lockModules) {
            const marketplaceRoot = marketplaceRoots.get(lockModule.source.marketplace) || '';
            // Infer module file paths based on module ID pattern
            const parts = lockModule.id.split('/');
            let manifestFile = '';
            let blueprintFile = '';
            // Build paths relative to marketplace root
            // These will be resolved by MarketplaceService based on the source.root
            // All modules use schema.json (standardized naming)
            if (parts[0] === 'adapters') {
                manifestFile = `adapters/${parts[1]}/${parts[2]}/schema.json`;
                blueprintFile = `adapters/${parts[1]}/${parts[2]}/blueprint.ts`;
            }
            else if (parts[0] === 'connectors') {
                manifestFile = `connectors/${parts[1]}/${parts[2]}/schema.json`;
                blueprintFile = `connectors/${parts[1]}/${parts[2]}/blueprint.ts`;
            }
            else if (parts[0] === 'features') {
                // Features can have more parts: features/synap/capture/tech-stack
                if (parts.length >= 4) {
                    const featurePath = parts.slice(1, -1).join('/');
                    const layer = parts[parts.length - 1];
                    manifestFile = `features/${featurePath}/${layer}/schema.json`;
                    blueprintFile = `features/${featurePath}/${layer}/blueprint.ts`;
                }
                else {
                    manifestFile = `features/${parts[1]}/${parts[2]}/schema.json`;
                    blueprintFile = `features/${parts[1]}/${parts[2]}/blueprint.ts`;
                }
            }
            index[lockModule.id] = {
                id: lockModule.id,
                category: this.inferCategory(lockModule.id),
                type: this.inferType(lockModule.id),
                marketplace: { name: lockModule.source.marketplace },
                source: {
                    root: marketplaceRoot,
                    marketplace: lockModule.source.marketplace
                },
                manifest: { file: manifestFile },
                blueprint: { file: blueprintFile, runtime: 'source' },
                templates: [],
                parameters: {}
            };
        }
        return index;
    }
}
//# sourceMappingURL=v2-genome-handler.js.map
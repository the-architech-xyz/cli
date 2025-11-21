/**
 * Recipe Book Resolver
 *
 * Resolves module targetPackage and targetApps from recipe books.
 * This is the PRIMARY source of truth for module placement.
 *
 * Priority Order:
 * 1. User override (genome.moduleOverrides) - HIGHEST
 * 2. Genome module definition (genome.modules[].targetPackage)
 * 3. Recipe book (recipeModule.targetPackage) - PRIMARY SOURCE
 * 4. Recipe book package structure (packageStructure.directory)
 * 5. Generic fallback (no provider-specific logic)
 */
import { Logger } from '../infrastructure/logging/logger.js';
import { filterAppsByFramework, extractFrameworkRequirement } from '../../utils/framework-compatibility.js';
import { getProjectApps } from '../../utils/genome-helpers.js';
export class RecipeBookResolver {
    /**
     * Resolve targetPackage for a module using recipe books
     *
     * @param module - Module to resolve
     * @param genome - Genome with user overrides
     * @param recipeBooks - Map of marketplace name to recipe book
     * @returns Target package resolution with source information
     */
    static resolveTargetPackage(module, genome, recipeBooks) {
        // Check if genome defines monorepo structure
        // NOTE: During structure initialization, genome.project.monorepo may not be set yet,
        // but we can still resolve if structure === 'monorepo' (chicken-and-egg problem)
        const isMonorepo = genome.project.structure === 'monorepo';
        if (!isMonorepo) {
            return null;
        }
        // If monorepo config is not set yet (during structure initialization), create a minimal one
        let monorepoConfig = genome.project.monorepo;
        if (!monorepoConfig) {
            // Create minimal monorepo config for resolution purposes
            // This will be properly set by StructureInitializationLayer after package creation
            // Note: We can't mutate genome.project.monorepo directly, so we create a local config
            monorepoConfig = {
                tool: 'turborepo',
                packages: {}
            };
        }
        Logger.debug(`🔍 RecipeBookResolver: Resolving target package for module: ${module.id}`, {
            operation: 'recipe_book_resolution',
            moduleId: module.id,
            hasRecipeBooks: !!recipeBooks && recipeBooks.size > 0
        });
        // PRIORITY 1: Check user override (genome.moduleOverrides)
        const userOverride = this.getUserOverride(module.id, genome);
        if (userOverride) {
            Logger.debug(`✅ Using user override: ${userOverride.targetPackage}`, {
                operation: 'recipe_book_resolution',
                moduleId: module.id,
                source: 'user_override'
            });
            return userOverride;
        }
        // PRIORITY 2: Check genome module definition
        // Note: Module.config.targetPackage is the proper way to check, but module might have direct properties
        const genomeModule = this.findGenomeModule(module.id, genome);
        if (genomeModule) {
            // Check if module has targetPackage in config or directly
            const targetPackage = genomeModule.config?.targetPackage ||
                ('targetPackage' in genomeModule ? genomeModule.targetPackage : undefined);
            const targetApps = genomeModule.config?.targetApps ||
                ('targetApps' in genomeModule ? genomeModule.targetApps : undefined);
            if (targetPackage !== undefined) {
                Logger.debug(`✅ Using genome definition: ${targetPackage}`, {
                    operation: 'recipe_book_resolution',
                    moduleId: module.id,
                    source: 'genome_definition'
                });
                return {
                    targetPackage: targetPackage,
                    targetApps: targetApps,
                    source: 'genome_definition'
                };
            }
        }
        // PRIORITY 3: Check module metadata (if preserved during conversion)
        const moduleTargetPackage = module.config?.targetPackage ||
            ('targetPackage' in module ? module.targetPackage : undefined);
        const moduleTargetApps = module.config?.targetApps ||
            ('targetApps' in module ? module.targetApps : undefined);
        if (moduleTargetPackage !== undefined) {
            Logger.debug(`✅ Using module metadata: ${moduleTargetPackage}`, {
                operation: 'recipe_book_resolution',
                moduleId: module.id,
                source: 'genome_definition'
            });
            return {
                targetPackage: moduleTargetPackage,
                targetApps: moduleTargetApps,
                source: 'genome_definition'
            };
        }
        // PRIORITY 4: Recipe book lookup (PRIMARY SOURCE)
        if (recipeBooks && recipeBooks.size > 0) {
            console.log(`[RecipeBookResolver] Calling resolveFromRecipeBook() for ${module.id}`);
            const recipeResolution = this.resolveFromRecipeBook(module, recipeBooks, monorepoConfig, genome);
            console.log(`[RecipeBookResolver] resolveFromRecipeBook() returned:`, recipeResolution);
            if (recipeResolution && 'skip' in recipeResolution && recipeResolution.skip) {
                // Module was found but all apps were filtered out - skip entirely (no fallback)
                Logger.warn(`⏭️ Skipping module ${module.id} - found in recipe book but no compatible apps`, {
                    operation: 'recipe_book_resolution',
                    moduleId: module.id
                });
                return null; // Return null to skip module (don't fallback to generic)
            }
            else if (recipeResolution && !('skip' in recipeResolution)) {
                console.log(`[RecipeBookResolver] Returning recipe resolution:`, JSON.stringify(recipeResolution, null, 2));
                return recipeResolution;
            }
            else {
                console.log(`[RecipeBookResolver] Recipe resolution is null, falling back to generic`);
            }
        }
        // PRIORITY 5: Generic fallback (no provider-specific logic)
        const genericFallback = this.genericFallback(module, genome, monorepoConfig);
        if (genericFallback) {
            return genericFallback;
        }
        // No resolution found
        Logger.debug(`⚠️ No target package resolved for module: ${module.id}`, {
            operation: 'recipe_book_resolution',
            moduleId: module.id
        });
        return null;
    }
    /**
     * Check for user override in genome.moduleOverrides
     */
    static getUserOverride(moduleId, genome) {
        const monorepoConfig = genome.project.monorepo;
        if (!monorepoConfig) {
            return null;
        }
        // V2 COMPLIANCE: moduleOverrides is not part of MonorepoConfig type
        // This is an extended property that may be added dynamically
        // Check if it exists safely
        const moduleOverrides = 'moduleOverrides' in monorepoConfig
            ? monorepoConfig.moduleOverrides
            : undefined;
        if (!moduleOverrides || typeof moduleOverrides !== 'object') {
            return null;
        }
        const override = moduleOverrides[moduleId];
        if (!override) {
            return null;
        }
        return {
            targetPackage: override.targetPackage ?? null,
            targetApps: override.targetApps,
            source: 'user_override'
        };
    }
    /**
     * Find module in genome.modules array
     */
    static findGenomeModule(moduleId, genome) {
        if (!genome.modules) {
            return null;
        }
        for (const module of genome.modules) {
            // genome.modules is Module[], so module is always a Module object
            if (module.id === moduleId) {
                return module;
            }
        }
        return null;
    }
    /**
     * Resolve from recipe book (PRIMARY SOURCE)
     *
     * Searches all recipe books for the module and uses targetPackage from recipe
     *
     * Returns:
     * - TargetPackageResolution if module found and has valid execution context
     * - null if module not found in recipe book (fallback to generic)
     * - { skip: true } if module found but all apps filtered out (skip entirely)
     */
    static resolveFromRecipeBook(module, recipeBooks, monorepoConfig, genome) {
        const moduleId = module.id;
        console.log(`[RecipeBookResolver] Searching recipe books for module: ${moduleId}`);
        console.log(`[RecipeBookResolver] Recipe books count: ${recipeBooks.size}`);
        // Search all recipe books for this module
        // Use Array.from() to avoid iteration issues
        for (const [marketplaceName, recipeBook] of Array.from(recipeBooks.entries())) {
            console.log(`[RecipeBookResolver] Searching in marketplace: ${marketplaceName}`);
            console.log(`[RecipeBookResolver] Packages in recipe book:`, Object.keys(recipeBook.packages || {}));
            for (const [packageName, packageRecipe] of Object.entries(recipeBook.packages)) {
                // Type assertion for packageRecipe
                const typedPackageRecipe = packageRecipe;
                if (!typedPackageRecipe.providers) {
                    continue;
                }
                console.log(`[RecipeBookResolver] Checking package: ${packageName}, providers:`, Object.keys(typedPackageRecipe.providers));
                for (const [providerName, providerRecipe] of Object.entries(typedPackageRecipe.providers)) {
                    // Type assertion for providerRecipe
                    const typedProviderRecipe = providerRecipe;
                    if (!typedProviderRecipe.modules || !Array.isArray(typedProviderRecipe.modules)) {
                        continue;
                    }
                    console.log(`[RecipeBookResolver] Checking provider: ${providerName}, modules:`, typedProviderRecipe.modules.map((m) => m.id));
                    // Search modules in this provider recipe
                    for (const recipeModule of typedProviderRecipe.modules) {
                        const typedRecipeModule = recipeModule;
                        console.log(`[RecipeBookResolver] Comparing: ${typedRecipeModule.id} === ${moduleId}?`, typedRecipeModule.id === moduleId);
                        if (typedRecipeModule.id === moduleId) {
                            // Found module in recipe book!
                            console.log(`[RecipeBookResolver] ✅ Found module ${moduleId} in recipe book!`);
                            let targetPackage = typedRecipeModule.targetPackage;
                            let targetApps = typedRecipeModule.targetApps;
                            const requiredFramework = typedRecipeModule.requiredFramework; // Framework requirement from recipe book
                            const requiredAppTypes = typedRecipeModule.requiredAppTypes; // App type requirements from recipe book
                            // SPECIAL HANDLING: Framework adapters should target apps using that framework
                            // Framework adapters have IDs like: adapters/framework/nextjs, adapters/framework/expo, etc.
                            if (moduleId.startsWith('adapters/framework/') || moduleId.startsWith('framework/')) {
                                const frameworkName = moduleId.replace('adapters/framework/', '').replace('framework/', '');
                                console.log(`[RecipeBookResolver] Framework adapter detected: ${frameworkName}`);
                                // Find all apps using this framework
                                const apps = getProjectApps(genome);
                                const frameworkApps = apps
                                    .filter((app) => app?.framework === frameworkName)
                                    .map(app => app.id);
                                if (frameworkApps.length > 0) {
                                    targetApps = frameworkApps;
                                    targetPackage = null; // Framework adapters don't go in packages
                                    console.log(`[RecipeBookResolver] Framework adapter will target apps: ${frameworkApps.join(', ')}`);
                                }
                                else {
                                    Logger.warn(`⚠️ Framework adapter ${moduleId} found but no apps use framework ${frameworkName}`, {
                                        operation: 'recipe_book_resolution',
                                        moduleId,
                                        frameworkName
                                    });
                                }
                            }
                            console.log(`[RecipeBookResolver] targetPackage from recipe: ${targetPackage}`);
                            console.log(`[RecipeBookResolver] targetApps from recipe: ${targetApps}`);
                            console.log(`[RecipeBookResolver] monorepoConfig.packages:`, monorepoConfig.packages);
                            console.log(`[RecipeBookResolver] packageStructure.directory:`, typedPackageRecipe.packageStructure?.directory);
                            // If targetPackage is a package name (not path), resolve to actual path
                            let resolvedPackage = null;
                            if (targetPackage !== null && targetPackage !== undefined) {
                                // Check if it's a package name (e.g., "auth") or a path (e.g., "packages/auth")
                                if (targetPackage.includes('/')) {
                                    // It's already a path
                                    resolvedPackage = targetPackage;
                                    console.log(`[RecipeBookResolver] targetPackage is already a path: ${resolvedPackage}`);
                                }
                                else {
                                    // It's a package name, resolve to path using monorepo config or packageStructure
                                    const packagePath = monorepoConfig.packages?.[targetPackage];
                                    console.log(`[RecipeBookResolver] packagePath from monorepoConfig: ${packagePath}`);
                                    if (packagePath) {
                                        resolvedPackage = packagePath;
                                        console.log(`[RecipeBookResolver] Using packagePath from monorepoConfig: ${resolvedPackage}`);
                                    }
                                    else if (typedPackageRecipe.packageStructure?.directory) {
                                        resolvedPackage = typedPackageRecipe.packageStructure.directory;
                                        console.log(`[RecipeBookResolver] Using packageStructure.directory: ${resolvedPackage}`);
                                    }
                                    else {
                                        // Fallback: construct path from package name
                                        resolvedPackage = `packages/${targetPackage}`;
                                        console.log(`[RecipeBookResolver] Using fallback path: ${resolvedPackage}`);
                                    }
                                }
                            }
                            else {
                                console.log(`[RecipeBookResolver] targetPackage is null/undefined`);
                            }
                            console.log(`[RecipeBookResolver] Final resolvedPackage: ${resolvedPackage}`);
                            // Filter targetApps by framework and app type compatibility
                            // Use recipe book metadata if available, otherwise extract from module
                            let filteredTargetApps = targetApps;
                            if (targetApps && targetApps.length > 0) {
                                // Use recipe book framework requirement (metadata-driven, PRIMARY SOURCE)
                                // If not in recipe book, extract from module config (already loaded)
                                // Use recipe book framework requirement (PRIMARY SOURCE), or extract from module
                                const frameworkRequirement = requiredFramework || extractFrameworkRequirement(module);
                                // Use recipe book app type requirements (metadata-driven, PRIMARY SOURCE)
                                filteredTargetApps = filterAppsByFramework(targetApps, module, genome, frameworkRequirement, requiredAppTypes);
                                if (filteredTargetApps.length === 0) {
                                    Logger.warn(`⚠️ No compatible apps found for module ${moduleId} ` +
                                        `(required framework: ${frameworkRequirement || 'none'}, ` +
                                        `required app types: ${requiredAppTypes?.join(', ') || 'any'})`, {
                                        operation: 'recipe_book_resolution',
                                        moduleId,
                                        originalTargetApps: targetApps,
                                        requiredFramework: frameworkRequirement,
                                        requiredAppTypes: requiredAppTypes,
                                        source: 'recipe_book'
                                    });
                                    // If module explicitly targets apps (targetApps is not null/undefined),
                                    // and all apps are filtered out, skip the module entirely.
                                    // This prevents app-specific modules (like connectors) from executing
                                    // in package context with invalid path keys.
                                    if (targetApps && targetApps.length > 0) {
                                        // Module explicitly targets apps, but none are compatible - skip it
                                        Logger.warn(`⏭️ Skipping module ${moduleId} - explicitly targets apps but none are compatible`, {
                                            operation: 'recipe_book_resolution',
                                            moduleId,
                                            originalTargetApps: targetApps,
                                            requiredFramework: frameworkRequirement,
                                            requiredAppTypes: requiredAppTypes
                                        });
                                        return { skip: true }; // Special value to indicate skip (not fallback)
                                    }
                                    // Module doesn't explicitly target apps, so fallback to package if available
                                    if (resolvedPackage) {
                                        Logger.info(`📦 Falling back to package execution for module ${moduleId} (no compatible apps, but has package)`, {
                                            operation: 'recipe_book_resolution',
                                            moduleId,
                                            targetPackage: resolvedPackage
                                        });
                                        return {
                                            targetPackage: resolvedPackage,
                                            targetApps: undefined,
                                            requiredFramework: requiredFramework,
                                            requiredAppTypes: requiredAppTypes,
                                            source: 'recipe_book'
                                        };
                                    }
                                    // No compatible apps AND no package = skip module
                                    Logger.warn(`⏭️ Skipping module ${moduleId} - no compatible apps and no package target`, {
                                        operation: 'recipe_book_resolution',
                                        moduleId,
                                        originalTargetApps: targetApps,
                                        requiredFramework: frameworkRequirement,
                                        requiredAppTypes: requiredAppTypes
                                    });
                                    return null;
                                }
                                if (filteredTargetApps.length < targetApps.length) {
                                    Logger.info(`🔒 Framework compatibility filter: ${targetApps.length} → ${filteredTargetApps.length} compatible apps`, {
                                        operation: 'recipe_book_resolution',
                                        moduleId,
                                        originalTargetApps: targetApps,
                                        filteredTargetApps,
                                        source: 'recipe_book'
                                    });
                                }
                            }
                            console.log(`[RecipeBookResolver] Returning resolution:`, {
                                targetPackage: resolvedPackage,
                                targetApps: filteredTargetApps,
                                source: 'recipe_book'
                            });
                            Logger.debug(`✅ Found module in recipe book: ${moduleId} → ${resolvedPackage}`, {
                                operation: 'recipe_book_resolution',
                                moduleId,
                                marketplace: marketplaceName,
                                package: packageName,
                                provider: providerName,
                                targetPackage: resolvedPackage,
                                targetApps: filteredTargetApps,
                                source: 'recipe_book'
                            });
                            const resolution = {
                                targetPackage: resolvedPackage,
                                targetApps: filteredTargetApps,
                                requiredFramework: requiredFramework, // Include in resolution for validation layer
                                requiredAppTypes: requiredAppTypes, // Include in resolution for validation layer
                                source: 'recipe_book'
                            };
                            console.log(`[RecipeBookResolver] Resolution object:`, JSON.stringify(resolution, null, 2));
                            return resolution;
                        }
                    }
                }
            }
        }
        return null;
    }
    /**
     * Generic fallback (NO provider-specific logic)
     *
     * Only uses generic patterns like:
     * - Module ID structure (adapters/, connectors/, features/)
     * - Layer inference (frontend, backend, tech-stack, database)
     * - App type detection
     *
     * NO provider names (better-auth, drizzle, etc.)
     * NO package-specific logic (auth, db, ui)
     */
    static genericFallback(module, genome, monorepoConfig) {
        const moduleId = module.id.toLowerCase();
        // V2 COMPLIANCE: Get apps from genome.project.apps (FrameworkApp[])
        const apps = {};
        if (genome.project.apps) {
            for (const app of genome.project.apps) {
                apps[app.id] = app;
            }
        }
        // Generic module type detection (no provider names)
        const moduleType = this.getGenericModuleType(moduleId);
        const moduleLayer = this.inferGenericLayer(moduleId);
        // Generic category detection (based on module ID structure only)
        const category = this.inferGenericCategory(moduleId);
        // Layer-based inference
        // V2 COMPLIANCE: tech-stack modules go to their capability package, not packages/shared
        if (moduleLayer === 'tech-stack') {
            // Try to infer capability from module ID (e.g., "features/auth/tech-stack" → "auth")
            const moduleIdParts = moduleId.split('/');
            if (moduleIdParts.length >= 2 && moduleIdParts[0] === 'features') {
                const capability = moduleIdParts[1]; // e.g., "auth", "payments"
                if (capability && monorepoConfig.packages) {
                    const capabilityPackage = monorepoConfig.packages[capability];
                    if (capabilityPackage) {
                        return {
                            targetPackage: capabilityPackage,
                            source: 'generic_fallback'
                        };
                    }
                }
            }
            // Fallback: return null (let recipe book or explicit config handle it)
            Logger.warn(`Cannot determine target package for tech-stack module: ${moduleId}`, {
                moduleId
            });
            return null;
        }
        if (moduleLayer === 'database') {
            // Generic: any database module goes to database package
            // Standardize on 'database' (not 'db') to avoid conflicts
            const dbPackage = monorepoConfig.packages?.database ||
                monorepoConfig.packages?.db ||
                'packages/database';
            return {
                targetPackage: dbPackage,
                source: 'generic_fallback'
            };
        }
        // Category-based inference (generic patterns only)
        if (category === 'ui' && moduleType === 'adapter') {
            // UI adapters → UI package (generic)
            const uiPackage = monorepoConfig.packages?.ui || 'packages/ui';
            return {
                targetPackage: uiPackage,
                source: 'generic_fallback'
            };
        }
        // Module type + layer inference
        if (moduleLayer === 'frontend' && moduleType === 'feature') {
            // Frontend features → check if multiple apps
            const frontendApps = Object.keys(apps).filter((appId) => {
                const app = apps[appId];
                return app?.framework === 'nextjs' || app?.framework === 'expo';
            });
            // V2 COMPLIANCE: Frontend features with multiple apps should target each app, not packages/shared
            // For now, target the first frontend app (can be enhanced to support multiple targets)
            if (frontendApps.length > 1 && frontendApps[0]) {
                const firstAppId = frontendApps[0];
                const firstApp = apps[firstAppId];
                if (firstApp && firstApp.package) {
                    return {
                        targetPackage: firstApp.package,
                        source: 'generic_fallback'
                    };
                }
            }
            // Single frontend app → find web app
            const webApp = Object.values(apps).find((app) => app?.framework === 'nextjs');
            if (webApp && webApp.package) {
                return {
                    targetPackage: webApp.package,
                    source: 'generic_fallback'
                };
            }
        }
        if (moduleLayer === 'backend' && moduleType === 'feature') {
            // Backend features → find API app
            const apiApp = Object.values(apps).find((app) => app?.framework === 'hono' || app?.framework === 'express');
            if (apiApp && apiApp.package) {
                return {
                    targetPackage: apiApp.package,
                    source: 'generic_fallback'
                };
            }
        }
        // V2 COMPLIANCE: No default to packages/shared
        // If we can't determine target, return null (let recipe book or explicit config handle it)
        Logger.warn(`Cannot determine target package for module: ${moduleId}. No fallback available.`, {
            moduleId,
            moduleLayer,
            moduleType,
            category
        });
        return null;
    }
    /**
     * Get generic module type (no provider names)
     */
    static getGenericModuleType(moduleId) {
        if (moduleId.startsWith('adapters/'))
            return 'adapter';
        if (moduleId.startsWith('connectors/'))
            return 'connector';
        if (moduleId.startsWith('features/'))
            return 'feature';
        if (moduleId.startsWith('framework/') || moduleId.includes('/framework/'))
            return 'framework';
        return null;
    }
    /**
     * Infer generic layer (no provider names)
     */
    static inferGenericLayer(moduleId) {
        if (moduleId.includes('/frontend') || moduleId.includes('/ui/'))
            return 'frontend';
        if (moduleId.includes('/backend') || moduleId.includes('/api/'))
            return 'backend';
        if (moduleId.includes('/tech-stack') || moduleId.includes('/techstack'))
            return 'tech-stack';
        if (moduleId.includes('/database') || moduleId.includes('/db/'))
            return 'database';
        return null;
    }
    /**
     * Infer generic category (based on module ID structure only, no provider names)
     */
    static inferGenericCategory(moduleId) {
        // Only use generic patterns from module ID structure
        if (moduleId.includes('ui/') || moduleId.includes('/ui/'))
            return 'ui';
        if (moduleId.includes('database/') || moduleId.includes('db/'))
            return 'database';
        if (moduleId.includes('auth/'))
            return 'auth';
        if (moduleId.includes('payment/'))
            return 'payment';
        if (moduleId.includes('email/'))
            return 'email';
        return 'other';
    }
}
//# sourceMappingURL=recipe-book-resolver.js.map
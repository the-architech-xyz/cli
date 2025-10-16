/**
 * Dependency Resolver Service
 *
 * Resolves module dependencies and creates execution order:
 * - Implicit dependencies (category-based hierarchy)
 * - Explicit dependencies (prerequisites in adapter.json)
 * - Conflict detection between modules
 * - Execution order optimization
 */
export class DependencyResolver {
    moduleService;
    constructor(moduleService) {
        this.moduleService = moduleService;
    }
    /**
     * Resolve dependencies and create execution order
     */
    async resolveDependencies(modules) {
        const errors = [];
        const warnings = [];
        const dependencyGraph = new Map();
        try {
            console.log(`🔍 Resolving dependencies for ${modules.length} modules`);
            // Step 1: Build dependency graph
            for (const module of modules) {
                const dependencies = await this.getModuleDependencies(module);
                dependencyGraph.set(module.id, dependencies);
                console.log(`  📋 Module ${module.id} depends on: [${dependencies.join(', ')}]`);
            }
            // Step 2: Check for circular dependencies
            const circularDeps = this.detectCircularDependencies(dependencyGraph);
            if (circularDeps.length > 0) {
                errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
                return { valid: false, errors, warnings, executionOrder: [], dependencyGraph };
            }
            // Step 3: Check for missing dependencies
            const missingDeps = this.detectMissingDependencies(modules, dependencyGraph);
            if (missingDeps.length > 0) {
                errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
                return { valid: false, errors, warnings, executionOrder: [], dependencyGraph };
            }
            // Step 4: Detect conflicts
            const conflicts = this.detectConflicts(modules);
            if (conflicts.length > 0) {
                warnings.push(`Potential conflicts detected: ${conflicts.join(', ')}`);
            }
            // Step 5: Create execution order
            const executionOrder = this.createExecutionOrder(modules, dependencyGraph);
            console.log(`  ✅ Execution order: ${executionOrder.map(m => m.id).join(' → ')}`);
            return {
                valid: true,
                errors,
                warnings,
                executionOrder,
                dependencyGraph
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown dependency resolution error';
            return {
                valid: false,
                errors: [`Dependency resolution failed: ${errorMessage}`],
                warnings,
                executionOrder: [],
                dependencyGraph
            };
        }
    }
    /**
     * Get dependencies for a module (implicit + explicit)
     */
    async getModuleDependencies(module) {
        const dependencies = [];
        // Implicit dependencies (category-based hierarchy)
        const implicitDeps = this.getImplicitDependencies(module);
        dependencies.push(...implicitDeps);
        // Explicit dependencies (from adapter.json)
        try {
            const adapterResult = await this.moduleService.loadModuleAdapter(module);
            if (adapterResult.success && adapterResult.adapter?.config?.prerequisites) {
                const prerequisites = adapterResult.adapter.config.prerequisites;
                const explicitDeps = prerequisites.modules || [];
                dependencies.push(...explicitDeps);
            }
        }
        catch (error) {
            // Ignore errors when loading adapter for dependencies
            console.warn(`  ⚠️ Could not load dependencies for ${module.id}: ${error}`);
        }
        return [...new Set(dependencies)]; // Remove duplicates
    }
    /**
     * Get implicit dependencies based on category hierarchy
     */
    getImplicitDependencies(module) {
        const dependencies = [];
        // Framework modules have no implicit dependencies
        if (module.category === 'framework') {
            return dependencies;
        }
        // All other modules depend on framework
        // This will be resolved by finding the framework module in the execution order
        // Integrators depend on their required adapters
        if (module.category === 'integrator') {
            // This will be handled by explicit dependencies
        }
        return dependencies;
    }
    /**
     * Detect circular dependencies
     */
    detectCircularDependencies(dependencyGraph) {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (moduleId, path) => {
            if (recursionStack.has(moduleId)) {
                const cycleStart = path.indexOf(moduleId);
                const cycle = path.slice(cycleStart).concat(moduleId);
                circularDeps.push(cycle.join(' → '));
                return;
            }
            if (visited.has(moduleId)) {
                return;
            }
            visited.add(moduleId);
            recursionStack.add(moduleId);
            const dependencies = dependencyGraph.get(moduleId) || [];
            for (const dep of dependencies) {
                dfs(dep, [...path, moduleId]);
            }
            recursionStack.delete(moduleId);
        };
        for (const moduleId of dependencyGraph.keys()) {
            if (!visited.has(moduleId)) {
                dfs(moduleId, []);
            }
        }
        return circularDeps;
    }
    /**
     * Detect missing dependencies
     */
    detectMissingDependencies(modules, dependencyGraph) {
        const missingDeps = [];
        const moduleIds = new Set(modules.map(m => m.id));
        for (const [moduleId, dependencies] of dependencyGraph.entries()) {
            for (const dep of dependencies) {
                if (!moduleIds.has(dep)) {
                    missingDeps.push(`${moduleId} requires ${dep}`);
                }
            }
        }
        return missingDeps;
    }
    /**
     * Detect potential conflicts between modules
     */
    detectConflicts(modules) {
        const conflicts = [];
        // Check for duplicate modules
        const moduleIds = new Map();
        for (const module of modules) {
            const count = moduleIds.get(module.id) || 0;
            moduleIds.set(module.id, count + 1);
        }
        for (const [moduleId, count] of moduleIds.entries()) {
            if (count > 1) {
                conflicts.push(`Module ${moduleId} is specified ${count} times`);
            }
        }
        // Check for conflicting categories
        const categoryModules = new Map();
        for (const module of modules) {
            const category = module.category || 'unknown';
            const modulesInCategory = categoryModules.get(category) || [];
            modulesInCategory.push(module.id);
            categoryModules.set(category, modulesInCategory);
        }
        // Some categories should only have one module
        const singleModuleCategories = ['framework'];
        for (const category of singleModuleCategories) {
            const modulesInCategory = categoryModules.get(category) || [];
            if (modulesInCategory.length > 1) {
                conflicts.push(`Category ${category} should only have one module, found: ${modulesInCategory.join(', ')}`);
            }
        }
        return conflicts;
    }
    /**
     * Create execution order using topological sort
     */
    createExecutionOrder(modules, dependencyGraph) {
        const executionOrder = [];
        const visited = new Set();
        const moduleMap = new Map(modules.map(m => [m.id, m]));
        // First, add framework modules (they have no dependencies)
        const frameworkModules = modules.filter(m => m.category === 'framework');
        for (const module of frameworkModules) {
            executionOrder.push(module);
            visited.add(module.id);
        }
        // Then add other modules in dependency order
        const remainingModules = modules.filter(m => m.category !== 'framework');
        while (remainingModules.length > 0) {
            let addedAny = false;
            for (let i = remainingModules.length - 1; i >= 0; i--) {
                const module = remainingModules[i];
                if (!module)
                    continue;
                const dependencies = dependencyGraph.get(module.id) || [];
                // Check if all dependencies are satisfied
                const allDepsSatisfied = dependencies.every(dep => visited.has(dep));
                if (allDepsSatisfied) {
                    executionOrder.push(module);
                    visited.add(module.id);
                    remainingModules.splice(i, 1);
                    addedAny = true;
                }
            }
            if (!addedAny && remainingModules.length > 0) {
                // This shouldn't happen if we validated dependencies properly
                console.warn(`  ⚠️ Could not resolve execution order for remaining modules: ${remainingModules.map(m => m.id).join(', ')}`);
                break;
            }
        }
        return executionOrder;
    }
}
//# sourceMappingURL=dependency-resolver.js.map
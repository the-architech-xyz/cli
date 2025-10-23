/**
 * Dependency Graph Service
 *
 * Builds and manages a Directed Acyclic Graph (DAG) representing module dependencies.
 * Handles circular dependency detection and provides graph traversal capabilities.
 */
export class DependencyGraph {
    moduleService;
    graph = new Map();
    circularDependencies = [];
    constructor(moduleService) {
        this.moduleService = moduleService;
    }
    /**
     * Build dependency graph from validated modules
     */
    async buildGraph(modules) {
        console.log(`🔍 Building dependency graph for ${modules.length} modules`);
        const errors = [];
        const warnings = [];
        try {
            // Initialize graph nodes
            for (const module of modules) {
                this.graph.set(module.id, {
                    module,
                    dependencies: [],
                    dependents: [],
                    inDegree: 0,
                    outDegree: 0
                });
            }
            // Build dependency relationships
            for (const module of modules) {
                const dependencies = await this.getModuleDependencies(module);
                const node = this.graph.get(module.id);
                if (!node) {
                    errors.push(`Module ${module.id} not found in graph`);
                    continue;
                }
                node.dependencies = dependencies;
                // Update dependent relationships
                for (const depId of dependencies) {
                    const depNode = this.graph.get(depId);
                    if (depNode) {
                        depNode.dependents.push(module.id);
                    }
                    else {
                        warnings.push(`Dependency ${depId} not found in module list for ${module.id}`);
                    }
                }
            }
            // Calculate degrees
            this.calculateDegrees();
            // Detect circular dependencies
            const circularDeps = this.detectCircularDependencies();
            if (circularDeps.length > 0) {
                errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
                return { success: false, graph: this.graph, errors, warnings };
            }
            // Validate all dependencies exist
            const missingDeps = this.validateDependencies(modules);
            if (missingDeps.length > 0) {
                errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
                return { success: false, graph: this.graph, errors, warnings };
            }
            console.log(`✅ Dependency graph built successfully`);
            console.log(`  📊 Nodes: ${this.graph.size}`);
            console.log(`  🔗 Total dependencies: ${Array.from(this.graph.values()).reduce((sum, node) => sum + node.dependencies.length, 0)}`);
            return {
                success: true,
                graph: this.graph,
                errors,
                warnings
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Failed to build dependency graph: ${errorMessage}`);
            return {
                success: false,
                graph: this.graph,
                errors: [`Dependency graph build failed: ${errorMessage}`],
                warnings
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
            const adapterId = module.id.split('/').pop() || module.id;
            const adapterResult = await this.moduleService.loadModuleAdapter(module);
            if (adapterResult.success && adapterResult.adapter?.config?.prerequisites) {
                const prerequisites = adapterResult.adapter.config.prerequisites;
                const explicitDeps = prerequisites.modules || [];
                dependencies.push(...explicitDeps);
            }
        }
        catch (error) {
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
        // All other modules implicitly depend on framework
        // This will be resolved by finding framework modules in the execution plan
        return dependencies;
    }
    /**
     * Calculate in-degree and out-degree for each node
     */
    calculateDegrees() {
        for (const [moduleId, node] of this.graph.entries()) {
            node.inDegree = node.dependents.length;
            node.outDegree = node.dependencies.length;
        }
    }
    /**
     * Detect circular dependencies using DFS
     */
    detectCircularDependencies() {
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
            const node = this.graph.get(moduleId);
            if (node) {
                for (const dep of node.dependencies) {
                    dfs(dep, [...path, moduleId]);
                }
            }
            recursionStack.delete(moduleId);
        };
        for (const moduleId of this.graph.keys()) {
            if (!visited.has(moduleId)) {
                dfs(moduleId, []);
            }
        }
        return circularDeps;
    }
    /**
     * Validate that all dependencies exist in the module list
     */
    validateDependencies(modules) {
        const missingDeps = [];
        const moduleIds = new Set(modules.map(m => m.id));
        for (const [moduleId, node] of this.graph.entries()) {
            for (const dep of node.dependencies) {
                // Try to find the dependency by mapping short names to full module IDs
                const mappedDep = this.mapShortNameToModuleId(dep, modules);
                if (!moduleIds.has(mappedDep)) {
                    missingDeps.push(`${moduleId} requires ${dep}`);
                }
            }
        }
        return missingDeps;
    }
    /**
     * Map short dependency names to full module IDs
     */
    mapShortNameToModuleId(shortName, modules) {
        // Common mappings for short names to full module IDs
        const shortNameMap = {
            'nextjs': 'framework/nextjs',
            'drizzle': 'database/drizzle',
            'better-auth': 'auth/better-auth',
            'shadcn-ui': 'ui/shadcn-ui',
            'tanstack-query': 'data-fetching/tanstack-query',
            'zustand': 'state/zustand',
            'vitest': 'testing/vitest',
            'eslint': 'core/golden-stack', // ESLint is now part of Golden Stack
            'prettier': 'core/golden-stack', // Prettier is now part of Golden Stack
            'forms': 'core/forms'
        };
        // If it's already a full module ID, return as-is
        if (shortName.includes('/')) {
            return shortName;
        }
        // Check if it's in our mapping
        if (shortNameMap[shortName]) {
            return shortNameMap[shortName];
        }
        // Try to find a module that ends with this short name
        const matchingModule = modules.find(m => m.id.endsWith(`/${shortName}`));
        if (matchingModule) {
            return matchingModule.id;
        }
        // Return the original short name if no mapping found
        return shortName;
    }
    /**
     * Get all nodes with no dependencies (root nodes)
     */
    getRootNodes() {
        return Array.from(this.graph.values()).filter(node => node.dependencies.length === 0);
    }
    /**
     * Get all nodes with no dependents (leaf nodes)
     */
    getLeafNodes() {
        return Array.from(this.graph.values()).filter(node => node.dependents.length === 0);
    }
    /**
     * Get direct dependencies of a module
     */
    getDependencies(moduleId) {
        const node = this.graph.get(moduleId);
        return node ? node.dependencies : [];
    }
    /**
     * Get direct dependents of a module
     */
    getDependents(moduleId) {
        const node = this.graph.get(moduleId);
        return node ? node.dependents : [];
    }
    /**
     * Get the entire graph
     */
    getGraph() {
        return this.graph;
    }
    /**
     * Get graph statistics
     */
    getStatistics() {
        const nodes = Array.from(this.graph.values());
        const totalDependencies = nodes.reduce((sum, node) => sum + node.dependencies.length, 0);
        const rootNodes = nodes.filter(node => node.dependencies.length === 0).length;
        const leafNodes = nodes.filter(node => node.dependents.length === 0).length;
        // Calculate max depth using BFS
        let maxDepth = 0;
        const visited = new Set();
        const queue = [];
        // Start from root nodes
        for (const node of nodes) {
            if (node.dependencies.length === 0) {
                queue.push({ moduleId: node.module.id, depth: 0 });
            }
        }
        while (queue.length > 0) {
            const { moduleId, depth } = queue.shift();
            if (visited.has(moduleId))
                continue;
            visited.add(moduleId);
            maxDepth = Math.max(maxDepth, depth);
            const node = this.graph.get(moduleId);
            if (node) {
                for (const dependent of node.dependents) {
                    queue.push({ moduleId: dependent, depth: depth + 1 });
                }
            }
        }
        return {
            totalNodes: this.graph.size,
            totalDependencies,
            rootNodes,
            leafNodes,
            maxDepth
        };
    }
}
//# sourceMappingURL=dependency-graph.js.map
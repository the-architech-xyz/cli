/**
 * High-Level Dependency Resolver
 * 
 * Intelligent dependency resolution system that can:
 * - Resolve capabilities to modules
 * - Handle transitive dependencies
 * - Detect conflicts and circular dependencies
 * - Generate optimal execution order
 */

import { 
  CapabilityRegistry, 
  ResolutionResult, 
  ResolvedModule, 
  ResolutionError, 
  ResolutionWarning,
  DependencyGraph,
  DependencyNode,
  ModuleConfig,
  ResolutionOptions,
  CapabilityResolution
} from '@thearchitech.xyz/types';
import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
import { Logger } from '../infrastructure/logging/logger.js';

export class HighLevelDependencyResolver {
  private capabilityRegistry: CapabilityRegistry = {};
  private moduleRegistry: Map<string, ModuleConfig> = new Map();
  private dependencyGraph: DependencyGraph = { nodes: new Map(), edges: new Map(), cycles: [] };
  private resolvedModules: ResolvedModule[] = [];
  private options: ResolutionOptions;

  constructor(
    private moduleService: ModuleService,
    options: Partial<ResolutionOptions> = {}
  ) {
    this.options = {
      failFast: true,
      maxDepth: 50,
      allowConflicts: false,
      strictMode: true,
      verbose: false,
      ...options
    };
  }

  /**
   * Main resolution method - resolves a genome to a complete execution plan
   */
  async resolveGenome(genome: Module[]): Promise<ResolutionResult> {
    Logger.info('🔍 Starting high-level dependency resolution');
    
    try {
      // 1. Initialize registries
      await this.initializeRegistries(genome);
      
      // 2. Recursive expansion
      const expandedModules = await this.recursiveExpansion(genome);
      
      // 3. Capability resolution
      const resolvedModules = await this.resolveCapabilities(expandedModules);
      
      // 4. Build dependency graph
      await this.buildDependencyGraph(resolvedModules);
      
      // 5. Detect cycles
      this.detectCycles();
      
      // 6. Topological sorting
      const executionOrder = this.topologicalSort();
      
      // 7. Detect conflicts
      const conflicts = this.detectConflicts(resolvedModules);
      
      // 8. Generate warnings
      const warnings = this.generateWarnings(resolvedModules);
      
      const result: ResolutionResult = {
        success: conflicts.length === 0,
        modules: resolvedModules,
        executionOrder,
        conflicts,
        warnings,
        capabilityRegistry: this.capabilityRegistry
      };

      if (this.options.verbose) {
        Logger.info('📊 Resolution complete:', {
          modules: resolvedModules.length,
          executionOrder: executionOrder.length,
          conflicts: conflicts.length,
          warnings: warnings.length
        });
      }

      return result;
      
    } catch (error) {
      Logger.error(`❌ Dependency resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Initialize capability and module registries
   */
  private async initializeRegistries(modules: Module[]): Promise<void> {
    Logger.info('📚 Initializing capability registry');
    
    this.capabilityRegistry = {};
    this.moduleRegistry.clear();
    
    // Add all modules to the registry
    for (const module of modules) {
      if (!module.config) {
        continue; // Skip modules without config
      }
      
      // Convert module.config to ModuleConfig format
      const moduleConfig: ModuleConfig = {
        id: module.config.id,
        category: module.config.category as 'framework' | 'adapter' | 'integrator' | 'feature',
        version: module.config.version,
        parameters: module.config.parameters || {},
        capabilities: module.config.capabilities || {},
        prerequisites: module.config.prerequisites || { modules: [], capabilities: [] },
        ...(module.config.provides && { provides: module.config.provides })
      };
      
      this.moduleRegistry.set(module.id, moduleConfig);
      
      // Build capability registry from module capabilities
      if (moduleConfig.capabilities) {
        for (const [capName, capDef] of Object.entries(moduleConfig.capabilities)) {
          if (!this.capabilityRegistry[capName]) {
            this.capabilityRegistry[capName] = {
              providers: [],
              consumers: [],
              conflicts: []
            };
          }
          this.capabilityRegistry[capName].providers.push({
            moduleId: module.id,
            capabilityVersion: capDef.version || '1.0.0',
            confidence: 100,
            metadata: {
              ...(capDef.description && { description: capDef.description }),
              ...(capDef.provides && { provides: capDef.provides })
            }
          });
        }
      }
    }
    
    Logger.info('✅ Capability registry initialized');
  }

  /**
   * Recursively expand modules to include all prerequisites
   */
  private async recursiveExpansion(modules: Module[]): Promise<Module[]> {
    Logger.info('🔄 Starting recursive expansion');
    
    const expandedModules = new Set<string>();
    const moduleQueue = [...modules];
    const resolvedModules: Module[] = [];
    let depth = 0;

    while (moduleQueue.length > 0 && depth < this.options.maxDepth) {
      const module = moduleQueue.shift()!;
      
      if (expandedModules.has(module.id)) {
        Logger.info(`⏭️ Skipping already expanded module: ${module.id}`);
        continue;
      }
      expandedModules.add(module.id);
      
      Logger.info(`🔍 Processing module ${module.id} (depth: ${depth})`);
      
      // Load module config
      const config = await this.loadModuleConfig(module.id);
      if (!config) {
        throw new Error(`Module config not found: ${module.id}`);
      }
      
      this.moduleRegistry.set(module.id, config);
      
      // Resolve prerequisites
      const prerequisites = await this.resolvePrerequisites(config);
      Logger.info(`📋 Module ${module.id} has ${prerequisites.length} prerequisites: [${prerequisites.map(p => p.id).join(', ')}]`);
      
      // Add prerequisite modules to queue
      for (const prereq of prerequisites) {
        if (!expandedModules.has(prereq.id)) {
          moduleQueue.push(prereq);
          Logger.info(`➕ Added prerequisite to queue: ${prereq.id}`);
        }
      }
      
      resolvedModules.push(module);
      depth++;
      
      Logger.info(`📊 Queue size: ${moduleQueue.length}, Resolved: ${resolvedModules.length}, Depth: ${depth}`);
    }

    if (depth >= this.options.maxDepth) {
      Logger.error(`❌ Maximum resolution depth (${this.options.maxDepth}) exceeded`);
      Logger.error(`📊 Final state - Queue: ${moduleQueue.length}, Resolved: ${resolvedModules.length}, Depth: ${depth}`);
      Logger.error(`📋 Remaining modules: [${moduleQueue.map(m => m.id).join(', ')}]`);
      throw new Error(`Maximum resolution depth (${this.options.maxDepth}) exceeded`);
    }

    Logger.info(`✅ Recursive expansion complete: ${resolvedModules.length} modules`);
    return resolvedModules;
  }

  /**
   * Resolve capabilities to their providing modules
   */
  private async resolveCapabilities(modules: Module[]): Promise<ResolvedModule[]> {
    Logger.info('🎯 Resolving capabilities');
    
    const resolvedModules: ResolvedModule[] = [];
    
    for (const module of modules) {
      const config = this.moduleRegistry.get(module.id);
      if (!config) continue;
      
      // Resolve capability prerequisites
      if (config.prerequisites?.capabilities) {
        const capabilityModules = await this.resolveCapabilityRequirements(
          config.prerequisites.capabilities
        );
        
        // Add capability providers to resolved modules
        for (const capModule of capabilityModules) {
          if (!resolvedModules.find(m => m.id === capModule.id)) {
            const resolvedModule: ResolvedModule = {
              id: capModule.id,
              category: (capModule.category || 'adapter') as 'framework' | 'adapter' | 'integrator' | 'feature',
              version: capModule.version || '1.0.0',
              parameters: capModule.parameters || {},
              ...(capModule.features && { features: capModule.features }),
              ...(capModule.externalFiles && { externalFiles: capModule.externalFiles }),
              resolutionPath: [`capability:${config.prerequisites?.capabilities?.join(',') || 'unknown'}`],
              capabilities: capModule.config?.provides?.capabilities || [],
              prerequisites: capModule.config?.prerequisites?.capabilities || [],
              confidence: 80
            };
            resolvedModules.push(resolvedModule);
          }
        }
      }
      
      // Convert module to resolved module
      const resolvedModule: ResolvedModule = {
        id: module.id,
        category: this.getModuleCategory(module.id),
        ...(module.version && { version: module.version }),
        parameters: module.parameters,
        ...(module.features && { features: module.features }),
        ...(module.externalFiles && { externalFiles: module.externalFiles }),
        resolutionPath: [module.id], // Simplified for now
        capabilities: this.extractCapabilities(config),
        prerequisites: this.extractPrerequisites(config),
        confidence: 100 // Simplified for now
      };
      
      resolvedModules.push(resolvedModule);
    }
    
    Logger.info(`✅ Capability resolution complete: ${resolvedModules.length} modules`);
    
    // Store resolved modules for later use
    this.resolvedModules = resolvedModules;
    
    return resolvedModules;
  }

  /**
   * Build dependency graph from resolved modules
   */
  private async buildDependencyGraph(modules: ResolvedModule[]): Promise<void> {
    Logger.info('🕸️ Building dependency graph');
    
    this.dependencyGraph = { nodes: new Map(), edges: new Map(), cycles: [] };
    
    // Create nodes
    for (const module of modules) {
      const node: DependencyNode = {
        id: module.id,
        category: module.category,
        dependencies: module.prerequisites,
        dependents: [],
        level: 0,
        visited: false,
        inProgress: false
      };
      this.dependencyGraph.nodes.set(module.id, node);
    }
    
    // Create edges
    for (const module of modules) {
      const node = this.dependencyGraph.nodes.get(module.id);
      if (!node) continue;
      
      for (const dep of module.prerequisites) {
        const depNode = this.dependencyGraph.nodes.get(dep);
        if (depNode) {
          depNode.dependents.push(module.id);
          const edges = this.dependencyGraph.edges.get(dep) || [];
          edges.push(module.id);
          this.dependencyGraph.edges.set(dep, edges);
        }
      }
    }
    
    Logger.info('✅ Dependency graph built');
  }

  /**
   * Detect circular dependencies
   */
  private detectCycles(): void {
    Logger.info('🔍 Detecting circular dependencies');
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (moduleId: string, path: string[]): void => {
      if (recursionStack.has(moduleId)) {
        const cycleStart = path.indexOf(moduleId);
        const cycle = path.slice(cycleStart).concat(moduleId);
        cycles.push(cycle);
        return;
      }
      
      if (visited.has(moduleId)) return;
      
      visited.add(moduleId);
      recursionStack.add(moduleId);
      
      const node = this.dependencyGraph.nodes.get(moduleId);
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep, [...path, moduleId]);
        }
      }
      
      recursionStack.delete(moduleId);
    };
    
    for (const moduleId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(moduleId)) {
        dfs(moduleId, []);
      }
    }
    
    this.dependencyGraph.cycles = cycles;
    
    if (cycles.length > 0) {
      Logger.warn(`⚠️ Detected ${cycles.length} circular dependencies`);
    } else {
      Logger.info('✅ No circular dependencies detected');
    }
  }

  /**
   * Topological sort for execution order
   */
  private topologicalSort(): ResolvedModule[] {
    Logger.info('📋 Creating execution order');
    
    const executionOrder: ResolvedModule[] = [];
    const visited = new Set<string>();
    const inProgress = new Set<string>();
    
    const visit = (moduleId: string): void => {
      if (inProgress.has(moduleId)) {
        throw new Error(`Circular dependency detected involving ${moduleId}`);
      }
      
      if (visited.has(moduleId)) return;
      
      inProgress.add(moduleId);
      
      const node = this.dependencyGraph.nodes.get(moduleId);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }
      
      inProgress.delete(moduleId);
      visited.add(moduleId);
      
      // Find the resolved module
      const resolvedModule = this.findResolvedModule(moduleId);
      if (resolvedModule) {
        executionOrder.push(resolvedModule);
      }
    };
    
    // Visit all nodes
    for (const moduleId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }
    
    Logger.info(`✅ Execution order created: ${executionOrder.length} modules`);
    return executionOrder;
  }

  /**
   * Detect conflicts between modules
   */
  private detectConflicts(modules: ResolvedModule[]): ResolutionError[] {
    Logger.info('⚠️ Detecting conflicts');
    
    const conflicts: ResolutionError[] = [];
    
    // Check for capability conflicts
    const capabilityProviders = new Map<string, ResolvedModule[]>();
    
    for (const module of modules) {
      for (const capability of module.capabilities) {
        const providers = capabilityProviders.get(capability) || [];
        providers.push(module);
        capabilityProviders.set(capability, providers);
      }
    }
    
    // Check for multiple providers
    for (const [capability, providers] of capabilityProviders.entries()) {
      if (providers.length > 1 && providers[0]) {
        conflicts.push({
          type: 'CONFLICTING_PROVIDERS',
          module: providers[0].id,
          capability,
          message: `Capability '${capability}' is provided by multiple modules: ${providers.map(p => p.id).join(', ')}`,
          suggestions: [
            `Choose one of: ${providers.map(p => p.id).join(', ')}`,
            'Remove conflicting modules from your genome'
          ],
          severity: 'error'
        });
      }
    }
    
    // Check for missing capabilities
    for (const module of modules) {
      for (const prerequisite of module.prerequisites) {
        if (!capabilityProviders.has(prerequisite)) {
          conflicts.push({
            type: 'MISSING_CAPABILITY',
            module: module.id,
            capability: prerequisite,
            message: `Module '${module.id}' requires capability '${prerequisite}' but no module provides it`,
            suggestions: [
              `Add a module that provides '${prerequisite}'`,
              'Check marketplace for available providers'
            ],
            severity: 'error'
          });
        }
      }
    }
    
    Logger.info(`✅ Conflict detection complete: ${conflicts.length} conflicts found`);
    return conflicts;
  }

  /**
   * Generate warnings for resolved modules
   */
  private generateWarnings(modules: ResolvedModule[]): ResolutionWarning[] {
    const warnings: ResolutionWarning[] = [];
    
    // Check for low confidence modules
    for (const module of modules) {
      if (module.confidence < 80) {
        warnings.push({
          type: 'LOW_CONFIDENCE',
          module: module.id,
          message: `Module '${module.id}' has low confidence (${module.confidence}%)`,
          suggestions: ['Verify module compatibility', 'Check for updates']
        });
      }
    }
    
    return warnings;
  }

  /**
   * Load module configuration
   */
  private async loadModuleConfig(moduleId: string): Promise<ModuleConfig | null> {
    // This would load from the marketplace in a real implementation
    // For now, return a mock config
    return {
      id: moduleId,
      category: this.getModuleCategory(moduleId),
      version: '1.0.0',
      capabilities: {},
      prerequisites: { modules: [], capabilities: [], adapters: [], integrators: [] },
      parameters: {}
    };
  }

  /**
   * Resolve prerequisites for a module
   */
  private async resolvePrerequisites(config: ModuleConfig): Promise<Module[]> {
    const prerequisites: Module[] = [];
    
    // Resolve module prerequisites
    if (config.prerequisites.modules) {
      for (const moduleId of config.prerequisites.modules) {
        prerequisites.push({
          id: moduleId,
          category: this.getModuleCategory(moduleId),
          parameters: {}
        });
      }
    }
    
    return prerequisites;
  }

  /**
   * Resolve capability requirements
   */
  private async resolveCapabilityRequirements(capabilities: string[]): Promise<Module[]> {
    const modules: Module[] = [];
    
    for (const capability of capabilities) {
      // Look up capability providers in the registry
      const providers = this.capabilityRegistry[capability];
      
      if (!providers || providers.providers.length === 0) {
        Logger.warn(`No providers found for capability: ${capability}`);
        continue;
      }
      
      // For now, take the first provider (highest confidence)
      // In a real implementation, you might want to choose based on confidence or user preference
      const provider = providers.providers[0];
      if (provider) {
        const module: Module = {
          id: provider.moduleId,
          category: this.getModuleCategory(provider.moduleId),
          version: provider.capabilityVersion,
          parameters: {}
        };
        
        // Avoid duplicates
        if (!modules.find(m => m.id === module.id)) {
          modules.push(module);
        }
      }
    }
    
    return modules;
  }

  /**
   * Extract capabilities from module config
   */
  private extractCapabilities(config: ModuleConfig): string[] {
    return Object.keys(config.capabilities);
  }

  /**
   * Extract prerequisites from module config
   */
  private extractPrerequisites(config: ModuleConfig): string[] {
    const prerequisites: string[] = [];
    
    if (config.prerequisites.modules) {
      prerequisites.push(...config.prerequisites.modules);
    }
    
    if (config.prerequisites.capabilities) {
      // Resolve capabilities to modules (simplified)
      prerequisites.push(...config.prerequisites.capabilities);
    }
    
    return prerequisites;
  }

  /**
   * Get module category from ID
   */
  private getModuleCategory(moduleId: string): 'framework' | 'adapter' | 'integrator' | 'feature' {
    // Validate module ID format
    this.validateModuleId(moduleId);
    
    if (moduleId.startsWith('framework/')) return 'framework';
    if (moduleId.startsWith('integrations/')) return 'integrator';
    if (moduleId.startsWith('connector:')) return 'integrator'; // Connectors are treated as integrators
    if (moduleId.startsWith('features/')) return 'feature';
    return 'adapter';
  }

  /**
   * Validate module ID format and reject invalid types
   */
  private validateModuleId(moduleId: string): void {
    const validPrefixes = ['framework/', 'adapter/', 'integrations/', 'features/', 'connector:', 'ui/', 'database/', 'auth/', 'payment/', 'email/', 'testing/', 'quality/', 'observability/', 'deployment/', 'state/', 'core/', 'data-fetching/', 'content/', 'services/', 'blockchain/'];
    
    // Check for legacy capability: prefix
    if (moduleId.startsWith('capability:')) {
      throw new Error(`Invalid module type found: 'capability:'. The capability module type has been deprecated. Please use proper integration modules instead. Found: ${moduleId}`);
    }
    
    // Check if module ID has a valid prefix
    const hasValidPrefix = validPrefixes.some(prefix => moduleId.startsWith(prefix));
    if (!hasValidPrefix) {
      Logger.warn(`Module ID '${moduleId}' does not start with a recognized prefix. Valid prefixes: ${validPrefixes.join(', ')}`);
    }
  }

  /**
   * Get module type from module
   */
  private getModuleType(module: Module): string {
    return module.category || 'unknown';
  }

  /**
   * Find resolved module by ID
   */
  private findResolvedModule(moduleId: string): ResolvedModule | null {
    return this.resolvedModules.find(m => m.id === moduleId) || null;
  }
}

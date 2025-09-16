/**
 * Global Context Manager
 * 
 * Centralized state management for the entire generation process.
 * Provides a clean API for accessing and modifying state.
 */

import { EventEmitter } from 'events';
import { 
  GlobalContext, 
  ContextManager, 
  ExecutionState, 
  ProjectState, 
  EnvironmentState, 
  ModuleState, 
  DependencyState, 
  FileSystemState, 
  IntegrationState,
  EnvironmentVariable,
  DependencyInfo,
  ModuleResult,
  ModuleConfiguration
} from '@thearchitech.xyz/types';

export class GlobalContextManager implements ContextManager {
  private context: GlobalContext;
  private eventEmitter: EventEmitter;
  private stateHistory: GlobalContext[];

  constructor(initialContext: Partial<GlobalContext> = {}) {
    this.context = this.createInitialContext(initialContext);
    this.eventEmitter = new EventEmitter();
    this.stateHistory = [this.context];
  }

  // ============================================================================
  // CONTEXT ACCESS
  // ============================================================================

  getContext(): GlobalContext {
    return this.context;
  }

  getExecutionState(): ExecutionState {
    return this.context.execution;
  }

  getProjectState(): ProjectState {
    return this.context.project;
  }

  getEnvironmentState(): EnvironmentState {
    return this.context.environment;
  }

  getModuleState(): ModuleState {
    return this.context.modules;
  }

  getDependencyState(): DependencyState {
    return this.context.dependencies;
  }

  getFileSystemState(): FileSystemState {
    return this.context.filesystem;
  }

  getIntegrationState(): IntegrationState {
    return this.context.integrations;
  }

  // ============================================================================
  // STATE MODIFICATION
  // ============================================================================

  updateExecutionState(updates: Partial<ExecutionState>): void {
    this.context.execution = { ...this.context.execution, ...updates };
    this.emitStateChange('execution', updates);
  }

  updateProjectState(updates: Partial<ProjectState>): void {
    this.context.project = { ...this.context.project, ...updates };
    this.emitStateChange('project', updates);
  }

  addEnvironmentVariable(variable: EnvironmentVariable): void {
    this.context.environment.variables.set(variable.key, variable);
    this.emitStateChange('environment', { variables: [variable] });
  }

  addDependency(dependency: DependencyInfo): void {
    const packageType = dependency.type === 'devDependency' ? 'devDependencies' : 'dependencies';
    this.context.dependencies.packages[packageType].set(dependency.name, dependency.version);
    this.emitStateChange('dependencies', { packages: [dependency] });
  }

  addModuleResult(moduleId: string, result: ModuleResult): void {
    this.context.modules.results.set(moduleId, result);
    this.context.modules.completed.add(moduleId);
    
    // Aggregate dependencies and environment variables
    result.dependencies.forEach(dep => this.addDependency(dep));
    result.environmentVariables.forEach(env => this.addEnvironmentVariable(env));
    
    this.emitStateChange('modules', { results: { [moduleId]: result } });
  }

  addModuleConfiguration(moduleId: string, config: ModuleConfiguration): void {
    this.context.modules.configurations.set(moduleId, config);
    this.emitStateChange('modules', { configurations: { [moduleId]: config } });
  }

  addScript(name: string, command: string): void {
    this.context.dependencies.scripts.set(name, command);
    this.emitStateChange('dependencies', { scripts: { [name]: command } });
  }

  // ============================================================================
  // TEMPLATE RESOLUTION
  // ============================================================================

  resolveTemplate(template: string): string {
    return TemplateResolver.resolve(template, this.context);
  }

  // ============================================================================
  // STATE PERSISTENCE
  // ============================================================================

  saveState(): void {
    this.stateHistory.push({ ...this.context });
  }

  rollbackToState(index: number): void {
    if (index >= 0 && index < this.stateHistory.length) {
      const stateToRestore = this.stateHistory[index];
      if (stateToRestore) {
        this.context = this.createInitialContext(stateToRestore);
        this.emitStateChange('rollback', { toIndex: index });
      }
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  onStateChange(event: string, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  private emitStateChange(slice: string, data: any): void {
    this.eventEmitter.emit('stateChange', { slice, data });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private createInitialContext(initial: Partial<GlobalContext>): GlobalContext {
    return {
      execution: {
        traceId: this.generateUUID(),
        startTime: new Date(),
        status: 'pending',
        currentPhase: 'initialization',
        options: { verbose: false, skipInstall: false, dryRun: false },
        errors: [],
        warnings: []
      },
      project: {
        name: '',
        description: '',
        version: '1.0.0',
        path: '',
        framework: { type: '', version: '', configuration: {} },
        structure: { srcDir: 'src', publicDir: 'public', configDir: '.', libDir: 'src/lib' },
        files: { created: [], modified: [], deleted: [] }
      },
      environment: {
        variables: new Map(),
        cliOptions: {},
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        paths: {
          projectRoot: '',
          sourceRoot: '',
          configRoot: '',
          libRoot: ''
        }
      },
      modules: {
        executionOrder: [],
        completed: new Set(),
        failed: new Set(),
        configurations: new Map(),
        dependencies: new Map(),
        results: new Map()
      },
      dependencies: {
        packages: {
          dependencies: new Map(),
          devDependencies: new Map(),
          peerDependencies: new Map(),
          optionalDependencies: new Map()
        },
        scripts: new Map(),
        metadata: {
          name: '',
          version: '1.0.0',
          description: '',
          author: '',
          license: 'MIT'
        }
      },
      filesystem: {
        vfsInstances: new Map(),
        operations: [],
        conflicts: []
      },
      integrations: {
        integrations: new Map(),
        features: new Map(),
        results: new Map()
      },
      ...initial
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// ============================================================================
// TEMPLATE RESOLVER
// ============================================================================

export class TemplateResolver {
  static resolve(template: string, context: GlobalContext): string {
    let resolved = template;

    // 1. Resolve path variables
    resolved = this.resolvePathVariables(resolved, context);

    // 2. Resolve environment variables
    resolved = this.resolveEnvironmentVariables(resolved, context);

    // 3. Resolve module parameters
    resolved = this.resolveModuleParameters(resolved, context);

    // 4. Resolve project variables
    resolved = this.resolveProjectVariables(resolved, context);

    // 5. Resolve execution variables
    resolved = this.resolveExecutionVariables(resolved, context);

    return resolved;
  }

  private static resolvePathVariables(template: string, context: GlobalContext): string {
    return template.replace(/\{\{paths\.([^}]+)\}\}/g, (match, key) => {
      const paths = context.environment.paths;
      switch (key) {
        case 'projectRoot': return paths.projectRoot;
        case 'sourceRoot': return paths.sourceRoot;
        case 'configRoot': return paths.configRoot;
        case 'libRoot': return paths.libRoot;
        default: return match;
      }
    });
  }

  private static resolveEnvironmentVariables(template: string, context: GlobalContext): string {
    return template.replace(/\{\{env\.([^}]+)\}\}/g, (match, key) => {
      const variable = context.environment.variables.get(key);
      return variable ? variable.value : match;
    });
  }

  private static resolveModuleParameters(template: string, context: GlobalContext): string {
    return template.replace(/\{\{module\.parameters\.([^}]+)\}\}/g, (match, key) => {
      const currentModule = context.execution.currentModule;
      if (currentModule) {
        const moduleConfig = context.modules.configurations.get(currentModule);
        return moduleConfig?.parameters[key] || match;
      }
      return match;
    });
  }

  private static resolveProjectVariables(template: string, context: GlobalContext): string {
    return template.replace(/\{\{project\.([^}]+)\}\}/g, (match, key) => {
      const project = context.project;
      switch (key) {
        case 'name': return project.name;
        case 'description': return project.description;
        case 'version': return project.version;
        case 'path': return project.path;
        default: return match;
      }
    });
  }

  private static resolveExecutionVariables(template: string, context: GlobalContext): string {
    return template.replace(/\{\{execution\.([^}]+)\}\}/g, (match, key) => {
      const execution = context.execution;
      switch (key) {
        case 'traceId': return execution.traceId;
        case 'currentPhase': return execution.currentPhase;
        case 'currentModule': return execution.currentModule || '';
        default: return match;
      }
    });
  }
}

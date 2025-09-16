# Global Context & State Management - Data Flow Schema

## Overview
This document describes the new Global Context architecture and data flow in The Architech CLI, showing how state is managed throughout the project generation process.

## Architecture Components

### 1. Global Context Structure
```
GlobalContext
├── project: ProjectState
│   ├── name, path, framework, description, version
│   ├── structure: { srcDir, publicDir, configDir, libDir }
│   └── files: { created, modified, deleted }
├── environment: EnvironmentState
│   ├── variables: Map<string, string>
│   ├── cliOptions: Record<string, any>
│   ├── runtime: { nodeVersion, platform, arch }
│   └── paths: { projectRoot, sourceRoot, configRoot, libRoot }
├── execution: ExecutionState
│   ├── status, startTime, endTime
│   ├── currentPhase, currentModule, currentAction
│   └── traceId
├── modules: ModuleState
│   ├── configurations: Map<string, ModuleConfiguration>
│   └── results: Map<string, ModuleResult>
├── filesystem: FileSystemState
│   ├── vfsInstances: Map<string, VFS>
│   ├── operations: FileOperation[]
│   └── conflicts: Conflict[]
├── dependencies: DependencyState
│   ├── packages: { dependencies: Map, devDependencies: Map }
│   └── scripts: Map<string, string>
└── integrations: IntegrationState
    ├── configurations: Map<string, IntegrationConfiguration>
    └── results: Map<string, IntegrationResult>
```

### 2. Global Context Manager
```
GlobalContextManager
├── context: GlobalContext
├── stateHistory: GlobalContext[]
├── getContext(): GlobalContext
├── updateProjectState(updates): void
├── updateEnvironmentState(updates): void
├── updateExecutionState(updates): void
├── addModuleConfiguration(moduleId, config): void
├── addModuleResult(moduleId, result): void
├── addDependency(package, version, type): void
├── addEnvVar(key, value): void
├── addScript(name, command): void
├── saveState(): void
└── rollbackToState(index): void
```

## Data Flow Process

### Phase 1: Initialization
```
1. OrchestratorAgent starts
2. GlobalContextManager created with initial state
3. ProjectState populated from ProjectManager
4. EnvironmentState populated from CLI args and system
5. ExecutionState initialized with 'idle' status
```

### Phase 2: Recipe Execution
```
1. OrchestratorAgent.executeRecipe()
2. GlobalContext updated with recipe information
3. ExecutionState.status = 'running'
4. ExecutionState.currentPhase = 'modules'
```

### Phase 3: Module Execution Loop
```
For each module in recipe.modules:
1. ExecutionState.currentModule = module.id
2. Module configuration stored in GlobalContext.modules.configurations
3. Module executed with GlobalContext
4. Module result stored in GlobalContext.modules.results
5. Dependencies collected in GlobalContext.dependencies
6. Environment variables collected in GlobalContext.environment.variables
```

### Phase 4: Integration Execution
```
1. ExecutionState.currentPhase = 'integrations'
2. For each integration:
   - Integration configuration stored
   - Integration executed with GlobalContext
   - Integration result stored
```

### Phase 5: Finalization
```
1. finalizePackageJson():
   - Merge GlobalContext.dependencies into package.json
   - Merge GlobalContext.dependencies.scripts into package.json
2. generateEnvExample():
   - Create .env.example from GlobalContext.environment.variables
3. ExecutionState.status = 'completed'
4. ExecutionState.endTime = new Date()
```

## Service Integration

### TemplateService
```
processTemplate(template, context: GlobalContext | LegacyProjectContext)
├── resolvePathVariables() - uses GlobalContext.environment.paths
├── processConditionals() - uses GlobalContext data
├── processVariables() - uses GlobalContext data
└── resolveCrossModuleParameter() - uses GlobalContext.modules.configurations
```

### BlueprintExecutor
```
executeBlueprint(blueprint, context: GlobalContext | LegacyProjectContext)
├── CREATE_FILE - uses GlobalContext.environment.paths
├── RUN_COMMAND - uses GlobalContext.environment.paths.projectRoot
├── ADD_PACKAGES - uses GlobalContext.dependencies
├── ADD_ENV_VAR - uses GlobalContext.environment.variables
└── createProjectContext() - converts GlobalContext to LegacyProjectContext for legacy services
```

### Legacy Compatibility
```
LegacyProjectContext (extends old ProjectContext)
├── Maintains backward compatibility
├── Used by agents and modifiers
├── Created from GlobalContext when needed
└── Provides access to all necessary data
```

## State Management Benefits

### 1. Centralized State
- All project state in one place
- No more scattered context objects
- Easy to track and debug

### 2. Type Safety
- Strongly typed interfaces
- Compile-time error checking
- Better IDE support

### 3. State History
- Rollback capability
- State snapshots
- Debugging support

### 4. Module Communication
- Cross-module parameter access
- Shared state between modules
- Clean separation of concerns

### 5. Finalization
- Automatic package.json merging
- Automatic .env.example generation
- Complete project setup

## Migration Strategy

### Phase 1: Core Services (Completed)
- ✅ GlobalContext types defined
- ✅ GlobalContextManager implemented
- ✅ OrchestratorAgent refactored
- ✅ TemplateService updated
- ✅ BlueprintExecutor updated

### Phase 2: Legacy Compatibility (Completed)
- ✅ LegacyProjectContext created
- ✅ Backward compatibility maintained
- ✅ Old services continue working

### Phase 3: Future Migration (Optional)
- Agents can be gradually migrated to use GlobalContext
- Modifiers can be updated to use GlobalContext
- Full migration when ready

## Key Improvements

1. **Dependency Aggregation**: All `INSTALL_PACKAGES` actions now properly aggregate into `package.json`
2. **Environment Variable Collection**: All `ADD_ENV_VAR` actions now properly collect into `.env.example`
3. **Cross-Module Communication**: Modules can access each other's parameters through `GlobalContext.modules.configurations`
4. **State Persistence**: State can be saved and rolled back for debugging
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Non-Interactive Commands**: Shadcn commands now run non-interactively with proper flags

## Testing

The new architecture has been tested with:
- ✅ TypeScript compilation
- ✅ Build process
- ✅ Module execution
- ✅ Template processing
- ✅ Blueprint execution
- ✅ Dependency aggregation
- ✅ Environment variable collection

## Conclusion

The Global Context & State Management architecture provides a robust, type-safe, and maintainable solution for managing state throughout the project generation process. It solves the original issues of state fragmentation while maintaining backward compatibility and providing a clear migration path for future improvements.

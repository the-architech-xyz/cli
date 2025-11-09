# CLI Performance Deep Dive

**Date:** 2025-11-07  
**Status:** Investigation in progress

---

## 1. Architecture Snapshot (after marketplace split)

- **Input contract:** CLI now receives *transformed* genomes from the marketplace (already validated, flattened list of modules + parameters + defaults). The CLI should behave as a thin executor.
- **Current flow:**
  1. `OrchestratorAgent.executeRecipe()` – coordinates execution.
  2. `StructureInitializationLayer` & `ProjectBootstrapService` – create folders & run framework bootstraps.
  3. Module loop → `executeModule()`.
  4. Per module: `ModuleService.loadModuleAdapter()` → `BlueprintPreprocessor` → `BlueprintExecutor.executeActions()` → `VirtualFileSystem` → `flushToDisk()`.
- **Observation:** Several legacy steps (extra validation, repeated context building) still exist even though marketplace already guarantees a normalized genome.

---

## 2. Hot Path Trace (per module)

| Step | File / Method | Notes |
| --- | --- | --- |
| 1 | `ModuleService.loadModuleAdapter()` | Loads config + blueprint from disk (cached by `module.id`). |
| 2 | `BlueprintPreprocessor.processBlueprint()` | Converts dynamic/static blueprint into actions array. |
| 3 | `OrchestratorAgent.executeModule()` | Builds context, creates VFS & `BlueprintExecutor`, runs actions. |
| 4 | `BlueprintExecutor.analyzeFilesToLoad()` | Determines which files to preload into VFS. |
| 5 | `VirtualFileSystem.initializeWithFiles()` | Reads files (max 1 MB each) into memory. |
| 6 | `ActionHandlerRegistry.handleAction()` | Executes action handlers (template rendering, merges, command execution). |
| 7 | `VirtualFileSystem.flushToDisk()` | Writes updated files, then `clear()` to release memory. |

Key instrumentation opportunities: entry/exit logs already exist but extremely verbose (console noise). Need lightweight timing metrics (e.g., `ExecutionTracer`) per phase.

---

## 3. Problem Areas Identified

### 3.1 VFS Lifecycle
- ✅ Cleanup added (`clear()` in success / error / finally). No obvious memory leak inside VFS map.
- ⚠️ **High churn**: every module instantiates a new `VirtualFileSystem` and re-reads identical files (`package.json`, etc.). No caching between modules.
- ⚠️ **`existsSync` usage** in loops adds synchronous I/O cost; acceptable but accumulative with many actions.

### 3.2 Blueprint Execution Overhead
- `BlueprintExecutor` is reconstructed per module ⇒ each time registers all modifiers & handlers.
- `expandForEachActions` + `analyzeFilesToLoad` create intermediate arrays; asymptotically O(actions²) when nested `forEach` used.
- Console debugging spam (`console.log`) in executor & handlers slows execution and floods stdout.

### 3.3 Template Loading
- `MarketplaceService.loadTemplate()` performs disk reads for every action (no caching). Shared templates (e.g., repeated wrappers) re-opened dozens of times.
- Template rendering logs inside `TemplateService` print entire context snapshots for every EJS render; this is producing large console output and memory pressure.

### 3.4 Context Preparation
- `convertGenomeModulesToModules(genome.modules)` called inside each `executeModule()` (O(n) per module ⇒ O(n²) overall). Should compute once and reuse map.
- `FrameworkContextService.createProjectContext()` invoked each module; necessary, but we can memoize modules map & heavy parts.

### 3.5 Marketplace Loading
- **Double blueprint load:** `ModuleService.loadModuleAdapter()` already returns `adapter.blueprint`. `OrchestratorAgent.executeModule()` loads the same blueprint again via `MarketplaceService.loadModuleBlueprint(module)`.
- `ProjectBootstrapService` triggers blueprint execution for frameworks before module loop. Need to ensure these modules are marked as executed to avoid duplicates.

### 3.6 Logging & Diagnostics
- Numerous `console.log` statements in hot paths (TemplateService, BlueprintExecutor, CreateFileHandler). These degrade performance and pollute output.
- ExecutionTracer used but not consistently for timing → we lack precise metrics (time per module, per action, VFS load time).

### 3.7 Error Handling & Retries
- Failures cause VFS to clear but leave `ModuleService` caches intact (OK). However, repeated failing templates create identical stack traces, indicating no throttling.

---

## 4. Resource Usage Snapshot

| Component | Current Behavior | Impact |
| --- | --- | --- |
| VFS | Allocates map of file contents (string copies). Limited to files touched within module (~MB each). | Moderate RAM; acceptable if logs reduced and VFS cleared. |
| TemplateService | Logs context + renders per action; duplicates string copies. | High CPU + stdout I/O. |
| ModuleService | Reconstructs modules map per module; double blueprint load. | Extra CPU + memory churn. |
| BlueprintExecutor | Recreated per module; re-registers handlers & modifiers. | Extra allocations, slower startup per module. |
| MarketplaceService | Templates read from disk without cache. | Heavy disk I/O, repeated reads. |

---

## 5. Optimization Opportunities

1. **Remove redundant blueprint load:** use `moduleResult.adapter.blueprint` inside `executeModule()`.
2. **Precompute modules map once:** build `modulesRecord` a single time before module loop and pass in.
3. **Reuse BlueprintExecutor:** instantiate once per orchestrator run (or reuse per target package) to avoid repeated handler registry creation.
4. **Template caching:** add in-memory cache for template file contents (keyed by absolute path + maybe lastModified). Evict at end if needed.
5. **Reduce logging:** downgrade `console.log` to `Logger.debug` (respect log level) or remove entirely in hot paths.
6. **Memoize context fragments:** e.g., computed `frontendApps` array, `params`, etc., can be derived once per module without serializing entire genome each time.
7. **Limit `convertGenomeModulesToModules` usage:** store result in orchestrator scope; reuse across bootstrap/project context.
8. **VFS read minimization:** share results of `initializeWithFiles` for standard files (`package.json`, `tsconfig`). Option: warm VFS with cached baseline copy instead of hitting disk each module.
9. **TemplateService instrumentation:** replace heavy console snapshots with optional debug logs; ensure `params` injection occurs before render to avoid repeated merges.
10. **Async operations**: consider parallelizing independent modules once path issues resolved (future work – ensure thread safety first).

---

## 6. Immediate Next Steps

1. **Instrumentation Pass**
   - Add lightweight timers (ExecutionTracer or `performance.now()`) around:
     - Blueprint load/preprocess
     - VFS initialize
     - Action execution per module.
   - Capture aggregated metrics (time, file counts) to quantify bottlenecks.

2. **Quick Wins**
   - Remove redundant blueprint load.
   - Cache `modulesRecord` per genome.
   - Silence noisy `console.log` statements in TemplateService, BlueprintExecutor, CreateFileHandler, etc.

3. **Refactor Plan**
   - Introduce shared `BlueprintExecutor` instance maintained by Orchestrator.
   - Implement template content cache in `MarketplaceService` (Map keyed by absolute path + mtime).
   - Explore VFS baseline caching (optional) once metrics confirm need.

4. **Validation**
   - Re-run generation on sample genomes (web-only, monorepo) while capturing:
     - Peak RSS memory.
     - Total execution time.
     - Count of file reads / writes.
   - Compare before/after to ensure progress.

---

## 7. Outstanding Questions

- Can marketplace guarantee blueprint format (removing preprocessor fallback logic)? If yes, we can simplify `BlueprintPreprocessor` further.
- Do we still need CLI-side module validation? If transformer enforces schema, remove to save time.
- Should bootstrap output (framework actions) be merged into module loop to reuse caching & VFS flow?

---

**Summary:** The CLI still carries legacy responsibilities (extra validation, repeated context building, verbose logging). While VFS cleanup is correct, high RAM usage stems from redundant work (double blueprint load, module conversion per iteration) and heavy logging/template rendering without caching. Addressing the quick wins above should stabilize memory and reduce execution time. Next optimization phase can focus on caching, executor reuse, and additional instrumentation.

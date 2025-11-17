/**
 * Blueprint Executor - Intelligent Foreman
 * 
 * Implements the Executor-Centric architecture:
 * - Analyzes blueprints to determine VFS need
 * - Creates VFS only when necessary
 * - Delegates actions to specialized handlers
 * - Manages VFS lifecycle
 */

import { Blueprint, BlueprintExecutionResult, BlueprintAction } from '@thearchitech.xyz/types';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
import { ModifierRegistry } from '../../file-system/modifiers/modifier-registry.js';
import { PackageJsonMergerModifier } from '../../file-system/modifiers/package-json-merger.js';
import { TsconfigEnhancerModifier } from '../../file-system/modifiers/tsconfig-enhancer.js';
import { JsConfigMergerModifier } from '../../file-system/modifiers/js-config-merger.js';
import { YamlMergerModifier } from '../../file-system/modifiers/yaml-merger.js';
import { ActionHandlerRegistry } from './action-handlers/index.js';
import { ArchitechError, ArchitechErrorCode } from '../../infrastructure/error/architech-error.js';
import { TemplateService } from '../../file-system/template/template-service.js';
import { PathKeyRegistry } from '../../path/path-key-registry.js';

// Simple modifier interface for now
interface ModifierDefinition {
  execute: (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export class BlueprintExecutor {
  private modifierRegistry: ModifierRegistry;
  private actionHandlerRegistry: ActionHandlerRegistry;

  constructor(projectRoot: string) {
    this.modifierRegistry = new ModifierRegistry();
    this.initializeModifiers();
    this.actionHandlerRegistry = new ActionHandlerRegistry(this.modifierRegistry);
  }

  /**
   * Expand forEach actions into individual actions
   */
  private expandForEachActions(actions: BlueprintAction[], context: ProjectContext): BlueprintAction[] {
    const expandedActions: BlueprintAction[] = [];
    
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (!action) continue;
      
      
      if (action.forEach) {
        console.log(`🔄 Found forEach action: ${action.forEach}`);
        
        // Resolve the forEach path to get the array of items
        const items = this.resolveForEachPath(action.forEach, context);
        
        if (Array.isArray(items) && items.length > 0) {
          console.log(`🔄 Expanded forEach into ${items.length} individual actions`);
          
          // Create individual actions for each item
          for (const item of items) {
            const expandedAction = this.createExpandedAction(action, item);
            expandedActions.push(expandedAction);
          }
        } else {
          console.log(`⚠️  forEach path resolved to empty array or invalid value: ${action.forEach}`);
          // Add the original action without expansion
          expandedActions.push(action);
        }
      } else {
        // No forEach, add the original action
        expandedActions.push(action);
      }
    }
    
    return expandedActions;
  }

  /**
   * Resolve a forEach path (e.g., "module.parameters.components") to get the array of items
   */
  private resolveForEachPath(path: string, context: ProjectContext): any[] {
    try {
      // Split the path by dots and navigate through the context object
      const pathParts = path.split('.');
      let current: any = context;
      
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          console.log(`⚠️  forEach path not found: ${path} (failed at: ${part})`);
          return [];
        }
      }
      
      if (Array.isArray(current)) {
        return current;
      } else {
        console.log(`⚠️  forEach path resolved to non-array: ${path} = ${typeof current}`);
        return [];
      }
    } catch (error) {
      console.log(`⚠️  Error resolving forEach path ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Create an expanded action by replacing {{item}} placeholders with the actual item value
   */
  private createExpandedAction(originalAction: BlueprintAction, item: any): BlueprintAction {
    // Deep clone the action to avoid modifying the original
    const expandedAction = JSON.parse(JSON.stringify(originalAction));
    
    delete (expandedAction as any).forEach;
    
    // Replace {{item}} placeholders in all string properties
    const itemValue = typeof item === 'object' ? JSON.stringify(item) : String(item);
    
    // List of properties that might contain {{item}} placeholders
    const stringProperties = ['command', 'path', 'content', 'template', 'script', 'package', 'envVar', 'envValue'];
    
    for (const prop of stringProperties) {
      if (expandedAction[prop] && typeof expandedAction[prop] === 'string') {
        expandedAction[prop] = expandedAction[prop].replace(/\{\{item\}\}/g, itemValue);
      }
    }
    
    // Also check params object for string values
    if (expandedAction.params && typeof expandedAction.params === 'object') {
      for (const key in expandedAction.params) {
        if (typeof expandedAction.params[key] === 'string') {
          expandedAction.params[key] = expandedAction.params[key].replace(/\{\{item\}\}/g, itemValue);
        }
      }
    }
    
    return expandedAction;
  }

  private async enforcePathKeyContractOnAction(action: BlueprintAction, context: ProjectContext): Promise<void> {
    if (!action || typeof (action as any).path !== 'string') {
      return;
    }

    const templatePath = (action as any).path;
    if (typeof templatePath !== 'string' || !templatePath.includes('${paths.')) {
      return;
    }

    const marketplaceName = (context.module as any)?.marketplace?.name || 'core';
    const project = (context.project as any) || {};
    const projectStructure = project.structure === 'monorepo'
      ? 'monorepo'
      : project.structure === 'single-app'
        ? 'single-app'
        : undefined;

    const validation = await PathKeyRegistry.validatePathKeyUsage(
      templatePath,
      marketplaceName,
      projectStructure
    );

    if (!validation.valid) {
      const detail = validation.errors?.map((error) => `${error.key}: ${error.message}`).join('; ')
        || 'Unknown path key error';
      throw new Error(`Invalid path key in action path "${templatePath}": ${detail}`);
    }
  }

  /**
   * Intelligent VFS Pre-loader: Automatically analyze blueprint to determine which files need to be loaded
   * 
   * This method implements the "Intelligent VFS Pre-loader" doctrine:
   * - Automatically detects files from action analysis
   * - Always includes default files (package.json)
   * - Supports contextualFiles as escape hatch
   * - Handles forEach actions recursively
   * 
   * @param actions - Blueprint actions to analyze
   * @param context - Project context
   * @param blueprint - Optional blueprint (for contextualFiles)
   * @returns Array of unique file paths to pre-load
   */
  private analyzeAndPreloadRequiredFiles(
    actions: BlueprintAction[],
    context: ProjectContext,
    blueprint?: Blueprint
  ): string[] {
    const filesToLoad = new Set<string>();
    
    // 1. Always include default files (doctrine requirement)
    filesToLoad.add('package.json');
    
    // 2. Add contextualFiles if provided (escape hatch for edge cases)
    if (blueprint?.contextualFiles && Array.isArray(blueprint.contextualFiles)) {
      blueprint.contextualFiles.forEach(file => filesToLoad.add(file));
    }
    
    // 3. Add module.externalFiles if available
    if (context.module?.externalFiles && Array.isArray(context.module.externalFiles)) {
      context.module.externalFiles.forEach(file => filesToLoad.add(file));
    }
    
    // 4. Analyze actions to automatically detect file interactions
    for (const action of actions) {
      if (!action) continue;
      
      // Handle forEach actions (expand first, then analyze recursively)
      if ((action as any).forEach) {
        const expandedActions = this.expandForEachActions([action], context);
        const expandedFiles = this.analyzeAndPreloadRequiredFiles(expandedActions, context, blueprint);
        expandedFiles.forEach(file => filesToLoad.add(file));
        continue;
      }
      
      // Determine files needed based on action type
      switch (action.type) {
        case 'INSTALL_PACKAGES':
        case 'ADD_SCRIPT':
        case 'ADD_DEPENDENCY':
        case 'ADD_DEV_DEPENDENCY':
          // These actions always need package.json (already in default list)
          filesToLoad.add('package.json');
          break;
          
        case 'ENHANCE_FILE':
          if ((action as any).path) {
            // Only add if there's no fallback create option
            // If fallback is 'create', the file might not exist yet
            if (!(action as any).fallback || (action as any).fallback !== 'create') {
              filesToLoad.add((action as any).path);
            }
          }
          break;
          
        case 'MERGE_JSON':
        case 'MERGE_CONFIG':
        case 'APPEND_TO_FILE':
        case 'PREPEND_TO_FILE':
        case 'ADD_TS_IMPORT':
        case 'EXTEND_SCHEMA':
        case 'WRAP_CONFIG':
          // These actions modify existing files, so we need to pre-load them
          if ((action as any).path) {
            filesToLoad.add((action as any).path);
          }
          break;
          
        case 'CREATE_FILE':
          // CREATE_FILE doesn't need pre-loading (file is created, not modified)
          // However, if it has a merge strategy, we might need the existing file
          if ((action as any).mergeStrategy && (action as any).path) {
            filesToLoad.add((action as any).path);
          }
          break;
      }
    }
    
    // 5. Return deduplicated array
    return Array.from(filesToLoad);
  }
  
  /**
   * @deprecated Use analyzeAndPreloadRequiredFiles instead
   * Kept for backward compatibility
   */
  private analyzeFilesToLoad(
    actions: BlueprintAction[],
    context: ProjectContext,
    blueprint?: Blueprint
  ): string[] {
    return this.analyzeAndPreloadRequiredFiles(actions, context, blueprint);
  }

  /**
   * Initialize the modifier registry with available modifiers
   */
  private initializeModifiers(): void {
    // Register available modifiers
    this.modifierRegistry.register('package-json-merger', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for package-json-merger' };
        }
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new PackageJsonMergerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    this.modifierRegistry.register('tsconfig-enhancer', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for tsconfig-enhancer' };
        }
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new TsconfigEnhancerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    this.modifierRegistry.register('css-enhancer', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for css-enhancer' };
        }
        
        try {
          const newContent = params.content || params.styles || '';
          
          // Check if file exists
          if (!vfs.fileExists(filePath)) {
            // File doesn't exist, create it with the new content
            vfs.writeFile(filePath, newContent);
            return { 
              success: true, 
              message: `CSS file created: ${filePath}` 
            };
          }
          
          // File exists - intelligently merge content
          const existingContent = await vfs.readFile(filePath);
          
          // Check what type of content we're adding
          const isImport = newContent.trim().startsWith('@import');
          const isTailwindDirective = newContent.trim().startsWith('@tailwind');
          const isLayerDirective = newContent.trim().startsWith('@layer');
          
          // Check if content already exists
          if (existingContent.includes(newContent.trim())) {
            return { 
              success: true, 
              message: `CSS already contains this content: ${filePath}` 
            };
          }
          
          let mergedContent: string;
          
          if (isImport || isTailwindDirective || isLayerDirective) {
            // Prepend directives and imports at the top
            mergedContent = newContent + '\n' + existingContent;
          } else {
            // Append other CSS rules at the bottom
            mergedContent = existingContent + '\n' + newContent;
          }
          
          await vfs.writeFile(filePath, mergedContent);
          
          return { 
            success: true, 
            message: `CSS enhanced: ${filePath}` 
          };
        } catch (error) {
          return { 
            success: false, 
            error: `CSS enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    });

    this.modifierRegistry.register('js-config-merger', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for js-config-merger' };
        }
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new JsConfigMergerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    this.modifierRegistry.register('ts-module-enhancer', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for ts-module-enhancer' };
        }
        const { TsModuleEnhancerModifier } = await import('../../file-system/modifiers/ts-module-enhancer.js');
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new TsModuleEnhancerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    this.modifierRegistry.register('yaml-merger', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for yaml-merger' };
        }
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new YamlMergerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    // json-merger: Generic deep merge for any JSON file
    this.modifierRegistry.register('json-merger', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for json-merger' };
        }
        const { JsonMergerModifier } = await import('../../file-system/modifiers/json-merger.js');
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new JsonMergerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    // js-export-wrapper: Wrap exports with higher-order functions (e.g., withSentryConfig)
    this.modifierRegistry.register('js-export-wrapper', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for js-export-wrapper' };
        }
        const { JsExportWrapperModifier } = await import('../../file-system/modifiers/js-export-wrapper.js');
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new JsExportWrapperModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    // jsx-children-wrapper: Wrap {children} with provider components
    this.modifierRegistry.register('jsx-children-wrapper', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for jsx-children-wrapper' };
        }
        const { JsxChildrenWrapperModifier } = await import('../../file-system/modifiers/jsx-children-wrapper.js');
        // CRITICAL: Use VFS projectRoot instead of context.project.path
        // VFS projectRoot is the source of truth (e.g., packages/shared for monorepo)
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, vfsProjectRoot);
        const modifier = new JsxChildrenWrapperModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });
  }

  /**
   * Execute a list of actions directly (for preprocessed blueprints)
   * 
   * This method is used when blueprints have been preprocessed into static action arrays.
   * It skips the blueprint analysis and directly executes the provided actions.
   */
  async executeActions(actions: BlueprintAction[], context: ProjectContext, vfs: VirtualFileSystem): Promise<BlueprintExecutionResult> {
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Intelligent analysis: Automatically detect files to pre-load
      // This implements the "Intelligent VFS Pre-loader" doctrine
      // Analyzes actions to determine which files need to be loaded into VFS
      // Note: executeActions doesn't have blueprint context, so contextualFiles won't be available
      const filesToRead = this.analyzeAndPreloadRequiredFiles(actions, context);
      
      // 2. Pre-populate VFS with existing files (intelligent pre-loading)
      // CRITICAL: Resolve path variables before passing to initializeWithFiles
      if (filesToRead.length > 0) {
        const resolvedFilesToRead = filesToRead.map((filePath: string) => {
          // Resolve path variables if present
          if (context.pathHandler?.resolveTemplate) {
            return context.pathHandler.resolveTemplate(filePath);
          }
          return filePath;
        });
        
        // Deduplicate resolved paths
        const uniqueFilesToRead = Array.from(new Set(resolvedFilesToRead)) as string[];
        
        await vfs.initializeWithFiles(uniqueFilesToRead);
      }
      
      // 3. Expand forEach actions
      const expandedActions = this.expandForEachActions(actions, context);
      
      // 4. Execute all actions on the VFS (unified execution)
      for (let i = 0; i < expandedActions.length; i++) {
        const action = expandedActions[i];
        if (!action) continue;
        
        // Evaluate condition if present (skip action if condition is false)
        if (!this.evaluateActionCondition(action, context)) {
          const actionPath = 'path' in action ? action.path : action.type;
          console.log(`  ⏭️  Skipping action (condition false): ${actionPath}`);
          continue;
        }
        
        const actionPath = 'path' in action ? action.path : 'N/A';

        await this.enforcePathKeyContractOnAction(action, context);

        // CRITICAL: Use VFS projectRoot (which is set to targetPackagePath for monorepo)
        // This ensures commands and file operations run in the correct package directory
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const result = await this.actionHandlerRegistry.handleAction(action, context, vfsProjectRoot, vfs);
        
        if (!result.success) {
          const error = ArchitechError.blueprintExecutionFailed(
            'preprocessed',
            result.error || 'Action execution failed'
          );
          errors.push(error.getUserMessage());
          
          // FAIL FAST: Return immediately when any action fails
          return {
            success: false,
            files,
            errors,
            warnings
          };
        }
        
        if (result.files) {
          files.push(...result.files);
        }
      }
      
      return {
        success: errors.length === 0,
        files,
        errors,
        warnings
      };
      
    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'action_execution', moduleId: 'preprocessed' }
      );
      
      return { 
        success: false, 
        files,
        errors: [architechError.getUserMessage()],
        warnings
      };
    }
  }

  /**
   * Execute a blueprint with per-blueprint transactional VFS
   * Each blueprint receives its own dedicated VFS instance from OrchestratorAgent
   * 
   * Flow:
   * 1. Analyze blueprint to identify files to pre-load
   * 2. Pre-populate VFS with existing files from disk
   * 3. Execute all actions on the VFS (in-memory)
   * 4. Return to OrchestratorAgent (VFS flush happens there after successful execution)
   * 
   * Note: Blueprint type safety is enforced at compile-time by the marketplace,
   * so no runtime validation is needed.
   */
  async executeBlueprint(blueprint: Blueprint, context: ProjectContext, vfs: VirtualFileSystem): Promise<BlueprintExecutionResult> {
    console.log(`🎯 Executing blueprint: ${blueprint.name}`);
    
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Intelligent analysis: Automatically detect files to pre-load
      // This implements the "Intelligent VFS Pre-loader" doctrine
      const filesToLoad = this.analyzeAndPreloadRequiredFiles(blueprint.actions, context, blueprint);
      
      // 2. Pre-populate VFS with detected files
      // CRITICAL: Resolve path variables before passing to initializeWithFiles
      // This handles monorepo vs single-app path resolution correctly
      if (filesToLoad.length > 0) {
        const resolvedFiles = filesToLoad.map((filePath: string) => {
          // Resolve path variables if present (handles ${paths.*} templates)
          if (context.pathHandler?.resolveTemplate) {
            return context.pathHandler.resolveTemplate(filePath);
          }
          return filePath;
        });
        await vfs.initializeWithFiles(resolvedFiles);
      }
      
      // 3. Expand forEach actions
      const expandedActions = this.expandForEachActions(blueprint.actions, context);
      
      // 4. Execute all actions on the VFS (unified execution)
      for (let i = 0; i < expandedActions.length; i++) {
        const action = expandedActions[i];
        if (!action) continue;
        
        // Evaluate condition if present (skip action if condition is false)
        if (!this.evaluateActionCondition(action, context)) {
          const actionPath = 'path' in action ? action.path : action.type;
          console.log(`  ⏭️  Skipping action (condition false): ${actionPath}`);
          continue;
        }
        
        const actionPath = 'path' in action ? action.path : action.type;

        await this.enforcePathKeyContractOnAction(action, context);

        // CRITICAL: Use VFS projectRoot (which is set to appTargetDir for framework setup)
        // This ensures commands run in the correct package directory (apps/web, apps/api, etc.)
        // The VFS is initialized with the correct directory in module-service.ts
        const vfsProjectRoot = (vfs as any).projectRoot || context.project.path || '.';
        const result = await this.actionHandlerRegistry.handleAction(action, context, vfsProjectRoot, vfs);
        
        if (!result.success) {
          const error = ArchitechError.blueprintExecutionFailed(
            blueprint.id,
            result.error || 'Action execution failed'
          );
          errors.push(error.getUserMessage());
          
          // FAIL FAST: Return immediately when any action fails
          return {
            success: false,
            files,
            errors,
            warnings
          };
        }
        
        if (result.files) {
          files.push(...result.files);
        }
        
      }
      
      return {
        success: errors.length === 0,
        files,
        errors,
        warnings
      };
      
    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Blueprint execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'blueprint_execution', moduleId: blueprint?.id || 'unknown' }
      );
      
      return { 
        success: false, 
        files,
        errors: [architechError.getUserMessage()],
        warnings
      };
    }
  }

  /**
   * Evaluate action condition to determine if action should execute
   * 
   * Conditions are processed as templates using Handlebars-style syntax:
   * - {{#if variable}} - evaluates truthiness of variable
   * - Returns true if no condition specified (always execute)
   * - Returns false if condition evaluates to false/undefined
   */
  private evaluateActionCondition(action: BlueprintAction, context: ProjectContext): boolean {
    // No condition = always execute
    if (!(action as any).condition) {
      return true;
    }

    const condition = (action as any).condition;
    
    // Handle Handlebars-style {{#if variable}} conditions
    const ifMatch = condition.match(/\{\{#if\s+([^}]+)\}\}/);
    if (ifMatch) {
      const variablePath = ifMatch[1].trim();
      const value = this.getNestedValueFromContext(context, variablePath);
      return TemplateService.isTruthy(value);
    }

    // Handle simple boolean conditions (already evaluated)
    if (typeof condition === 'boolean') {
      return condition;
    }

    // Process condition as template and check if result is truthy
    try {
      const processedCondition = TemplateService.processTemplate(condition, context, {
        processVariables: true,
        processConditionals: false // Already handled above
      });
      
      // If template was replaced (not just literal string), evaluate result
      if (processedCondition !== condition) {
        return TemplateService.isTruthy(processedCondition);
      }
      
      // If still looks like template syntax, probably false
      if (processedCondition.includes('{{')) {
        return false;
      }
      
      return TemplateService.isTruthy(processedCondition);
    } catch (error) {
      console.warn(`⚠️  Failed to evaluate condition: ${condition}`, error);
      return false; // Fail closed: skip action if condition evaluation fails
    }
  }

  /**
   * Get nested value from context using dot notation (e.g., 'module.parameters.reactVersion')
   */
  private getNestedValueFromContext(context: ProjectContext, path: string): unknown {
    const keys = path.split('.');
    let value: any = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
}


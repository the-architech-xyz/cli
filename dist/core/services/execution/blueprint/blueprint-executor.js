/**
 * Blueprint Executor - Intelligent Foreman
 *
 * Implements the Executor-Centric architecture:
 * - Analyzes blueprints to determine VFS need
 * - Creates VFS only when necessary
 * - Delegates actions to specialized handlers
 * - Manages VFS lifecycle
 */
import { ModifierRegistry } from '../../file-system/modifiers/modifier-registry.js';
import { PackageJsonMergerModifier } from '../../file-system/modifiers/package-json-merger.js';
import { TsconfigEnhancerModifier } from '../../file-system/modifiers/tsconfig-enhancer.js';
import { JsConfigMergerModifier } from '../../file-system/modifiers/js-config-merger.js';
import { YamlMergerModifier } from '../../file-system/modifiers/yaml-merger.js';
import { BlueprintAnalyzer } from '../../project/blueprint-analyzer/index.js';
import { ActionHandlerRegistry } from './action-handlers/index.js';
import { ArchitechError } from '../../infrastructure/error/architech-error.js';
import { TemplateService } from '../../file-system/template/template-service.js';
export class BlueprintExecutor {
    modifierRegistry;
    actionHandlerRegistry;
    blueprintAnalyzer;
    constructor(projectRoot) {
        this.modifierRegistry = new ModifierRegistry();
        this.initializeModifiers();
        this.actionHandlerRegistry = new ActionHandlerRegistry(this.modifierRegistry);
        this.blueprintAnalyzer = new BlueprintAnalyzer();
    }
    /**
     * Expand forEach actions into individual actions
     */
    expandForEachActions(actions, context) {
        const expandedActions = [];
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            if (!action)
                continue;
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
                }
                else {
                    console.log(`⚠️  forEach path resolved to empty array or invalid value: ${action.forEach}`);
                    // Add the original action without expansion
                    expandedActions.push(action);
                }
            }
            else {
                // No forEach, add the original action
                expandedActions.push(action);
            }
        }
        return expandedActions;
    }
    /**
     * Resolve a forEach path (e.g., "module.parameters.components") to get the array of items
     */
    resolveForEachPath(path, context) {
        try {
            // Split the path by dots and navigate through the context object
            const pathParts = path.split('.');
            let current = context;
            for (const part of pathParts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                }
                else {
                    console.log(`⚠️  forEach path not found: ${path} (failed at: ${part})`);
                    return [];
                }
            }
            if (Array.isArray(current)) {
                return current;
            }
            else {
                console.log(`⚠️  forEach path resolved to non-array: ${path} = ${typeof current}`);
                return [];
            }
        }
        catch (error) {
            console.log(`⚠️  Error resolving forEach path ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }
    /**
     * Create an expanded action by replacing {{item}} placeholders with the actual item value
     */
    createExpandedAction(originalAction, item) {
        // Deep clone the action to avoid modifying the original
        const expandedAction = JSON.parse(JSON.stringify(originalAction));
        // Replace {{item}} placeholders in all string properties
        const itemValue = String(item);
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
    /**
     * Initialize the modifier registry with available modifiers
     */
    initializeModifiers() {
        // Register available modifiers
        this.modifierRegistry.register('package-json-merger', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for package-json-merger' };
                }
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new PackageJsonMergerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        this.modifierRegistry.register('tsconfig-enhancer', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for tsconfig-enhancer' };
                }
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new TsconfigEnhancerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        this.modifierRegistry.register('css-enhancer', {
            execute: async (filePath, params, context, vfs) => {
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
                    let mergedContent;
                    if (isImport || isTailwindDirective || isLayerDirective) {
                        // Prepend directives and imports at the top
                        mergedContent = newContent + '\n' + existingContent;
                    }
                    else {
                        // Append other CSS rules at the bottom
                        mergedContent = existingContent + '\n' + newContent;
                    }
                    await vfs.writeFile(filePath, mergedContent);
                    return {
                        success: true,
                        message: `CSS enhanced: ${filePath}`
                    };
                }
                catch (error) {
                    return {
                        success: false,
                        error: `CSS enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }
        });
        this.modifierRegistry.register('js-config-merger', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for js-config-merger' };
                }
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new JsConfigMergerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        this.modifierRegistry.register('ts-module-enhancer', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for ts-module-enhancer' };
                }
                const { TsModuleEnhancerModifier } = await import('../../file-system/modifiers/ts-module-enhancer.js');
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new TsModuleEnhancerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        this.modifierRegistry.register('yaml-merger', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for yaml-merger' };
                }
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new YamlMergerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        // json-merger: Generic deep merge for any JSON file
        this.modifierRegistry.register('json-merger', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for json-merger' };
                }
                const { JsonMergerModifier } = await import('../../file-system/modifiers/json-merger.js');
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new JsonMergerModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        // js-export-wrapper: Wrap exports with higher-order functions (e.g., withSentryConfig)
        this.modifierRegistry.register('js-export-wrapper', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for js-export-wrapper' };
                }
                const { JsExportWrapperModifier } = await import('../../file-system/modifiers/js-export-wrapper.js');
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
                const modifier = new JsExportWrapperModifier(engine);
                return await modifier.execute(filePath, params, context);
            }
        });
        // jsx-children-wrapper: Wrap {children} with provider components
        this.modifierRegistry.register('jsx-children-wrapper', {
            execute: async (filePath, params, context, vfs) => {
                if (!vfs) {
                    return { success: false, error: 'VFS required for jsx-children-wrapper' };
                }
                const { JsxChildrenWrapperModifier } = await import('../../file-system/modifiers/jsx-children-wrapper.js');
                const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
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
    async executeActions(actions, context, vfs) {
        console.log(`🎯 Executing ${actions.length} preprocessed actions`);
        const files = [];
        const errors = [];
        const warnings = [];
        try {
            // 1. Expand forEach actions
            const expandedActions = this.expandForEachActions(actions, context);
            // 2. Execute all actions on the VFS (unified execution)
            for (let i = 0; i < expandedActions.length; i++) {
                const action = expandedActions[i];
                if (!action)
                    continue;
                // Evaluate condition if present (skip action if condition is false)
                if (!this.evaluateActionCondition(action, context)) {
                    const actionPath = 'path' in action ? action.path : action.type;
                    console.log(`  ⏭️  Skipping action (condition false): ${actionPath}`);
                    continue;
                }
                const actionPath = 'path' in action ? action.path : 'N/A';
                const result = await this.actionHandlerRegistry.handleAction(action, context, context.project.path || '.', vfs);
                if (!result.success) {
                    const error = ArchitechError.blueprintExecutionFailed('preprocessed', result.error || 'Action execution failed');
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
        }
        catch (error) {
            const architechError = ArchitechError.internalError(`Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { operation: 'action_execution', moduleId: 'preprocessed' });
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
    async executeBlueprint(blueprint, context, vfs) {
        console.log(`🎯 Executing blueprint: ${blueprint.name}`);
        const files = [];
        const errors = [];
        const warnings = [];
        try {
            // 1. Analyze blueprint to identify files to pre-load
            const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint, context);
            // 2. Pre-populate VFS with existing files (intelligent pre-loading)
            if (analysis.filesToRead.length > 0) {
                await vfs.initializeWithFiles(analysis.filesToRead);
            }
            // 3. Expand forEach actions
            const expandedActions = this.expandForEachActions(blueprint.actions, context);
            // 4. Execute all actions on the VFS (unified execution)
            for (let i = 0; i < expandedActions.length; i++) {
                const action = expandedActions[i];
                if (!action)
                    continue;
                // Evaluate condition if present (skip action if condition is false)
                if (!this.evaluateActionCondition(action, context)) {
                    const actionPath = 'path' in action ? action.path : action.type;
                    console.log(`  ⏭️  Skipping action (condition false): ${actionPath}`);
                    continue;
                }
                const actionPath = 'path' in action ? action.path : 'N/A';
                const result = await this.actionHandlerRegistry.handleAction(action, context, context.project.path || '.', vfs);
                if (!result.success) {
                    const error = ArchitechError.blueprintExecutionFailed(blueprint.id, result.error || 'Action execution failed');
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
        }
        catch (error) {
            const architechError = ArchitechError.internalError(`Blueprint execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { operation: 'blueprint_execution', moduleId: blueprint?.id || 'unknown' });
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
    evaluateActionCondition(action, context) {
        // No condition = always execute
        if (!action.condition) {
            return true;
        }
        const condition = action.condition;
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
        }
        catch (error) {
            console.warn(`⚠️  Failed to evaluate condition: ${condition}`, error);
            return false; // Fail closed: skip action if condition evaluation fails
        }
    }
    /**
     * Get nested value from context using dot notation (e.g., 'module.parameters.reactVersion')
     */
    getNestedValueFromContext(context, path) {
        const keys = path.split('.');
        let value = context;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
}
//# sourceMappingURL=blueprint-executor.js.map
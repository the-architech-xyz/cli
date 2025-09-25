/**
 * Blueprint Executor - Clean Implementation
 * 
 * Executes blueprints using the new three-layer architecture:
 * Layer 1: File Modification Engine (primitives)
 * Layer 2: Blueprint Orchestrator (translation)
 * Layer 3: Blueprint Executor (orchestration)
 */

import { Blueprint, BlueprintAction, BlueprintExecutionResult, ProjectContext, BlueprintContext } from '@thearchitech.xyz/types';
import { CommandRunner } from '../../../cli/command-runner.js';
import { logger } from '../../../utils/logger.js';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
import { FileModificationEngine } from '../../file-system/file-engine/file-modification-engine.js';
import { TemplateService } from '../../file-system/template/index.js';
import { ModuleFetcherService } from '../../module-management/fetcher/module-fetcher.js';

export class BlueprintExecutor {
  private commandRunner: CommandRunner;
  private currentAction: BlueprintAction | null = null;

  constructor(projectRoot: string, moduleFetcher: ModuleFetcherService) {
    this.commandRunner = new CommandRunner();
  }

  /**
   * Execute a blueprint with two-pass execution logic
   * Phase 1: Scaffolding commands (RUN_COMMAND with create-* commands)
   * Phase 2: Enhancement actions (CREATE_FILE, ENHANCE_FILE, etc.)
   */
  async executeBlueprint(blueprint: Blueprint, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<BlueprintExecutionResult> {
    console.log(`🎯 Executing blueprint: ${blueprint.name}`);
    
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Create a new VFS for each blueprint execution (VFS per blueprint)
    let vfs: VirtualFileSystem;
    let shouldFlushVFS = false;
    
    if (blueprintContext) {
      vfs = blueprintContext.vfs;
    } else {
      vfs = new (await import('../../file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${blueprint.id}`, context.project.path || '.');
      shouldFlushVFS = true;
    }
    
    // Separate actions into scaffolding and enhancement phases
    const { scaffoldingActions, enhancementActions } = this.categorizeActions(blueprint.actions, context);
    
    console.log(`🏗️ Phase 1: Executing ${scaffoldingActions.length} scaffolding commands`);
    console.log(`🔧 Phase 2: Executing ${enhancementActions.length} enhancement actions`);
    
    // PHASE 1: Execute scaffolding commands first (no VFS operations)
    for (let i = 0; i < scaffoldingActions.length; i++) {
      const action = scaffoldingActions[i];
      
      if (!action) {
        errors.push(`Scaffolding action at index ${i} is undefined`);
        continue;
      }
      
      console.log(`  🏗️ [${i + 1}/${scaffoldingActions.length}] ${action.type} - ${action.command}`);
      
      // Check action condition before processing
      if (action.condition) {
        const shouldExecute = this.evaluateCondition(action.condition, context);
        if (!shouldExecute) {
          console.log(`  ⏭️ Skipping scaffolding action due to condition: ${action.condition}`);
          continue;
        }
      }
      
      // Set current action for context-aware processing
      this.currentAction = action;
      
      try {
        // Execute scaffolding action directly (no VFS)
        // Execute scaffolding action directly (no VFS)
        const result = await this.executeSemanticAction(action, context, {
          vfs,
          projectRoot: context.project.path || '.',
          externalFiles: []
        });
        
        if (result.success) {
          console.log(`  ✅ Scaffolding command completed successfully`);
        } else {
          if (result.error) {
            errors.push(`Scaffolding command failed: ${result.error}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Scaffolding action ${i + 1} failed: ${errorMessage}`);
      }
    }
    
    // Post-scaffolding VFS synchronization
    if (scaffoldingActions.length > 0) {
      console.log(`🔄 Synchronizing VFS with disk state after scaffolding...`);
      try {
        await this.synchronizeVFSWithDisk(vfs, context.project.path || '.');
        console.log(`✅ VFS synchronized with disk state`);
      } catch (error) {
        console.error(`❌ Failed to synchronize VFS:`, error);
        errors.push(`Failed to synchronize VFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // PHASE 2: Execute enhancement actions (with VFS operations)
    for (let i = 0; i < enhancementActions.length; i++) {
      const action = enhancementActions[i];
      
      if (!action) {
        errors.push(`Enhancement action at index ${i} is undefined`);
        continue;
      }
      
      console.log(`  🔧 [${i + 1}/${enhancementActions.length}] ${action.type}`);
      console.log(`  🔍 Action path: ${action.path}`);
      console.log(`  🔍 Action condition: ${action.condition}`);
      
      // Check action condition before processing
      if (action.condition) {
        const shouldExecute = this.evaluateCondition(action.condition, context);
        console.log(`  🔍 Action condition evaluation: ${action.condition} = ${shouldExecute}`);
        if (!shouldExecute) {
          console.log(`  ⏭️ Skipping enhancement action due to condition: ${action.condition}`);
          continue;
        }
      }
      
      // Set current action for context-aware processing
      this.currentAction = action;
      
      try {
        // Execute enhancement action with VFS
        const result = await this.executeSemanticAction(action, context, {
          vfs,
          projectRoot: context.project.path || '.',
          externalFiles: []
        });
        
        if (result.success) {
          if (result.files) {
            files.push(...result.files);
          }
        } else {
          if (result.error) {
            errors.push(result.error);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Enhancement action ${i + 1} failed: ${errorMessage}`);
      }
    }
    
    // Flush VFS to disk - each blueprint should flush its VFS
    try {
      await vfs.flushToDisk();
      console.log(`✅ Blueprint VFS flushed to disk`);
    } catch (error) {
      console.error(`❌ Failed to flush VFS:`, error);
      errors.push(`Failed to flush VFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const success = errors.length === 0;
    
    return {
      success,
      files,
      errors,
      warnings
    };
  }

  /**
   * Categorize actions into scaffolding and enhancement phases
   */
  private categorizeActions(actions: BlueprintAction[], context: ProjectContext): {
    scaffoldingActions: BlueprintAction[];
    enhancementActions: BlueprintAction[];
  } {
    const scaffoldingActions: BlueprintAction[] = [];
    const enhancementActions: BlueprintAction[] = [];
    
    for (const action of actions) {
      if (!action) continue;
      
      // Handle forEach actions by expanding them
      if (action.forEach) {
        console.log(`🔄 Processing forEach action: ${action.forEach}`);
        const expandedActions = this.expandForEachAction(action, context);
        console.log(`🔄 Expanded into ${expandedActions.length} actions`);
        const categorized = this.categorizeActions(expandedActions, context);
        scaffoldingActions.push(...categorized.scaffoldingActions);
        enhancementActions.push(...categorized.enhancementActions);
        continue;
      }
      
      // Check if this is a scaffolding command
      if (action.type === 'RUN_COMMAND' && action.command) {
        const processedCommand = this.processTemplate(action.command, context);
        if (this.isScaffoldingCommand(processedCommand)) {
          scaffoldingActions.push(action);
          continue;
        }
      }
      
      // All other actions are enhancement actions
      enhancementActions.push(action);
    }
    
    return { scaffoldingActions, enhancementActions };
  }

  /**
   * Expand forEach actions into multiple individual actions
   */
  private expandForEachAction(action: BlueprintAction, context: ProjectContext): BlueprintAction[] {
    if (!action.forEach) return [action];
    
    console.log(`🔍 Expanding forEach: ${action.forEach}`);
    console.log(`🔍 Context keys:`, Object.keys(context));
    
    // Get the array to iterate over from context
    const forEachPath = action.forEach.split('.');
    let forEachArray: any[] = [];
    
    // Navigate to the array in the context
    let current: any = context;
    for (const key of forEachPath) {
      console.log(`🔍 Looking for key: ${key} in current:`, current);
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`forEach path not found: ${action.forEach} at key: ${key}`);
        return [action];
      }
    }
    
    if (!Array.isArray(current)) {
      console.warn(`forEach target is not an array: ${action.forEach}`);
      return [action];
    }
    
    forEachArray = current;
    
    // Create individual actions for each item
    const expandedActions: BlueprintAction[] = [];
    
    for (let i = 0; i < forEachArray.length; i++) {
      const item = forEachArray[i];
      const expandedAction: BlueprintAction = {
        type: action.type,
        ...(action.command && { command: action.command.replace(/\{\{item\}\}/g, item) }),
        ...(action.path && { path: action.path.replace(/\{\{item\}\}/g, item) }),
        ...(action.content && { content: action.content.replace(/\{\{item\}\}/g, item) }),
        ...(action.template && { template: action.template.replace(/\{\{item\}\}/g, item) }),
        ...(action.packages && { packages: action.packages }),
        ...(action.workingDir && { workingDir: action.workingDir }),
        ...(action.condition && { condition: action.condition }),
        ...(action.params && { params: action.params }),
        ...(action.fallback && { fallback: action.fallback })
      };
      
      expandedActions.push(expandedAction);
    }
    
    console.log(`🔄 Expanded forEach action into ${expandedActions.length} individual actions`);
    return expandedActions;
  }

  /**
   * Check if a command is a scaffolding command (creates project structure)
   */
  private isScaffoldingCommand(command: string): boolean {
    const scaffoldingPatterns = [
      /create-next-app/,
      /create-vite/,
      /create-react-app/,
      /create-svelte/,
      /create-vue/,
      /create-angular/,
      /create-t3-app/,
      /create-turbo/,
      /create-expo/,
      /create-remix/,
      /create-solid/,
      /create-qwik/,
      /npx create-/,
      /yarn create/,
      /pnpm create/,
      /bun create/
    ];
    
    return scaffoldingPatterns.some(pattern => pattern.test(command));
  }

  /**
   * Synchronize VFS with disk state after scaffolding commands
   */
  private async synchronizeVFSWithDisk(vfs: VirtualFileSystem, projectRoot: string): Promise<void> {
    try {
      // Read all files from disk and load them into VFS
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Recursively read all files in the project directory
      const readDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other common directories
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
              continue;
            }
            await readDirectory(fullPath, relativeFilePath);
          } else if (entry.isFile()) {
            // Read file content and load into VFS
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              vfs.createFile(relativeFilePath, content);
              console.log(`  📂 Loaded from disk: ${relativeFilePath}`);
            } catch (error) {
              console.warn(`  ⚠️ Could not read file: ${relativeFilePath}`);
            }
          }
        }
      };
      
      await readDirectory(projectRoot);
    } catch (error) {
      console.error(`❌ Failed to synchronize VFS with disk:`, error);
      throw error;
    }
  }

  /**
   * Process template variables in content
   */
  private processTemplate(template: string, context: ProjectContext): string {
    return TemplateService.processTemplate(template, context);
  }

  /**
   * Execute a semantic action
   */
  private async executeSemanticAction(
    action: BlueprintAction, 
    context: ProjectContext, 
    blueprintContext: BlueprintContext
  ): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      switch (action.type) {
        case 'CREATE_FILE':
          if (!action.path) {
            return { success: false, error: 'CREATE_FILE action missing path' };
          }
          
          if (!action.content && !action.template) {
            return { success: false, error: 'CREATE_FILE action missing content or template' };
          }
          
          // Process template path
          const processedPath = this.processTemplate(action.path, context);
          
          let processedContent: string;
          if (action.template) {
            // Load template from marketplace
            // For now, use a placeholder - in a real implementation, this would load the template
            processedContent = `// Template: ${action.template}\n// TODO: Load template content`;
          } else {
            // Process inline content
            processedContent = this.processTemplate(action.content!, context);
          }
          
          // Create file in VFS
          blueprintContext.vfs.createFile(processedPath, processedContent);
          console.log(`  📝 Created file: ${processedPath}`);
          
          return { success: true, files: [processedPath] };
          
        case 'RUN_COMMAND':
          if (!action.command) {
            return { success: false, error: 'RUN_COMMAND action missing command' };
          }
          
          // Process template command
          const runCommand = this.processTemplate(action.command, context);
          console.log(`  ⚡ Executing command: ${runCommand}`);
          
          try {
            // Parse the command string into command and arguments
            const commandParts = runCommand.split(' ').filter(part => part.length > 0);
            if (commandParts.length === 0) {
              return { success: false, error: 'Empty command' };
            }
            
            const command = commandParts[0]!; // We know it exists because we checked length > 0
            const args = commandParts.slice(1).filter((arg): arg is string => typeof arg === 'string');
            
            // Execute the command using the command runner
            const commandArray: string[] = [command, ...args];
            const result = await this.commandRunner.execCommand(commandArray, {
              cwd: context.project.path || '.',
              verbose: true
            });
            
            console.log(`  ✅ Command executed successfully`);
            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`  ❌ Command execution error: ${errorMessage}`);
            return { success: false, error: errorMessage };
          }
          
        case 'INSTALL_PACKAGES':
          if (!action.packages) {
            return { success: false, error: 'INSTALL_PACKAGES action missing packages' };
          }
          
          // Process template packages (packages is an array, so we join them)
          const processedPackages = action.packages.map(pkg => this.processTemplate(pkg, context));
          console.log(`  📦 Installing packages: ${processedPackages.join(' ')}`);
          
          // For now, just log the packages (in a real implementation, this would install them)
          // TODO: Implement actual package installation
          
          return { success: true };
          
        case 'ADD_SCRIPT':
          if (!action.command || !action.name) {
            return { success: false, error: 'ADD_SCRIPT action missing command or name' };
          }
          
          // Process template command
          const scriptCommand = this.processTemplate(action.command, context);
          console.log(`  📝 Adding script '${action.name}': ${scriptCommand}`);
          
          // For now, just log the script (in a real implementation, this would add to package.json)
          // TODO: Implement actual script addition
          
          return { success: true };
          
        case 'ADD_ENV_VAR':
          if (!action.key || !action.value) {
            return { success: false, error: 'ADD_ENV_VAR action missing key or value' };
          }
          
          // Process template value
          const processedValue = this.processTemplate(action.value, context);
          console.log(`  🔧 Adding env var '${action.key}': ${processedValue}`);
          
          // For now, just log the env var (in a real implementation, this would add to .env)
          // TODO: Implement actual env var addition
          
          return { success: true };
          
        case 'ENHANCE_FILE':
          if (!action.path) {
            return { success: false, error: 'ENHANCE_FILE action missing path' };
          }
          
          // Process template path
          const enhancePath = this.processTemplate(action.path, context);
          
          let enhanceContent: string;
          if (action.params && action.params.content) {
            // Use inline content from params
            enhanceContent = this.processTemplate(action.params.content, context);
          } else if (action.template) {
            // Load template from marketplace
            enhanceContent = `// Template: ${action.template}\n// TODO: Load template content`;
          } else {
            return { success: false, error: 'ENHANCE_FILE action missing content or template' };
          }
          
          // Check if file exists in VFS, if not create it (fallback: create)
          if (!blueprintContext.vfs.fileExists(enhancePath)) {
            if (action.fallback === 'create') {
              blueprintContext.vfs.createFile(enhancePath, enhanceContent);
              console.log(`  📝 Created file (fallback): ${enhancePath}`);
            } else {
              return { success: false, error: `File ${enhancePath} does not exist and no fallback specified` };
            }
          } else {
            // File exists, enhance it by writing new content
            blueprintContext.vfs.writeFile(enhancePath, enhanceContent);
            console.log(`  🔧 Enhanced file: ${enhancePath}`);
          }
          
          return { success: true, files: [enhancePath] };
          
        default:
          return { success: false, error: `Unsupported action type: ${action.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Evaluate condition for conditional actions
   */
  private evaluateCondition(condition: string, context: ProjectContext): boolean {
    try {
      // Process template for condition evaluation
      const templateService = new TemplateService();
      const processedCondition = TemplateService.processTemplate(condition, context);
      
      // For now, just check if the condition evaluates to a truthy value
      // This is a simplified implementation
      return Boolean(processedCondition);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }
}

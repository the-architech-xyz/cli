/**
 * Blueprint Executor - Clean Implementation
 * 
 * Executes blueprints using the new three-layer architecture:
 * Layer 1: File Modification Engine (primitives)
 * Layer 2: Blueprint Orchestrator (translation)
 * Layer 3: Blueprint Executor (orchestration)
 */

import { Blueprint, BlueprintAction, BlueprintExecutionResult, GlobalContext, LegacyProjectContext, BlueprintContext } from '@thearchitech.xyz/types';
import { CommandRunner } from '../../../cli/command-runner.js';
import { logger } from '../../../utils/logger.js';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
import { FileModificationEngine } from '../../file-system/file-engine/file-modification-engine.js';
import { TemplateService } from '../../file-system/template/index.js';
import { ModuleFetcherService } from '../../module-management/fetcher/module-fetcher.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export class BlueprintExecutor {
  private commandRunner: CommandRunner;
  private currentAction: BlueprintAction | null = null;

  constructor(projectRoot: string, moduleFetcher: ModuleFetcherService) {
    this.commandRunner = new CommandRunner();
  }

  /**
   * Execute a blueprint
   */
  async executeBlueprint(blueprint: Blueprint, context: GlobalContext | LegacyProjectContext, blueprintContext?: BlueprintContext): Promise<BlueprintExecutionResult> {
    // Execute blueprint
    
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Create a new VFS for each blueprint execution (VFS per blueprint)
    let vfs: VirtualFileSystem | null;
    let shouldFlushVFS = false;
    
    if (blueprintContext) {
      vfs = blueprintContext.vfs;
    } else {
      const projectPath = 'project' in context ? context.project.path : (('projectRoot' in context) ? (context as any).projectRoot || '.' : '.');
      vfs = new (await import('../../file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${blueprint.id}`, projectPath);
      shouldFlushVFS = true;
    }
    
    // Process actions and expand dynamic ones
    const processedActions = await this.processDynamicActions(blueprint.actions, context);
    
    for (let i = 0; i < processedActions.length; i++) {
      const action = processedActions[i];
      
      if (!action) {
        errors.push(`Action at index ${i} is undefined`);
        continue;
      }
      
      // Check action condition before processing
      if (action.condition) {
        const shouldExecute = this.evaluateCondition(action.condition, context);
        if (!shouldExecute) {
          continue;
        }
      }
      
      // Set current action for context-aware processing
      this.currentAction = action;
      
      try {
        // Execute semantic action directly
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
        errors.push(`Action ${i + 1} failed: ${errorMessage}`);
      }
    }
    
    // Flush VFS to disk if we created it (VFS per blueprint)
    if (shouldFlushVFS && vfs) {
      try {
        await vfs.flushToDisk();
        // VFS flushed successfully
      } catch (error) {
        console.error(`❌ Failed to flush VFS:`, error);
        errors.push(`Failed to flush VFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
   * Process dynamic actions that need to be expanded based on context
   */
  private async processDynamicActions(actions: BlueprintAction[], context: GlobalContext | LegacyProjectContext): Promise<BlueprintAction[]> {
    const processedActions: BlueprintAction[] = [];
    
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      
      if (!action) {
        continue;
      }
      
      
      // Check if this action has a forEach property for dynamic expansion
      if ((action as any).forEach) {
        
        // Extract array of items from context using the forEach path
        const items = this.extractArrayFromContext((action as any).forEach, context);
        
        if (items.length === 0) {
          continue;
        }
        
        
        // Generate individual actions for each item
        for (const item of items) {
          const dynamicAction = this.createDynamicAction(action, item);
          processedActions.push(dynamicAction);
        }
      } else {
        // Regular action, add as-is
        processedActions.push(action);
      }
    }
    
    return processedActions;
  }

  /**
   * Create a dynamic action by replacing placeholders with the current item
   */
  private createDynamicAction(originalAction: BlueprintAction, item: string): BlueprintAction {
    const dynamicAction: BlueprintAction = {
      type: originalAction.type
    };
    
    // Copy all properties from the original action
    Object.keys(originalAction).forEach(key => {
      if (key !== 'forEach') {
        (dynamicAction as any)[key] = (originalAction as any)[key];
      }
    });
    
    // Replace placeholders in string properties
    if (dynamicAction.command) {
      dynamicAction.command = dynamicAction.command.replace(/\{\{item\}\}/g, item);
    }
    if (dynamicAction.path) {
      dynamicAction.path = dynamicAction.path.replace(/\{\{item\}\}/g, item);
    }
    if (dynamicAction.content) {
      dynamicAction.content = dynamicAction.content.replace(/\{\{item\}\}/g, item);
    }
    
    return dynamicAction;
  }

  /**
   * Extract array from context using dot notation path
   */
  private extractArrayFromContext(path: string, context: GlobalContext | LegacyProjectContext): string[] {
    try {
      if ('environment' in context) {
        const globalContext = context as GlobalContext;
        
        // Handle module parameters
        if (path.startsWith('module.parameters.')) {
          const paramPath = path.substring(18);
          const currentModule = globalContext.execution.currentModule;
          if (currentModule) {
            const moduleConfig = globalContext.modules.configurations.get(currentModule);
            const value = this.getNestedValueFromObject(moduleConfig?.parameters || {}, paramPath);
            if (Array.isArray(value)) {
              return value;
            }
          } else {
            // Try to find the module by looking for the shadcn-ui module
            for (const [moduleId, moduleConfig] of globalContext.modules.configurations.entries()) {
              if (moduleId.includes('shadcn-ui')) {
                const value = this.getNestedValueFromObject(moduleConfig?.parameters || {}, paramPath);
                if (Array.isArray(value)) {
                  return value;
                }
              }
            }
          }
        }
        
        // Handle other context paths
        const value = this.getNestedValueFromObject(globalContext, path);
        if (Array.isArray(value)) {
          return value;
        }
      } else {
        // Legacy context fallback
        const legacyContext = context as LegacyProjectContext;
        const value = this.getNestedValueFromObject(legacyContext, path);
        if (Array.isArray(value)) {
          return value;
        }
      }
    } catch (error) {
      console.warn(`Failed to extract array from context path '${path}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return [];
  }

  /**
   * Get nested value from object using dot notation (helper method)
   */
  private getNestedValueFromObject(obj: unknown, path: string): unknown {
    if (!path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && current !== null && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Process template variables in content
   */
  private processTemplate(template: string, context: GlobalContext | LegacyProjectContext): string {
    const result = TemplateService.processTemplate(template, context);
    return result;
  }


  /**
   * Check for config file conflicts (TypeScript vs JavaScript)   */
  private async checkConfigFileConflict(filePath: string, vfs: any, projectRoot: string): Promise<{ success: boolean; error?: string }> {
    // Check if this is a config file
    const configFiles = ['next.config', 'drizzle.config', 'tailwind.config', 'vitest.config', 'tsconfig'];
    const isConfigFile = configFiles.some(config => filePath.includes(config));
    
    if (!isConfigFile) {
      return { success: true };
    }
    
    // Check for conflicting extensions
    const pathWithoutExt = filePath.replace(/\.(js|ts|mjs|json)$/, '');
    const extensions = ['.js', '.ts', '.mjs', '.json'];
    
    for (const ext of extensions) {
      if (ext !== path.extname(filePath)) {
        const conflictPath = pathWithoutExt + ext;
        let fileExists = false;
        
        if (vfs) {
          // VFS mode
          fileExists = vfs.fileExists(conflictPath);
        } else {
          // Direct mode - check file system
          try {
            const fullPath = path.join(projectRoot, conflictPath);
            await fs.access(fullPath);
            fileExists = true;
          } catch {
            fileExists = false;
          }
        }
        
        if (fileExists) {
          return {
            success: false,
            error: `Conflict: ${conflictPath} already exists. The blueprint tried to create a conflicting ${path.extname(filePath)} version. Please use TypeScript (.ts) extensions for config files.`
          };
        }
      }
    }
    
    return { success: true };
  }

  /**
   * Execute a semantic action
   */
  private async executeSemanticAction(
    action: BlueprintAction, 
    context: GlobalContext | LegacyProjectContext, 
    blueprintContext: BlueprintContext
  ): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      switch (action.type) {
        case 'CREATE_FILE':
          if (!action.path || !action.content) {
            return { success: false, error: 'CREATE_FILE action missing path or content' };
          }
          
          // Process template path and content
          const processedPath = this.processTemplate(action.path, context);
          const processedContent = this.processTemplate(action.content, context);
          
          // Check for config file conflicts (TypeScript vs JavaScript)
          const conflictCheck = await this.checkConfigFileConflict(processedPath, blueprintContext.vfs, blueprintContext.projectRoot);
          if (!conflictCheck.success) {
            return { success: false, error: conflictCheck.error || 'Config file conflict detected' };
          }
          
          if (blueprintContext.vfs) {
            // Create file in VFS
            blueprintContext.vfs.createFile(processedPath, processedContent);
          } else {
            // Direct file creation for simple blueprints
            const fullPath = path.join(blueprintContext.projectRoot, processedPath);
            await fs.writeFile(fullPath, processedContent, 'utf-8');
          }
          
          return { success: true, files: [processedPath] };
          
        case 'RUN_COMMAND':
          if (!action.command) {
            return { success: false, error: 'RUN_COMMAND action missing command' };
          }
          
          // VFS should NOT be flushed during blueprint execution
          // VFS is flushed by the orchestrator between blueprints
          
          // Process template command
          const runCommand = this.processTemplate(action.command, context);
          
          // Actually execute the command
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            // Execute command in the project directory
            const projectRoot = blueprintContext.projectRoot;
            const { stdout, stderr } = await execAsync(runCommand, { 
              cwd: projectRoot,
              timeout: (action as any).timeout || 30000 // 30 second timeout by default
            });
            
            if (stdout) {
            }
            if (stderr) {
            }
            
            return { success: true };
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `Command execution failed: ${errorMessage}` };
          }
          
        case 'INSTALL_PACKAGES':
          if (!action.packages) {
            return { success: false, error: 'INSTALL_PACKAGES action missing packages' };
          }
          
          // Process template packages (packages is an array, so we join them)
          const processedPackages = action.packages.map(pkg => this.processTemplate(pkg, context));
          
          // Actually add packages to package.json using the package-json-merger
          try {
            const packageJsonPath = 'pathHandler' in context && context.pathHandler ? context.pathHandler.getPackageJsonPath() : 'package.json';
            
            // Convert packages array to dependencies object
            const dependencies: Record<string, string> = {};
            const devDependencies: Record<string, string> = {};
            
            for (const pkg of processedPackages) {
              // Parse package name and version from "package@version" format
              const match = pkg.match(/^(.+?)@(.+)$/);
              const packageName = match ? match[1] : pkg;
              const packageVersion = match ? match[2] : 'latest';
              
              // Skip if packageName is undefined (shouldn't happen, but safety check)
              if (!packageName || !packageVersion) continue;
              
              // Check if it's a dev dependency (starts with @types/ or common dev packages)
              const isDevDep = packageName.startsWith('@types/') || 
                              packageName.startsWith('@typescript-eslint/') ||
                              packageName.startsWith('eslint-') ||
                              packageName.startsWith('prettier') ||
                              packageName.startsWith('vitest') ||
                              packageName.startsWith('@vitejs/') ||
                              packageName.startsWith('typescript') ||
                              action.isDev === true;
              
              if (isDevDep) {
                devDependencies[packageName] = packageVersion;
              } else {
                dependencies[packageName] = packageVersion;
              }
            }
            
            // Use the package-json-merger to add dependencies
            const { PackageJsonMerger } = await import('../../file-system/modifiers/modifier-service.js');
            const { FileModificationEngine } = await import('../../file-system/file-engine/file-modification-engine.js');
            const engine = new FileModificationEngine(blueprintContext.vfs, context.project.path || '.');
            const merger = new PackageJsonMerger(engine);
            
            const result = await merger.execute(packageJsonPath, {
              dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
              devDependencies: Object.keys(devDependencies).length > 0 ? devDependencies : undefined
            }, this.createProjectContext(context));
            
            if (!result.success) {
              return { success: false, error: `Failed to add packages: ${result.error}` };
            }
            
            return { success: true };
            
          } catch (error) {
            return { success: false, error: `Failed to install packages: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
          
        case 'ADD_SCRIPT':
          if (!action.command || !action.name) {
            return { success: false, error: 'ADD_SCRIPT action missing command or name' };
          }
          
          // Process template command
          const scriptCommand = this.processTemplate(action.command, context);
          
          // Actually add script to package.json using the package-json-merger
          try {
            const packageJsonPath = 'pathHandler' in context && context.pathHandler ? context.pathHandler.getPackageJsonPath() : 'package.json';
            
            // Use the package-json-merger to add script
            const { PackageJsonMerger } = await import('../../file-system/modifiers/modifier-service.js');
            const { FileModificationEngine } = await import('../../file-system/file-engine/file-modification-engine.js');
            const engine = new FileModificationEngine(blueprintContext.vfs, context.project.path || '.');
            const merger = new PackageJsonMerger(engine);
            
            const result = await merger.execute(packageJsonPath, {
              scripts: {
                [action.name]: scriptCommand
              }
            }, this.createProjectContext(context));
            
            if (!result.success) {
              return { success: false, error: `Failed to add script: ${result.error}` };
            }
            
            return { success: true };
            
          } catch (error) {
            return { success: false, error: `Failed to add script: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
          
        case 'ADD_ENV_VAR':
          if (!action.key || !action.value) {
            return { success: false, error: 'ADD_ENV_VAR action missing key or value' };
          }
          
          // Process template value
          const processedValue = this.processTemplate(action.value, context);
          
          // Actually add environment variable to .env file
          try {
            const envPath = 'pathHandler' in context && context.pathHandler ? context.pathHandler.resolvePath('.env') : '.env';
            
            // Read existing .env file or create new one
            let envContent = '';
            try {
              envContent = await fs.readFile(envPath, 'utf-8');
            } catch (error) {
              // File doesn't exist, create new one
              envContent = '';
            }
            
            // Check if key already exists
            const keyRegex = new RegExp(`^${action.key}=.*$`, 'm');
            if (keyRegex.test(envContent)) {
              // Update existing key
              envContent = envContent.replace(keyRegex, `${action.key}=${processedValue}`);
            } else {
              // Add new key
              envContent += envContent.endsWith('\n') ? '' : '\n';
              envContent += `${action.key}=${processedValue}\n`;
            }
            
            // Write back to .env file
            await fs.writeFile(envPath, envContent);
            
            return { success: true };
            
          } catch (error) {
            return { success: false, error: `Failed to add environment variable: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
          
        case 'ENHANCE_FILE':
          if (!action.path || !action.modifier) {
            return { success: false, error: 'ENHANCE_FILE action missing path or modifier' };
          }
          
          // Process template path
          const enhancedPath = this.processTemplate(action.path, context);
          
          // Get the modifier registry
          const { getModifierRegistry } = await import('../../file-system/modifiers/modifier-registry.js');
          const modifierRegistry = getModifierRegistry();
          
          // Debug logging
          
          // Get the modifier
          const modifier = modifierRegistry.get(action.modifier);
          if (!modifier) {
            return { success: false, error: `Modifier '${action.modifier}' not found. Available modifiers: ${modifierRegistry.list().join(', ')}` };
          }
          
          
          // Read the file from VFS or disk
          let fileContent: string;
          if (blueprintContext.vfs) {
            fileContent = await blueprintContext.vfs.readFile(enhancedPath);
            if (!fileContent) {
              return { success: false, error: `File not found in VFS: ${enhancedPath}` };
            }
          } else {
            // Direct file read for simple blueprints
            const fullPath = path.join(blueprintContext.projectRoot, enhancedPath);
            try {
              fileContent = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
              return { success: false, error: `File not found: ${enhancedPath}` };
            }
          }
          
          // Execute the modifier
          try {
            const result = await modifier.handler(fileContent, action.params || {}, context);
            if (result.success) {
              if (blueprintContext.vfs) {
                // Write the enhanced content back to VFS
                blueprintContext.vfs.writeFile(enhancedPath, result.content);
              } else {
                // Direct file write for simple blueprints
                const fullPath = path.join(blueprintContext.projectRoot, enhancedPath);
                await fs.writeFile(fullPath, result.content, 'utf-8');
              }
              return { success: true, files: [enhancedPath] };
            } else {
              return { success: false, error: `Modifier execution failed: ${result.error}` };
            }
          } catch (error) {
            return { success: false, error: `Modifier execution error: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
          
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
   * Create ProjectContext from GlobalContext or LegacyProjectContext
   */
  private createProjectContext(context: GlobalContext | LegacyProjectContext): any {
    if ('environment' in context) {
      // GlobalContext - create a minimal ProjectContext
      const globalContext = context as GlobalContext;
      return {
        project: {
          name: globalContext.project.name,
          path: globalContext.environment.paths.projectRoot,
          framework: globalContext.project.framework.type,
          description: globalContext.project.description,
          version: globalContext.project.version,
          author: '',
          license: 'MIT'
        },
        module: { id: '', category: '', version: '', parameters: {} },
        pathHandler: null,
        adapter: null,
        framework: globalContext.project.framework.type,
        cliArgs: {},
        projectRoot: globalContext.environment.paths.projectRoot,
        modules: {}
      };
    } else {
      // LegacyProjectContext - return as is
      return context;
    }
  }

  /**
   * Evaluate condition for conditional actions
   */
  private evaluateCondition(condition: string, context: GlobalContext | LegacyProjectContext): boolean {
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

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
      const projectPath = 'project' in context ? context.project.path : (('projectRoot' in context) ? (context as any).projectRoot || '.' : '.');
      vfs = new (await import('../../file-system/file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${blueprint.id}`, projectPath);
      shouldFlushVFS = true;
    }
    
    for (let i = 0; i < blueprint.actions.length; i++) {
      const action = blueprint.actions[i];
      
      if (!action) {
        errors.push(`Action at index ${i} is undefined`);
        continue;
      }
      
      console.log(`  📋 [${i + 1}/${blueprint.actions.length}] ${action.type}`);
      console.log(`  🔍 Action path: ${action.path}`);
      console.log(`  🔍 Action condition: ${action.condition}`);
      
      // Check action condition before processing
      if (action.condition) {
        const shouldExecute = this.evaluateCondition(action.condition, context);
        console.log(`  🔍 Action condition evaluation: ${action.condition} = ${shouldExecute}`);
        if (!shouldExecute) {
          console.log(`  ⏭️ Skipping action due to condition: ${action.condition}`);
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
    if (shouldFlushVFS) {
      try {
        await vfs.flushToDisk();
        console.log(`✅ Blueprint VFS flushed to disk`);
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
   * Process template variables in content
   */
  private processTemplate(template: string, context: GlobalContext | LegacyProjectContext): string {
    console.log(`🔍 BlueprintExecutor.processTemplate called with: ${template}`);
    console.log(`🔍 Context pathHandler:`, 'pathHandler' in context ? !!context.pathHandler : 'N/A');
    const result = TemplateService.processTemplate(template, context);
    console.log(`🔍 BlueprintExecutor.processTemplate result: ${result}`);
    return result;
  }

  /**
   * Check for config file conflicts (TypeScript vs JavaScript)
   */
  private checkConfigFileConflict(filePath: string, vfs: any): { success: boolean; error?: string } {
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
        if (vfs.fileExists(conflictPath)) {
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
          const conflictCheck = this.checkConfigFileConflict(processedPath, blueprintContext.vfs);
          if (!conflictCheck.success) {
            return { success: false, error: conflictCheck.error || 'Config file conflict detected' };
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
          
          // Actually execute the command
          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            // Execute command in the project directory
            const projectRoot = 'pathHandler' in context && context.pathHandler ? context.pathHandler.getProjectRoot() : '.';
            const { stdout, stderr } = await execAsync(runCommand, { 
              cwd: projectRoot,
              timeout: (action as any).timeout || 30000 // 30 second timeout by default
            });
            
            if (stdout) {
              console.log(`  📤 Output: ${stdout}`);
            }
            if (stderr) {
              console.log(`  ⚠️  Stderr: ${stderr}`);
            }
            
            console.log(`  ✅ Command executed successfully`);
            return { success: true };
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`  ❌ Command failed: ${errorMessage}`);
            return { success: false, error: `Command execution failed: ${errorMessage}` };
          }
          
        case 'INSTALL_PACKAGES':
          if (!action.packages) {
            return { success: false, error: 'INSTALL_PACKAGES action missing packages' };
          }
          
          // Process template packages (packages is an array, so we join them)
          const processedPackages = action.packages.map(pkg => this.processTemplate(pkg, context));
          console.log(`  📦 Installing packages: ${processedPackages.join(' ')}`);
          
          // Actually add packages to package.json using the package-json-merger
          try {
            const packageJsonPath = 'pathHandler' in context && context.pathHandler ? context.pathHandler.getPackageJsonPath() : 'package.json';
            
            // Convert packages array to dependencies object
            const dependencies: Record<string, string> = {};
            const devDependencies: Record<string, string> = {};
            
            for (const pkg of processedPackages) {
              // Check if it's a dev dependency (starts with @types/ or common dev packages)
              const isDevDep = pkg.startsWith('@types/') || 
                              pkg.startsWith('@typescript-eslint/') ||
                              pkg.startsWith('eslint-') ||
                              pkg.startsWith('prettier') ||
                              pkg.startsWith('vitest') ||
                              pkg.startsWith('@vitejs/') ||
                              pkg.startsWith('typescript') ||
                              action.isDev === true;
              
              if (isDevDep) {
                devDependencies[pkg] = 'latest';
              } else {
                dependencies[pkg] = 'latest';
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
            
            console.log(`  ✅ Successfully added packages to package.json`);
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
          console.log(`  📝 Adding script '${action.name}': ${scriptCommand}`);
          
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
            
            console.log(`  ✅ Successfully added script '${action.name}' to package.json`);
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
          console.log(`  🔧 Adding env var '${action.key}': ${processedValue}`);
          
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
            
            console.log(`  ✅ Successfully added environment variable '${action.key}' to .env`);
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
          console.log(`  🔧 Enhancing file: ${enhancedPath} with modifier: ${action.modifier}`);
          
          // Get the modifier registry
          const { getModifierRegistry } = await import('../../file-system/modifiers/modifier-registry.js');
          const modifierRegistry = getModifierRegistry();
          
          // Debug logging
          console.log(`  🔍 Modifier registry size: ${modifierRegistry.size()}`);
          console.log(`  🔍 Available modifiers: ${modifierRegistry.list().join(', ')}`);
          console.log(`  🔍 Looking for modifier: ${action.modifier}`);
          
          // Get the modifier
          const modifier = modifierRegistry.get(action.modifier);
          if (!modifier) {
            return { success: false, error: `Modifier '${action.modifier}' not found. Available modifiers: ${modifierRegistry.list().join(', ')}` };
          }
          
          console.log(`  ✅ Found modifier: ${action.modifier}`);
          
          // Read the file from VFS
          const fileContent = await blueprintContext.vfs.readFile(enhancedPath);
          if (!fileContent) {
            return { success: false, error: `File not found in VFS: ${enhancedPath}` };
          }
          
          console.log(`  📖 Read file content (${fileContent.length} chars)`);
          
          // Execute the modifier
          try {
            const result = await modifier.handler(fileContent, action.params || {}, context);
            if (result.success) {
              // Write the enhanced content back to VFS
              blueprintContext.vfs.writeFile(enhancedPath, result.content);
              console.log(`  ✅ Enhanced file: ${enhancedPath}`);
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

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
   * Execute a blueprint
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
          if (!action.path || !action.content) {
            return { success: false, error: 'CREATE_FILE action missing path or content' };
          }
          
          // Process template path and content
          const processedPath = this.processTemplate(action.path, context);
          const processedContent = this.processTemplate(action.content, context);
          
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
          
          // For now, just log the command (in a real implementation, this would execute it)
          // TODO: Implement actual command execution
          
          return { success: true };
          
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

/**
 * Blueprint Executor - Clean Implementation
 * 
 * Executes blueprints using the new three-layer architecture:
 * Layer 1: File Modification Engine (primitives)
 * Layer 2: Blueprint Orchestrator (translation)
 * Layer 3: Blueprint Executor (orchestration)
 */

import { Blueprint, BlueprintAction, BlueprintExecutionResult } from '../../../types/adapter.js';
import { ProjectContext } from '../../../types/agent.js';
import { BlueprintContext } from '../../../types/blueprint-context.js';
import { CommandRunner } from '../../cli/command-runner.js';
import { logger } from '../../utils/logger.js';
import { BlueprintOrchestrator } from '../blueprint-orchestrator/index.js';
import { VirtualFileSystem } from '../file-engine/virtual-file-system.js';
import { FileModificationEngine } from '../file-engine/file-modification-engine.js';
import { TemplateService } from '../template/index.js';

export class BlueprintExecutor {
  private commandRunner: CommandRunner;
  private orchestrator: BlueprintOrchestrator;
  private currentAction: BlueprintAction | null = null;

  constructor(projectRoot: string) {
    this.commandRunner = new CommandRunner();
    this.orchestrator = new BlueprintOrchestrator(projectRoot);
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
      vfs = new (await import('../file-engine/virtual-file-system.js')).VirtualFileSystem(`blueprint-${blueprint.id}`, context.project.path || '.');
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
        // Use orchestrator for all semantic actions with the shared VFS
        const result = await this.orchestrator.executeSemanticAction(action, context, {
          vfs,
          projectRoot: context.project.path || '.',
          externalFiles: []
        });
        
        if (result.success) {
          files.push(...result.files);
          warnings.push(...result.warnings);
        } else {
          errors.push(...result.errors);
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
   * Evaluate condition for conditional actions
   */
  private evaluateCondition(condition: string, context: ProjectContext): boolean {
    try {
      // Use the orchestrator's template processing for consistent condition evaluation
      const processedCondition = this.orchestrator.processTemplate(condition, context);
      
      // For now, just check if the condition evaluates to a truthy value
      // This is a simplified implementation
      return Boolean(processedCondition);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }
}

/**
 * Blueprint Executor - Intelligent Foreman
 * 
 * Implements the Executor-Centric architecture:
 * - Analyzes blueprints to determine VFS need
 * - Creates VFS only when necessary
 * - Delegates actions to specialized handlers
 * - Manages VFS lifecycle
 */

import { Blueprint, BlueprintExecutionResult, ProjectContext, BlueprintAction } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
import { ModifierRegistry } from '../../file-system/modifiers/modifier-registry.js';
import { PackageJsonMergerModifier } from '../../file-system/modifiers/package-json-merger.js';
import { TsconfigEnhancerModifier } from '../../file-system/modifiers/tsconfig-enhancer.js';
import { BlueprintAnalyzer } from '../../project/blueprint-analyzer/index.js';
import { ActionHandlerRegistry } from './action-handlers/index.js';
import { ArchitechError, ArchitechErrorCode } from '../../infrastructure/error/architech-error.js';

// Simple modifier interface for now
interface ModifierDefinition {
  execute: (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export class BlueprintExecutor {
  private modifierRegistry: ModifierRegistry;
  private actionHandlerRegistry: ActionHandlerRegistry;
  private blueprintAnalyzer: BlueprintAnalyzer;

  constructor(projectRoot: string) {
    this.modifierRegistry = new ModifierRegistry();
    this.initializeModifiers();
    this.actionHandlerRegistry = new ActionHandlerRegistry(this.modifierRegistry);
    this.blueprintAnalyzer = new BlueprintAnalyzer();
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
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
        const modifier = new PackageJsonMergerModifier(engine);
        return await modifier.execute(filePath, params, context);
      }
    });

    this.modifierRegistry.register('tsconfig-enhancer', {
      execute: async (filePath: string, params: any, context: ProjectContext, vfs?: VirtualFileSystem) => {
        if (!vfs) {
          return { success: false, error: 'VFS required for tsconfig-enhancer' };
        }
        const engine = new (await import('../../file-system/file-engine/file-modification-engine.js')).FileModificationEngine(vfs, context.project.path || '.');
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
          // Simple CSS enhancement: append new styles to existing CSS file
          const existingContent = await vfs.readFile(filePath);
          const newContent = params.content || params.styles || '';
          
          // Append new content to existing content
          const enhancedContent = existingContent + '\n\n' + newContent;
          vfs.writeFile(filePath, enhancedContent);
          
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
  }

  /**
   * Execute a blueprint using the Intelligent Foreman pattern
   * 1. Analyze blueprint to determine VFS need
   * 2. Create VFS only if needed
   * 3. Delegate actions to specialized handlers
   * 4. Flush VFS only if we created it
   */
  async executeBlueprint(blueprint: Blueprint, context: ProjectContext, sharedVFS?: VirtualFileSystem): Promise<BlueprintExecutionResult> {
    console.log(`🎯 Executing blueprint: ${blueprint.name}`);
    
    // DEBUG: Log the ENTIRE blueprint object
    console.log(`🔍 DEBUG: COMPLETE BLUEPRINT OBJECT:`, JSON.stringify(blueprint, null, 2));
    
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Analyze blueprint to determine VFS need
      const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint, context);
      
      let vfs: VirtualFileSystem | null = null;
      let shouldFlushVFS = false;
    
      if (analysis.needVFS) {
        // 2. Use shared VFS if provided, otherwise create new VFS
        if (sharedVFS) {
          vfs = sharedVFS;
          shouldFlushVFS = false; // Don't flush shared VFS
          console.log(`🗂️ VFS Mode: Using shared VFS for ${blueprint.name}`);
        } else {
          vfs = new VirtualFileSystem(`blueprint-${blueprint.id}`, context.project.path || '.');
          shouldFlushVFS = true;
          console.log(`🗂️ VFS Mode: Created VFS for ${blueprint.name}`);
        }
      } else {
        console.log(`💾 Direct Mode: No VFS needed for ${blueprint.name}`);
      }
      
      // 3. Execute actions in two phases:
      // Phase 1: RUN_COMMAND actions (Direct Mode) - these create files on disk
      // Phase 2: All other actions (VFS Mode if needed)
      
      const runCommandActions: BlueprintAction[] = [];
      const otherActions: BlueprintAction[] = [];
      
      for (const action of blueprint.actions) {
        if (action.type === 'RUN_COMMAND') {
          runCommandActions.push(action);
        } else {
          otherActions.push(action);
        }
      }
      
      // Phase 1: Execute RUN_COMMAND actions first (Direct Mode)
      for (const action of runCommandActions) {
        console.log(`  ⚡ Executing RUN_COMMAND action: ${action.command}`);
        const result = await this.actionHandlerRegistry.handleAction(action, context, context.project.path || '.', undefined);
        
        if (!result.success) {
          const error = ArchitechError.blueprintExecutionFailed(
            blueprint.id,
            result.error || 'RUN_COMMAND action failed'
          );
          errors.push(error.getUserMessage());
          console.log(`    ❌ RUN_COMMAND failed: ${error.getDebugMessage()}`);
          
          // FAIL FAST: Return immediately when RUN_COMMAND fails
          return {
            success: false,
            files,
            errors,
            warnings
          };
        } else {
          console.log(`    ✅ RUN_COMMAND completed: ${result.message || 'Command executed'}`);
        }
      }
      
      // Phase 2: Initialize VFS with files that now exist on disk
      if (vfs && analysis.filesToRead.length > 0) {
        console.log(`🔄 VFS: Initializing with files after RUN_COMMAND phase...`);
        console.log(`🔍 DEBUG VFS: Files to pre-load: [${analysis.filesToRead.join(', ')}]`);
        await vfs.initializeWithFiles(analysis.filesToRead);
        console.log(`🔍 DEBUG VFS: After pre-loading, VFS contains: [${vfs.getAllFiles().join(', ')}]`);
      }
      
      // Phase 3: Execute all other actions (VFS Mode if needed)
      for (const action of otherActions) {
        console.log(`  🔧 Executing action: ${action.type}`);
        
        const result = await this.actionHandlerRegistry.handleAction(action, context, context.project.path || '.', vfs || undefined);
        
        if (!result.success) {
          const error = ArchitechError.blueprintExecutionFailed(
            blueprint.id,
            result.error || 'Unknown action error'
          );
          errors.push(error.getUserMessage());
          console.log(`    ❌ Action failed: ${error.getDebugMessage()}`);
          continue;
        }
        
          if (result.files) {
            files.push(...result.files);
        }
        
        console.log(`    ✅ Action completed: ${result.message || action.type}`);
      }
      
      // 4. Flush VFS only if we created it
      if (shouldFlushVFS && vfs) {
      try {
        await vfs.flushToDisk();
          console.log(`💾 VFS flushed to disk`);
      } catch (error) {
          const architechError = ArchitechError.internalError(
            `VFS flush failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { operation: 'vfs_flush', moduleId: blueprint.id }
          );
          errors.push(architechError.getUserMessage());
          console.log(`❌ VFS flush failed: ${architechError.getDebugMessage()}`);
        }
      }
      
      return {
        success: errors.length === 0,
        files,
        errors,
        warnings
      };
      
    } catch (error) {
      console.error(`🔍 DEBUG CATCH: blueprint = ${blueprint ? blueprint.id : 'undefined'}`);
      console.error(`🔍 DEBUG CATCH: error = ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`🔍 DEBUG CATCH: error stack = ${error instanceof Error ? error.stack : 'No stack'}`);
      
      const architechError = ArchitechError.internalError(
        `Blueprint execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'blueprint_execution', moduleId: blueprint?.id || 'unknown' }
      );
      console.error(`❌ Blueprint execution failed: ${architechError.getDebugMessage()}`);
      
      return { 
        success: false, 
        files,
        errors: [architechError.getUserMessage()],
        warnings
      };
    }
  }
}

/**
 * Blueprint Executor - Intelligent Foreman
 * 
 * Implements the Executor-Centric architecture:
 * - Analyzes blueprints to determine VFS need
 * - Creates VFS only when necessary
 * - Delegates actions to specialized handlers
 * - Manages VFS lifecycle
 */

import { Blueprint, BlueprintExecutionResult, ProjectContext } from '@thearchitech.xyz/types';
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
  }

  /**
   * Execute a blueprint using the Intelligent Foreman pattern
   * 1. Analyze blueprint to determine VFS need
   * 2. Create VFS only if needed
   * 3. Delegate actions to specialized handlers
   * 4. Flush VFS only if we created it
   */
  async executeBlueprint(blueprint: Blueprint, context: ProjectContext): Promise<BlueprintExecutionResult> {
    console.log(`🎯 Executing blueprint: ${blueprint.name}`);
    
    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. Analyze blueprint to determine VFS need
      const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint, context);
      
      let vfs: VirtualFileSystem | null = null;
    let shouldFlushVFS = false;
    
      if (analysis.needVFS) {
        // 2. Create VFS only if needed
        vfs = new VirtualFileSystem(`blueprint-${blueprint.id}`, context.project.path || '.');
        shouldFlushVFS = true;
        console.log(`🗂️ VFS Mode: Created VFS for ${blueprint.name}`);
    } else {
        console.log(`💾 Direct Mode: No VFS needed for ${blueprint.name}`);
      }
      
      // 3. Execute all actions using specialized handlers
      for (const action of blueprint.actions) {
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
      const architechError = ArchitechError.internalError(
        `Blueprint execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'blueprint_execution', moduleId: blueprint.id }
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

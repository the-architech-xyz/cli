/**
 * Agent Execution Service
 * 
 * Handles agent execution, VFS management, and result aggregation.
 * Extracted from OrchestratorAgent to improve separation of concerns.
 */

import { Module, ProjectContext, AgentResult, BlueprintContext, Blueprint } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../file-system/file-engine/virtual-file-system.js';
import { BlueprintAnalyzer } from '../../project/blueprint-analyzer/blueprint-analyzer.js';
import { ErrorHandler, ErrorCode } from '../../infrastructure/error/index.js';
import { BaseAgent } from '@thearchitech.xyz/types';

export interface ExecutionStrategy {
  needsVFS: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  reasons: string[];
}

export interface ModuleExecutionResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
  executionTime: number;
  strategy: ExecutionStrategy;
}

export class AgentExecutionService {
  private blueprintAnalyzer: BlueprintAnalyzer;
  private agents: Map<string, unknown>;

  constructor(agents: Map<string, unknown>) {
    this.blueprintAnalyzer = new BlueprintAnalyzer();
    this.agents = agents;
  }

  /**
   * Execute a single module with the appropriate strategy
   */
  async executeModule(
    module: Module,
    context: ProjectContext,
    blueprint: Blueprint,
    projectRoot: string
  ): Promise<ModuleExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Analyze blueprint to determine execution strategy
      const analysis = this.blueprintAnalyzer.analyzeBlueprint(blueprint);
      const strategy: ExecutionStrategy = {
        needsVFS: analysis.allRequiredFiles.length > 0,
        complexity: analysis.allRequiredFiles.length > 5 ? 'complex' : analysis.allRequiredFiles.length > 2 ? 'moderate' : 'simple',
        reasons: [`Requires ${analysis.allRequiredFiles.length} files`, ...(analysis.contextualFiles.length > 0 ? ['Uses contextual files'] : [])]
      };

      console.log(`🔍 Blueprint analysis: ${strategy.complexity} complexity, VFS needed: ${strategy.needsVFS}`);
      console.log(`📋 Reasons: ${strategy.reasons.join(', ')}`);

      let result: AgentResult;

      if (strategy.needsVFS) {
        // Complex execution path - use VFS
        result = await this.executeWithVFS(module, context, blueprint, projectRoot);
      } else {
        // Simple execution path - direct to disk
        result = await this.executeSimple(module, context, blueprint, projectRoot);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        files: result.files,
        errors: result.errors,
        warnings: result.warnings,
        executionTime,
        strategy
      };
    } catch (error) {
      const errorResult = ErrorHandler.handleAgentError(
        error,
        module.category,
        module.id
      );

      return {
        success: false,
        files: [],
        errors: [errorResult.error],
        warnings: [],
        executionTime: Date.now() - startTime,
        strategy: {
          needsVFS: false,
          complexity: 'simple',
          reasons: ['Error occurred during execution']
        }
      };
    }
  }

  /**
   * Execute module with VFS (complex operations)
   */
  private async executeWithVFS(
    module: Module,
    context: ProjectContext,
    blueprint: Blueprint,
    projectRoot: string
  ): Promise<AgentResult> {
    // Create new VFS for this blueprint with proper isolation
    const vfs = new VirtualFileSystem(module.id, projectRoot);

    // Pre-load external files if specified
    await this.preloadExternalFiles(vfs, module.externalFiles || [], projectRoot);

    // Create blueprint context
    const blueprintContext: BlueprintContext = {
      vfs,
      projectRoot,
      externalFiles: module.externalFiles || []
    };

    // Get the appropriate agent
    const agent = this.agents.get(module.category);
    if (!agent) {
      throw new Error(`No agent found for category: ${module.category}`);
    }

    // Execute the module with the agent and blueprint context
    const moduleResult = await (agent as { execute: (module: Module, context: ProjectContext, blueprintContext?: BlueprintContext) => Promise<AgentResult> }).execute(module, context, blueprintContext);

    if (moduleResult.success) {
      // Flush VFS to disk for this blueprint
      console.log(`💾 Flushing VFS to disk for ${module.id}...`);
      await vfs.flushToDisk();
      console.log(`✅ VFS flushed for ${module.id}`);
    }

    return moduleResult;
  }

  /**
   * Execute module with simple file operations (no VFS)
   */
  private async executeSimple(
    module: Module,
    context: ProjectContext,
    blueprint: Blueprint,
    projectRoot: string
  ): Promise<AgentResult> {
    console.log(`⚡ Executing simple blueprint: ${module.id} (direct to disk)`);

    const files: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Execute each action directly
      for (let i = 0; i < blueprint.actions.length; i++) {
        const action = blueprint.actions[i];
        if (!action) {
          errors.push(`Action at index ${i} is undefined`);
          break;
        }

        console.log(`  📋 [${i + 1}/${blueprint.actions.length}] ${action.type}`);

        // Simple action execution (replacing SimpleFileExecutor)
        const result = await this.executeSimpleAction(action, projectRoot);

        if (result.success) {
          files.push(...result.files);
        } else {
          errors.push(result.error || 'Unknown error');
          break; // Stop on first error
        }
      }

      return {
        success: errors.length === 0,
        files,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        files: [],
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Execute a simple action directly to disk
   */
  private async executeSimpleAction(action: any, projectRoot: string): Promise<{ success: boolean; files: string[]; error?: string }> {
    try {
      const files: string[] = [];
      
      switch (action.type) {
        case 'CREATE_FILE':
          const filePath = require('path').join(projectRoot, action.path);
          const dir = require('path').dirname(filePath);
          await require('fs').promises.mkdir(dir, { recursive: true });
          await require('fs').promises.writeFile(filePath, action.content || '');
          files.push(action.path);
          break;
          
        case 'RUN_COMMAND':
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          await execAsync(action.command, { cwd: projectRoot });
          break;
          
        default:
          return { success: false, files: [], error: `Unsupported action type: ${action.type}` };
      }
      
      return { success: true, files };
    } catch (error) {
      return { 
        success: false, 
        files: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Pre-load external files into VFS
   */
  private async preloadExternalFiles(
    vfs: VirtualFileSystem,
    externalFiles: string[],
    projectRoot: string
  ): Promise<void> {
    for (const filePath of externalFiles) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(projectRoot, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        await vfs.writeFile(filePath, content);
        console.log(`📁 Pre-loaded external file: ${filePath}`);
      } catch (error) {
        // File doesn't exist, skip silently
        console.log(`⚠️ External file not found: ${filePath}`);
      }
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(results: ModuleExecutionResult[]): {
    totalModules: number;
    successfulModules: number;
    failedModules: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    vfsModules: number;
    simpleModules: number;
  } {
    const totalModules = results.length;
    const successfulModules = results.filter(r => r.success).length;
    const failedModules = totalModules - successfulModules;
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = totalModules > 0 ? totalExecutionTime / totalModules : 0;
    const vfsModules = results.filter(r => r.strategy.needsVFS).length;
    const simpleModules = results.filter(r => !r.strategy.needsVFS).length;

    return {
      totalModules,
      successfulModules,
      failedModules,
      totalExecutionTime,
      averageExecutionTime,
      vfsModules,
      simpleModules
    };
  }
}

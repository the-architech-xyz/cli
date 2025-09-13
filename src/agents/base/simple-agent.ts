/**
 * Simple Agent Base Class
 * 
 * Base class for all agents in The Architech
 * Provides common functionality for agent execution
 */

import { Agent, Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { BlueprintContext } from '../../types/blueprint-context.js';
import { AdapterLoader } from '../../core/services/adapter/adapter-loader.js';
import { BlueprintExecutor } from '../../core/services/blueprint/blueprint-executor.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export abstract class SimpleAgent implements Agent {
  public category: string;
  protected adapterLoader: AdapterLoader;
  protected blueprintExecutor?: BlueprintExecutor;
  protected pathHandler: PathHandler;

  constructor(category: string, pathHandler: PathHandler) {
    this.category = category;
    this.pathHandler = pathHandler;
    this.adapterLoader = new AdapterLoader();
  }

  /**
   * Execute a module (implemented by subclasses)
   */
  abstract execute(module: Module, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<AgentResult>;

  /**
   * Get the category this agent handles
   */
  getCategory(): string {
    return this.category;
  }

  /**
   * Load and execute an adapter for a module
   */
  protected async executeAdapter(module: Module, context: ProjectContext, blueprintContext?: BlueprintContext): Promise<AgentResult> {
    try {
      console.log(`  🔧 Loading adapter: ${module.category}/${module.id}`);
      
      // Load the adapter - extract adapter ID from module ID
      const adapterId = module.id.split('/').pop() || module.id;
      const adapter = await this.adapterLoader.loadAdapter(module.category, adapterId);
      
      console.log(`  📋 Executing blueprint: ${adapter.blueprint.name}`);
      
      // Create blueprint executor
      this.blueprintExecutor = new BlueprintExecutor(context.project.path || '.');
      
      // Execute the blueprint with blueprint context
      const result = await this.blueprintExecutor!.executeBlueprint(adapter.blueprint, context, blueprintContext);
      
      if (result.success) {
        console.log(`  ✅ Adapter ${module.id} completed successfully`);
        return {
          success: true,
          files: result.files,
          errors: [],
          warnings: result.warnings
        };
      } else {
        console.error(`  ❌ Adapter ${module.id} failed: ${result.errors.join(', ')}`);
        return {
          success: false,
          files: [],
          errors: result.errors,
          warnings: result.warnings
        };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ❌ Failed to execute adapter ${module.id}: ${errorMessage}`);
      
      return {
        success: false,
        files: [],
        errors: [`Failed to execute adapter ${module.id}: ${errorMessage}`],
        warnings: []
      };
    }
  }

  /**
   * Validate module parameters
   */
  protected validateModule(module: Module): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!module.id) {
      errors.push('Module must have an id');
    }
    
    if (!module.category) {
      errors.push('Module must have a category');
    }
    
    if (!module.version) {
      errors.push('Module must have a version');
    }
    
    if (!module.parameters || typeof module.parameters !== 'object') {
      errors.push('Module must have parameters object');
    }
    
    // Category-specific validation
    if (module.category !== this.category) {
      errors.push(`Module category ${module.category} does not match agent category ${this.category}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get path handler
   */
  protected getPathHandler(): PathHandler {
    return this.pathHandler;
  }
}
/**
 * Content Agent
 * 
 * Handles content management and internationalization setup
 * Manages translations, content localization, and i18n configuration
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { ProjectContext, AgentResult } from '../../types/agent.js';
import { Module } from '../../types/recipe.js';
import { AdapterLoader } from '../../core/services/adapter/adapter-loader.js';
import { BlueprintExecutor } from '../../core/services/blueprint/blueprint-executor.js';

export class ContentAgent extends SimpleAgent {
  public category = 'content';

  constructor(pathHandler: any) {
    super('content', pathHandler);
  }

  /**
   * Execute content module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🌍 Content Agent executing: ${module.id}`);
    
    try {
      // Load adapter - extract adapter ID from module ID
      const adapterLoader = new AdapterLoader();
      const adapterId = module.id.split('/').pop() || module.id;
      const adapter = await adapterLoader.loadAdapter(this.category, adapterId);
      
      if (!adapter) {
        return {
          success: false,
          files: [],
          errors: [`Failed to load content adapter: ${module.id}`],
          warnings: []
        };
      }

      console.log(`  🔧 Loading adapter: ${this.category}/${module.id}`);
      console.log(`  📋 Executing blueprint: ${adapter.blueprint.name}`);

      // Execute blueprint
      const blueprintExecutor = new BlueprintExecutor(context.project.path || '.');
      const result = await blueprintExecutor.executeBlueprint(adapter.blueprint, context);

      if (result.success) {
        console.log(`  ✅ Adapter ${module.id} completed successfully`);
        return {
          success: true,
          files: result.files,
          errors: [],
          warnings: result.warnings || []
        };
      } else {
        console.log(`  ❌ Adapter ${module.id} failed: ${result.errors.join(', ')}`);
        return {
          success: false,
          files: result.files,
          errors: result.errors,
          warnings: result.warnings || []
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ❌ Content Agent failed: ${errorMessage}`);
      
      return {
        success: false,
        files: [],
        errors: [`Content Agent execution failed: ${errorMessage}`],
        warnings: []
      };
    }
  }
}

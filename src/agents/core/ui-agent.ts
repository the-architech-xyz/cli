/**
 * UI Agent
 * 
 * Handles UI component modules (Shadcn/ui, Chakra UI, etc.)
 * Responsible for setting up UI component libraries
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export class UIAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('ui', pathHandler);
  }

  /**
   * Execute a UI module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🎨 UI Agent executing: ${module.id}`);
    
    // Validate basic module structure only
    const validation = this.validateModule(module);
    if (!validation.valid) {
      return {
        success: false,
        files: [],
        errors: validation.errors,
        warnings: []
      };
    }
    
    // Execute the adapter (adapter handles its own validation)
    return await this.executeAdapter(module, context);
  }

}

/**
 * Framework Agent
 * 
 * Handles framework modules (Next.js, React, Vue, etc.)
 * Responsible for setting up the base framework structure
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export class FrameworkAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('framework', pathHandler);
  }

  /**
   * Execute a framework module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🏗️ Framework Agent executing: ${module.id}`);
    
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

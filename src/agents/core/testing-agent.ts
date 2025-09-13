/**
 * Testing Agent
 * 
 * Handles testing modules (Vitest, Jest, etc.)
 * Responsible for setting up testing frameworks
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export class TestingAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('testing', pathHandler);
  }

  /**
   * Execute a testing module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🧪 Testing Agent executing: ${module.id}`);
    
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

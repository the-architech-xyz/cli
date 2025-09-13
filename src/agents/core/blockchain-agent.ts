/**
 * Blockchain Agent
 * 
 * Handles blockchain integration modules (Web3, Ethers, Wallet Connect, etc.)
 * Responsible for setting up blockchain interactions and wallet connections
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export class BlockchainAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('blockchain', pathHandler);
  }

  /**
   * Execute a blockchain module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`⛓️ Blockchain Agent executing: ${module.id}`);
    
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

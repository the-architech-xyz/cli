/**
 * Framework Agent
 * 
 * Handles framework modules (Next.js, React, Vue, etc.)
 * Responsible for setting up the base framework structure
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '@thearchitech.xyz/types';
import { PathService } from '../../core/services/path/path-service.js';
import { ModuleFetcherService } from '../../core/services/module-management/fetcher/module-fetcher.js';

export class FrameworkAgent extends SimpleAgent {
  constructor(pathHandler: PathService, moduleFetcher: ModuleFetcherService) {
    super('framework', pathHandler, moduleFetcher);
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

/**
 * UI Agent
 * 
 * Handles UI component modules (Shadcn/ui, Chakra UI, etc.)
 * Responsible for setting up UI component libraries
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '@thearchitech.xyz/types';
import { PathService } from '../../core/services/path/path-service.js';
import { ModuleFetcherService } from '../../core/services/module-management/fetcher/module-fetcher.js';

export class UIAgent extends SimpleAgent {
  constructor(pathHandler: PathService, moduleFetcher: ModuleFetcherService) {
    super('ui', pathHandler, moduleFetcher);
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

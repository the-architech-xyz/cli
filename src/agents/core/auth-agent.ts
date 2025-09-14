/**
 * Auth Agent
 * 
 * Handles authentication modules (Better Auth, NextAuth, etc.)
 * Responsible for setting up authentication systems
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '@thearchitech.xyz/types';
import { PathService } from '../../core/services/path/path-service.js';
import { ModuleFetcherService } from '../../core/services/module-management/fetcher/module-fetcher.js';

export class AuthAgent extends SimpleAgent {
  constructor(pathHandler: PathService, moduleFetcher: ModuleFetcherService) {
    super('auth', pathHandler, moduleFetcher);
  }

  /**
   * Execute an auth module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🔐 Auth Agent executing: ${module.id}`);
    
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

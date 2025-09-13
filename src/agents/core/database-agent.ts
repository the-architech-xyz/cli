/**
 * Database Agent
 * 
 * Handles database modules (Drizzle, Prisma, etc.)
 * Responsible for setting up database connections and schemas
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { Module, ProjectContext, AgentResult } from '../../types/agent.js';
import { PathHandler } from '../../core/services/path/path-handler.js';

export class DatabaseAgent extends SimpleAgent {
  constructor(pathHandler: PathHandler) {
    super('database', pathHandler);
  }

  /**
   * Execute a database module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    console.log(`🗄️ Database Agent executing: ${module.id}`);
    
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

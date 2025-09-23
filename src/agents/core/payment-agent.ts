/**
 * Payment Agent
 * 
 * Handles payment processing and monetization setup
 * Manages Stripe integration, subscriptions, and payment flows
 */

import { SimpleAgent } from '../base/simple-agent.js';
import { ProjectContext, AgentResult, Module } from '@thearchitech.xyz/types';
import { AdapterLoader } from '../../core/services/module-management/adapter/adapter-loader.js';
import { BlueprintExecutor } from '../../core/services/execution/blueprint/blueprint-executor.js';
import { PathService } from '../../core/services/path/path-service.js';
import { ModuleFetcherService } from '../../core/services/module-management/fetcher/module-fetcher.js';

export class PaymentAgent extends SimpleAgent {
  public category = 'payment';

  constructor(pathHandler: PathService, moduleFetcher: ModuleFetcherService) {
    super('payment', pathHandler, moduleFetcher);
  }

  /**
   * Execute payment module
   */
  async execute(module: Module, context: ProjectContext): Promise<AgentResult> {
    
    try {
      // Load adapter - extract adapter ID from module ID
      const adapterLoader = new AdapterLoader(this.moduleFetcher);
      const adapterId = module.id.split('/').pop() || module.id;
      const adapter = await adapterLoader.loadAdapter(this.category, adapterId);
      
      if (!adapter) {
        return {
          success: false,
          files: [],
          errors: [`Failed to load payment adapter: ${module.id}`],
          warnings: []
        };
      }


      // Execute blueprint
      const blueprintExecutor = new BlueprintExecutor(context.project.path || '.', this.moduleFetcher);
      const result = await blueprintExecutor.executeBlueprint(adapter.blueprint, context);

      if (result.success) {
        return {
          success: true,
          files: result.files,
          errors: [],
          warnings: result.warnings || []
        };
      } else {
        return {
          success: false,
          files: result.files,
          errors: result.errors,
          warnings: result.warnings || []
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        files: [],
        errors: [`Payment Agent execution failed: ${errorMessage}`],
        warnings: []
      };
    }
  }
}

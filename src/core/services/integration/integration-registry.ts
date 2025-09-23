/**
 * Integration Feature Registry
 * 
 * Manages integration features that connect adapters with frameworks.
 * Now uses dynamic analysis from the marketplace instead of hardcoded integrations.
 */

import { IntegrationAdapter } from '@thearchitech.xyz/types';
import { IntegrationLoaderService } from '../module-management/integration/integration-loader.js';
import { createRequire } from 'module';
import * as path from 'path';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationAdapter> = new Map();
  private integrationLoader: IntegrationLoaderService;
  private isInitialized: boolean = false;

  constructor() {
    // Get marketplace path (same logic as ModuleFetcherService)
    const localMarketplacePath = process.env.LOCAL_MARKETPLACE_PATH;
    
    let marketplacePath: string;
    if (localMarketplacePath) {
      marketplacePath = localMarketplacePath;
    } else {
      try {
        const require = createRequire(import.meta.url);
        const packagePath = require.resolve('@thearchitech.xyz/marketplace');
        // Get the directory containing the package, not the main file
        marketplacePath = path.dirname(packagePath);
      } catch (error) {
        throw new Error('@thearchitech.xyz/marketplace package not found. Please install it or set LOCAL_MARKETPLACE_PATH for development.');
      }
    }
    
    this.integrationLoader = new IntegrationLoaderService(marketplacePath);
  }

  /**
   * Initialize the registry by loading all integrations from marketplace
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const integrations = await this.integrationLoader.loadAllIntegrations();
      
      for (const integration of integrations) {
        this.integrations.set(integration.id, integration);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error(`❌ Failed to initialize integration registry: ${error}`);
      throw error;
    }
  }

  /**
   * Register an integration adapter
   */
  register(integration: IntegrationAdapter): void {
    this.integrations.set(integration.id, integration);
  }

  /**
   * Get integration adapter by ID
   */
  async get(id: string): Promise<IntegrationAdapter | undefined> {
    // Ensure registry is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.integrations.get(id);
  }

  /**
   * Get all registered integrations
   */
  getAll(): IntegrationAdapter[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Check if integration exists
   */
  has(id: string): boolean {
    return this.integrations.has(id);
  }

  /**
   * Clear all integrations
   */
  clear(): void {
    this.integrations.clear();
  }
}


/**
 * Integration Feature Registry
 * 
 * Manages integration features that connect adapters with frameworks.
 * Now uses dynamic analysis from the marketplace instead of hardcoded integrations.
 */

import { IntegrationAdapter } from '@thearchitech.xyz/types';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationAdapter> = new Map();

  constructor() {
    // V2: Integrations are now loaded dynamically from the marketplace
    // No need for hardcoded integrations
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


/**
 * Integration Loader Service
 * 
 * Loads integration adapters from the marketplace repository.
 * Handles both adapter and integration module discovery and loading.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { IntegrationAdapter, Blueprint } from '@thearchitech.xyz/types';
import { TypeScriptBlueprintParser } from '../../execution/blueprint/typescript-blueprint-parser.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface IntegrationManifest {
  integrations: Array<{
    id: string;
    name: string;
    version: string;
    path: string;
    category: 'integration';
    dependencies: string[];
    adapters: string[];
  }>;
  lastUpdated: string;
  totalIntegrations: number;
}

export class IntegrationLoaderService {
  private marketplacePath: string;

  constructor(marketplacePath: string) {
    this.marketplacePath = marketplacePath;
  }

  /**
   * Load all integrations from the marketplace
   */
  async loadAllIntegrations(): Promise<IntegrationAdapter[]> {
    try {
      const integrations: IntegrationAdapter[] = [];
      
      // Get all integration directories
      const integrationsPath = path.join(this.marketplacePath, 'integrations');
      const integrationDirs = await fs.readdir(integrationsPath, { withFileTypes: true });
      const integrationNames = integrationDirs
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name);
      
      for (const dir of integrationNames) {
        try {
          const integration = await this.loadIntegration(dir);
          if (integration) {
            integrations.push(integration);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load integration ${dir}: ${error}`);
        }
      }
      return integrations;
    } catch (error) {
      console.error(`❌ Failed to load integrations: ${error}`);
      return [];
    }
  }

  /**
   * Load a specific integration by name
   */
  async loadIntegration(integrationName: string): Promise<IntegrationAdapter | null> {
    try {
      // Load integration.json
      const integrationJsonPath = path.join('integrations', integrationName, 'integration.json');
      const integrationConfig = await this.loadIntegrationConfig(integrationJsonPath);
      
      if (!integrationConfig) {
        return null;
      }

      // Load blueprint.ts
      const blueprintPath = path.join('integrations', integrationName, 'blueprint.ts');
      const blueprint = await this.loadIntegrationBlueprint(blueprintPath);
      
      if (!blueprint) {
        return null;
      }

      return {
        id: integrationConfig.id,
        name: integrationConfig.name,
        version: integrationConfig.version,
        description: integrationConfig.description || '',
        category: 'integration',
        tech_stack: {
          framework: integrationConfig.framework || 'nextjs',
          adapters: integrationConfig.adapters || []
        },
        requirements: {
          modules: integrationConfig.dependencies || [],
          dependencies: integrationConfig.dependencies || []
        },
        provides: {
          files: integrationConfig.files || [],
          components: integrationConfig.components || [],
          pages: integrationConfig.pages || []
        },
        sub_features: integrationConfig.sub_features || {},
        blueprint
      };
    } catch (error) {
      console.warn(`⚠️  Failed to load integration ${integrationName}: ${error}`);
      return null;
    }
  }

  /**
   * Load integration configuration from integration.json
   */
  private async loadIntegrationConfig(configPath: string): Promise<any> {
    try {
      const fullPath = path.join(this.marketplacePath, configPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Failed to load integration config ${configPath}: ${error}`);
      return null;
    }
  }

  /**
   * Load integration blueprint from blueprint.ts
   */
  private async loadIntegrationBlueprint(blueprintPath: string): Promise<Blueprint | null> {
    try {
      const fullPath = path.join(this.marketplacePath, blueprintPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return TypeScriptBlueprintParser.parseBlueprint(content);
    } catch (error) {
      console.warn(`⚠️  Failed to load integration blueprint ${blueprintPath}: ${error}`);
      return null;
    }
  }

  /**
   * Get all available integration names
   */
  async getAvailableIntegrations(): Promise<string[]> {
    try {
      const integrationsPath = path.join(this.marketplacePath, 'integrations');
      const integrationDirs = await fs.readdir(integrationsPath, { withFileTypes: true });
      return integrationDirs
        .filter(dir => dir.isDirectory())
        .map(dir => dir.name);
    } catch (error) {
      console.warn(`⚠️  Failed to list integrations: ${error}`);
      return [];
    }
  }

  /**
   * Check if integration exists
   */
  async integrationExists(integrationName: string): Promise<boolean> {
    try {
      const integrationJsonPath = path.join(this.marketplacePath, 'integrations', integrationName, 'integration.json');
      await fs.access(integrationJsonPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get integration dependencies
   */
  async getIntegrationDependencies(integrationName: string): Promise<string[]> {
    try {
      const integration = await this.loadIntegration(integrationName);
      return integration?.requirements.dependencies || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get integrations that depend on specific adapters
   */
  async getIntegrationsForAdapters(adapterIds: string[]): Promise<IntegrationAdapter[]> {
    try {
      const allIntegrations = await this.loadAllIntegrations();
      
      return allIntegrations.filter(integration => {
        // Check if integration depends on any of the specified adapters
        return integration.tech_stack.adapters.some((adapterId: string) => 
          adapterIds.some(id => id.includes(adapterId) || adapterId.includes(id))
        );
      });
    } catch (error) {
      console.warn(`⚠️  Failed to get integrations for adapters: ${error}`);
      return [];
    }
  }
}

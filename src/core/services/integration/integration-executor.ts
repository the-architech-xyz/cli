/**
 * Integration Feature Executor
 * 
 * Executes integration features that connect adapters with frameworks
 */

import { IntegrationAdapter, ProjectContext } from '@thearchitech.xyz/types';
import { BlueprintExecutor } from '../execution/blueprint/blueprint-executor.js';
import { VirtualFileSystem } from '../file-system/file-engine/virtual-file-system.js';

export class IntegrationExecutor {
  private blueprintExecutor: BlueprintExecutor;

  constructor(blueprintExecutor: BlueprintExecutor) {
    this.blueprintExecutor = blueprintExecutor;
  }

  /**
   * Execute an integration adapter with sub-features
   */
  async executeIntegration(
    integration: IntegrationAdapter, 
    context: ProjectContext,
    features?: { [key: string]: boolean | string | string[] }
  ): Promise<void> {
    console.log(`Executing integration adapter: ${integration.name}`);
    
    // Merge features with defaults
    const activeFeatures = this.mergeFeaturesWithDefaults(integration, features);
    
    console.log(`🔍 Integration features:`, activeFeatures);
    console.log(`🔍 Integration sub_features:`, integration.sub_features);
    
    // Create enhanced context with sub-features
    const enhancedContext = {
      ...context,
      integration: {
        id: integration.id,
        features: activeFeatures
      }
    };
    
    console.log(`🔍 Enhanced context:`, JSON.stringify(enhancedContext, null, 2));
    
    // Execute the integration blueprint
    await this.blueprintExecutor.executeBlueprint(
      integration.blueprint,
      enhancedContext
    );
    
    console.log(`Integration adapter completed: ${integration.name}`);
  }


  /**
   * Merge user features with integration defaults
   */
  private mergeFeaturesWithDefaults(
    integration: IntegrationAdapter, 
    features?: { [key: string]: boolean | string | string[] }
  ): { [key: string]: boolean | string | string[] } {
    const activeFeatures: { [key: string]: boolean | string | string[] } = {};
    
    // Apply defaults first
    for (const [key, config] of Object.entries(integration.sub_features)) {
      activeFeatures[key] = (config as any).default ?? false;
    }
    
    // Override with user-provided features
    if (features) {
      for (const [key, value] of Object.entries(features)) {
        if (integration.sub_features[key]) {
          activeFeatures[key] = value;
        }
      }
    }
    
    return activeFeatures;
  }

  /**
   * Execute multiple integration adapters
   */
  async executeIntegrations(
    integrations: IntegrationAdapter[],
    context: ProjectContext,
    featuresMap?: Map<string, { [key: string]: boolean | string | string[] }>
  ): Promise<void> {
    console.log(`Executing ${integrations.length} integration adapters`);
    
    for (const integration of integrations) {
      const features = featuresMap?.get(integration.id);
      await this.executeIntegration(integration, context, features);
    }
    
    console.log('All integration adapters completed');
  }

  /**
   * Validate integration adapter requirements
   */
  validateRequirements(
    integration: IntegrationAdapter,
    availableModules: string[]
  ): boolean {
    const requiredModules = integration.requirements.modules;
    const missingModules = requiredModules.filter(
      (module: string) => !availableModules.includes(module)
    );
    
    if (missingModules.length > 0) {
      console.warn(
        `Integration ${integration.id} requires modules: ${missingModules.join(', ')}`
      );
      return false;
    }
    
    return true;
  }

  /**
   * Validate integration adapter features
   */
  validateFeatures(
    integration: IntegrationAdapter, 
    features?: { [key: string]: boolean | string | string[] }
  ): boolean {
    if (!features) return true;
    
    for (const [key, value] of Object.entries(features)) {
      const featureConfig = integration.sub_features[key];
      if (!featureConfig) {
        console.warn(`Integration ${integration.id} does not support feature: ${key}`);
        return false;
      }
      
      // Validate type
      if (featureConfig.type === 'boolean' && typeof value !== 'boolean') {
        console.warn(`Feature ${key} must be boolean`);
        return false;
      }
      
      if (featureConfig.type === 'string' && typeof value !== 'string') {
        console.warn(`Feature ${key} must be string`);
        return false;
      }
      
      if (featureConfig.type === 'array' && !Array.isArray(value)) {
        console.warn(`Feature ${key} must be array`);
        return false;
      }
      
      // Validate options if provided
      if (featureConfig.options && featureConfig.type === 'string') {
        if (!featureConfig.options.includes(value as string)) {
          console.warn(`Feature ${key} value "${value}" is not in allowed options: ${featureConfig.options.join(', ')}`);
          return false;
        }
      }
    }
    
    return true;
  }
}

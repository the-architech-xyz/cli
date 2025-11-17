/**
 * Module Configuration Service
 * 
 * Unified service for module configuration merging, parameter defaults, and template context building.
 * Combines functionality of ParameterMerger and ModuleEnhancer.
 * 
 * DOCTRINE DECISION: This service remains in the CLI because it handles EXECUTION-TIME concerns:
 * - Merging user-provided parameters with adapter defaults at execution time
 * - Building template context for blueprint execution
 * - This is NOT transformation logic (which belongs in marketplace)
 * - This is runtime parameter merging for blueprint execution
 * 
 * The marketplace transformer handles transformation-time concerns (capability resolution, module expansion).
 * This service handles execution-time concerns (parameter merging, context building).
 */

import { Module, Genome, ResolvedGenome, MergedConfiguration } from '@thearchitech.xyz/types';
import { Logger } from '../infrastructure/logging/index.js';

export class ModuleConfigurationService {
  /**
   * Merge module configuration with user overrides
   */
  mergeModuleConfiguration(module: Module, adapter: any, genome: ResolvedGenome): MergedConfiguration {
    const moduleConfig = adapter.config;
    const userOverrides = module.parameters || {};

    if (!moduleConfig.parameters?.features) {
      // Build template context even for modules without features
      const mergedParameters = this.mergeParametersWithDefaults(
        moduleConfig.parameters, 
        userOverrides
      );
      
      const enrichedModule = {
        ...module,
        parameters: mergedParameters
      };

      const templateContext: Record<string, any> = {
        project: genome.project || {},
        modules: genome.modules || [],
        module: enrichedModule
      };
      
      return {
        activeFeatures: [],
        resolvedCapabilities: [],
        executionOrder: [],
        conflicts: [],
        templateContext,
      };
    }

    // Merge parameter defaults with user overrides
    const mergedParameters = this.mergeParametersWithDefaults(
      moduleConfig.parameters,
      userOverrides
    );

    // Extract active features from merged parameters
    const activeFeatures: string[] = [];
    const featureParameters = mergedParameters.features || {};
    
    for (const [featureName, isEnabled] of Object.entries(featureParameters)) {
      if (isEnabled === true) {
        activeFeatures.push(featureName);
      }
    }

    // Build template context with merged parameters
    const enrichedModule = {
      ...module,
      parameters: mergedParameters
    };

    const templateContext: Record<string, any> = {
      project: genome.project || {},
      modules: genome.modules || [],
      module: enrichedModule
    };

    return {
      activeFeatures,
      resolvedCapabilities: [],
      executionOrder: activeFeatures,
      conflicts: [],
      templateContext,
    };
  }

  /**
   * Merge parameter defaults with user overrides
   */
  mergeParametersWithDefaults(
    parameterSchema: any,
    userOverrides: Record<string, any>
  ): Record<string, any> {
    const merged: Record<string, any> = {};
    
    // CRITICAL FIX: Clean user overrides - extract default values if they're schema objects
    for (const [key, value] of Object.entries(userOverrides)) {
      if (this.isParameterSchema(value)) {
        // This is a schema object, extract the default value
        merged[key] = value.default;
        Logger.debug(`🔧 Extracted default from schema for '${key}': ${JSON.stringify(value.default).substring(0, 100)}`);
      } else {
        // This is an actual value, keep it
        merged[key] = value;
      }
    }
    
    if (!parameterSchema || typeof parameterSchema !== 'object') {
      return merged;
    }
    
    Logger.debug(`🔧 Merging parameter defaults. Cleaned user overrides: ${Object.keys(merged).join(', ')}`);
    
    // Merge defaults for top-level parameters
    for (const [key, schema] of Object.entries(parameterSchema)) {
      // Skip the 'features' object - we handle it separately below
      if (key === 'features') {
        continue;
      }
      
      // Skip if user has already provided this parameter
      if (merged[key] !== undefined) {
        Logger.debug(`⏭️  Skipping '${key}' - user value exists: ${JSON.stringify(merged[key]).substring(0, 50)}`);
        continue;
      }
      
      // Check if this parameter has a default value
      if (schema && typeof schema === 'object') {
        const paramDef = schema as any;
        if ('default' in paramDef) {
          merged[key] = paramDef.default;
          Logger.debug(`✅ Applied default for parameter '${key}': ${JSON.stringify(paramDef.default).substring(0, 100)}`);
        } else {
          Logger.debug(`⚠️  Parameter '${key}' has no default value in schema`);
        }
      }
    }
    
    // Handle nested 'features' object (for Constitutional Architecture modules)
    if (parameterSchema.features && typeof parameterSchema.features === 'object') {
      merged.features = merged.features || {};
      
      for (const [featureName, featureConfig] of Object.entries(parameterSchema.features)) {
        // Skip if user has already configured this feature
        if (merged.features[featureName] !== undefined) {
          continue;
        }
        
        // Apply default for this feature
        if (featureConfig && typeof featureConfig === 'object') {
          const featureDef = featureConfig as any;
          if ('default' in featureDef) {
            merged.features[featureName] = featureDef.default;
            Logger.debug(`✅ Applied default for feature '${featureName}': ${featureDef.default}`);
          }
        }
      }
    }
    
    Logger.debug(`✅ Final merged parameters: ${Object.keys(merged).join(', ')}`);
    return merged;
  }

  /**
   * Check if a value is a parameter schema object
   */
  private isParameterSchema(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      ('type' in value || 'default' in value || 'description' in value)
    );
  }
}


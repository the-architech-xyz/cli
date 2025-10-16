/**
 * Cross-Feature Prerequisite Validator
 * 
 * Validates that when a feature enables a capability that requires another feature,
 * that required feature is present in the genome.
 * 
 * Example: teams-billing requires payments/frontend/shadcn
 */

import { Module } from '@thearchitech.xyz/types';
import { Genome } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';
import { convertGenomeModuleToModule, convertGenomeModulesToModules } from '../module-management/genome-module-converter.js';
import { Logger } from '../infrastructure/logging/logger.js';

export interface CrossFeatureValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CrossFeatureRequirement {
  sourceModule: string;
  sourceCapability: string;
  requiredFeatures: string[];
  requiredCapabilities: string[];
}

export class CrossFeatureValidator {
  constructor(private moduleService: ModuleService) {}

  /**
   * Validate cross-feature prerequisites for entire genome
   */
  async validateGenome(genome: Genome): Promise<CrossFeatureValidationResult> {
    Logger.info('🔍 Validating cross-feature prerequisites');
    
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get list of all module IDs in genome
      const moduleIds = new Set(genome.modules.map((m: any) => m.id));
      
      // Check each module's enabled features
      for (const genomeModule of genome.modules) {
        const module = convertGenomeModuleToModule(genomeModule);
        const moduleConfig = await this.loadModuleConfig(module.id);
        if (!moduleConfig) continue;
        
        // Check internal_structure for cross-feature requirements
        if (moduleConfig.internal_structure?.optional) {
          for (const [capabilityName, capabilityObj] of Object.entries(moduleConfig.internal_structure.optional)) {
            // Check if this capability is enabled
            const isEnabled = this.isCapabilityEnabled(module, capabilityName);
            
            if (isEnabled) {
              const capability = capabilityObj as { requires_features?: string[]; requires_capabilities?: string[]; provides: string[]; templates: string[] };
              
              // Validate requires_features
              if (capability.requires_features) {
                for (const requiredFeature of capability.requires_features) {
                  if (!moduleIds.has(requiredFeature)) {
                    errors.push(
                      `Module ${module.id} has capability "${capabilityName}" enabled, ` +
                      `which requires feature "${requiredFeature}", ` +
                      `but it is not present in the genome. ` +
                      `Add: { id: '${requiredFeature}' }`
                    );
                  }
                }
              }
              
              // Validate requires_capabilities
              if (capability.requires_capabilities) {
                const convertedModules = convertGenomeModulesToModules(genome.modules);
                const missingCaps = await this.checkCapabilitiesAvailable(
                  capability.requires_capabilities,
                  convertedModules
                );
                
                if (missingCaps.length > 0) {
                  errors.push(
                    `Module ${module.id} has capability "${capabilityName}" enabled, ` +
                    `which requires capabilities [${missingCaps.join(', ')}], ` +
                    `but they are not provided by any module in the genome.`
                  );
                }
              }
            }
          }
        }
      }

      const isValid = errors.length === 0;
      
      if (isValid) {
        Logger.info('✅ Cross-feature prerequisite validation passed');
      } else {
        Logger.error(`❌ Cross-feature prerequisite validation failed with ${errors.length} errors`);
      }

      return { valid: isValid, errors, warnings };
      
    } catch (error) {
      Logger.error(`❌ Cross-feature validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors: [`Cross-feature validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Check if a capability is enabled for a module
   */
  private isCapabilityEnabled(module: Module, capabilityName: string): boolean {
    // Check in module parameters
    if (module.parameters?.features) {
      const featuresParam = module.parameters.features;
      // Handle both object and boolean parameter formats
      if (typeof featuresParam === 'object' && capabilityName in featuresParam) {
        return featuresParam[capabilityName] === true;
      }
    }
    
    // If not explicitly set, check default in module config
    // (Would need to load module config to check defaults)
    return false;
  }

  /**
   * Check if required capabilities are available in genome
   */
  private async checkCapabilitiesAvailable(
    requiredCapabilities: string[],
    modules: Module[]
  ): Promise<string[]> {
    const missingCapabilities: string[] = [];
    
    // Build list of all provided capabilities in genome
    const providedCapabilities = new Set<string>();
    
    for (const module of modules) {
      const moduleConfig = await this.loadModuleConfig(module.id);
      if (!moduleConfig) continue;
      
      // Add capabilities from provides array
      if (Array.isArray(moduleConfig.provides)) {
        for (const cap of moduleConfig.provides) {
          // Handle template strings like "{{#if features.migrations}}database-migrations{{/if}}"
          if (typeof cap === 'string' && !cap.includes('{{')) {
            providedCapabilities.add(cap);
          }
        }
      }
      
      // Add capabilities from internal_structure
      if (moduleConfig.internal_structure?.core?.provides) {
        for (const cap of moduleConfig.internal_structure.core.provides) {
          providedCapabilities.add(cap);
        }
      }
      
      if (moduleConfig.internal_structure?.optional) {
        for (const [capName, capabilityObj] of Object.entries(moduleConfig.internal_structure.optional)) {
          const capability = capabilityObj as { requires_features?: string[]; requires_capabilities?: string[]; provides: string[]; templates: string[] };
          
          // Check if this capability is enabled
          const isEnabled = this.isCapabilityEnabled(module, capName);
          if (isEnabled && capability.provides) {
            for (const cap of capability.provides) {
              providedCapabilities.add(cap);
            }
          }
        }
      }
    }
    
    // Check which required capabilities are missing
    for (const requiredCap of requiredCapabilities) {
      if (!providedCapabilities.has(requiredCap)) {
        missingCapabilities.push(requiredCap);
      }
    }
    
    return missingCapabilities;
  }

  /**
   * Load module configuration
   */
  private async loadModuleConfig(moduleId: string): Promise<any> {
    try {
      const result = await this.moduleService.loadModuleAdapter({ id: moduleId, parameters: {} });
      return result.adapter;
    } catch (error) {
      Logger.warn(`⚠️ Failed to load module config for ${moduleId}`);
      return null;
    }
  }
}


/**
 * PrerequisiteValidator Service
 * 
 * Intelligent dependency resolution and validation for The Architech CLI.
 * Implements the "Capability & Prerequisite" system with version compatibility.
 */

import { 
  PrerequisiteValidationResult, 
  CapabilityDeclaration, 
  CapabilityRequirement, 
  CapabilityConflict, 
  VersionMismatch,
  Recipe,
  Module
} from '@thearchitech.xyz/types';
import { ModuleFetcherService } from '../module-management/fetcher/module-fetcher.js';
import { AdapterConfig } from '@thearchitech.xyz/types';

export class PrerequisiteValidator {
  private moduleFetcher: ModuleFetcherService;

  constructor(moduleFetcher: ModuleFetcherService) {
    this.moduleFetcher = moduleFetcher;
  }

  /**
   * Validates a recipe's modules for capability dependencies and conflicts
   * 
   * @param recipe - The recipe containing the modules to validate
   * @returns Validation result with detailed error information
   */
  async validate(recipe: Recipe): Promise<PrerequisiteValidationResult> {
    try {
      // Step 1: Load all adapter configurations from the modules
      const adapterConfigs = await this.loadAdapterConfigs(recipe.modules);
      
      // Step 2: Collect all provided capabilities
      const providedCapabilities = this.collectProvidedCapabilities(adapterConfigs);
      
      // Step 3: Check for conflicts (same capability provided by multiple adapters)
      const conflicts = this.detectConflicts(providedCapabilities);
      if (conflicts.length > 0) {
        return {
          isValid: false,
          error: this.formatConflictError(conflicts),
          details: {
            providedCapabilities,
            missingCapabilities: [],
            conflictingCapabilities: conflicts,
            versionMismatches: []
          }
        };
      }
      
      // Step 4: Check all prerequisites
      const missingCapabilities: CapabilityRequirement[] = [];
      const versionMismatches: VersionMismatch[] = [];
      
      for (const adapterConfig of adapterConfigs) {
        if (adapterConfig.prerequisites?.capabilities) {
          for (const requirement of adapterConfig.prerequisites.capabilities) {
            const validation = this.validateCapabilityRequirement(
              requirement, 
              providedCapabilities, 
              adapterConfig.id
            );
            
            if (!validation.isValid) {
              if (validation.isMissing) {
                missingCapabilities.push(requirement);
              } else if (validation.versionMismatch) {
                versionMismatches.push(validation.versionMismatch);
              }
            }
          }
        }
      }
      
      // Step 5: Return validation result
      if (missingCapabilities.length > 0 || versionMismatches.length > 0) {
        return {
          isValid: false,
          error: this.formatPrerequisiteError(missingCapabilities, versionMismatches),
          details: {
            providedCapabilities,
            missingCapabilities,
            conflictingCapabilities: conflicts,
            versionMismatches
          }
        };
      }
      
      return {
        isValid: true,
        details: {
          providedCapabilities,
          missingCapabilities: [],
          conflictingCapabilities: conflicts,
          versionMismatches: []
        }
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          providedCapabilities: [],
          missingCapabilities: [],
          conflictingCapabilities: [],
          versionMismatches: []
        }
      };
    }
  }

  /**
   * Load adapter configurations for all modules in the recipe
   */
  private async loadAdapterConfigs(modules: Module[]): Promise<AdapterConfig[]> {
    const configs: AdapterConfig[] = [];
    
    for (const module of modules) {
      try {
        const result = await this.moduleFetcher.fetchAdapterConfig(module.id, module.version);
        if (result.success && result.content) {
          configs.push(result.content);
        } else {
          console.warn(`⚠️  Could not load adapter config for ${module.id}: ${result.error}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not load adapter config for ${module.id}: ${error}`);
        // Continue with other adapters even if one fails to load
      }
    }
    
    return configs;
  }

  /**
   * Collect all capabilities provided by the adapters
   */
  private collectProvidedCapabilities(adapterConfigs: AdapterConfig[]): CapabilityDeclaration[] {
    const capabilities: CapabilityDeclaration[] = [];
    
    for (const config of adapterConfigs) {
      if (config.provides) {
        for (const capability of config.provides) {
          capabilities.push({
            ...capability,
            // Add adapter ID for tracking
            description: capability.description || `Provided by ${config.id}`
          });
        }
      }
    }
    
    return capabilities;
  }

  /**
   * Detect conflicts where the same capability is provided by multiple adapters
   */
  private detectConflicts(providedCapabilities: CapabilityDeclaration[]): CapabilityConflict[] {
    const conflicts: CapabilityConflict[] = [];
    const capabilityMap = new Map<string, string[]>();
    
    // Group capabilities by name
    for (const capability of providedCapabilities) {
      if (!capabilityMap.has(capability.name)) {
        capabilityMap.set(capability.name, []);
      }
      capabilityMap.get(capability.name)!.push(capability.description || 'Unknown adapter');
    }
    
    // Find conflicts
    for (const [capabilityName, providers] of capabilityMap) {
      if (providers.length > 1) {
        conflicts.push({
          capability: capabilityName,
          providers: providers,
          message: `Capability '${capabilityName}' is provided by multiple adapters: ${providers.join(', ')}`
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Validate a single capability requirement against provided capabilities
   */
  private validateCapabilityRequirement(
    requirement: CapabilityRequirement,
    providedCapabilities: CapabilityDeclaration[],
    adapterId: string
  ): { isValid: boolean; isMissing: boolean; versionMismatch?: VersionMismatch } {
    // Find the provided capability
    const provided = providedCapabilities.find(cap => cap.name === requirement.name);
    
    if (!provided) {
      return { isValid: false, isMissing: true };
    }
    
    // Check version compatibility if version constraint is specified
    if (requirement.version) {
      const isCompatible = this.checkVersionCompatibility(provided.version, requirement.version);
      if (!isCompatible) {
        return {
          isValid: false,
          isMissing: false,
          versionMismatch: {
            capability: requirement.name,
            required: requirement.version,
            provided: provided.version,
            provider: provided.description || 'Unknown adapter',
            message: `Adapter '${adapterId}' requires '${requirement.name}' ${requirement.version}, but ${provided.version} is provided`
          }
        };
      }
    }
    
    return { isValid: true, isMissing: false };
  }

  /**
   * Check if a provided version satisfies a version constraint
   * Uses simple semver comparison (>=, ~, ^, =)
   */
  private checkVersionCompatibility(providedVersion: string, requiredVersion: string): boolean {
    try {
      // Remove any 'v' prefix
      const provided = providedVersion.replace(/^v/, '');
      const required = requiredVersion.replace(/^v/, '');
      
      // Handle exact version
      if (required.startsWith('=')) {
        return provided === required.substring(1);
      }
      
      // Handle >= constraint
      if (required.startsWith('>=')) {
        return this.compareVersions(provided, required.substring(2)) >= 0;
      }
      
      // Handle > constraint
      if (required.startsWith('>')) {
        return this.compareVersions(provided, required.substring(1)) > 0;
      }
      
      // Handle ~ constraint (compatible within same minor version)
      if (required.startsWith('~')) {
        return this.isCompatibleVersion(provided, required.substring(1));
      }
      
      // Handle ^ constraint (compatible within same major version)
      if (required.startsWith('^')) {
        return this.isCompatibleMajorVersion(provided, required.substring(1));
      }
      
      // Default to exact match
      return provided === required;
      
    } catch (error) {
      console.warn(`⚠️  Version comparison failed: ${providedVersion} vs ${requiredVersion}`);
      return false;
    }
  }

  /**
   * Compare two version strings (returns -1, 0, or 1)
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  /**
   * Check if version is compatible within same minor version (~)
   */
  private isCompatibleVersion(provided: string, required: string): boolean {
    const providedParts = provided.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    // Must have same major and minor versions
    return providedParts[0] === requiredParts[0] && 
           providedParts[1] === requiredParts[1] &&
           (providedParts[2] || 0) >= (requiredParts[2] || 0);
  }

  /**
   * Check if version is compatible within same major version (^)
   */
  private isCompatibleMajorVersion(provided: string, required: string): boolean {
    const providedParts = provided.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    // Must have same major version
    return providedParts[0] === requiredParts[0];
  }

  /**
   * Format conflict error message
   */
  private formatConflictError(conflicts: CapabilityConflict[]): string {
    const conflictMessages = conflicts.map(conflict => 
      `  - ${conflict.message}`
    ).join('\n');
    
    return `❌ Capability conflicts detected:\n${conflictMessages}\n\nPlease remove redundant adapters from your project.`;
  }

  /**
   * Format prerequisite error message
   */
  private formatPrerequisiteError(
    missingCapabilities: CapabilityRequirement[], 
    versionMismatches: VersionMismatch[]
  ): string {
    const errors: string[] = [];
    
    if (missingCapabilities.length > 0) {
      const missingMessages = missingCapabilities.map(req => 
        `  - Missing capability: '${req.name}'${req.version ? ` (${req.version})` : ''}`
      ).join('\n');
      errors.push(`❌ Missing required capabilities:\n${missingMessages}`);
    }
    
    if (versionMismatches.length > 0) {
      const versionMessages = versionMismatches.map(mismatch => 
        `  - ${mismatch.message}`
      ).join('\n');
      errors.push(`❌ Version compatibility issues:\n${versionMessages}`);
    }
    
    return errors.join('\n\n') + '\n\nPlease add the required adapters or update versions to resolve these issues.';
  }
}

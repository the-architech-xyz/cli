/**
 * Module Validator Service
 * 
 * Validates individual modules to ensure:
 * - Module exists in the marketplace
 * - Module ID format is correct
 * - Module category is valid
 * - Module version is compatible
 */

import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';

export interface ModuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  adapter?: any;
}

export class ModuleValidator {
  constructor(private moduleService: ModuleService) {}

  /**
   * Validate a single module
   */
  async validateModule(module: Module): Promise<ModuleValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Validate module structure
      const structureValidation = this.validateModuleStructure(module);
      if (!structureValidation.valid) {
        errors.push(...structureValidation.errors);
        return { valid: false, errors, warnings };
      }

      // Step 2: Validate module exists in marketplace
      const existenceValidation = await this.validateModuleExistence(module);
      if (!existenceValidation.valid) {
        errors.push(...existenceValidation.errors);
        return { valid: false, errors, warnings };
      }

      // Step 3: Validate module version compatibility
      const versionValidation = await this.validateModuleVersion(module, existenceValidation.adapter);
      if (!versionValidation.valid) {
        warnings.push(...versionValidation.warnings);
      }

      return {
        valid: true,
        errors,
        warnings,
        adapter: existenceValidation.adapter
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown module validation error';
      return {
        valid: false,
        errors: [`Module validation failed: ${errorMessage}`],
        warnings
      };
    }
  }

  /**
   * Validate module structure
   */
  private validateModuleStructure(module: Module): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!module.id) {
      errors.push('Module ID is required');
    } else if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(module.id)) {
      errors.push('Module ID must be in format "category/name" (e.g., "ui/shadcn-ui")');
    }

    if (!module.category) {
      errors.push('Module category is required');
    } else if (!['framework', 'ui', 'database', 'auth', 'payment', 'email', 'content', 'testing', 'observability', 'state', 'deployment', 'blockchain', 'tooling'].includes(module.category)) {
      errors.push(`Invalid module category: ${module.category}`);
    }

    if (!module.version) {
      errors.push('Module version is required');
    }

    if (!module.parameters || typeof module.parameters !== 'object') {
      errors.push('Module parameters must be an object');
    }

    // Validate category matches ID
    if (module.id && module.category) {
      const expectedCategory = module.id.split('/')[0];
      if (expectedCategory !== module.category) {
        errors.push(`Module category "${module.category}" does not match ID category "${expectedCategory}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate module exists in marketplace
   */
  private async validateModuleExistence(module: Module): Promise<{ valid: boolean; errors: string[]; adapter?: any }> {
    const errors: string[] = [];

    try {
      // Extract adapter ID from module ID
      const adapterId = module.id.split('/').pop() || module.id;
      
      // Try to load the adapter
      const adapterResult = await this.moduleService.loadModuleAdapter(module);
      
      if (!adapterResult.success) {
        return {
          valid: false,
          errors: [`Failed to load adapter: ${adapterResult.error}`],
          warnings: []
        };
      }
      
      const adapter = adapterResult.adapter;
      
      return {
        valid: true,
        errors,
        warnings,
        adapter: adapter
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to load module ${module.id}: ${errorMessage}`);
      return { valid: false, errors, warnings: [] };
    }
  }

  /**
   * Validate module version compatibility
   */
  private async validateModuleVersion(module: Module, adapter: any): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    if (!adapter || !adapter.config) {
      return { valid: true, warnings };
    }

    // Check if module version matches adapter version
    if (module.version !== adapter.config.version) {
      warnings.push(`Module version ${module.version} does not match adapter version ${adapter.config.version}`);
    }

    // Check if adapter supports the requested framework
    if (adapter.config.supportedFrameworks && !adapter.config.supportedFrameworks.includes('nextjs')) {
      warnings.push(`Module ${module.id} may not support the selected framework`);
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}

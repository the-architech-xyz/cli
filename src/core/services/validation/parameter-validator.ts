/**
 * Parameter Validator Service
 * 
 * Validates module parameters against adapter.json schemas to ensure:
 * - Parameter types are correct
 * - Required parameters are provided
 * - Enum values are valid
 * - Parameter constraints are satisfied
 */

import { Module } from '@thearchitech.xyz/types';
import { ModuleService } from '../module-management/module-service.js';

export interface ParameterValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ParameterValidator {
  constructor(private moduleService: ModuleService) {}

  /**
   * Validate module parameters against schema
   */
  async validateParameters(module: Module): Promise<ParameterValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Load adapter to get schema
      const adapterResult = await this.moduleService.loadModuleAdapter(module);
      
      if (!adapterResult.success) {
        return {
          valid: false,
          errors: [`Failed to load adapter: ${adapterResult.error}`],
          warnings: []
        };
      }
      
      const adapter = adapterResult.adapter;
      const schema = adapter?.config?.parameters;

      if (!schema) {
        // No schema defined, parameters are valid by default
        return { valid: true, errors, warnings };
      }

      // Validate each parameter
      for (const [paramName, paramValue] of Object.entries(module.parameters || {})) {
        const paramSchema = schema[paramName];
        
        if (!paramSchema) {
          warnings.push(`Unknown parameter "${paramName}" for module ${module.id}`);
          continue;
        }

        const paramValidation = this.validateParameter(paramName, paramValue, paramSchema, module.id);
        if (!paramValidation.valid) {
          errors.push(...paramValidation.errors);
        }
        warnings.push(...paramValidation.warnings);
      }

      // Check for missing required parameters
      for (const [paramName, paramSchema] of Object.entries(schema)) {
        if (paramSchema.required && !(paramName in (module.parameters || {}))) {
          errors.push(`Required parameter "${paramName}" is missing for module ${module.id}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parameter validation error';
      return {
        valid: false,
        errors: [`Parameter validation failed for ${module.id}: ${errorMessage}`],
        warnings
      };
    }
  }

  /**
   * Validate a single parameter against its schema
   */
  private validateParameter(
    paramName: string, 
    paramValue: any, 
    paramSchema: any, 
    moduleId: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    if (paramSchema.type) {
      const expectedType = paramSchema.type;
      const actualType = typeof paramValue;
      
      if (expectedType === 'array' && !Array.isArray(paramValue)) {
        errors.push(`Parameter "${paramName}" must be an array for module ${moduleId}`);
      } else if (expectedType !== 'array' && actualType !== expectedType) {
        errors.push(`Parameter "${paramName}" must be of type ${expectedType}, got ${actualType} for module ${moduleId}`);
      }
    }

    // Enum validation
    if (paramSchema.enum && Array.isArray(paramSchema.enum) && !paramSchema.enum.includes(paramValue)) {
      errors.push(`Parameter "${paramName}" must be one of [${paramSchema.enum.join(', ')}], got "${paramValue}" for module ${moduleId}`);
    }

    // Array validation
    if (Array.isArray(paramValue) && paramSchema.items) {
      for (let i = 0; i < paramValue.length; i++) {
        const itemValidation = this.validateParameter(
          `${paramName}[${i}]`, 
          paramValue[i], 
          paramSchema.items, 
          moduleId
        );
        errors.push(...itemValidation.errors);
        warnings.push(...itemValidation.warnings);
      }
    }

    // String validation
    if (typeof paramValue === 'string' && paramSchema.minLength && paramValue.length < paramSchema.minLength) {
      errors.push(`Parameter "${paramName}" must be at least ${paramSchema.minLength} characters long for module ${moduleId}`);
    }

    if (typeof paramValue === 'string' && paramSchema.maxLength && paramValue.length > paramSchema.maxLength) {
      errors.push(`Parameter "${paramName}" must be at most ${paramSchema.maxLength} characters long for module ${moduleId}`);
    }

    // Number validation
    if (typeof paramValue === 'number') {
      if (paramSchema.minimum !== undefined && paramValue < paramSchema.minimum) {
        errors.push(`Parameter "${paramName}" must be at least ${paramSchema.minimum} for module ${moduleId}`);
      }
      if (paramSchema.maximum !== undefined && paramValue > paramSchema.maximum) {
        errors.push(`Parameter "${paramName}" must be at most ${paramSchema.maximum} for module ${moduleId}`);
      }
    }

    // Boolean validation
    if (typeof paramValue === 'boolean' && paramSchema.type !== 'boolean') {
      warnings.push(`Parameter "${paramName}" is boolean but schema expects ${paramSchema.type} for module ${moduleId}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

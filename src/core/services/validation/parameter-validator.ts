/**
 * Parameter Validator Service
 * 
 * Validates module parameters against JSON schema definitions from adapter.json files.
 * This is a critical component for the type-safe architecture.
 */

import Ajv from 'ajv';
import { AdapterConfig } from '@thearchitech.xyz/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ParameterValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
  }

  /**
   * Validate module parameters against schema
   * @param moduleId Module identifier
   * @param userParameters User-provided parameters from genome.ts
   * @param adapterConfig Adapter configuration with parameter schemas
   * @returns Validation result
   */
  validateModuleParameters(
    moduleId: string, 
    userParameters: Record<string, any> = {}, 
    adapterConfig: AdapterConfig
  ): ValidationResult {
    const errors: string[] = [];
    
    // Check if adapter has parameter schemas
    if (!adapterConfig.parameters) {
      // No parameters to validate
      return { valid: true, errors: [] };
    }
    
    // Build JSON Schema from adapter config
    const schema = {
      type: 'object',
      properties: {},
      required: [] as string[]
    };
    
    // Build schema properties from adapter config parameters
    for (const [paramName, paramConfig] of Object.entries(adapterConfig.parameters)) {
      // Create a clean copy of the parameter schema without non-JSON Schema properties
      const cleanParamSchema: any = {};
      const paramConfigAny = paramConfig as any;
      
      // Handle custom types that need conversion to JSON Schema
      if (paramConfig.type === 'select') {
        cleanParamSchema.type = 'string';
        if (paramConfigAny.choices) {
          cleanParamSchema.enum = paramConfigAny.choices;
        }
      } else if (paramConfig.type) {
        cleanParamSchema.type = paramConfig.type;
      }
      
      // Copy additional JSON schema properties that might exist
      if (paramConfigAny.enum) cleanParamSchema.enum = paramConfigAny.enum;
      if (paramConfigAny.format) cleanParamSchema.format = paramConfigAny.format;
      if (paramConfigAny.minimum) cleanParamSchema.minimum = paramConfigAny.minimum;
      if (paramConfigAny.maximum) cleanParamSchema.maximum = paramConfigAny.maximum;
      if (paramConfigAny.minLength) cleanParamSchema.minLength = paramConfigAny.minLength;
      if (paramConfigAny.maxLength) cleanParamSchema.maxLength = paramConfigAny.maxLength;
      if (paramConfigAny.pattern) cleanParamSchema.pattern = paramConfigAny.pattern;
      if (paramConfig.default) cleanParamSchema.default = paramConfig.default;
      if (paramConfigAny.items) cleanParamSchema.items = paramConfigAny.items;
      
      // Add the cleaned parameter schema to properties
      (schema.properties as any)[paramName] = cleanParamSchema;
      
      // Add required properties
      if (paramConfig.required === true) {
        schema.required.push(paramName);
      }
    }
    
    // Validate parameters against schema
    const validate = this.ajv.compile(schema);
    const valid = validate(userParameters);
    
    if (!valid && validate.errors) {
      // Format user-friendly error messages
      for (const error of validate.errors) {
        const path = error.instancePath.replace(/^\//, '') || error.params.missingProperty || '(unknown)';
        
        let message: string;
        switch (error.keyword) {
          case 'required':
            message = `Parameter '${error.params.missingProperty}' is required`;
            break;
          case 'enum':
            message = `Parameter '${path}' must be one of: ${error.params.allowedValues.join(', ')}`;
            break;
          case 'type':
            message = `Parameter '${path}' must be of type ${error.params.type}`;
            break;
          case 'format':
            message = `Parameter '${path}' must be a valid ${error.params.format}`;
            break;
          default:
            message = error.message || 'Unknown validation error';
            break;
        }
        
        errors.push(message);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply default values from schema to user parameters
   * @param userParameters User-provided parameters
   * @param adapterConfig Adapter configuration with parameter schemas
   * @returns User parameters with defaults applied
   */
  applyDefaultValues(
    userParameters: Record<string, any> = {},
    adapterConfig: AdapterConfig
  ): Record<string, any> {
    const result = { ...userParameters };
    
    // Check if adapter has parameter schemas
    if (!adapterConfig.parameters) {
      return result;
    }
    
    // Apply default values from schema
    for (const [paramName, paramConfig] of Object.entries(adapterConfig.parameters)) {
      // Only apply default if user didn't provide a value
      if (result[paramName] === undefined && paramConfig.default !== undefined) {
        result[paramName] = paramConfig.default;
      }
    }
    
    return result;
  }
}

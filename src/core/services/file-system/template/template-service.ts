/**
 * Template Service - Centralized Template Processing
 * 
 * Provides unified template processing functionality across the entire CLI.
 * Handles variable substitution, conditional blocks, and path resolution.
 */

import { ProjectContext } from '@thearchitech.xyz/types';

export interface TemplateProcessingOptions {
  /**
   * Whether to process Handlebars-like conditionals {{#if condition}}...{{/if}}
   * @default true
   */
  processConditionals?: boolean;
  
  /**
   * Whether to process path variables through the path handler
   * @default true
   */
  processPathVariables?: boolean;
  
  /**
   * Whether to process template variables {{variable}}
   * @default true
   */
  processVariables?: boolean;
  
  /**
   * Custom variable prefix (default: '{{')
   * @default '{{'
   */
  variablePrefix?: string;
  
  /**
   * Custom variable suffix (default: '}}')
   * @default '}}'
   */
  variableSuffix?: string;
}

export class TemplateService {
  private static readonly DEFAULT_OPTIONS: Required<TemplateProcessingOptions> = {
    processConditionals: true,
    processPathVariables: true,
    processVariables: true,
    variablePrefix: '{{',
    variableSuffix: '}}'
  };

  /**
   * Process a template string with the given context
   */
  static processTemplate(
    template: string, 
    context: ProjectContext, 
    options: TemplateProcessingOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let processed = template;
    
    // 1. Process path variables first (from decentralized path handler)
    if (opts.processPathVariables && context.pathHandler?.resolveTemplate) {
      processed = context.pathHandler.resolveTemplate(processed);
    }
    
    // 2. Process Handlebars-like conditionals {{#if condition}}...{{/if}}
    if (opts.processConditionals) {
      processed = this.processConditionals(processed, context, opts);
    }
    
    // 3. Process template variables {{variable}}
    if (opts.processVariables) {
      processed = this.processVariables(processed, context, opts);
    }
    
    return processed;
  }

  /**
   * Process Handlebars-like conditionals {{#if condition}}...{{/if}}
   */
  private static processConditionals(
    template: string, 
    context: ProjectContext, 
    options: Required<TemplateProcessingOptions>
  ): string {
    const conditionalRegex = new RegExp(
      `\\{\\{#if\\s+([^}]+)\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
      'g'
    );
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = this.getNestedValue(context, condition.trim());
      return this.isTruthy(value) ? content : '';
    });
  }

  /**
   * Process template variables {{variable}}
   */
  private static processVariables(
    template: string, 
    context: ProjectContext, 
    options: Required<TemplateProcessingOptions>
  ): string {
    const variableRegex = new RegExp(
      `${this.escapeRegex(options.variablePrefix)}([^}]+)${this.escapeRegex(options.variableSuffix)}`,
      'g'
    );
    
    return template.replace(variableRegex, (match, variable) => {
      const trimmedVariable = variable.trim();
      let value = this.getNestedValue(context, trimmedVariable);
      
      // Handle cross-module parameter access for common cases
      if (value === undefined) {
        value = this.resolveCrossModuleParameter(context, trimmedVariable);
      }
      
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Resolve cross-module parameters for common template variables
   */
  private static resolveCrossModuleParameter(context: ProjectContext, variable: string): unknown {
    // Handle common cross-module parameter patterns
    if (variable === 'module.parameters.databaseType') {
      return context.databaseModule?.parameters?.databaseType || 
             context.databaseModule?.parameters?.provider ||
             'postgresql';
    }
    
    if (variable === 'module.parameters.currency') {
      const currencies = context.paymentModule?.parameters?.currencies;
      if (Array.isArray(currencies) && currencies.length > 0) {
        return currencies[0]; // Return first currency
      }
      return context.paymentModule?.parameters?.currency || 'usd';
    }
    
    if (variable === 'module.parameters.provider') {
      return context.databaseModule?.parameters?.provider || 'postgresql';
    }
    
    if (variable === 'module.parameters.mode') {
      return context.paymentModule?.parameters?.mode || 'test';
    }
    
    // Handle other common patterns
    if (variable.startsWith('databaseModule.parameters.')) {
      const param = variable.replace('databaseModule.parameters.', '');
      return context.databaseModule?.parameters?.[param];
    }
    
    if (variable.startsWith('paymentModule.parameters.')) {
      const param = variable.replace('paymentModule.parameters.', '');
      return context.paymentModule?.parameters?.[param];
    }
    
    if (variable.startsWith('authModule.parameters.')) {
      const param = variable.replace('authModule.parameters.', '');
      return context.authModule?.parameters?.[param];
    }
    
    return undefined;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: unknown, path: string): unknown {
    if (!path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && current !== null && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Check if value is truthy (Handlebars-like logic)
   */
  private static isTruthy(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value !== '' && value !== 'false' && value !== '0';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return Boolean(value);
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate template syntax (basic validation)
   */
  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for unmatched conditionals
    const openConditionals = (template.match(/\{\{#if\s+[^}]+\}\}/g) || []).length;
    const closeConditionals = (template.match(/\{\{\/if\}\}/g) || []).length;
    
    if (openConditionals !== closeConditionals) {
      errors.push(`Unmatched conditionals: ${openConditionals} open, ${closeConditionals} close`);
    }
    
    // Check for malformed variables (basic check)
    const malformedVariables = template.match(/\{\{[^}]*$/g);
    if (malformedVariables) {
      errors.push(`Malformed variables found: ${malformedVariables.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract all variables used in a template
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract variables from {{variable}} syntax
    const variableMatches = template.match(/\{\{([^}]+)\}\}/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const variable = match.slice(2, -2).trim();
        if (variable && !variable.startsWith('#if') && !variable.startsWith('/if')) {
          variables.add(variable);
        }
      });
    }
    
    return Array.from(variables);
  }

  /**
   * Extract all conditional expressions from a template
   */
  static extractConditionals(template: string): string[] {
    const conditionals: string[] = [];
    
    const conditionalMatches = template.match(/\{\{#if\s+([^}]+)\}\}/g);
    if (conditionalMatches) {
      conditionalMatches.forEach(match => {
        const condition = match.match(/\{\{#if\s+([^}]+)\}\}/)?.[1];
        if (condition) {
          conditionals.push(condition.trim());
        }
      });
    }
    
    return conditionals;
  }
}

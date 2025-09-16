/**
 * Template Service - Centralized Template Processing
 * 
 * Provides unified template processing functionality across the entire CLI.
 * Handles variable substitution, conditional blocks, and path resolution.
 */

import { GlobalContext, LegacyProjectContext } from '@thearchitech.xyz/types';

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
    context: GlobalContext | LegacyProjectContext, 
    options: TemplateProcessingOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let processed = template;
    
    // 1. Process path variables first (from decentralized path handler)
    if (opts.processPathVariables && 'pathHandler' in context && context.pathHandler?.resolveTemplate) {
      console.log(`🔍 TemplateService: Processing path variables for: ${template}`);
      processed = context.pathHandler.resolveTemplate(processed);
      console.log(`🔍 TemplateService: After path processing: ${processed}`);
    } else if (opts.processPathVariables && 'environment' in context) {
      // Use GlobalContext path resolution
      processed = this.resolvePathVariables(processed, context);
    } else {
      console.log(`⚠️ TemplateService: Path processing skipped - pathHandler:`, 'pathHandler' in context ? !!context.pathHandler : 'N/A', 'resolveTemplate:', 'pathHandler' in context ? !!context.pathHandler?.resolveTemplate : 'N/A');
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
   * Resolve path variables using GlobalContext
   */
  private static resolvePathVariables(template: string, context: GlobalContext): string {
    return template.replace(/\{\{paths\.([^}]+)\}\}/g, (match, key) => {
      const paths = context.environment.paths;
      switch (key) {
        case 'projectRoot': return paths.projectRoot;
        case 'sourceRoot': return paths.sourceRoot;
        case 'configRoot': return paths.configRoot;
        case 'libRoot': return paths.libRoot;
        default: return match;
      }
    });
  }

  /**
   * Process Handlebars-like conditionals {{#if condition}}...{{/if}}
   */
  private static processConditionals(
    template: string, 
    context: GlobalContext | LegacyProjectContext, 
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
    context: GlobalContext | LegacyProjectContext, 
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
  private static resolveCrossModuleParameter(context: GlobalContext | LegacyProjectContext, variable: string): unknown {
    // Handle GlobalContext
    if ('environment' in context) {
      const globalContext = context as GlobalContext;
      
      // Handle module parameters
      if (variable.startsWith('module.parameters.')) {
        const paramPath = variable.substring(18);
        const currentModule = globalContext.execution.currentModule;
        if (currentModule) {
          const moduleConfig = globalContext.modules.configurations.get(currentModule);
          return this.getNestedValueFromObject(moduleConfig?.parameters || {}, paramPath);
        }
        return undefined;
      }
      
      return undefined;
    }
    
    // Handle LegacyProjectContext
    const legacyContext = context as LegacyProjectContext;
    
    // Handle common cross-module parameter patterns
    if (variable === 'module.parameters.databaseType') {
      return legacyContext.databaseModule?.parameters?.databaseType || 
             legacyContext.databaseModule?.parameters?.provider ||
             'postgresql';
    }
    
    if (variable === 'module.parameters.currency') {
      const currencies = legacyContext.paymentModule?.parameters?.currencies;
      if (Array.isArray(currencies) && currencies.length > 0) {
        return currencies[0]; // Return first currency
      }
      return legacyContext.paymentModule?.parameters?.currency || 'usd';
    }
    
    if (variable === 'module.parameters.provider') {
      return legacyContext.databaseModule?.parameters?.provider || 'postgresql';
    }
    
    if (variable === 'module.parameters.mode') {
      return legacyContext.paymentModule?.parameters?.mode || 'test';
    }
    
    // Handle other common patterns
    if (variable.startsWith('databaseModule.parameters.')) {
      const param = variable.replace('databaseModule.parameters.', '');
      return legacyContext.databaseModule?.parameters?.[param];
    }
    
    if (variable.startsWith('paymentModule.parameters.')) {
      const param = variable.replace('paymentModule.parameters.', '');
      return legacyContext.paymentModule?.parameters?.[param];
    }
    
    if (variable.startsWith('authModule.parameters.')) {
      const param = variable.replace('authModule.parameters.', '');
      return legacyContext.authModule?.parameters?.[param];
    }
    
    return undefined;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: GlobalContext | LegacyProjectContext, path: string): unknown {
    if (!path) return undefined;
    
    // Handle GlobalContext specific paths
    if ('environment' in obj) {
      const globalContext = obj as GlobalContext;
      
      // Handle environment variables
      if (path.startsWith('env.')) {
        const key = path.substring(4);
        const variable = globalContext.environment.variables.get(key);
        return variable ? variable.value : undefined;
      }
      
      // Handle module parameters
      if (path.startsWith('module.parameters.')) {
        const paramPath = path.substring(18);
        const currentModule = globalContext.execution.currentModule;
        if (currentModule) {
          const moduleConfig = globalContext.modules.configurations.get(currentModule);
          return this.getNestedValueFromObject(moduleConfig?.parameters || {}, paramPath);
        }
        return undefined;
      }
      
      // Handle project variables
      if (path.startsWith('project.')) {
        const propPath = path.substring(8);
        return this.getNestedValueFromObject(globalContext.project, propPath);
      }
      
      // Handle execution variables
      if (path.startsWith('execution.')) {
        const propPath = path.substring(10);
        return this.getNestedValueFromObject(globalContext.execution, propPath);
      }
    }
    
    // Fallback to standard nested value resolution
    return this.getNestedValueFromObject(obj, path);
  }

  /**
   * Get nested value from object using dot notation (helper method)
   */
  private static getNestedValueFromObject(obj: unknown, path: string): unknown {
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

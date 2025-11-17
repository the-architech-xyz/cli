/**
 * Template Service - Centralized Template Processing
 * 
 * Provides unified template processing functionality across the entire CLI.
 * Now powered by EJS for robust template processing with zero JSX conflicts.
 * Handles variable substitution, conditional blocks, loops, and path resolution.
 * 
 * Template Syntax (EJS):
 * - Variables: <%= variable %>
 * - Conditionals: <% if (condition) { %> ... <% } %>
 * - Loops: <% array.forEach((item, index) => { %> ... <% }); %>
 */

import * as ejs from 'ejs';
import { ProjectContext } from '@thearchitech.xyz/marketplace/types/template-context.js';

export interface TemplateProcessingOptions {
  /**
   * Whether to process conditionals ({{#if}} or <% if %>)
   * @default true
   */
  processConditionals?: boolean;
  
  /**
   * Whether to process path variables through the path handler
   * @default true
   */
  processPathVariables?: boolean;
  
  /**
   * Whether to process template variables ({{var}} or <%= var %>)
   * @default true
   */
  processVariables?: boolean;
  
  /**
   * Whether to validate path variables before processing
   * @default true
   */
  validatePathVariables?: boolean;
  
  /**
   * Whether to throw an error if path validation fails
   * @default false
   */
  strictPathValidation?: boolean;
}

export class TemplateService {
  private static readonly DEFAULT_OPTIONS: Required<TemplateProcessingOptions> = {
    processConditionals: true,
    processPathVariables: true,
    processVariables: true,
    validatePathVariables: true,
    strictPathValidation: false
  };

  /**
   * Process a template string with the given context
   * HYBRID APPROACH:
   * - EJS (<% %>) for .tpl files with complex React/JSX code
   * - Simple regex ({{ }}) for blueprint inline strings (backward compatible)
   * 
   * Automatically detects which engine to use based on syntax found in template.
   */
  static processTemplate(
    template: string, 
    context: ProjectContext, 
    options: TemplateProcessingOptions = {}
  ): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let processed = template;
    
    // 0. Validate path variables if enabled (sync validation only - checks if paths exist in PathService)
    if (opts.validatePathVariables && context.pathHandler) {
      const pathKeyRegex = /\$\{paths\.([^}]+)\}/g;
      const missingPaths: string[] = [];
      let match;
      
      while ((match = pathKeyRegex.exec(processed)) !== null) {
        const key = match[1]?.trim();
        if (key && !context.pathHandler.hasPath(key)) {
          missingPaths.push(key);
        }
      }
      
      if (missingPaths.length > 0) {
        const errorMessage = `Path validation failed. Missing path keys: ${missingPaths.join(', ')}. ` +
                           `Available paths: ${context.pathHandler.getAvailablePaths?.()?.slice(0, 20).join(', ') || 'none'}`;
        
        if (opts.strictPathValidation) {
          throw new Error(errorMessage);
        } else {
          console.warn(`⚠️ ${errorMessage}`);
        }
      }
    }
    
    // 1. Process path variables first (our custom logic)
    // PathResolver removed - paths are now stored in correct format (relative to package root)
    // Use pathHandler.resolveTemplate() directly
    if (opts.processPathVariables && context.pathHandler?.resolveTemplate) {
      processed = context.pathHandler.resolveTemplate(processed);
    }
    
    // 2. Detect template engine based on syntax
    const hasEJSSyntax = processed.includes('<%');
    const hasHandlebarsSyntax = processed.includes('{{');
    
    if (opts.processVariables || opts.processConditionals) {
      // STRATEGY 1: Use EJS for templates with EJS syntax (complex .tpl files)
      if (hasEJSSyntax) {
        try {
          // DEBUG: Log context structure
          console.log('🔍 EJS Context keys:', Object.keys(context));
          console.log('🔍 Has project?', !!context.project);
          console.log('🔍 Has modules?', !!context.modules, Array.isArray(context.modules) ? `(${context.modules.length} items)` : '');
          
          // Ensure params is always available (even if empty) to prevent template errors
          // This is a safety net in case params wasn't added in orchestrator-agent
          const contextAny = context as any;
          if (!contextAny.params) {
            contextAny.params = context.module?.parameters || {};
          }
          
          processed = ejs.render(processed, context, {
            async: false,
            compileDebug: true,
            escape: (str: string) => str,
            rmWhitespace: false,
            // NOTE: Removed _with: false to allow direct property access in templates
            // Templates can use: module.parameters.xxx instead of context.module.parameters.xxx
          });
          console.log('✅ EJS processing successful');
          
        } catch (error) {
          console.error('❌ EJS processing failed:', error);
          console.error('📋 Context snapshot:', JSON.stringify({
            project: context.project,
            moduleId: context.module?.id,
            hasModules: !!context.modules,
            modulesCount: Array.isArray(context.modules) ? context.modules.length : 'not array'
          }, null, 2));
          
          // Try to extract line number from error
          if (error instanceof Error && error.message) {
            console.error('💥 Error details:', error.message);
          }
          
          throw new Error(`EJS template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      // STRATEGY 2: Use simple regex for Handlebars syntax (blueprint inline strings)
      else if (hasHandlebarsSyntax) {
        processed = this.processSimpleHandlebars(processed, context, opts);
        console.log('✅ Simple template processing successful');
      }
    }
    
    return processed;
  }

  /**
   * Process simple Handlebars-style templates (for blueprint inline strings)
   * Uses clean, simple regex - perfect for non-nested command strings
   */
  private static processSimpleHandlebars(
    template: string,
    context: ProjectContext,
    options: Required<TemplateProcessingOptions>
  ): string {
    let processed = template;

    // Process simple {{#if condition}}...{{/if}} (non-nested only)
    processed = processed.replace(
      /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        const value = this.getNestedValue(context, condition.trim());
        return this.isTruthy(value) ? content : '';
      }
    );

    // Process simple variable substitution {{variable}} and expressions {{variable || "fallback"}}
    processed = processed.replace(
      /\{\{([^{#/}][^}]*?)\}\}/g,
      (match, variable) => {
        const trimmedVariable = variable.trim();
        
        // Handle JavaScript expressions with || operator
        if (trimmedVariable.includes('||')) {
          return this.evaluateExpression(context, trimmedVariable);
        }
        
        // Handle simple variable substitution
        const value = this.getNestedValue(context, trimmedVariable);
        return value !== undefined ? String(value) : match;
      }
    );

    return processed;
  }

  /**
   * Process a template with strict path validation (throws error on missing paths)
   */
  static processTemplateWithStrictValidation(
    template: string, 
    context: ProjectContext, 
    options: Omit<TemplateProcessingOptions, 'strictPathValidation'> = {}
  ): string {
    return this.processTemplate(template, context, {
      ...options,
      strictPathValidation: true
    });
  }

  /**
   * Validate path variables in a template without processing
   * Note: Marketplace validation is async, but this method provides sync validation
   */
  static validateTemplatePaths(
    template: string, 
    context: ProjectContext
  ): { valid: boolean; missingPaths: string[]; usedPaths: string[] } {
    if (!context.pathHandler) {
      return { valid: true, missingPaths: [], usedPaths: [] };
    }

    // Sync validation: check if paths exist in PathService
    const pathKeyRegex = /\$\{paths\.([^}]+)\}/g;
    const missingPaths: string[] = [];
    const usedPaths: string[] = [];
    let match;
    
    while ((match = pathKeyRegex.exec(template)) !== null) {
      const key = match[1]?.trim();
      if (key) {
        usedPaths.push(key);
        if (!context.pathHandler.hasPath(key)) {
          missingPaths.push(key);
        }
      }
    }
    
    return {
      valid: missingPaths.length === 0,
      missingPaths,
      usedPaths
    };
  }

  /**
   * REMOVED: Old complex regex-based template processing methods
   * 
   * The following methods have been replaced by a HYBRID system:
   * - Complex .tpl files: Processed by EJS (<% if %>, <%= var %>)
   * - Simple blueprint strings: Processed by simple regex ({{#if}}, {{var}})
   * 
   * Removed methods:
   * - processConditionals() - Now split: EJS for complex, regex for simple
   * - processEachLoops() - EJS handles <% forEach %>, regex handles {{#each}}
   * - processVariables() - EJS handles <%= %>, regex handles {{}}
   * - resolveCrossModuleParameter() - Merged into getNestedValue()
   * 
   * Migration Date: October 11, 2025
   * Reason: Handlebars conflicted with JSX {{ }}; regex failed on nested structures
   * Solution: EJS for templates, simple regex for inline strings
   */

  /**
   * Get nested value from object using dot notation
   * Used internally by simple regex processor for blueprint strings
   * 
   * Example: getNestedValue(context, 'project.name') → 'hello-world'
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
   * Evaluate JavaScript expressions with || operator
   * Used by simple regex processor for expressions like {{variable || "fallback"}}
   */
  private static evaluateExpression(context: ProjectContext, expression: string): string {
    try {
      // Split by || operator
      const parts = expression.split('||').map(part => part.trim());
      
      if (parts.length !== 2) {
        // If not exactly 2 parts, fall back to simple variable substitution
        const value = this.getNestedValue(context, expression);
        return value !== undefined ? String(value) : `{{${expression}}}`;
      }
      
      const [variablePart, fallbackPart] = parts;
      
      if (!variablePart || !fallbackPart) {
        // If parts are missing, fall back to simple variable substitution
        const value = this.getNestedValue(context, expression);
        return value !== undefined ? String(value) : `{{${expression}}}`;
      }
      
      // Get the variable value
      const value = this.getNestedValue(context, variablePart);
      
      // If value exists and is truthy, return it
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
      
      // Otherwise, return the fallback (remove quotes if present)
      const fallback = fallbackPart.replace(/^["']|["']$/g, '');
      return fallback;
      
    } catch (error) {
      // If evaluation fails, return the original expression
      return `{{${expression}}}`;
    }
  }

  /**
   * Check if value is truthy
   * Used by simple regex processor for {{#if}} conditionals in blueprint strings
   * Provides consistent truthiness logic across all template types
   */
  static isTruthy(value: unknown): boolean {
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
   * Validate template syntax using EJS compilation
   * This provides accurate syntax validation
   */
  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Try to compile the template to check for syntax errors
      ejs.compile(template, {
        compileDebug: true,
        client: false,
      });
      
      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown template syntax error';
      errors.push(`EJS template syntax error: ${errorMessage}`);
    
    return {
        valid: false,
      errors
    };
    }
  }

  /**
   * Extract all variables used in a template
   * Uses regex to find EJS variable output tags <%= variable %>
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract variables from <%= variable %> and <%- variable %> syntax
    const variableMatches = template.match(/<%[=-]\s*([^%]+?)\s*%>/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        // Extract the variable name (remove <%= and %>)
        const variable = match.replace(/<%[=-]\s*/, '').replace(/\s*%>/, '').trim();
        if (variable) {
          variables.add(variable);
        }
      });
    }
    
    return Array.from(variables);
  }

  /**
   * Extract all conditional expressions from a template
   * Uses regex to find EJS if statements
   */
  static extractConditionals(template: string): string[] {
    const conditionals: string[] = [];
    
    // Extract conditions from <% if (condition) { %> syntax
    const conditionalMatches = template.match(/<%\s*if\s*\(([^)]+)\)\s*\{\s*%>/g);
    if (conditionalMatches) {
      conditionalMatches.forEach(match => {
        // Extract the condition expression
        const conditionMatch = match.match(/if\s*\(([^)]+)\)/);
        if (conditionMatch && conditionMatch[1]) {
          conditionals.push(conditionMatch[1].trim());
        }
      });
    }
    
    return conditionals;
  }
}

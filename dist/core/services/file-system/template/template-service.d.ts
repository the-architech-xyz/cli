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
export declare class TemplateService {
    private static readonly DEFAULT_OPTIONS;
    /**
     * Process a template string with the given context
     * HYBRID APPROACH:
     * - EJS (<% %>) for .tpl files with complex React/JSX code
     * - Simple regex ({{ }}) for blueprint inline strings (backward compatible)
     *
     * Automatically detects which engine to use based on syntax found in template.
     */
    static processTemplate(template: string, context: ProjectContext, options?: TemplateProcessingOptions): string;
    /**
     * Process simple Handlebars-style templates (for blueprint inline strings)
     * Uses clean, simple regex - perfect for non-nested command strings
     */
    private static processSimpleHandlebars;
    /**
     * Process a template with strict path validation (throws error on missing paths)
     */
    static processTemplateWithStrictValidation(template: string, context: ProjectContext, options?: Omit<TemplateProcessingOptions, 'strictPathValidation'>): string;
    /**
     * Validate path variables in a template without processing
     * Note: Marketplace validation is async, but this method provides sync validation
     */
    static validateTemplatePaths(template: string, context: ProjectContext): {
        valid: boolean;
        missingPaths: string[];
        usedPaths: string[];
    };
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
    private static getNestedValue;
    /**
     * Evaluate JavaScript expressions with || operator
     * Used by simple regex processor for expressions like {{variable || "fallback"}}
     */
    private static evaluateExpression;
    /**
     * Check if value is truthy
     * Used by simple regex processor for {{#if}} conditionals in blueprint strings
     * Provides consistent truthiness logic across all template types
     */
    static isTruthy(value: unknown): boolean;
    /**
     * Validate template syntax using EJS compilation
     * This provides accurate syntax validation
     */
    static validateTemplate(template: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Extract all variables used in a template
     * Uses regex to find EJS variable output tags <%= variable %>
     */
    static extractVariables(template: string): string[];
    /**
     * Extract all conditional expressions from a template
     * Uses regex to find EJS if statements
     */
    static extractConditionals(template: string): string[];
}

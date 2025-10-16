/**
 * Template Service Unit Tests
 * 
 * Tests the centralized template processing functionality
 */

import { describe, it, expect } from 'vitest';
import { TemplateService } from '../../src/core/services/template/template-service.js';
import { ProjectContext } from '../../src/types/agent.js';

describe('TemplateService', () => {
  const mockContext: ProjectContext = {
    project: {
      name: 'test-project',
      framework: 'nextjs',
      path: '/test/path',
      description: 'Test project'
    },
    module: {
      id: 'nextjs',
      category: 'framework',
      version: 'latest',
      parameters: {
        typescript: true,
        tailwind: false
      }
    },
    pathHandler: {
      resolveTemplate: (template: string) => template.replace('{{project.name}}', 'test-project')
    },
    adapter: {
      id: 'nextjs',
      name: 'Next.js',
      description: 'Next.js framework',
      category: 'framework',
      version: 'latest',
      blueprint: 'nextjs.blueprint'
    },
    framework: 'nextjs'
  };

  describe('processTemplate', () => {
    it('should process simple variables', () => {
      const template = 'Hello {{project.name}}!';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('Hello test-project!');
    });

    it('should process nested variables', () => {
      const template = 'Framework: {{context..typescript}}';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('Framework: true');
    });

    it('should process conditionals', () => {
      const template = '{{#if context..typescript}}TypeScript enabled{{/if}}';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('TypeScript enabled');
    });

    it('should skip conditionals when false', () => {
      const template = '{{#if context..tailwind}}Tailwind enabled{{/if}}';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('');
    });

    it('should handle complex conditionals', () => {
      const template = `
        {{#if context..typescript}}
        import React from 'react';
        {{/if}}
        {{#if context..tailwind}}
        import './globals.css';
        {{/if}}
      `;
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toContain("import React from 'react';");
      expect(result).not.toContain("import './globals.css';");
    });

    it('should process path variables through path handler', () => {
      const template = 'Path: {{project.name}}/src';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('Path: test-project/src');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Missing: {{nonexistent.variable}}';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('Missing: {{nonexistent.variable}}');
    });

    it('should handle empty template', () => {
      const result = TemplateService.processTemplate('', mockContext);
      expect(result).toBe('');
    });

    it('should handle template with no variables', () => {
      const template = 'Static content';
      const result = TemplateService.processTemplate(template, mockContext);
      expect(result).toBe('Static content');
    });
  });

  describe('processTemplate with options', () => {
    it('should skip conditionals when disabled', () => {
      const template = '{{#if context..typescript}}TypeScript{{/if}}';
      const result = TemplateService.processTemplate(template, mockContext, {
        processConditionals: false
      });
      expect(result).toBe('{{#if context..typescript}}TypeScript{{/if}}');
    });

    it('should skip variables when disabled', () => {
      const template = 'Hello {{project.name}}!';
      const result = TemplateService.processTemplate(template, mockContext, {
        processVariables: false,
        processPathVariables: false
      });
      expect(result).toBe('Hello {{project.name}}!');
    });

    it('should skip path variables when disabled', () => {
      const template = 'Path: {{project.name}}/src';
      const result = TemplateService.processTemplate(template, mockContext, {
        processPathVariables: false
      });
      expect(result).toBe('Path: test-project/src');
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = 'Hello {{project.name}}!';
      const result = TemplateService.validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unmatched conditionals', () => {
      const template = '{{#if condition}}Content{{/if}}{{#if another}}More content';
      const result = TemplateService.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unmatched conditionals: 2 open, 1 close');
    });

    it('should detect malformed variables', () => {
      const template = 'Hello {{project.name!';
      const result = TemplateService.validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('extractVariables', () => {
    it('should extract all variables from template', () => {
      const template = 'Hello {{project.name}} from {{module.category}}!';
      const variables = TemplateService.extractVariables(template);
      expect(variables).toContain('project.name');
      expect(variables).toContain('module.category');
      expect(variables).toHaveLength(2);
    });

    it('should not extract conditional expressions', () => {
      const template = '{{#if condition}}Content{{/if}}';
      const variables = TemplateService.extractVariables(template);
      expect(variables).toHaveLength(0);
    });

    it('should handle empty template', () => {
      const variables = TemplateService.extractVariables('');
      expect(variables).toHaveLength(0);
    });
  });

  describe('extractConditionals', () => {
    it('should extract all conditionals from template', () => {
      const template = '{{#if condition1}}Content1{{/if}}{{#if condition2}}Content2{{/if}}';
      const conditionals = TemplateService.extractConditionals(template);
      expect(conditionals).toContain('condition1');
      expect(conditionals).toContain('condition2');
      expect(conditionals).toHaveLength(2);
    });

    it('should handle empty template', () => {
      const conditionals = TemplateService.extractConditionals('');
      expect(conditionals).toHaveLength(0);
    });
  });
});

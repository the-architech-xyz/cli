/**
 * DynamicQuestioner Tests
 * 
 * Tests for the dynamic question generation system that reads
 * ParameterSchema from plugins to generate questions automatically.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicQuestioner } from '../../../src/core/questions/dynamic-questioner';
import { IEnhancedPlugin, ParameterSchema, ParameterDefinition, ParameterOption, ParameterCondition, ParameterValidationRule, PluginCategory } from '../../../src/types/plugins';
import { ProjectContext, TechStackRecommendation, CustomizationQuestion, ValidationResult, ValidationError } from '../../../src/types/smart-questions';

// Mock plugins for testing
const mockShadcnUIPlugin: IEnhancedPlugin = {
  getMetadata: () => ({
    id: 'shadcn-ui',
    name: 'Shadcn UI',
    version: '1.0.0',
    description: 'Beautiful UI components',
    author: 'Test',
    category: PluginCategory.UI_LIBRARY,
    tags: ['ui', 'components'],
    license: 'MIT'
  }),
  getParameterSchema: () => ({
    category: PluginCategory.UI_LIBRARY,
    parameters: [
      {
        id: 'ui.components',
        name: 'Components',
        description: 'Select UI components to install',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'button', label: 'Button', description: 'Basic button component' },
          { value: 'card', label: 'Card', description: 'Card component' },
          { value: 'input', label: 'Input', description: 'Input component' }
        ],
        default: ['button', 'card'],
        validation: [
          {
            type: 'required',
            message: 'At least one component is required'
          }
        ]
      },
      {
        id: 'ui.theme',
        name: 'Theme',
        description: 'Select theme mode',
        type: 'select',
        required: false,
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' }
        ],
        default: 'system'
      },
      {
        id: 'ui.styling',
        name: 'Styling',
        description: 'Select styling approach',
        type: 'select',
        required: true,
        options: [
          { value: 'tailwind', label: 'Tailwind CSS' },
          { value: 'css', label: 'Custom CSS' }
        ],
        default: 'tailwind'
      }
    ],
    dependencies: [],
    validations: [],
    groups: [
      {
        id: 'ui',
        name: 'UI Configuration',
        description: 'Configure UI components and styling',
        order: 1,
        parameters: ['ui.components', 'ui.theme', 'ui.styling']
      }
    ]
  }),
  validateConfiguration: vi.fn((config: Record<string, any>): ValidationResult => {
    const errors: ValidationError[] = [];
    if (!config['ui.components'] || config['ui.components'].length === 0) {
      errors.push({
        field: 'ui.components',
        message: 'At least one component is required',
        code: 'REQUIRED',
        severity: 'error' as 'error' | 'warning'
      });
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }),
  install: vi.fn(),
  uninstall: vi.fn(),
  update: vi.fn(),
  validate: vi.fn(),
  getCompatibility: vi.fn(),
  getRequirements: vi.fn(),
  getConflicts: vi.fn(),
  getDependencies: vi.fn(),
  getConfigSchema: vi.fn(),
  getDefaultConfig: vi.fn(),
  getDynamicQuestions: vi.fn(),
  generateUnifiedInterface: vi.fn()
};

const mockRailwayPlugin: IEnhancedPlugin = {
  getMetadata: () => ({
    id: 'railway',
    name: 'Railway',
    version: '1.0.0',
    description: 'Deployment platform',
    author: 'Test',
    category: PluginCategory.DEPLOYMENT,
    tags: ['deployment', 'hosting'],
    license: 'MIT'
  }),
  getParameterSchema: () => ({
    category: PluginCategory.DEPLOYMENT,
    parameters: [
      {
        id: 'deployment.environment',
        name: 'Environment',
        description: 'Deployment environment',
        type: 'select',
        required: true,
        options: [
          { value: 'production', label: 'Production' },
          { value: 'staging', label: 'Staging' },
          { value: 'development', label: 'Development' }
        ],
        default: 'production'
      },
      {
        id: 'deployment.builder',
        name: 'Builder',
        description: 'Build system',
        type: 'select',
        required: true,
        options: [
          { value: 'nixpacks', label: 'Nixpacks' },
          { value: 'dockerfile', label: 'Dockerfile' }
        ],
        default: 'nixpacks'
      }
    ],
    dependencies: [],
    validations: [],
    groups: [
      {
        id: 'deployment',
        name: 'Deployment Configuration',
        description: 'Configure deployment settings',
        order: 2,
        parameters: ['deployment.environment', 'deployment.builder']
      }
    ]
  }),
  validateConfiguration: vi.fn((config: Record<string, any>): ValidationResult => {
    const errors: ValidationError[] = [];
    if (!config['deployment.environment']) {
      errors.push({
        field: 'deployment.environment',
        message: 'Environment is required',
        code: 'REQUIRED',
        severity: 'error' as 'error' | 'warning'
      });
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }),
  install: vi.fn(),
  uninstall: vi.fn(),
  update: vi.fn(),
  validate: vi.fn(),
  getCompatibility: vi.fn(),
  getRequirements: vi.fn(),
  getConflicts: vi.fn(),
  getDependencies: vi.fn(),
  getConfigSchema: vi.fn(),
  getDefaultConfig: vi.fn(),
  getDynamicQuestions: vi.fn(),
  generateUnifiedInterface: vi.fn()
};

// Mock PluginSystem
vi.mock('../../../src/core/plugin/plugin-system.js', () => ({
  PluginSystem: {
    getInstance: vi.fn(() => ({
      getRegistry: () => ({
        get: vi.fn((id: string) => {
          if (id === 'shadcn-ui') return mockShadcnUIPlugin;
          if (id === 'railway') return mockRailwayPlugin;
          return null;
        })
      })
    }))
  }
}));

describe('DynamicQuestioner', () => {
  let dynamicQuestioner: DynamicQuestioner;

  beforeEach(() => {
    dynamicQuestioner = new DynamicQuestioner();
  });

  describe('generatePluginQuestions', () => {
    it('should generate questions from plugin parameter schemas', async () => {
      const selectedPlugins = ['shadcn-ui', 'railway'];
      const context = {};
      
      const questions = await dynamicQuestioner.generatePluginQuestions(selectedPlugins, context);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      // Should have questions for both plugins
      const shadcnQuestions = questions.filter(q => q.category === 'shadcn-ui');
      const railwayQuestions = questions.filter(q => q.category === 'railway');
      
      expect(shadcnQuestions.length).toBeGreaterThan(0);
      expect(railwayQuestions.length).toBeGreaterThan(0);
    });

    it('should convert parameter types correctly', async () => {
      const selectedPlugins = ['shadcn-ui'];
      const context = {};
      const questions = await dynamicQuestioner.generatePluginQuestions(selectedPlugins, context);
      
      const componentsQuestion = questions.find(q => q.id === 'shadcn-ui.ui.components');
      expect(componentsQuestion).toBeDefined();
      expect(componentsQuestion?.type).toBe('checkbox');
      expect(componentsQuestion?.choices).toBeDefined();
      expect(componentsQuestion?.choices?.length).toBe(3);
      
      const themeQuestion = questions.find(q => q.id === 'shadcn-ui.ui.theme');
      expect(themeQuestion).toBeDefined();
      expect(themeQuestion?.type).toBe('select');
      expect(themeQuestion?.choices).toBeDefined();
      expect(themeQuestion?.choices?.length).toBe(3);
    });

    it('should handle required parameters', async () => {
      const selectedPlugins = ['shadcn-ui'];
      const context = {};
      const questions = await dynamicQuestioner.generatePluginQuestions(selectedPlugins, context);
      
      const requiredQuestion = questions.find(q => q.id === 'shadcn-ui.ui.components');
      expect(requiredQuestion).toBeDefined();
      expect(requiredQuestion?.validate).toBeDefined();
      
      const optionalQuestion = questions.find(q => q.id === 'shadcn-ui.ui.theme');
      expect(optionalQuestion).toBeDefined();
    });

    it('should handle default values', async () => {
      const selectedPlugins = ['shadcn-ui'];
      const context = {};
      const questions = await dynamicQuestioner.generatePluginQuestions(selectedPlugins, context);
      
      const componentsQuestion = questions.find(q => q.id === 'shadcn-ui.ui.components');
      expect(componentsQuestion?.default).toEqual(['button', 'card']);
      
      const themeQuestion = questions.find(q => q.id === 'shadcn-ui.ui.theme');
      expect(themeQuestion?.default).toBe('system');
    });
  });

  describe('validatePluginConfiguration', () => {
    it('should validate configuration using plugin validation', async () => {
      const answers = {
        'shadcn-ui.ui.components': ['button'],
        'shadcn-ui.ui.theme': 'system',
        'shadcn-ui.ui.styling': 'tailwind'
      };
      const selectedPlugins = ['shadcn-ui'];
      
      const result = await dynamicQuestioner.validatePluginConfiguration(answers, selectedPlugins);
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle validation errors', async () => {
      const answers = {
        'shadcn-ui.ui.theme': 'system',
        'shadcn-ui.ui.styling': 'tailwind'
        // Missing required 'ui.components'
      };
      const selectedPlugins = ['shadcn-ui'];
      
      const result = await dynamicQuestioner.validatePluginConfiguration(answers, selectedPlugins);
      
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('shadcn-ui.ui.components');
    });
  });

  describe('convertParameterToQuestion', () => {
    it('should convert SELECT parameters to select questions', () => {
      const param: ParameterDefinition = {
        id: 'test.select',
        name: 'Test Select',
        description: 'Test description',
        type: 'select',
        required: true,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ],
        default: 'option1'
      };
      
      const question = dynamicQuestioner['convertParameterToQuestion'](param, mockShadcnUIPlugin, {});
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('select');
      expect(question?.name).toBe('shadcn-ui.test.select');
      expect(question?.message).toBe('Test Select');
      expect(question?.choices).toBeDefined();
      expect(question?.choices?.length).toBe(2);
      expect(question?.default).toBe('option1');
    });

    it('should convert MULTI_SELECT parameters to checkbox questions', () => {
      const param: ParameterDefinition = {
        id: 'test.multi',
        name: 'Test Multi',
        description: 'Test description',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ],
        default: ['option1']
      };
      
      const question = dynamicQuestioner['convertParameterToQuestion'](param, mockShadcnUIPlugin, {});
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('checkbox');
      expect(question?.name).toBe('shadcn-ui.test.multi');
      expect(question?.message).toBe('Test Multi');
      expect(question?.choices).toBeDefined();
      expect(question?.choices?.length).toBe(2);
      expect(question?.default).toEqual(['option1']);
    });

    it('should convert BOOLEAN parameters to confirm questions', () => {
      const param: ParameterDefinition = {
        id: 'test.boolean',
        name: 'Test Boolean',
        description: 'Test description',
        type: 'boolean',
        required: true,
        default: true
      };
      
      const question = dynamicQuestioner['convertParameterToQuestion'](param, mockShadcnUIPlugin, {});
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('confirm');
      expect(question?.name).toBe('shadcn-ui.test.boolean');
      expect(question?.message).toBe('Test Boolean');
      expect(question?.default).toBe(true);
    });

    it('should convert STRING parameters to input questions', () => {
      const param: ParameterDefinition = {
        id: 'test.string',
        name: 'Test String',
        description: 'Test description',
        type: 'string',
        required: true,
        default: 'default value'
      };
      
      const question = dynamicQuestioner['convertParameterToQuestion'](param, mockShadcnUIPlugin, {});
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('input');
      expect(question?.name).toBe('shadcn-ui.test.string');
      expect(question?.message).toBe('Test String');
      expect(question?.default).toBe('default value');
    });

    it('should convert NUMBER parameters to input questions', () => {
      const param: ParameterDefinition = {
        id: 'test.number',
        name: 'Test Number',
        description: 'Test description',
        type: 'number',
        required: true,
        default: 42
      };
      
      const question = dynamicQuestioner['convertParameterToQuestion'](param, mockShadcnUIPlugin, {});
      
      expect(question).toBeDefined();
      expect(question?.type).toBe('input');
      expect(question?.name).toBe('shadcn-ui.test.number');
      expect(question?.message).toBe('Test Number');
      expect(question?.default).toBe(42);
    });
  });

  describe('shouldShowParameter', () => {
    it('should show parameter without conditions', () => {
      const param: ParameterDefinition = {
        id: 'test.param',
        name: 'Test Parameter',
        description: 'Test parameter',
        type: 'string',
        required: true
      };
      
      const context = {};
      const shouldShow = dynamicQuestioner['shouldShowParameter'](param, context);
      
      expect(shouldShow).toBe(true);
    });

    it('should evaluate equals condition correctly', () => {
      const param: ParameterDefinition = {
        id: 'test.param',
        name: 'Test Parameter',
        description: 'Test parameter',
        type: 'string',
        required: true,
        conditions: [
          {
            parameter: 'test.field',
            operator: 'equals',
            value: 'expected',
            action: 'show'
          }
        ]
      };
      
      const context = { 'test.field': 'expected' };
      const shouldShow = dynamicQuestioner['shouldShowParameter'](param, context);
      
      expect(shouldShow).toBe(true);
    });

    it('should hide parameter when condition is not met', () => {
      const param: ParameterDefinition = {
        id: 'test.param',
        name: 'Test Parameter',
        description: 'Test parameter',
        type: 'string',
        required: true,
        conditions: [
          {
            parameter: 'test.field',
            operator: 'equals',
            value: 'expected',
            action: 'show'
          }
        ]
      };
      
      const context = { 'test.field': 'different' };
      const shouldShow = dynamicQuestioner['shouldShowParameter'](param, context);
      
      expect(shouldShow).toBe(false);
    });

    it('should handle multiple conditions with AND logic', () => {
      const param: ParameterDefinition = {
        id: 'test.param',
        name: 'Test Parameter',
        description: 'Test parameter',
        type: 'string',
        required: true,
        conditions: [
          {
            parameter: 'test.field1',
            operator: 'equals',
            value: 'value1',
            action: 'show'
          },
          {
            parameter: 'test.field2',
            operator: 'equals',
            value: 'value2',
            action: 'show'
          }
        ]
      };
      
      const context = { 
        'test.field1': 'value1',
        'test.field2': 'value2'
      };
      const shouldShow = dynamicQuestioner['shouldShowParameter'](param, context);
      
      expect(shouldShow).toBe(true);
    });
  });

  describe('validateParameter', () => {
    it('should validate required parameters', () => {
      const value = '';
      const rules = [
        {
          type: 'required',
          message: 'This field is required'
        }
      ];
      const result = dynamicQuestioner['validateParameter'](value, rules);
      
      expect(result).toBe('This field is required');
    });

    it('should validate optional parameters', () => {
      const value = '';
      const rules = [];
      const result = dynamicQuestioner['validateParameter'](value, rules);
      
      expect(result).toBe(true);
    });

    it('should validate string length', () => {
      const value = 'ab';
      const rules = [
        {
          type: 'minLength',
          value: 3,
          message: 'Minimum 3 characters required'
        }
      ];
      
      const result = dynamicQuestioner['validateParameter'](value, rules);
      
      expect(result).toBe('Minimum 3 characters required');
    });

    it('should validate number range', () => {
      const value = 5;
      const rules = [
        {
          type: 'min',
          value: 10,
          message: 'Minimum value is 10'
        }
      ];
      
      const result = dynamicQuestioner['validateParameter'](value, rules);
      
      expect(result).toBe('Minimum value is 10');
    });
  });

  describe('sortQuestionsByGroup', () => {
    it('should sort questions by group order', () => {
      const questions = [
        { id: 'group2.param', category: 'group2', message: 'Group 2' },
        { id: 'group1.param', category: 'group1', message: 'Group 1' },
        { id: 'group3.param', category: 'group3', message: 'Group 3' }
      ] as any[];
      
      const sorted = dynamicQuestioner['sortQuestionsByGroup'](questions);
      
      expect(sorted.length).toBe(3);
      expect(sorted[0].id).toBe('group1.param');
      expect(sorted[1].id).toBe('group2.param');
      expect(sorted[2].id).toBe('group3.param');
    });

    it('should handle questions without groups', () => {
      const questions = [
        { id: 'param1', message: 'Param 1' },
        { id: 'param2', message: 'Param 2' }
      ] as any[];
      
      const sorted = dynamicQuestioner['sortQuestionsByGroup'](questions);
      
      expect(sorted.length).toBe(2);
      expect(sorted[0].id).toBe('param1');
      expect(sorted[1].id).toBe('param2');
    });
  });

  describe('extractPluginAnswers', () => {
    it('should extract answers by plugin ID', () => {
      const allAnswers = {
        'shadcn-ui.ui.components': ['button', 'card'],
        'shadcn-ui.ui.theme': 'system',
        'railway.deployment.environment': 'production',
        'other.param': 'value'
      };
      
      const pluginId = 'shadcn-ui';
      const pluginAnswers = dynamicQuestioner['extractPluginAnswers'](allAnswers, pluginId);
      
      expect(pluginAnswers).toEqual({
        'ui.components': ['button', 'card'],
        'ui.theme': 'system'
      });
    });

    it('should handle empty answers', () => {
      const allAnswers = {};
      const pluginId = 'shadcn-ui';
      const pluginAnswers = dynamicQuestioner['extractPluginAnswers'](allAnswers, pluginId);
      
      expect(pluginAnswers).toEqual({});
    });
  });
}); 
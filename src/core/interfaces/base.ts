/**
 * Core Interfaces for Tech-Agnostic Plugin Architecture
 * 
 * Defines the foundational interfaces for the new adapter-based system.
 * This replaces the old plugin system with a more flexible, tech-agnostic approach.
 */

export enum CoreCategory {
  FRAMEWORK = 'framework',
  DATABASE = 'database',
  AUTH = 'auth',
  UI = 'ui',
  DEPLOYMENT = 'deployment',
  TESTING = 'testing',
  OBSERVABILITY = 'observability',
  EMAIL = 'email',
  CONTENT = 'content',
  PERFORMANCE = 'performance',
  STATE = 'state'
}

export interface PluginMetadata {
  name: string;
  version: string;
  category: CoreCategory;
  description: string;
  dependencies?: string[];
  conflicts?: string[];
  requirements?: any[];
  license?: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  tags?: string[];
  author?: string;
}

export interface ParameterSchema {
  parameters: ParameterDefinition[];
  groups?: ParameterGroup[];
  conditions?: ParameterCondition[];
}

export interface ParameterDefinition {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  enum?: any[];
  validation?: ValidationRule[];
  group?: string;
  condition?: ParameterCondition;
}

export interface ParameterGroup {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface ParameterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

export interface AgentContext {
  workspacePath: string;
  answers: Record<string, any>;
  env: Record<string, string>;
  runStep: (stepId: string, cmd: string) => Promise<void>;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

export interface PluginResult {
  success: boolean;
  filesGenerated?: string[];
  nextSteps?: string[];
  warnings?: string[];
  errors?: string[];
  artifacts?: any[];
  dependencies?: string[];
  scripts?: Record<string, string>;
  configs?: Record<string, any>;
  duration?: number;
}

export interface PluginError {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
  suggestion?: string;
  timestamp: Date;
}

export interface IPlugin {
  getMetadata(): PluginMetadata;
  getParameterSchema(): ParameterSchema;
  execute(context: AgentContext): Promise<PluginResult>;
  rollback?(context: AgentContext): Promise<void>;
  validate?(context: AgentContext): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
} 
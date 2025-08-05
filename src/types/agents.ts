/**
 * Agent Types
 * 
 * Agent-specific types and interfaces for the AI-powered orchestration system.
 * Agents are the "brains" that coordinate plugin execution and make intelligent decisions.
 */

import { 
  ValidationResult, 
  ValidationError, 
  Artifact, 
  Logger, 
  LogLevel, 
  LogContext,
  EnvironmentInfo, 
  UserContext,
  ProjectType,
  TargetPlatform,
  DEFAULT_TIMEOUT,
  ERROR_CODES
} from './core.js';
import { CommandRunner } from '../core/cli/command-runner.js';
import { StructureInfo } from '../core/project/structure-service.js';
import { IPlugin, PluginCategory } from './plugins.js';
import { ProjectContext, TechRecommendation } from './smart-questions.js';

// Re-export core types for convenience
export type {
  ValidationResult,
  ValidationError,
  Artifact,
  Logger,
  LogContext,
  EnvironmentInfo,
  UserContext
};
export {
  LogLevel,
  ProjectType,
  TargetPlatform,
  DEFAULT_TIMEOUT,
  ERROR_CODES
};

// ============================================================================
// CORE AGENT INTERFACE
// ============================================================================

export interface IAgent {
  // Core execution
  execute(context: AgentContext): Promise<AgentResult>;
  
  // Lifecycle hooks
  validate?(context: AgentContext): Promise<ValidationResult>;
  prepare?(context: AgentContext): Promise<void>;
  cleanup?(context: AgentContext): Promise<void>;
  
  // Error handling & recovery
  rollback?(context: AgentContext): Promise<void>;
  retry?(context: AgentContext, attempt: number): Promise<AgentResult>;
  
  // Metadata & capabilities
  getMetadata(): AgentMetadata;
  getCapabilities(): AgentCapability[];
  
  // Plugin discovery & recommendations (NEW)
  getAvailablePlugins?(): Promise<IPlugin[]>;
  getPluginCapabilities?(pluginId: string): Promise<AgentCapability[]>;
  getRecommendations?(context: ProjectContext): Promise<TechRecommendation[]>;
  getDomainCategories?(): PluginCategory[];
  
  // State management (optional)
  getState?(): AgentState | undefined;
  setState?(state: AgentState): void;
}

// ============================================================================
// CONTEXT & CONFIGURATION
// ============================================================================

export interface AgentContext {
  // Project configuration
  projectName: string;
  projectPath: string;
  packageManager: string;
  
  // Project structure and preferences
  projectStructure?: StructureInfo;
  
  // User input and requirements
  userInput?: string;
  
  // Execution options
  options: ExecutionOptions;
  
  // Agent-specific configuration
  config: Record<string, any>;
  
  // Shared utilities
  runner: CommandRunner;
  logger: Logger;
  
  // State management (immutable)
  state: Map<string, any>;
  
  // Dependencies on other agents
  dependencies: string[];
  
  // Environment information
  environment: EnvironmentInfo;
  
  // User context (for future use)
  user?: UserContext;
}

export interface ExecutionOptions {
  skipGit: boolean;
  skipInstall: boolean;
  useDefaults: boolean;
  verbose: boolean;
  dryRun?: boolean;
  force?: boolean;
  timeout?: number;
}

// ============================================================================
// RESULTS & VALIDATION
// ============================================================================

export interface AgentResult {
  success: boolean;
  data?: any;
  errors?: AgentError[];
  warnings?: string[];
  duration: number;
  artifacts?: Artifact[];
  nextSteps?: string[];
  state?: AgentState;
  metrics?: PerformanceMetrics;
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestion?: string;
  timestamp: Date;
}

// ============================================================================
// METADATA & CAPABILITIES
// ============================================================================

export interface AgentMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  category: AgentCategory;
  tags: string[];
  dependencies: string[];
  conflicts?: string[];
  requirements: AgentRequirement[];
  license?: string;
  repository?: string;
}

export interface AgentCapability {
  id?: string;
  name: string;
  description: string;
  parameters?: Parameter[];
  examples?: Example[];
  category: CapabilityCategory;
  requirements?: string[];
  conflicts?: string[];
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface Example {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedResult: any;
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'enum' | 'custom';
  value: any;
  message: string;
}

export interface AgentRequirement {
  type: 'package' | 'file' | 'permission' | 'environment';
  name: string;
  version?: string;
  description: string;
}

// ============================================================================
// ENUMS
// ============================================================================

export enum AgentCategory {
  FOUNDATION = 'foundation',
  FRAMEWORK = 'framework',
  UI = 'ui',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  DEPLOYMENT = 'deployment',
  TESTING = 'testing',
  PAYMENT = 'payment',
  EMAIL = 'email',
  ADMIN = 'admin',
  MONITORING = 'monitoring',
  CUSTOM = 'custom'
}

export enum CapabilityCategory {
  FOUNDATION = 'foundation',
  FRAMEWORK = 'framework',
  SETUP = 'setup',
  CONFIGURATION = 'configuration',
  GENERATION = 'generation',
  VALIDATION = 'validation',
  OPTIMIZATION = 'optimization',
  INTEGRATION = 'integration'
}

// ============================================================================
// ARTIFACTS & STATE
// ============================================================================

export interface AgentState {
  version: string;
  data: Record<string, any>;
  timestamp: Date;
  checksum: string;
}

// ============================================================================
// PERFORMANCE & MONITORING
// ============================================================================

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  artifactsGenerated: number;
  filesCreated: number;
  dependenciesInstalled: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type AgentFactory = (context: AgentContext) => IAgent;

export type AgentValidator = (context: AgentContext) => Promise<ValidationResult>;

export type AgentExecutor = (context: AgentContext) => Promise<AgentResult>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const AGENT_INTERFACE_VERSION = '1.0.0';

export const SUPPORTED_AGENT_CATEGORIES = Object.values(AgentCategory);

export const AGENT_ERROR_CODES = ERROR_CODES; 
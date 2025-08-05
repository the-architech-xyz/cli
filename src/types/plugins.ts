/**
 * Plugin Types and Interfaces
 * 
 * Defines the core plugin system types, interfaces, and utilities.
 */

import { 
  AgentContext, 
  ValidationResult, 
  ValidationError 
} from './agents.js';
import { Question } from './questions.js';

/**
 * Plugin Types
 * 
 * Plugin-specific types and interfaces for the modular technology system.
 * Plugins are the "hands" that implement specific technologies and generate artifacts.
 */

import { 
  Artifact, 
  Logger,
  ProjectType,
  TargetPlatform,
  // Database types
  DatabaseProvider,
  ORMLibrary,
  DatabaseFeature,
  ORMOption,
  ConnectionOption,
  // Auth types
  AuthProvider,
  AuthFeature,
  SessionOption,
  SecurityOption,
  // UI types
  UILibrary,
  ComponentOption,
  ThemeOption,
  StylingOption,
  // Deployment types
  DeploymentPlatform,
  // Email types
  EmailService,
  EmailFeature,
  TemplateOption,
  // Testing types
  TestingFramework,
  TestType,
  CoverageOption,
  // Payment types
  PaymentProvider,
  PaymentFeature,
  // Monitoring types
  MonitoringService,
  AnalyticsOption,
  AlertOption,
  // Blockchain types
  BlockchainNetwork,
  SmartContractOption,
  WalletOption,
  // Framework types
  FrameworkOption,
  BuildOption,
  DeploymentOption,
  // Plugin config types
  DatabasePluginConfig,
  UIPluginConfig,
  AuthPluginConfig,
  TestingPluginConfig
} from './core.js';

// Re-export core types for convenience
export type {
  ValidationResult,
  ValidationError,
  Artifact,
  Logger,
  // Database types
  DatabaseProvider,
  ORMLibrary,
  // Auth types
  AuthProvider,
  // UI types
  UILibrary,
  // Deployment types
  DeploymentPlatform,
  // Email types
  EmailService,
  // Testing types
  TestingFramework,
  // Payment types
  PaymentProvider,
  // Monitoring types
  MonitoringService,
  // Plugin config types
  DatabasePluginConfig,
  UIPluginConfig,
  AuthPluginConfig,
  TestingPluginConfig
};
export {
  ProjectType,
  TargetPlatform,
  // Database enums
  DatabaseFeature,
  ORMOption,
  ConnectionOption,
  // Auth enums
  AuthFeature,
  SessionOption,
  SecurityOption,
  // UI enums
  ComponentOption,
  ThemeOption,
  StylingOption,
  // Email enums
  EmailFeature,
  TemplateOption,
  // Testing enums
  TestType,
  CoverageOption,
  // Payment enums
  PaymentFeature,
  // Monitoring enums
  AnalyticsOption,
  AlertOption,
  // Blockchain enums
  BlockchainNetwork,
  SmartContractOption,
  WalletOption,
  // Framework enums
  FrameworkOption,
  BuildOption,
  DeploymentOption
};

// ============================================================================
// MISSING TYPES (not in core.ts)
// ============================================================================

/**
 * Framework Plugin Configuration
 */
export interface FrameworkPluginConfig {
  framework: FrameworkOption;
  buildTool: BuildOption;
  deploymentTarget: DeploymentOption;
  bundler?: string;
  transpiler?: string;
  minifier?: string;
  sourceMaps?: boolean;
  optimization?: boolean;
  // Next.js specific properties
  appRouter?: boolean;
  importAlias?: boolean;
  typescript?: boolean;
  eslint?: boolean;
  tailwind?: boolean;
  srcDir?: boolean;
}

/**
 * Billing Options for Payment Plugins
 */
export enum BillingOption {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one-time',
  USAGE_BASED = 'usage-based',
  FREEMIUM = 'freemium',
  ENTERPRISE = 'enterprise'
}

// ============================================================================
// PLUGIN INTERFACES
// ============================================================================

export interface IPlugin {
  // Core plugin information
  getMetadata(): PluginMetadata;
  
  // Plugin lifecycle
  install(context: PluginContext): Promise<PluginResult>;
  uninstall(context: PluginContext): Promise<PluginResult>;
  update(context: PluginContext): Promise<PluginResult>;
  
  // Validation and compatibility
  validate(context: PluginContext): Promise<ValidationResult>;
  getCompatibility(): CompatibilityMatrix;
  
  // Dependencies and conflicts
  getDependencies(): string[];
  getConflicts(): string[];
  getRequirements(): PluginRequirement[];
  
  // Configuration
  getDefaultConfig(): Record<string, any>;
  getConfigSchema(): ConfigSchema;
}

// Enhanced plugin interface for advanced features
export interface IEnhancedPlugin extends IPlugin {
  // Dynamic parameter definition
  getParameterSchema(): ParameterSchema;
  
  // Dynamic question generation - simplified (returns empty array by default)
  getDynamicQuestions(context: PluginContext): Question[];
  
  // Configuration validation
  validateConfiguration(config: Record<string, any>): ValidationResult;
  
  // Unified interface generation
  generateUnifiedInterface(config: Record<string, any>): UnifiedInterfaceTemplate;
}

// ============================================================================
// CATEGORY-SPECIFIC PLUGIN INTERFACES
// ============================================================================

/**
 * Database Plugin Interface
 */
export interface IUIDatabasePlugin extends IEnhancedPlugin {
  getDatabaseProviders(): string[];
  getORMOptions(): string[];
  getDatabaseFeatures(): string[];
  getConnectionOptions(): string[];
  getProviderLabel(provider: string): string;
  getProviderDescription(provider: string): string;
  getFeatureLabel(feature: string): string;
  getFeatureDescription(feature: string): string;
}

/**
 * Auth Plugin Interface
 */
export interface IUIAuthPlugin extends IEnhancedPlugin {
  getAuthProviders(): string[];
  getAuthFeatures(): string[];
  getSessionOptions(): string[];
  getSecurityOptions(): string[];
}

/**
 * UI Plugin Interface
 */
export interface IUIPlugin extends IEnhancedPlugin {
  getUILibraries(): string[];
  getComponentOptions(): string[];
  getThemeOptions(): string[];
  getStylingOptions(): string[];
}

/**
 * Deployment Plugin Interface
 */
export interface IUIDeploymentPlugin extends IEnhancedPlugin {
  getDeploymentPlatforms(): string[];
  getEnvironmentOptions(): string[];
  getInfrastructureOptions(): string[];
}

/**
 * Testing Plugin Interface
 */
export interface IUITestingPlugin extends IEnhancedPlugin {
  getTestingFrameworks(): string[];
  getTestTypes(): string[];
  getCoverageOptions(): string[];
  getEnvironmentOptions(): string[];
}

/**
 * Email Plugin Interface
 */
export interface IUIEmailPlugin extends IEnhancedPlugin {
  getEmailServices(): string[];
  getEmailFeatures(): string[];
  getTemplateOptions(): string[];
}

/**
 * Payment Plugin Interface
 */
export interface IUIPaymentPlugin extends IEnhancedPlugin {
  getPaymentProviders(): string[];
  getPaymentFeatures(): string[];
  getCurrencyOptions(): string[];
}

/**
 * Monitoring Plugin Interface
 */
export interface IUIMonitoringPlugin extends IEnhancedPlugin {
  getMonitoringServices(): string[];
  getAnalyticsOptions(): string[];
  getAlertOptions(): string[];
}

/**
 * Blockchain Plugin Interface
 */
export interface IUIBlockchainPlugin extends IEnhancedPlugin {
  getBlockchainNetworks(): string[];
  getSmartContractOptions(): string[];
  getWalletOptions(): string[];
}

/**
 * Framework Plugin Interface
 */
export interface IUIFrameworkPlugin extends IEnhancedPlugin {
  getFrameworkOptions(): string[];
  getBuildOptions(): string[];
  getDeploymentOptions(): string[];
}

// ============================================================================
// PLUGIN METADATA
// ============================================================================

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  tags: string[];
  license: string;
  repository?: string;
  homepage?: string;
  documentation?: string;
  changelog?: string;
}

export enum PluginCategory {
  // Framework plugins
  FRAMEWORK = 'framework',
  
  // UI/UX plugins
  UI_LIBRARY = 'ui-library',
  DESIGN_SYSTEM = 'design-system',
  ICON_LIBRARY = 'icon-library',
  ANIMATION = 'animation',
  
  // Database plugins
  DATABASE = 'database',
  ORM = 'orm',
  MIGRATION = 'migration',
  
  // Authentication plugins
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  
  // Feature plugins
  PAYMENT = 'payment',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  ANALYTICS = 'analytics',
  MONITORING = 'monitoring',
  TESTING = 'testing',
  
  // Infrastructure plugins
  DEPLOYMENT = 'deployment',
  CI_CD = 'ci-cd',
  CONTAINERIZATION = 'containerization',
  
  // Development plugins
  CODE_QUALITY = 'code-quality',
  LINTING = 'linting',
  FORMATTING = 'formatting',
  BUNDLING = 'bundling',
  
  // Platform plugins
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  PWA = 'pwa',
  
  // Integration plugins
  API = 'api',
  GRAPHQL = 'graphql',
  WEBSOCKET = 'websocket',
  
  // Custom category
  CUSTOM = 'custom'
}

// ============================================================================
// PLUGIN CONTEXT & RESULT
// ============================================================================

export interface PluginContext extends AgentContext {
  pluginId: string;
  pluginConfig: Record<string, any>;
  installedPlugins: string[];
  projectType: ProjectType;
  targetPlatform: TargetPlatform[];
}

export interface PluginResult {
  success: boolean;
  artifacts: PluginArtifact[];
  dependencies: DependencyInfo[];
  scripts: ScriptInfo[];
  configs: ConfigInfo[];
  errors: PluginError[];
  warnings: string[];
  duration: number;
}

export interface PluginArtifact {
  type: 'file' | 'directory' | 'template' | 'config';
  path: string;
  content?: string;
  template?: string;
  variables?: Record<string, any>;
  permissions?: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  category: PluginCategory;
  optional?: boolean;
}

export interface ScriptInfo {
  name: string;
  command: string;
  description: string;
  category: 'dev' | 'build' | 'test' | 'deploy' | 'custom';
}

export interface ConfigInfo {
  file: string;
  content: string;
  mergeStrategy: 'replace' | 'merge' | 'append';
}

export interface PluginError {
  code: string;
  message: string;
  details?: any;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// COMPATIBILITY & VALIDATION
// ============================================================================

export interface CompatibilityMatrix {
  frameworks: string[];
  platforms: TargetPlatform[];
  nodeVersions: string[];
  packageManagers: string[];
  databases?: string[];
  uiLibraries?: string[];
  conflicts: string[];
}

export interface PluginRequirement {
  type: 'package' | 'binary' | 'service' | 'config';
  name: string;
  description: string;
  version?: string;
  optional?: boolean;
}

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

export interface ConfigSchema {
  type: 'object';
  properties: Record<string, ConfigProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  default?: any;
  enum?: any[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: ConfigProperty;
  properties?: Record<string, ConfigProperty>;
}

// ============================================================================
// ENHANCED PLUGIN FEATURES
// ============================================================================

export interface ParameterSchema {
  category: PluginCategory;
  parameters: ParameterDefinition[];
  dependencies: ParameterDependency[];
  validations: ParameterValidation[];
  groups: ParameterGroup[];
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  options?: ParameterOption[];
  conditions?: ParameterCondition[];
  validation?: ParameterValidationRule[];
  group?: string;
  order?: number;
}

export interface ParameterOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  recommended?: boolean;
  disabled?: boolean;
}

export interface ParameterCondition {
  parameter: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
}

export interface ParameterDependency {
  parameter: string;
  dependsOn: string;
  condition: ParameterCondition;
  message?: string;
}

export interface ParameterValidation {
  parameter: string;
  rules: ParameterValidationRule[];
}

export interface ParameterValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, config: Record<string, any>) => boolean | string;
}

export interface ParameterGroup {
  id: string;
  name: string;
  description: string;
  order: number;
  parameters: string[];
}

export interface UnifiedInterfaceTemplate {
  category: PluginCategory;
  exports: ExportDefinition[];
  types: TypeDefinition[];
  utilities: UtilityDefinition[];
  constants: ConstantDefinition[];
  documentation: string;
}

export interface ExportDefinition {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'constant';
  implementation: string;
  documentation: string;
  parameters?: ParameterDefinition[];
  returnType?: string;
  examples?: string[];
}

export interface TypeDefinition {
  name: string;
  type: 'interface' | 'type' | 'enum';
  definition: string;
  documentation: string;
  properties?: TypeProperty[];
}

export interface TypeProperty {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

export interface UtilityDefinition {
  name: string;
  type: 'function' | 'class';
  implementation: string;
  documentation: string;
  parameters: ParameterDefinition[];
  returnType: string;
  examples: string[];
}

export interface ConstantDefinition {
  name: string;
  value: any;
  documentation: string;
  type: string;
}

// ============================================================================
// PLUGIN REGISTRY & MANAGEMENT
// ============================================================================

export interface PluginRegistry {
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  getAll(): IPlugin[];
  getByCategory(category: PluginCategory): IPlugin[];
  getCompatible(projectType: ProjectType, platform: TargetPlatform[]): IPlugin[];
  validateCompatibility(plugins: string[]): ValidationResult;
}

export interface PluginManager {
  // Plugin lifecycle
  installPlugin(pluginId: string, context: PluginContext): Promise<PluginResult>;
  uninstallPlugin(pluginId: string, context: PluginContext): Promise<PluginResult>;
  updatePlugin(pluginId: string, context: PluginContext): Promise<PluginResult>;
  
  // Batch operations
  installPlugins(pluginIds: string[], context: PluginContext): Promise<PluginResult[]>;
  uninstallPlugins(pluginIds: string[], context: PluginContext): Promise<PluginResult[]>;
  
  // Discovery and validation
  discoverPlugins(): Promise<IPlugin[]>;
  validatePlugin(plugin: IPlugin): Promise<ValidationResult>;
  
  // Configuration
  getPluginConfig(pluginId: string): Record<string, any>;
  setPluginConfig(pluginId: string, config: Record<string, any>): void;
  
  // Dependencies
  resolveDependencies(pluginIds: string[]): Promise<DependencyResolution>;
  checkConflicts(pluginIds: string[]): Promise<ConflictInfo[]>;
}

export interface DependencyResolution {
  plugins: string[];
  order: string[];
  conflicts: ConflictInfo[];
  missing: string[];
}

export interface ConflictInfo {
  plugin1: string;
  plugin2: string;
  reason: string;
  severity: 'error' | 'warning';
  resolution?: string;
} 
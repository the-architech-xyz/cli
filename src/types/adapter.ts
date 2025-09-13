/**
 * Adapter Types - V1 Enhanced with Intelligence
 * 
 * Enhanced adapter structure for intelligent blueprint execution
 */

export interface Adapter {
  config: AdapterConfig;
  blueprint: Blueprint;
}

export interface AdapterConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  blueprint: string;
  dependencies?: string[]; // Other adapters this adapter depends on
  capabilities?: string[]; // What this adapter can do
  limitations?: string; // Textual description of limitations
  parameters?: Record<string, ParameterDefinition>; // Parameter definitions
  features?: Record<string, FeatureDefinition>; // V2: Modular features
  paths?: Record<string, string>; // V1: Framework-specific path declarations
}

export interface ParameterDefinition {
  type: 'string' | 'boolean' | 'number' | 'select' | 'array' | 'object';
  required: boolean;
  default?: any;
  choices?: string[];
  description: string;
  validation?: (value: any) => boolean;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  blueprint: string; // Path to feature blueprint
  dependencies?: string[]; // Other features this feature depends on
  parameters?: Record<string, ParameterDefinition>; // Feature-specific parameters
  category?: 'core' | 'premium' | 'integration' | 'cross-adapter'; // Feature category
  compatibility?: string[]; // Compatible adapters (for cross-adapter features)
}

export interface Blueprint {
  id: string;
  name: string;
  description?: string;
  version?: string;
  contextualFiles?: string[]; // Files that need to be pre-loaded into VFS
  actions: BlueprintAction[];
}

export interface BlueprintAction {
  // High-level semantic actions
  type: 'INSTALL_PACKAGES' | 'ADD_SCRIPT' | 'ADD_ENV_VAR' | 'CREATE_FILE' | 'APPEND_TO_FILE' | 'PREPEND_TO_FILE' | 'RUN_COMMAND' | 'MERGE_JSON' | 'ADD_TS_IMPORT' | 'ENHANCE_FILE' | 'MERGE_CONFIG' | 'WRAP_CONFIG' | 'EXTEND_SCHEMA';
  
  // Common properties
  condition?: string; // Template condition for conditional execution
  
  // INSTALL_PACKAGES parameters
  packages?: string[]; // Array of package names
  isDev?: boolean; // Whether to install as dev dependencies
  
  // ADD_SCRIPT parameters
  name?: string; // Script name
  command?: string; // Script command
  
  // ADD_ENV_VAR parameters
  key?: string; // Environment variable key
  value?: string; // Environment variable value
  description?: string; // Optional description
  
  // CREATE_FILE parameters
  path?: string; // File path
  content?: string; // File content
  overwrite?: boolean; // Whether to overwrite existing files
  
  // APPEND_TO_FILE / PREPEND_TO_FILE parameters
  // (uses path and content from above)
  
  // RUN_COMMAND parameters
  workingDir?: string; // Working directory for command
  
  // MERGE_JSON parameters
  // (uses path from CREATE_FILE and content as object)
  
  // ADD_TS_IMPORT parameters
  imports?: ImportDefinition[];
  
  // ENHANCE_FILE parameters
  modifier?: string; // Modifier function name
  params?: Record<string, any>; // Parameters for modifier function
  fallback?: 'skip' | 'error' | 'create'; // Fallback strategy
  
  // MERGE_CONFIG parameters
  strategy?: 'deep-merge' | 'shallow-merge' | 'replace'; // Merge strategy
  config?: Record<string, any>; // Configuration object to merge
  
  // WRAP_CONFIG parameters
  wrapper?: string; // Wrapper function name
  options?: Record<string, any>; // Options for wrapper function
  
  // EXTEND_SCHEMA parameters
  tables?: SchemaTable[]; // Tables to add to schema
  additionalImports?: string[]; // Additional imports needed (if any)
  
}

export interface SchemaTable {
  name: string; // Table name
  definition: string; // Table definition code
}

export interface ImportDefinition {
  moduleSpecifier: string;
  namedImports?: string[];
  defaultImport?: string;
  namespaceImport?: string;
}

// Modifier system types
export interface ModifierDefinition {
  handler: (filePath: string, params: any, context: any) => Promise<any>; // ProjectContext will be imported
  paramsSchema: any; // JSONSchema for validation
  description: string;
  supportedFileTypes: string[];
}

export interface ModifierRegistry {
  [key: string]: ModifierDefinition;
}

export interface BlueprintExecutionResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
}

# API Reference

## Overview

This document provides a comprehensive reference for The Architech CLI's APIs, interfaces, and types.

## 🏗️ Core Types

### **AgentContext**

```typescript
interface AgentContext {
  projectName: string;
  projectPath: string;
  userInput: string;
  state: Map<string, any>;
  logger: Logger;
}
```

### **PluginContext**

```typescript
interface PluginContext extends AgentContext {
  pluginConfig: Record<string, any>;
  pathResolver: PathResolver;
}
```

### **PluginResult**

```typescript
interface PluginResult {
  success: boolean;
  artifacts: string[];
  dependencies: string[];
  scripts: Record<string, string>;
  configs: Record<string, any>;
  errors: ValidationError[];
  warnings: ValidationError[];
  duration: number;
}
```

## 🎯 Agent Interfaces

### **IAgent**

```typescript
interface IAgent {
  // Core capabilities
  execute(context: AgentContext): Promise<AgentResult>;
  
  // Plugin discovery (Phase 1)
  getAvailablePlugins?(): Promise<IPlugin[]>;
  getPluginCapabilities?(pluginId: string): Promise<AgentCapability[]>;
  getRecommendations?(context: ProjectContext): Promise<TechRecommendation[]>;
  getDomainCategories?(): PluginCategory[];
}
```

### **AgentCapability**

```typescript
interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  confidence: number;
  requirements: string[];
}
```

### **TechRecommendation**

```typescript
interface TechRecommendation {
  pluginId: string;
  name: string;
  description: string;
  confidence: number;
  reasons: string[];
  alternatives: string[];
}
```

## 🔌 Plugin Interfaces

### **IPlugin**

```typescript
interface IPlugin {
  getMetadata(): PluginMetadata;
  async install(context: PluginContext): Promise<PluginResult>;
  async uninstall?(context: PluginContext): Promise<PluginResult>;
  async update?(context: PluginContext): Promise<PluginResult>;
}
```

### **IEnhancedPlugin**

```typescript
interface IEnhancedPlugin extends IPlugin {
  getParameterSchema(): ParameterSchema;
  validateConfiguration(config: Record<string, any>): ValidationResult;
  generateUnifiedInterface(config: Record<string, any>): UnifiedInterfaceTemplate;
  getDynamicQuestions?(context: any): any[];
}
```

### **PluginMetadata**

```typescript
interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  description: string;
  author: string;
  repository?: string;
  documentation?: string;
  compatibility: {
    frameworks: string[];
    nodeVersion: string;
    packageManagers: string[];
  };
}
```

## 📋 Parameter Schema

### **ParameterSchema**

```typescript
interface ParameterSchema {
  category: PluginCategory;
  parameters: ParameterDefinition[];
  validations: ParameterValidation[];
  dependencies: ParameterDependency[];
  groups: ParameterGroup[];
}
```

### **ParameterDefinition**

```typescript
interface ParameterDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  default?: any;
  options?: ParameterOption[];
  validation?: ParameterValidation;
  conditions?: ParameterCondition[];
  group?: string;
}
```

### **ParameterOption**

```typescript
interface ParameterOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  recommended?: boolean;
}
```

### **ParameterValidation**

```typescript
interface ParameterValidation {
  id: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  validate?: (value: any, config: Record<string, any>) => ValidationResult;
}
```

### **ParameterDependency**

```typescript
interface ParameterDependency {
  id: string;
  type: 'required' | 'exclusive' | 'conditional';
  source: string;
  target: string;
  condition?: (config: Record<string, any>) => boolean;
}
```

### **ParameterGroup**

```typescript
interface ParameterGroup {
  id: string;
  name: string;
  description: string;
  parameters: string[];
  order?: number;
}
```

## 🎯 Question System

### **ProjectRecommendation**

```typescript
interface ProjectRecommendation {
  projectType: ProjectType;
  features: string[];
  techStack: TechStackRecommendation;
  complexity: string;
  confidence: number;
  estimatedTime: string;
}
```

### **TechStackRecommendation**

```typescript
interface TechStackRecommendation {
  database: TechRecommendation;
  auth: TechRecommendation;
  ui: TechRecommendation;
  deployment: TechRecommendation;
  testing: TechRecommendation;
}
```

### **TechRecommendation**

```typescript
interface TechRecommendation {
  pluginId: string;
  name: string;
  description: string;
  confidence: number;
  reasons: string[];
  alternatives: string[];
}
```

### **ProjectContext**

```typescript
interface ProjectContext {
  type: ProjectType;
  features: string[];
  complexity: string;
  expertise: string;
  requirements: string[];
}
```

### **CustomizationQuestion**

```typescript
interface CustomizationQuestion {
  id: string;
  name: string;
  type: 'confirm' | 'input' | 'select' | 'multiselect';
  message: string;
  description?: string;
  default?: any;
  choices?: Array<{ name: string; value: any; description?: string }>;
  when?: (answers: Record<string, any>) => boolean;
  validate?: (input: any) => ValidationResult;
}
```

### **DynamicCustomizationQuestion**

```typescript
interface DynamicCustomizationQuestion extends CustomizationQuestion {
  category?: string;
  dependencies?: ParameterDependency[];
  conditions?: ParameterCondition[];
}
```

## 🔧 Validation

### **ValidationResult**

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

### **ValidationError**

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}
```

## 🛣️ Path Resolution

### **PathResolver**

```typescript
class PathResolver {
  constructor(context: AgentContext);
  
  // Framework detection
  isNextJSAppRouter(): boolean;
  isMonorepo(): boolean;
  getFramework(): string;
  
  // Path resolution
  getAppPath(): string;
  getComponentsPath(): string;
  getLibPath(): string;
  getPublicPath(): string;
  getTypesPath(): string;
  getConfigPath(filename: string): string;
  getEnvPath(): string;
  
  // File operations
  generateFile(filePath: string, content: string): Promise<void>;
  readFile(filePath: string): Promise<string>;
  fileExists(filePath: string): Promise<boolean>;
}
```

## 🎨 Unified Interfaces

### **UnifiedInterfaceTemplate**

```typescript
interface UnifiedInterfaceTemplate {
  category: PluginCategory;
  exports: UnifiedExport[];
  types: UnifiedType[];
  utilities: UnifiedUtility[];
  constants: UnifiedConstant[];
  documentation: string;
}
```

### **UnifiedExport**

```typescript
interface UnifiedExport {
  name: string;
  type: 'class' | 'function' | 'constant' | 'interface';
  implementation: string;
  documentation: string;
  examples: string[];
}
```

### **UnifiedType**

```typescript
interface UnifiedType {
  name: string;
  type: 'interface' | 'type' | 'enum';
  definition: string;
  documentation: string;
}
```

### **UnifiedUtility**

```typescript
interface UnifiedUtility {
  name: string;
  type: 'function';
  signature: string;
  documentation: string;
  examples: string[];
}
```

### **UnifiedConstant**

```typescript
interface UnifiedConstant {
  name: string;
  value: string | number | boolean;
  documentation: string;
}
```

## 🏗️ Project Configuration

### **ProjectConfig**

```typescript
interface ProjectConfig {
  projectName: string;
  projectType: string;
  features: string[];
  techStack: {
    framework: FrameworkConfig;
    database: DatabaseConfig;
    auth: AuthConfig;
    ui: UIConfig;
    deployment: DeploymentConfig;
    testing: TestingConfig;
  };
  customizations: Record<string, any>;
  plugins: string[];
  complexity: string;
  estimatedTime: string;
}
```

### **FrameworkConfig**

```typescript
interface FrameworkConfig {
  name: string;
  version: string;
  features: string[];
  config: Record<string, any>;
}
```

### **DatabaseConfig**

```typescript
interface DatabaseConfig {
  provider: string;
  orm: string;
  features: string[];
  connectionString?: string;
  migrations: boolean;
  seeding: boolean;
}
```

### **AuthConfig**

```typescript
interface AuthConfig {
  provider: string;
  providers: string[];
  session: string;
  emailVerification: boolean;
  security: string[];
}
```

### **UIConfig**

```typescript
interface UIConfig {
  library: string;
  components: string[];
  theme: string;
  styling: string;
}
```

### **DeploymentConfig**

```typescript
interface DeploymentConfig {
  platform: string;
  environment: string;
  builder: string;
  watchPatterns: string[];
}
```

### **TestingConfig**

```typescript
interface TestingConfig {
  framework: string;
  testTypes: string[];
  coverage: boolean;
  coverageThreshold: number;
}
```

## 🔄 Enums

### **PluginCategory**

```typescript
enum PluginCategory {
  FRAMEWORK = 'framework',
  UI_LIBRARY = 'ui_library',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  DEPLOYMENT = 'deployment',
  TESTING = 'testing',
  MONITORING = 'monitoring',
  PAYMENT = 'payment',
  EMAIL = 'email',
  CUSTOM = 'custom'
}
```

### **ProjectType**

```typescript
enum ProjectType {
  BLOG = 'blog',
  ECOMMERCE = 'ecommerce',
  SAAS = 'saas',
  DASHBOARD = 'dashboard',
  API = 'api',
  PORTFOLIO = 'portfolio',
  CUSTOM = 'custom'
}
```

### **DATABASE_PROVIDERS**

```typescript
enum DATABASE_PROVIDERS {
  NEON = 'neon',
  SUPABASE = 'supabase',
  MONGODB = 'mongodb',
  PLANETSCALE = 'planetscale',
  LOCAL_SQLITE = 'local-sqlite'
}
```

## 🚀 Usage Examples

### **Creating a Plugin**

```typescript
import { BasePlugin, PluginCategory } from '@the-architech/core';

export class MyPlugin extends BasePlugin {
  getMetadata() {
    return {
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      category: PluginCategory.CUSTOM,
      description: 'My custom plugin',
      author: 'Your Name',
      compatibility: {
        frameworks: ['nextjs'],
        nodeVersion: '>=16.0.0',
        packageManagers: ['npm', 'yarn']
      }
    };
  }

  getParameterSchema() {
    return {
      category: PluginCategory.CUSTOM,
      parameters: [
        {
          id: 'option1',
          name: 'Option 1',
          type: 'string',
          description: 'First option',
          required: true,
          default: 'default-value'
        }
      ],
      validations: [],
      dependencies: [],
      groups: []
    };
  }

  validateConfiguration(config: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!config.option1) {
      errors.push({
        field: 'option1',
        message: 'Option 1 is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async install(context: PluginContext): Promise<PluginResult> {
    // Implementation
    return this.createSuccessResult({
      artifacts: ['Generated files'],
      dependencies: ['my-dependency'],
      scripts: {},
      configs: {}
    });
  }
}
```

### **Creating an Agent**

```typescript
import { IAgent, AgentContext, AgentResult } from '@the-architech/core';

export class MyAgent implements IAgent {
  async execute(context: AgentContext): Promise<AgentResult> {
    // Implementation
    return {
      success: true,
      data: {},
      errors: []
    };
  }

  async getAvailablePlugins(): Promise<IPlugin[]> {
    // Return available plugins
    return [];
  }

  async getRecommendations(context: ProjectContext): Promise<TechRecommendation[]> {
    // Return technology recommendations
    return [];
  }
}
```

### **Using PathResolver**

```typescript
import { PathResolver } from '@the-architech/core';

const pathResolver = new PathResolver(context);

// Get framework-aware paths
const appPath = pathResolver.getAppPath();
const componentsPath = pathResolver.getComponentsPath();
const libPath = pathResolver.getLibPath();

// Generate files
await pathResolver.generateFile('app/page.tsx', content);
await pathResolver.generateFile('lib/utils.ts', utilsContent);
```

### **Creating Parameter Schema**

```typescript
const schema: ParameterSchema = {
  category: PluginCategory.DATABASE,
  parameters: [
    {
      id: 'provider',
      name: 'Database Provider',
      type: 'select',
      description: 'Choose your database provider',
      required: true,
      default: 'neon',
      options: [
        { value: 'neon', label: 'Neon', recommended: true },
        { value: 'supabase', label: 'Supabase' },
        { value: 'mongodb', label: 'MongoDB' }
      ]
    },
    {
      id: 'connectionString',
      name: 'Connection String',
      type: 'string',
      description: 'Database connection string',
      required: false,
      conditions: [
        {
          parameter: 'provider',
          operator: 'not_equals',
          value: 'local-sqlite',
          action: 'show'
        }
      ]
    }
  ],
  validations: [
    {
      id: 'connection-string-validation',
      type: 'custom',
      message: 'Connection string is required for remote databases',
      validate: (config) => {
        if (config.provider !== 'local-sqlite' && !config.connectionString) {
          return {
            valid: false,
            errors: [{
              field: 'connectionString',
              message: 'Connection string is required',
              code: 'REQUIRED_FIELD',
              severity: 'error'
            }]
          };
        }
        return { valid: true, errors: [] };
      }
    }
  ],
  dependencies: [],
  groups: [
    {
      id: 'database-setup',
      name: 'Database Setup',
      description: 'Configure your database',
      parameters: ['provider', 'connectionString']
    }
  ]
};
```

## 📚 Error Handling

### **Common Error Types**

```typescript
// Configuration validation error
interface ConfigurationError {
  type: 'CONFIGURATION_ERROR';
  field: string;
  message: string;
  code: string;
}

// Plugin installation error
interface InstallationError {
  type: 'INSTALLATION_ERROR';
  pluginId: string;
  message: string;
  details: string;
}

// Path resolution error
interface PathError {
  type: 'PATH_ERROR';
  path: string;
  message: string;
  operation: string;
}
```

### **Error Handling Example**

```typescript
try {
  const result = await plugin.install(context);
  if (!result.success) {
    console.error('Plugin installation failed:', result.errors);
    return;
  }
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Configuration error in ${error.field}: ${error.message}`);
  } else if (error instanceof InstallationError) {
    console.error(`Installation error for ${error.pluginId}: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

**This API reference provides comprehensive documentation for all The Architech CLI interfaces, types, and usage patterns. For specific implementation details, see the individual documentation files.** 
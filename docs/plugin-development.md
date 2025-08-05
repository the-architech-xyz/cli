# Plugin Development Guide

## Overview

The Architech uses a powerful plugin system that allows you to add new technologies and features. This guide covers how to create, develop, and integrate plugins into the system.

## 🏗️ Plugin Architecture

### **Three-Layer Architecture**

Each plugin follows a consistent 3-file structure:

```
src/plugins/libraries/orm/drizzle/
├── DrizzlePlugin.ts       # Main plugin class
├── DrizzleSchema.ts       # Parameter schema definitions
└── DrizzleGenerator.ts    # File generation logic
```

### **Plugin Categories**

Plugins are organized into categories based on their functionality:

- **🗄️ Database**: ORMs, databases, migrations
- **🔐 Authentication**: Auth providers, session management
- **🎨 UI Libraries**: Component libraries, styling
- **🚀 Deployment**: Hosting platforms, containers
- **🧪 Testing**: Testing frameworks, utilities
- **📧 Email**: Email services, templates
- **💳 Payments**: Payment processors, billing
- **📊 Monitoring**: Analytics, error tracking

## 🔌 Plugin Interface

### **Base Plugin Interface**

```typescript
export interface IPlugin {
  getMetadata(): PluginMetadata;
  async install(context: PluginContext): Promise<PluginResult>;
  async uninstall(context: PluginContext): Promise<PluginResult>;
  async update(context: PluginContext): Promise<PluginResult>;
}
```

### **Enhanced Plugin Interface**

```typescript
export interface IEnhancedPlugin extends IPlugin {
  getParameterSchema(): ParameterSchema;
  validateConfiguration(config: Record<string, any>): ValidationResult;
  generateUnifiedInterface(config: Record<string, any>): UnifiedInterfaceTemplate;
  getDynamicQuestions(context: any): any[];
}
```

### **Plugin Metadata**

```typescript
export interface PluginMetadata {
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

## 📋 Creating a New Plugin

### **Step 1: Plugin Structure**

Create the basic plugin structure:

```bash
src/plugins/libraries/your-category/your-plugin/
├── YourPlugin.ts
├── YourSchema.ts
└── YourGenerator.ts
```

### **Step 2: Plugin Class**

```typescript
// src/plugins/libraries/your-category/your-plugin/YourPlugin.ts
import { BasePlugin } from '../../base/BasePlugin';
import { PluginContext, PluginResult } from '../../../types/plugins';
import { YourSchema } from './YourSchema';
import { YourGenerator } from './YourGenerator';

export class YourPlugin extends BasePlugin {
  private generator: YourGenerator;

  getMetadata() {
    return {
      id: 'your-plugin',
      name: 'Your Plugin',
      version: '1.0.0',
      category: PluginCategory.YOUR_CATEGORY,
      description: 'Description of your plugin',
      author: 'Your Name',
      compatibility: {
        frameworks: ['nextjs', 'react'],
        nodeVersion: '>=16.0.0',
        packageManagers: ['npm', 'yarn', 'pnpm']
      }
    };
  }

  getParameterSchema() {
    return YourSchema.getParameterSchema();
  }

  validateConfiguration(config: Record<string, any>): ValidationResult {
    return YourSchema.validateConfiguration(config);
  }

  async install(context: PluginContext): Promise<PluginResult> {
    const startTime = Date.now();
    
    try {
      // Initialize path resolver
      this.initializePathResolver(context);
      
      // Initialize generator
      this.generator = new YourGenerator(this.pathResolver);
      
      // Get configuration
      const config = context.pluginConfig as YourPluginConfig;
      
      // Validate configuration
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        return this.createErrorResult('Configuration validation failed', validation.errors);
      }
      
      // Generate files
      await this.generator.generateFiles(config, context);
      
      // Install dependencies
      await this.installDependencies(config.dependencies);
      
      // Generate unified interface
      const unifiedInterface = this.generateUnifiedInterface(config);
      await this.generateUnifiedInterfaceFile(unifiedInterface);
      
      return this.createSuccessResult({
        artifacts: this.generator.getArtifacts(),
        dependencies: config.dependencies,
        scripts: config.scripts,
        configs: config.configs
      }, Date.now() - startTime);
      
    } catch (error) {
      return this.createErrorResult('Plugin installation failed', error);
    }
  }
}
```

### **Step 3: Parameter Schema**

```typescript
// src/plugins/libraries/your-category/your-plugin/YourSchema.ts
import { ParameterSchema, ParameterDefinition, PluginCategory } from '../../../types/plugins';

export class YourSchema {
  static getParameterSchema(): ParameterSchema {
    return {
      category: PluginCategory.YOUR_CATEGORY,
      parameters: [
        {
          id: 'option1',
          name: 'Option 1',
          type: 'string',
          description: 'Description of option 1',
          required: true,
          default: 'default-value',
          validation: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          }
        },
        {
          id: 'option2',
          name: 'Option 2',
          type: 'boolean',
          description: 'Enable option 2',
          required: false,
          default: false
        },
        {
          id: 'option3',
          name: 'Option 3',
          type: 'select',
          description: 'Choose option 3',
          required: false,
          default: 'choice1',
          options: [
            { value: 'choice1', label: 'Choice 1' },
            { value: 'choice2', label: 'Choice 2' },
            { value: 'choice3', label: 'Choice 3' }
          ]
        }
      ],
      validations: [
        {
          id: 'custom-validation',
          type: 'custom',
          message: 'Custom validation message',
          validate: (config: Record<string, any>) => {
            // Custom validation logic
            return { valid: true };
          }
        }
      ],
      dependencies: [
        {
          id: 'option2-depends-on-option1',
          type: 'required',
          source: 'option1',
          target: 'option2',
          condition: (config: Record<string, any>) => {
            return config.option1 === 'specific-value';
          }
        }
      ],
      groups: [
        {
          id: 'basic-options',
          name: 'Basic Options',
          description: 'Basic configuration options',
          parameters: ['option1', 'option2']
        },
        {
          id: 'advanced-options',
          name: 'Advanced Options',
          description: 'Advanced configuration options',
          parameters: ['option3']
        }
      ]
    };
  }

  static validateConfiguration(config: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate required fields
    if (!config.option1) {
      errors.push({
        field: 'option1',
        message: 'Option 1 is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }
    
    // Validate string length
    if (config.option1 && config.option1.length > 100) {
      errors.push({
        field: 'option1',
        message: 'Option 1 must be less than 100 characters',
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### **Step 4: File Generator**

```typescript
// src/plugins/libraries/your-category/your-plugin/YourGenerator.ts
import { PathResolver } from '../../base/PathResolver';

export class YourGenerator {
  private pathResolver: PathResolver;
  private artifacts: string[] = [];

  constructor(pathResolver: PathResolver) {
    this.pathResolver = pathResolver;
  }

  async generateFiles(config: YourPluginConfig, context: any): Promise<void> {
    // Generate main configuration file
    await this.generateConfigFile(config);
    
    // Generate implementation files
    await this.generateImplementationFiles(config);
    
    // Generate type definitions
    await this.generateTypeDefinitions(config);
  }

  private async generateConfigFile(config: YourPluginConfig): Promise<void> {
    const configContent = this.buildConfigContent(config);
    const configPath = this.pathResolver.getConfigPath('your-config.ts');
    
    await this.generateFile(configPath, configContent);
    this.artifacts.push(configPath);
  }

  private async generateImplementationFiles(config: YourPluginConfig): Promise<void> {
    const libPath = this.pathResolver.getLibPath();
    const implementationPath = path.join(libPath, 'your-plugin');
    
    // Generate main implementation
    const implementationContent = this.buildImplementationContent(config);
    await this.generateFile(path.join(implementationPath, 'index.ts'), implementationContent);
    
    // Generate utilities
    const utilitiesContent = this.buildUtilitiesContent(config);
    await this.generateFile(path.join(implementationPath, 'utils.ts'), utilitiesContent);
    
    this.artifacts.push(implementationPath);
  }

  private async generateTypeDefinitions(config: YourPluginConfig): Promise<void> {
    const typesPath = this.pathResolver.getTypesPath();
    const typesContent = this.buildTypesContent(config);
    
    await this.generateFile(path.join(typesPath, 'your-plugin.ts'), typesContent);
    this.artifacts.push(path.join(typesPath, 'your-plugin.ts'));
  }

  private buildConfigContent(config: YourPluginConfig): string {
    return `
// Generated by Your Plugin
export const yourPluginConfig = {
  option1: '${config.option1}',
  option2: ${config.option2},
  option3: '${config.option3}'
};
`;
  }

  private buildImplementationContent(config: YourPluginConfig): string {
    return `
// Your Plugin Implementation
import { yourPluginConfig } from '../config/your-config';

export class YourPluginService {
  constructor() {
    // Initialize with config
  }

  async initialize(): Promise<void> {
    // Implementation logic
  }

  async execute(): Promise<any> {
    // Main execution logic
  }
}

export const yourPluginService = new YourPluginService();
`;
  }

  private buildUtilitiesContent(config: YourPluginConfig): string {
    return `
// Your Plugin Utilities
export function yourPluginUtility(): void {
  // Utility functions
}
`;
  }

  private buildTypesContent(config: YourPluginConfig): string {
    return `
// Your Plugin Types
export interface YourPluginConfig {
  option1: string;
  option2: boolean;
  option3: string;
}

export interface YourPluginResult {
  success: boolean;
  data?: any;
  error?: string;
}
`;
  }

  getArtifacts(): string[] {
    return this.artifacts;
  }
}
```

## 🎯 Unified Interface Generation

### **Generating Unified Interfaces**

Plugins must generate unified interface files that provide technology-agnostic APIs:

```typescript
export class YourPlugin extends BasePlugin {
  generateUnifiedInterface(config: Record<string, any>): UnifiedInterfaceTemplate {
    return {
      category: PluginCategory.YOUR_CATEGORY,
      exports: [
        {
          name: 'yourService',
          type: 'class',
          implementation: 'YourPluginService',
          documentation: 'Main service for your plugin',
          examples: [
            'await yourService.initialize()',
            'const result = await yourService.execute()'
          ]
        }
      ],
      types: [
        {
          name: 'YourPluginConfig',
          type: 'interface',
          definition: 'interface YourPluginConfig { option1: string; option2: boolean; }',
          documentation: 'Configuration for your plugin'
        }
      ],
      utilities: [
        {
          name: 'yourPluginUtility',
          type: 'function',
          signature: 'yourPluginUtility(): void',
          documentation: 'Utility function for your plugin'
        }
      ],
      constants: [
        {
          name: 'YOUR_PLUGIN_VERSION',
          value: '1.0.0',
          documentation: 'Plugin version'
        }
      ],
      documentation: 'Your Plugin provides...'
    };
  }
}
```

### **Generated Unified Interface File**

The plugin generates a unified interface file:

```typescript
// app/lib/your-category/index.ts (generated)
export interface YourPluginConfig {
  option1: string;
  option2: boolean;
  option3: string;
}

export interface YourPluginResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class YourPluginService {
  private config: YourPluginConfig;

  constructor(config: YourPluginConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Implementation varies by plugin
  }

  async execute(): Promise<YourPluginResult> {
    // Implementation varies by plugin
  }
}

export const yourPluginService = new YourPluginService(config);
```

## 🔧 Plugin Registration

### **Registering Your Plugin**

Add your plugin to the plugin registry:

```typescript
// src/plugins/registry.ts
import { YourPlugin } from './libraries/your-category/your-plugin/YourPlugin';

export const pluginRegistry = [
  // ... existing plugins
  new YourPlugin(),
];
```

### **Plugin Discovery**

Agents automatically discover your plugin:

```typescript
// Agents can query your plugin
const availablePlugins = await agent.getAvailablePlugins();
const yourPlugin = availablePlugins.find(p => p.getMetadata().id === 'your-plugin');

// Get plugin capabilities
const capabilities = await agent.getPluginCapabilities('your-plugin');

// Get recommendations
const recommendations = await agent.getRecommendations(context);
```

## 🧪 Testing Your Plugin

### **Unit Tests**

```typescript
// tests/plugins/your-plugin.test.ts
import { YourPlugin } from '../../src/plugins/libraries/your-category/your-plugin/YourPlugin';

describe('YourPlugin', () => {
  let plugin: YourPlugin;

  beforeEach(() => {
    plugin = new YourPlugin();
  });

  describe('getMetadata', () => {
    it('should return correct metadata', () => {
      const metadata = plugin.getMetadata();
      
      expect(metadata.id).toBe('your-plugin');
      expect(metadata.name).toBe('Your Plugin');
      expect(metadata.category).toBe(PluginCategory.YOUR_CATEGORY);
    });
  });

  describe('getParameterSchema', () => {
    it('should return valid parameter schema', () => {
      const schema = plugin.getParameterSchema();
      
      expect(schema.category).toBe(PluginCategory.YOUR_CATEGORY);
      expect(schema.parameters).toHaveLength(3);
      expect(schema.parameters[0].id).toBe('option1');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate correct configuration', () => {
      const config = {
        option1: 'test-value',
        option2: true,
        option3: 'choice1'
      };
      
      const result = plugin.validateConfiguration(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid configuration', () => {
      const config = {
        option1: '', // Invalid: empty string
        option2: true,
        option3: 'choice1'
      };
      
      const result = plugin.validateConfiguration(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('option1');
    });
  });

  describe('install', () => {
    it('should install plugin successfully', async () => {
      const context = {
        projectPath: '/tmp/test-project',
        pluginConfig: {
          option1: 'test-value',
          option2: true,
          option3: 'choice1'
        }
      };
      
      const result = await plugin.install(context);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toHaveLength(3);
      expect(result.dependencies).toBeDefined();
    });
  });
});
```

### **Integration Tests**

```typescript
// tests/integration/your-plugin-integration.test.ts
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent';

describe('YourPlugin Integration', () => {
  it('should be discovered by agents', async () => {
    const orchestrator = new OrchestratorAgent();
    const availablePlugins = await orchestrator.getAvailablePlugins();
    
    const yourPlugin = availablePlugins.find(p => p.getMetadata().id === 'your-plugin');
    expect(yourPlugin).toBeDefined();
  });

  it('should be recommended by agents', async () => {
    const context = {
      projectType: 'test-project',
      features: ['your-feature'],
      complexity: 'medium'
    };
    
    const recommendations = await agent.getRecommendations(context);
    const yourRecommendation = recommendations.find(r => r.pluginId === 'your-plugin');
    
    expect(yourRecommendation).toBeDefined();
    expect(yourRecommendation.confidence).toBeGreaterThan(0);
  });
});
```

## 📚 Best Practices

### **1. Plugin Design**

- **Single Responsibility**: Each plugin should have one clear purpose
- **Configuration Driven**: Use parameter schemas for all configuration
- **Validation**: Always validate configuration before installation
- **Error Handling**: Provide clear error messages and recovery suggestions

### **2. File Generation**

- **Consistent Structure**: Follow established patterns for file organization
- **Type Safety**: Generate TypeScript definitions for all APIs
- **Documentation**: Include JSDoc comments for all generated code
- **Examples**: Provide usage examples in generated code

### **3. Integration**

- **Unified Interfaces**: Generate technology-agnostic APIs
- **Agent Integration**: Ensure agents can discover and recommend your plugin
- **Dependency Management**: Properly declare and install dependencies
- **Configuration**: Use the parameter schema system for all configuration

### **4. Testing**

- **Unit Tests**: Test all plugin methods thoroughly
- **Integration Tests**: Test plugin discovery and recommendation
- **End-to-End Tests**: Test complete plugin installation
- **Error Cases**: Test error handling and validation

## 🚀 Advanced Features

### **Plugin Dependencies**

```typescript
export class YourPlugin extends BasePlugin {
  getDependencies(): PluginDependency[] {
    return [
      {
        pluginId: 'nextjs',
        version: '>=14.0.0',
        required: true
      },
      {
        pluginId: 'typescript',
        version: '>=5.0.0',
        required: true
      }
    ];
  }
}
```

### **Plugin Conflicts**

```typescript
export class YourPlugin extends BasePlugin {
  getConflicts(): PluginConflict[] {
    return [
      {
        pluginId: 'conflicting-plugin',
        reason: 'Your plugin conflicts with conflicting-plugin',
        resolution: 'Remove conflicting-plugin or use alternative'
      }
    ];
  }
}
```

### **Plugin Hooks**

```typescript
export class YourPlugin extends BasePlugin {
  async beforeInstall(context: PluginContext): Promise<void> {
    // Pre-installation setup
  }

  async afterInstall(context: PluginContext): Promise<void> {
    // Post-installation cleanup
  }

  async onError(error: Error, context: PluginContext): Promise<void> {
    // Error handling
  }
}
```

## 📖 Documentation

### **Plugin Documentation**

Create comprehensive documentation for your plugin:

```markdown
# Your Plugin

## Overview

Your Plugin provides...

## Installation

```bash
architech new my-project
# Select Your Plugin during configuration
```

## Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| option1 | string | Yes | - | Description of option1 |
| option2 | boolean | No | false | Description of option2 |
| option3 | select | No | choice1 | Description of option3 |

## Usage

```typescript
import { yourPluginService } from '@/lib/your-category';

// Initialize the service
await yourPluginService.initialize();

// Use the service
const result = await yourPluginService.execute();
```

## API Reference

### YourPluginService

#### `initialize(): Promise<void>`
Initializes the plugin service.

#### `execute(): Promise<YourPluginResult>`
Executes the main functionality.

## Examples

### Basic Usage

```typescript
// Basic configuration
const config = {
  option1: 'my-value',
  option2: true,
  option3: 'choice1'
};
```

### Advanced Usage

```typescript
// Advanced configuration with custom settings
const config = {
  option1: 'custom-value',
  option2: false,
  option3: 'choice2'
};
```

## Troubleshooting

### Common Issues

1. **Configuration Error**: Ensure all required options are provided
2. **Dependency Error**: Check that all dependencies are installed
3. **Path Error**: Verify that the project structure is correct

### Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/your-repo/issues)
- **Documentation**: [Full documentation](https://your-docs.com)
- **Community**: [Join discussions](https://discord.gg/your-community)
```

---

**Your plugin is now ready to be integrated into The Architech ecosystem! Follow these guidelines to ensure your plugin works seamlessly with the agent-driven architecture and provides a great user experience.** 
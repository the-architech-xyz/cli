# Architecture Overview

## 🏗️ System Architecture

The Architech follows a modern, modular architecture that separates concerns and promotes maintainability. This document provides a high-level overview of how all components work together.

## 🎯 Core Architecture Principles

### 1. **Agent-Driven Intelligence**
- **Agents** handle user interaction and orchestration
- **Plugins** provide technology implementations
- **Core System** manages common functionality
- **Smart Question System** handles intelligent user input

### 2. **Data-Driven Design**
- Plugins provide parameter schemas
- Agents use schemas to generate questions
- Configuration flows from user input to plugin execution

### 3. **Progressive Disclosure**
- Only ask what's needed based on context
- Conditional questions based on previous answers
- Expertise-based complexity

### 4. **Intelligent Recommendations**
- Context-aware technology suggestions
- Project-type specific recommendations
- Confidence-based alternatives

### 5. **Framework-Aware Path Resolution**
- **Next.js App Router**: Uses root `app/`, `components/`, `lib/` directories
- **Monorepo**: Uses `apps/web/src/app/` structure for consistency
- **Automatic Detection**: Framework-aware path resolution
- **Technology Agnostic**: No lock-in to specific structures

### 6. **Three-Layer Unified Interface Architecture**
- **Agents (Brain)**: AI-powered decision making and orchestration
- **Plugins (Hands)**: Technology-specific implementation and unified interface file generation
- **Generated Files (Contract)**: Unified interface files that provide consistent APIs

### 7. **Technology Agnostic Design**
- **No Lock-in**: Easy to switch between technologies without code changes
- **Consistent Validation**: All technologies validated the same way through generated files
- **Extensible**: Add new technologies without changing agent code

## 📊 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    The Architech CLI                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Orchestrator  │    │  Specialized    │                │
│  │     Agent       │    │    Agents       │                │
│  │                 │    │                 │                │
│  │ • Main          │    │ • Database      │                │
│  │   Coordinator   │    │ • Authentication│                │
│  │ • Question      │    │ • UI            │                │
│  │   Orchestration │    │ • Deployment    │                │
│  │ • Plugin        │    │ • Testing       │                │
│  │   Execution     │    │ • Email         │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Smart Question System                   │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Smart         │    │  Unified        │                │
│  │  Recommender    │    │  Questioner     │                │
│  │                 │    │                 │                │
│  │ • Project       │    │ • Present       │                │
│  │   Analysis      │    │   Recommendations│                │
│  │ • Technology    │    │ • Handle        │                │
│  │   Suggestions   │    │   Customization │                │
│  │ • Confidence    │    │ • User          │                │
│  │   Scoring       │    │   Interaction   │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Dynamic        │    │  Config         │                │
│  │  Questioner     │    │  Builder        │                │
│  │                 │    │                 │                │
│  │ • Read Plugin   │    │ • Build Final   │                │
│  │   Schemas       │    │   Configuration │                │
│  │ • Generate      │    │ • Map to        │                │
│  │   Questions     │    │   Plugins       │                │
│  │ • Validate      │    │ • Create        │                │
│  │   Input         │    │   Artifacts     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        Plugin System                        │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Base Plugin   │    │  Category       │                │
│  │                 │    │  Plugins        │                │
│  │ • Common        │    │                 │                │
│  │   Functionality │    │ • Database      │                │
│  │ • Path          │    │ • Authentication│                │
│  │   Resolution    │    │ • UI            │                │
│  │ • File          │    │ • Deployment    │                │
│  │   Generation    │    │ • Testing       │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Parameter      │    │  Unified        │                │
│  │  Schema         │    │  Interface      │                │
│  │                 │    │                 │                │
│  │ • Configuration │    │ • Technology    │                │
│  │   Definition    │    │   Agnostic APIs │                │
│  │ • Validation    │    │ • Consistent    │                │
│  │   Rules         │    │   Interfaces    │                │
│  │ • Dependencies  │    │ • Generated     │                │
│  │   & Conditions  │    │   Files         │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 Agent-Driven Intelligence

### **Phase 1: Agent Enhancement (Completed)**

Agents are now "aware" of available plugins in their domain:

```typescript
export interface IAgent {
  // New capabilities
  getAvailablePlugins?(): Promise<IPlugin[]>;
  getPluginCapabilities?(pluginId: string): Promise<AgentCapability[]>;
  getRecommendations?(context: ProjectContext): Promise<TechRecommendation[]>;
  getDomainCategories?(): PluginCategory[];
}
```

#### **Specialized Agents**

**🎯 UIAgent**
- Discovers UI library plugins (Shadcn UI, Chakra UI, Material-UI)
- Provides UI-specific recommendations
- Handles component generation and theming

**🗄️ DBAgent**
- Discovers database plugins (Drizzle, Prisma, Mongoose)
- Provides database-specific recommendations
- Handles schema generation and migrations

**🔐 AuthAgent**
- Discovers authentication plugins (Better Auth, NextAuth.js)
- Provides auth-specific recommendations
- Handles authentication setup and configuration

**⚙️ OrchestratorAgent**
- Coordinates all specialized agents
- Manages plugin execution order
- Handles dependencies and conflicts
- Creates project structure and artifacts

### **Phase 2: Dynamic Smart Recommender (Completed)**

SmartRecommender now queries agents for recommendations:

```typescript
export class SmartRecommender {
  async generateTechStackRecommendations(context: ProjectContext, features: string[]): Promise<TechStackRecommendation> {
    // Query specialized agents
    const dbRecommendations = await this.dbAgent.getRecommendations(context);
    const authRecommendations = await this.authAgent.getRecommendations(context);
    const uiRecommendations = await this.uiAgent.getRecommendations(context);
    
    return {
      database: this.selectBestRecommendation(dbRecommendations),
      auth: this.selectBestRecommendation(authRecommendations),
      ui: this.selectBestRecommendation(uiRecommendations),
      deployment: this.selectBestRecommendation(deploymentRecommendations),
      testing: this.selectBestRecommendation(testingRecommendations)
    };
  }
}
```

### **Phase 3: Unified Plugin Intelligence (Completed)**

DynamicQuestioner reads plugin schemas automatically:

```typescript
export class DynamicQuestioner {
  async generateQuestionsFromSchema(schema: ParameterSchema): Promise<DynamicCustomizationQuestion[]> {
    const questions: DynamicCustomizationQuestion[] = [];
    
    for (const parameter of schema.parameters) {
      const question = this.convertParameterToQuestion(parameter);
      
      // Add dependencies and conditions
      if (parameter.dependencies) {
        question.dependencies = parameter.dependencies;
      }
      
      if (parameter.conditions) {
        question.conditions = parameter.conditions;
      }
      
      questions.push(question);
    }
    
    return questions;
  }
}
```

## 🔄 Smart Question System

### **Simplified 3-Step Flow**

#### **Step 1: Project Description**
```
🎭 Welcome to The Architech!

What would you like to build?
> A blog with payments and user authentication
```

#### **Step 2: Smart Recommendations**
```
🎯 I'll create a project with these features:

📊 Database: drizzle (90%)
   TypeScript-first ORM with excellent performance and type safety
🔐 Authentication: better-auth (90%)
   Modern, secure authentication with excellent Next.js integration
🎨 UI Library: chakra-ui (80%)
   Comprehensive component library with excellent accessibility
🚀 Deployment: railway (80%)
   Full-stack deployment platform with excellent developer experience
🧪 Testing: vitest (80%)
   Fast testing framework for modern projects

📊 Project: A full-stack web application
⏱️  Estimated time: 4 minutes
🎯 Confidence: 95%
```

#### **Step 3: Minimal Customization**
```
⚙️  Smart defaults will be applied:
   drizzle: provider, orm, features, connectionString, migrations, seeding
   better-auth: providers, session, emailVerification
   railway: environment, builder, watchPatterns
   vitest: testTypes, coverage, coverageThreshold

What would you like to do?
✅ Looks perfect, let's build it!
```

### **Core Components**

#### **🎯 SmartRecommender**
- Analyzes user input for project context
- Determines project type and complexity
- Generates technology recommendations
- Calculates confidence scores
- Estimates project time and complexity

#### **❓ UnifiedQuestioner**
- Presents recommendations in user-friendly format
- Handles user acceptance or rejection
- Manages customization questions
- Integrates with DynamicQuestioner for plugin-specific questions

#### **🔧 DynamicQuestioner**
- Reads plugin ParameterSchema automatically
- Generates questions dynamically
- Validates user input
- Ensures all plugins receive correct configuration

#### **⚙️ OrchestratorAgent**
- Coordinates the entire generation process
- Manages plugin execution order
- Handles dependencies and conflicts
- Creates project structure and artifacts

## 🔌 Plugin System

### **Plugin Architecture**

Each plugin follows a consistent 3-file structure:

```
src/plugins/libraries/orm/drizzle/
├── DrizzlePlugin.ts       # Main plugin class
├── DrizzleSchema.ts       # Parameter schema definitions
└── DrizzleGenerator.ts    # File generation logic
```

### **Plugin Categories**

#### **🗄️ Database Plugins**
- **Drizzle ORM**: TypeScript-first ORM with excellent performance
- **Prisma**: Rich ecosystem with auto-generated client
- **Mongoose**: MongoDB ODM with schema validation

#### **🔐 Authentication Plugins**
- **Better Auth**: Modern, secure authentication
- **NextAuth.js**: Complete authentication solution
- **Clerk**: User management platform

#### **🎨 UI Library Plugins**
- **Shadcn UI**: Beautiful, accessible components
- **Chakra UI**: Comprehensive component library
- **Material-UI**: 100+ components with theming

#### **🚀 Deployment Plugins**
- **Railway**: Full-stack deployment platform
- **Docker**: Containerized deployment
- **Vercel**: Zero-config deployment

#### **🧪 Testing Plugins**
- **Vitest**: Fast testing framework
- **Jest**: Comprehensive testing solution
- **Playwright**: End-to-end testing

### **Plugin Interface**

```typescript
export interface IEnhancedPlugin extends IPlugin {
  getParameterSchema(): ParameterSchema;
  validateConfiguration(config: Record<string, any>): ValidationResult;
  generateUnifiedInterface(config: Record<string, any>): UnifiedInterfaceTemplate;
  getDynamicQuestions(context: any): any[];
}
```

### **Parameter Schema**

```typescript
export interface ParameterSchema {
  category: PluginCategory;
  parameters: ParameterDefinition[];
  validations: ParameterValidation[];
  dependencies: ParameterDependency[];
  groups: ParameterGroup[];
}
```

## 🛣️ Framework-Aware Path Resolution

### **Path Resolution Strategy**

The system automatically detects and uses the correct project structure:

#### **Next.js App Router**
```
project/
├── app/              # Root app directory
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/       # Root components
├── lib/             # Root lib
└── public/          # Public assets
```

#### **Monorepo Structure**
```
project/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/     # Standard monorepo structure
│       │   ├── components/
│       │   └── lib/
│       └── public/
└── packages/
    ├── ui/
    ├── db/
    └── auth/
```

#### **Traditional Structure**
```
project/
├── src/
│   ├── app/         # Traditional structure
│   ├── components/
│   └── lib/
└── public/
```

### **PathResolver Implementation**

```typescript
export class PathResolver {
  private isNextJSAppRouter(): boolean {
    const framework = this.getFramework();
    return framework === 'nextjs' && !this.structure.isMonorepo;
  }

  getAppPath(): string {
    if (this.isNextJSAppRouter()) {
      return path.join(this.context.projectPath, 'app');
    } else {
      return path.join(this.context.projectPath, 'src', 'app');
    }
  }
}
```

## 🔧 Configuration Management

### **Configuration Flow**

1. **User Input** → SmartRecommender analyzes and generates recommendations
2. **Recommendations** → UnifiedQuestioner presents to user
3. **User Acceptance** → DynamicQuestioner generates plugin-specific questions
4. **Customizations** → ConfigBuilder creates final configuration
5. **Configuration** → Plugins receive validated configuration

### **Configuration Structure**

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

## 🚀 Project Generation Process

### **1. Project Structure Creation**
- Creates project directory
- Sets up basic file structure
- Initializes package.json
- Creates configuration files

### **2. Plugin Execution**
- Executes plugins in dependency order
- Installs dependencies
- Generates configuration files
- Creates unified interface files

### **3. Artifact Generation**
- Generates all project files
- Creates configuration files
- Sets up testing framework
- Configures deployment

### **4. Final Setup**
- Installs all dependencies
- Creates README with instructions
- Sets up Git repository
- Configures development tools

## 🎯 Benefits of Current Architecture

### **1. Agent-Driven Intelligence**
- **Specialized agents**: Domain-specific knowledge
- **Dynamic discovery**: Real-time plugin awareness
- **Intelligent recommendations**: Context-aware suggestions
- **Automatic validation**: Plugin-driven configuration

### **2. Simplified User Experience**
- **3 steps instead of 20+**: Describe, review, generate
- **Intelligent defaults**: Minimal configuration required
- **Clear recommendations**: Confidence scores and explanations
- **Fast generation**: Complete projects in under 5 minutes

### **3. Plugin Integration**
- **ParameterSchema**: Standardized configuration
- **Dynamic questions**: Automatic question generation
- **Unified interfaces**: Technology-agnostic APIs
- **Extensible system**: Easy to add new plugins

### **4. Framework Awareness**
- **Next.js App Router**: Automatic path detection
- **Monorepo support**: Turborepo integration
- **Technology agnostic**: No vendor lock-in
- **Consistent structure**: Standardized project organization

## 🔮 Future Enhancements

### **Planned Improvements**

1. **Enhanced AI Integration**
   - More sophisticated project analysis
   - Better technology recommendations
   - Improved confidence scoring

2. **Advanced Customization**
   - Visual configuration interface
   - Real-time preview
   - Advanced customization options

3. **Plugin Ecosystem**
   - Third-party plugin support
   - Plugin marketplace
   - Community contributions

4. **Enterprise Features**
   - Team collaboration
   - Project templates
   - Advanced deployment options

---

**The current architecture provides a modern, intelligent, and efficient system that eliminates complexity while maintaining flexibility and power.** 
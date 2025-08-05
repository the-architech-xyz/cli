# Question Generation System - Current Implementation

## Overview

The Architech CLI uses a modern, intelligent question system that provides a simplified 3-step flow. This system eliminates the complexity of the old progressive flow and template system, offering a more intuitive and efficient user experience.

## 🎯 **Current User Flow**

### **Step 1: Project Description**
```
🎭 Welcome to The Architech!

What would you like to build?
> A blog with payments and user authentication
```

### **Step 2: Smart Recommendations**
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

### **Step 3: Minimal Customization**
```
⚙️  Smart defaults will be applied:
   drizzle: provider, orm, features, connectionString, migrations, seeding
   better-auth: providers, session, emailVerification
   railway: environment, builder, watchPatterns
   vitest: testTypes, coverage, coverageThreshold

What would you like to do?
✅ Looks perfect, let's build it!
```

## 🏗️ **System Architecture**

### **Core Components**

#### **🎯 SmartRecommender**
The brain of the system that analyzes user input and generates intelligent recommendations.

**Responsibilities:**
- Analyze user input for project context
- Determine project type and complexity
- Generate technology recommendations
- Calculate confidence scores
- Estimate project time and complexity

**Implementation:**
```typescript
export class SmartRecommender {
  async getRecommendation(userInput: string): Promise<ProjectRecommendation> {
    // 1. Analyze user input
    const context = this.analyzeProjectContext(userInput);
    
    // 2. Extract features
    const features = this.extractFeatures(userInput);
    
    // 3. Determine complexity
    const complexity = this.calculateComplexity(context, features);
    
    // 4. Generate recommendations
    const techStack = await this.generateTechStackRecommendations(context, features);
    
    // 5. Calculate confidence
    const confidence = this.calculateConfidence(context, techStack);
    
    return {
      projectType: context.type,
      features,
      techStack,
      complexity,
      confidence,
      estimatedTime: this.estimateTime(complexity)
    };
  }
}
```

#### **❓ UnifiedQuestioner**
Presents recommendations to the user and handles customization.

**Responsibilities:**
- Present recommendations in user-friendly format
- Handle user acceptance or rejection
- Manage customization questions
- Integrate with DynamicQuestioner for plugin-specific questions

**Implementation:**
```typescript
export class UnifiedQuestioner {
  async presentRecommendation(recommendation: ProjectRecommendation): Promise<boolean> {
    // Present recommendations with confidence scores
    this.displayRecommendations(recommendation);
    
    // Ask for user acceptance
    const accepted = await this.askForAcceptance();
    
    if (accepted) {
      // Get minimal customizations
      const customizations = await this.askCustomizationQuestions(recommendation);
      return true;
    } else {
      // Handle rejection
      return await this.handleCustomizationRejection(recommendation);
    }
  }
}
```

#### **🔧 DynamicQuestioner**
Generates configuration questions automatically from plugin ParameterSchema.

**Responsibilities:**
- Read plugin ParameterSchema
- Generate questions dynamically
- Validate user input
- Ensure all plugins receive correct configuration

**Implementation:**
```typescript
export class DynamicQuestioner {
  async generateQuestions(plugins: IPlugin[]): Promise<DynamicCustomizationQuestion[]> {
    const questions: DynamicCustomizationQuestion[] = [];
    
    for (const plugin of plugins) {
      const schema = plugin.getParameterSchema();
      
      // Generate questions from parameter schema
      const pluginQuestions = this.generateQuestionsFromSchema(schema);
      
      // Add plugin-specific questions
      questions.push(...pluginQuestions);
    }
    
    return this.sortQuestionsByDependencies(questions);
  }
}
```

#### **⚙️ OrchestratorAgent**
Coordinates the entire generation process.

**Responsibilities:**
- Coordinate all agents
- Manage plugin execution
- Handle dependencies and conflicts
- Create project structure and artifacts

**Implementation:**
```typescript
export class OrchestratorAgent {
  async execute(context: AgentContext): Promise<AgentResult> {
    // 1. Get smart recommendation
    const recommendation = await this.smartRecommender.getRecommendation(context.userInput);
    
    // 2. Present to user
    const accepted = await this.unifiedQuestioner.presentRecommendation(recommendation);
    
    // 3. Get customizations
    const customizations = await this.unifiedQuestioner.askCustomizationQuestions(recommendation);
    
    // 4. Build configuration
    const projectConfig = this.configBuilder.buildConfig(recommendation, customizations);
    
    // 5. Execute plugins
    const result = await this.executePlugins(projectConfig, context);
    
    return result;
  }
}
```

## 🔄 **Agent-Driven Intelligence**

### **Phase 1: Agent Enhancement**
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

### **Phase 2: Dynamic Smart Recommender**
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

### **Phase 3: Unified Plugin Intelligence**
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

## 📊 **Current Implementation Status**

### **✅ Completed Features**

1. **SmartRecommender**
   - ✅ Project context analysis
   - ✅ Feature extraction
   - ✅ Complexity calculation
   - ✅ Technology recommendations
   - ✅ Confidence scoring

2. **UnifiedQuestioner**
   - ✅ Recommendation presentation
   - ✅ User acceptance handling
   - ✅ Customization question management
   - ✅ Integration with DynamicQuestioner

3. **DynamicQuestioner**
   - ✅ ParameterSchema reading
   - ✅ Dynamic question generation
   - ✅ Input validation
   - ✅ Dependency management

4. **OrchestratorAgent**
   - ✅ Agent coordination
   - ✅ Plugin execution
   - ✅ Configuration building
   - ✅ Project structure creation

### **🔄 Current Capabilities**

#### **Project Type Detection**
- Blog platforms
- E-commerce stores
- SaaS applications
- Dashboards
- API backends
- Portfolio websites
- Custom projects

#### **Technology Recommendations**
- **Databases**: Drizzle, Prisma, Mongoose
- **Authentication**: Better Auth, NextAuth.js
- **UI Libraries**: Shadcn UI, Chakra UI, Material-UI
- **Deployment**: Railway, Docker
- **Testing**: Vitest, Jest
- **Email**: Resend, SendGrid
- **Payments**: Stripe, PayPal
- **Monitoring**: Sentry, Google Analytics

#### **Smart Defaults**
- Automatic configuration based on project type
- Intelligent technology selection
- Minimal user input required
- Comprehensive project setup

## 🎯 **Benefits of Current System**

### **1. Simplified User Experience**
- **3 steps instead of 20+**: Describe, review, generate
- **Intelligent defaults**: Minimal configuration required
- **Clear recommendations**: Confidence scores and explanations
- **Fast generation**: Complete projects in under 5 minutes

### **2. Agent-Driven Intelligence**
- **Specialized agents**: Domain-specific knowledge
- **Dynamic discovery**: Real-time plugin awareness
- **Intelligent recommendations**: Context-aware suggestions
- **Automatic validation**: Plugin-driven configuration

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

## 🔮 **Future Enhancements**

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

## 📋 **Usage Examples**

### **Blog Platform**
```bash
architech new my-blog
# Input: "A blog with comments and newsletter signup"
# Output: Next.js + Drizzle + Better Auth + Shadcn UI
```

### **E-commerce Store**
```bash
architech new my-store
# Input: "An online store for electronics with payments"
# Output: Next.js + Drizzle + Better Auth + Shadcn UI + Stripe
```

### **SaaS Application**
```bash
architech new my-saas
# Input: "A SaaS with user management and subscriptions"
# Output: Next.js + Drizzle + Better Auth + Shadcn UI + Stripe
```

### **Dashboard**
```bash
architech new my-dashboard
# Input: "An admin dashboard with charts and user management"
# Output: Next.js + Drizzle + Better Auth + Material-UI + Charts
```

---

**The current question generation system provides a modern, intelligent, and efficient user experience that eliminates complexity while maintaining flexibility and power.** 
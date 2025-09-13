# 🏗️ The Architech

> **The fastest way to build production-ready applications**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/the-architech/cli)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

The Architech is a **Code Supply Chain** platform that elevates developers from "artisans" to "architects" by providing a declarative, agent-based approach to project generation and management.

## 🎯 Mission

Fix three critical problems in modern software development:

- **🔧 Disposable Code Syndrome** - Projects that can't be maintained or extended
- **🧠 Organizational Amnesia** - Loss of architectural knowledge over time  
- **🤖 The AI-Assistant Paradox** - AI tools that create more problems than they solve

## ✨ Features

### V1: Agent-Based Recipe Executor
- **📋 Declarative YAML Recipes** - Define your project in simple YAML files
- **🤖 Specialized Agents** - Each agent handles their domain (framework, database, auth, UI, testing)
- **🔌 Three-Tier Adapter System** - Agnostic Adapters, Dependent Adapters, and Integration Adapters
- **🔗 Integration System** - Cross-adapter integrations using "Requester-Provider" pattern
- **⚡ CLI-First Approach** - Leverages existing tools like `create-next-app` and `shadcn init`
- **🏗️ Three-Layer Architecture** - Clean separation of concerns with File Engine, Orchestrator, and Executor
- **🎯 Semantic Actions** - High-level, intent-driven actions that abstract implementation complexity
- **🗂️ Contextual, Isolated VFS** - Each blueprint runs in its own sandbox with pre-populated files
- **🔄 Smart Fallback Mechanism** - ENHANCE_FILE can auto-create missing files (perfect for API routes)
- **🛡️ Type-Safe** - Built with TypeScript for reliability and developer experience

### V2: Dynamic Module Management (Coming Soon)
- **➕ Dynamic Module Addition** - Add features to existing projects
- **📈 Monorepo Scaling** - Scale projects to monorepo structures
- **🧠 AI-Powered Recommendations** - Intelligent suggestions for project improvements
- **📊 Project State Management** - Track and manage project evolution

## 🚀 Quick Start

### Installation

```bash
npm install -g @the-architech/cli
```

### Create Your First Project

#### Option 1: Using Project Genomes (Recommended)

```bash
# List available genomes
architech list-genomes

# Create a SaaS application
architech new --genome saas-boilerplate --name my-saas

# Create a blog
architech new --genome blog-pro --name my-blog

# Create a marketplace
architech new --genome marketplace --name my-marketplace

# Create a dApp
architech new --genome dapp --name my-dapp
```

#### Option 2: Using Custom Recipes

1. **Create a recipe file** (`my-saas.yaml`):

```yaml
version: "1.0"
project:
  name: "my-saas"
  framework: "nextjs"
  path: "./my-saas"
modules:
  - id: "nextjs"
    category: "framework"
    version: "latest"
    parameters:
      typescript: true
      tailwind: true
      appRouter: true
  - id: "shadcn-ui"
    category: "ui"
    version: "latest"
    parameters:
      components: ["button", "input", "card", "dialog"]
  - id: "drizzle"
    category: "database"
    version: "latest"
    parameters:
      databaseType: "postgresql"
      includeMigrations: true
  - id: "better-auth"
    category: "auth"
    version: "latest"
    parameters:
      providers: ["github", "google"]
      sessionStrategy: "jwt"
  - id: "vitest"
    category: "testing"
    version: "latest"
    parameters:
      coverage: true
      ui: true
options:
  skipInstall: false
```

2. **Generate your project**:

```bash
architech new my-saas.yaml
```

3. **Start developing**:

```bash
cd my-saas
npm run dev
```

## 🏗️ Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Blueprint Executor              │
│                   (Orchestration & Coordination)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Layer 2: Blueprint Orchestrator              │
│              (Semantic Action Translation)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Layer 1: File Modification Engine              │
│                (Primitive File Operations)                  │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

- **📋 Recipe System** - Declarative YAML project definitions with integrations
- **🎯 Orchestrator Agent** - Central coordinator for execution
- **🤖 Specialized Agents** - Domain-specific execution engines
- **🔌 Three-Tier Adapter System** - Agnostic, Dependent, and Integration adapters
- **🔗 Integration Registry** - Cross-adapter integration management
- **📝 Blueprint System** - Declarative action lists with semantic actions
- **🎯 Semantic Actions** - High-level, intent-driven actions (CREATE_FILE, INSTALL_PACKAGES, ENHANCE_FILE, etc.)
- **🗂️ Contextual, Isolated VFS** - Each blueprint runs in its own sandbox with pre-populated files
- **🔍 BlueprintAnalyzer** - Analyzes blueprints to determine required files and execution strategy
- **🔄 Smart Fallback Mechanism** - ENHANCE_FILE can auto-create missing files with fallback strategies
- **🏗️ File Modification Engine** - Core file operations with Virtual File System

### Currently Supported Technologies

#### Frameworks
- **Next.js** - React framework with App Router
- **React** - Component library
- **Vue** - Progressive framework
- **Svelte** - Compile-time framework

#### Databases
- **Drizzle** - Type-safe SQL ORM
- **Prisma** - Next-generation ORM
- **TypeORM** - TypeScript ORM
- **Sequelize** - Promise-based ORM

#### Authentication
- **Better Auth** - Modern authentication library
- **NextAuth.js** - Authentication for Next.js
- **Auth0** - Identity platform
- **Firebase Auth** - Google's authentication service

#### UI Libraries
- **Shadcn/ui** - Re-usable components
- **Chakra UI** - Modular component library
- **Material-UI** - React components
- **Ant Design** - Enterprise-class UI design

#### Testing
- **Vitest** - Fast unit test framework
- **Jest** - JavaScript testing framework
- **Cypress** - End-to-end testing
- **Playwright** - Cross-browser testing

## 📚 Documentation

### Core Architecture
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Complete architectural documentation
- **[Design Choices](docs/CHOICES.md)** - Rationale behind design decisions

### Developer Guides
- **[Adapter Development Guide](docs/ADAPTER_DEVELOPMENT_GUIDE.md)** - Creating custom adapters
- **[Integration Development Guide](docs/INTEGRATION_DEVELOPMENT_GUIDE.md)** - Creating custom integrations
- **[Semantic Actions Guide](docs/SEMANTIC_ACTIONS_GUIDE.md)** - High-level AST-based operations

### References
- **[Recipe Format](docs/RECIPE_FORMAT.md)** - Complete recipe file reference
- **[CLI Reference](docs/CLI_REFERENCE.md)** - Complete CLI command reference

## 🛠️ CLI Commands

### V1 Commands

```bash
# Create a new project from a recipe
architech new <recipe.yaml>

# Show help
architech --help

# Show version
architech --version
```

### V2 Commands (Coming Soon)

```bash
# Add features to existing project
architech add <feature-id> [options]

# Scale project to monorepo
architech scale [options]
```

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- TypeScript 5.0+

### Setup

```bash
# Clone the repository
git clone https://github.com/the-architech/cli.git
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Project Structure

```
src/
├── agents/                 # Agent system
│   ├── base/              # Base agent class
│   ├── core/              # Specialized agents
│   └── orchestrator-agent.ts
├── adapters/              # Technology adapters
│   ├── framework/         # Framework adapters
│   ├── database/          # Database adapters
│   ├── auth/              # Auth adapters
│   ├── ui/                # UI adapters
│   └── testing/           # Testing adapters
├── commands/              # CLI commands
├── core/                  # Core services
└── types/                 # Type definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Adding New Adapters

1. **Agnostic Adapters**: Create in `src/adapters/<category>/<id>/` (tech-agnostic)
2. **Dependent Adapters**: Create in `src/adapters/<category>/<id>/` (framework-specific)
3. **Integration Adapters**: Create in `src/integrations/<requester>-<provider>-integration/`
4. Implement `adapter.json`/`integration.json` and `blueprint.ts`
5. Add validation to appropriate agent
6. Test with sample recipe

### Adding New Agents

1. Extend `SimpleAgent` base class
2. Implement domain-specific validation
3. Register in `OrchestratorAgent`
4. Add to agent exports

## 📈 Roadmap

### V1 (Current)
- ✅ Agent-based architecture
- ✅ Declarative YAML recipes
- ✅ Core technology adapters
- ✅ CLI command structure

### V2 (Q4 2025)
- 🔄 Dynamic module addition
- 🔄 Project state management
- 🔄 AI-powered recommendations
- 🔄 Intelligent dependency resolution

### V3 (Q1 2026)
- 🔮 Full AI development assistant
- 🔮 Natural language project generation
- 🔮 Automated testing and deployment
- 🔮 Cross-project knowledge sharing

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Shadcn/ui** - For beautiful, accessible components
- **Drizzle Team** - For type-safe database tools
- **Better Auth** - For modern authentication
- **Vitest Team** - For fast testing framework

## 📞 Support

- **Documentation**: [docs.the-architech.dev](https://docs.the-architech.dev)
- **GitHub Issues**: [github.com/the-architech/cli/issues](https://github.com/the-architech/cli/issues)
- **Discord**: [discord.gg/the-architech](https://discord.gg/the-architech)
- **Twitter**: [@the_architech](https://twitter.com/the_architech)

---

**Built with ❤️ by The Architech Team**

*Elevating developers from artisans to architects, one module at a time.*
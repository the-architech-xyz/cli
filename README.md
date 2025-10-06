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

### V1: Type-Safe Genome System
- **🧬 TypeScript Genomes** - Define your project with full autocomplete and type safety
- **🎯 IntelliSense Support** - Complete IDE integration with parameter validation
- **📋 Phase-Oriented CLI** - Beautiful progress display with clear execution phases
- **🔌 Modular Adapter System** - 50+ adapters across 12 categories (framework, database, auth, UI, etc.)
- **🔗 Seamless Integrations** - Automatic connections between adapters with type safety
- **⚡ CLI-First Approach** - Leverages existing tools like `create-next-app` and `shadcn init`
- **🏗️ Three-Layer Architecture** - Clean separation of concerns with File Engine, Orchestrator, and Executor
- **🎯 Semantic Actions** - High-level, intent-driven actions that abstract implementation complexity
- **🗂️ Virtual File System** - Atomic, transactional file operations with rollback safety
- **🔄 Smart Fallback Mechanism** - ENHANCE_FILE can auto-create missing files (perfect for API routes)
- **🛡️ Compile-Time Safety** - Full TypeScript validation prevents configuration errors

### V2: Dynamic Module Management (Coming Soon)
- **➕ Dynamic Module Addition** - Add features to existing projects
- **📈 Monorepo Scaling** - Scale projects to monorepo structures
- **🧠 AI-Powered Recommendations** - Intelligent suggestions for project improvements
- **📊 Project State Management** - Track and manage project evolution

## 🚀 Quick Start

### Installation

#### Option 1: Build from Source (Current Method)

```bash
# Clone the repository
git clone https://github.com/the-architech/cli.git
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Test the CLI
node dist/index.js --version
```

#### Option 2: NPM Package (Coming Soon)

```bash
# This will be available soon
npm install -g @the-architech/cli
```

### Create Your First Project

#### Option 1: Using Pre-built Genomes (Recommended)

```bash
# List available genomes
architech list-genomes

# Create a simple application (recommended for testing)
architech new /path/to/marketplace/genomes/simple-app.genome.ts

# Create a SaaS application
architech new /path/to/marketplace/genomes/saas-starter.genome.ts

# Create a blog
architech new /path/to/marketplace/genomes/blog-app.genome.ts

# Create an e-commerce app
architech new /path/to/marketplace/genomes/ecommerce-app.genome.ts

# Dry run (see what would be created)
architech new /path/to/marketplace/genomes/simple-app.genome.ts --dry-run
```

#### Option 2: Create Your Own TypeScript Genome

1. **Create a genome file** (`my-saas.genome.ts`):

```typescript
import { Genome } from '@thearchitech.xyz/marketplace';

const mySaaSGenome: Genome = {
  version: '1.0.0',
  project: {
    name: 'my-saas',
    framework: 'nextjs',
    path: './my-saas',
    description: 'My awesome SaaS application'
  },
  modules: [
    {
      id: 'framework/nextjs',
      parameters: {
        typescript: true,    // ← Full autocomplete
        tailwind: true,      // ← Type-safe parameters
        appRouter: true,     // ← IntelliSense support
        eslint: true
      },
      features: {
        performance: true,
        security: true,
        'api-routes': true
      }
    },
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'input', 'card', 'dialog'] // ← Autocomplete for components
      },
      features: {
        theming: true,
        accessibility: true
      }
    },
    {
      id: 'database/drizzle',
      parameters: {
        provider: 'neon',
        databaseType: 'postgresql'
      },
      features: {
        migrations: true,
        studio: true,
        relations: true
      }
    },
    {
      id: 'auth/better-auth',
      parameters: {
        providers: ['github', 'google'],
        emailPassword: true
      },
      features: {
        'email-verification': true,
        'password-reset': true,
        'multi-factor': true
      }
    }
  ]
};

export default mySaaSGenome;
```

2. **Generate your project**:

```bash
architech new my-saas.genome.ts
```

3. **Experience the beautiful CLI**:

```
🔍 Validating Genome...
   ✅ Completed in 45ms

📋 Planning Execution...
   ✅ Completed in 23ms

🏗️ Setting Up Framework...
   [1/4] 📦 Installing framework/nextjs...
   ✅ framework/nextjs

🔧 Installing Adapters...
   [2/4] 📦 Installing ui/shadcn-ui...
   ✅ ui/shadcn-ui
   [3/4] 📦 Installing database/drizzle...
   ✅ database/drizzle
   [4/4] 📦 Installing auth/better-auth...
   ✅ auth/better-auth

🔗 Configuring Integrations...
   ✅ All integrations configured

✨ Finalizing Project...
   ✅ Dependencies installed

🎉 Project created successfully!

Next steps:
  cd my-saas
  npm install
  npm run dev

Happy coding! 🎉
```

4. **Start developing**:

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

### Core Documentation
- **[Installation Guide](docs/INSTALLATION.md)** - Complete installation instructions
- **[Quick Start](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Working Examples](docs/EXAMPLES.md)** - Real, tested genome examples
- **[Genome Format](docs/GENOME_FORMAT.md)** - Complete TypeScript genome reference
- **[CLI Reference](docs/CLI_REFERENCE.md)** - Complete CLI command reference
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System architecture overview

### Developer Resources
- **[Modifier Cookbook](marketplace/docs/MODIFIER_COOKBOOK.md)** - Advanced modifier usage guide
- **[Authoring Guide](marketplace/docs/AUTHORING_GUIDE.md)** - Creating custom adapters
- **[Adapter Development](marketplace/docs/ADAPTER_DEVELOPMENT_GUIDE.md)** - Advanced adapter creation
- **[Integration Development](marketplace/docs/INTEGRATION_DEVELOPMENT_GUIDE.md)** - Creating integrations
- **[Semantic Actions](marketplace/docs/SEMANTIC_ACTIONS_GUIDE.md)** - AST-based operations

## 🛠️ CLI Commands

### Core Commands

```bash
# Create a new project from a TypeScript genome
architech new <genome-file> [options]

# List available pre-built genomes
architech list-genomes

# Add features to existing project
architech add <feature> [options]

# Scale project to monorepo structure
architech scale [options]

# Explore marketplace
architech marketplace [search|featured|categories]

# Analyze existing repository
architech analyze <repo-url> [options]

# Show help
architech --help

# Show version
architech --version
```

### Command Options

```bash
# Create with verbose output
architech new my-app.genome.ts --verbose

# Dry run (show what would be created)
architech new my-app.genome.ts --dry-run

# Quiet mode (minimal output)
architech new my-app.genome.ts --quiet

# Analyze with specific output format
architech analyze https://github.com/user/repo --format typescript

# Analyze local directory
architech analyze ./my-project --no-clone
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
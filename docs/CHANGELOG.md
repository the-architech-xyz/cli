# Changelog

All notable changes to The Architech CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🚀 Major Features

#### **Agent-Driven Intelligence (Phase 1-3 Complete)**
- **Phase 1: Agent Enhancement**: Agents now dynamically discover and understand available plugins
- **Phase 2: Dynamic Smart Recommender**: SmartRecommender queries agents for real-time recommendations
- **Phase 3: Unified Plugin Intelligence**: DynamicQuestioner reads plugin ParameterSchema automatically
- **New Agent Capabilities**: `getAvailablePlugins()`, `getPluginCapabilities()`, `getRecommendations()`, `getDomainCategories()`

#### **Simplified 3-Step Question System**
- **Replaced Complex Flow**: Eliminated dual template/progressive flow system
- **Smart Recommendations**: AI-powered technology suggestions with confidence scores
- **Minimal Customization**: Only ask what's needed based on context
- **Agent-Driven Questions**: Dynamic question generation from plugin schemas

#### **Enhanced Plugin System**
- **ParameterSchema**: Standardized configuration system for all plugins
- **Unified Interface Generation**: Technology-agnostic APIs for all plugins
- **Dynamic Discovery**: Agents automatically discover plugin capabilities
- **Improved Validation**: Comprehensive configuration validation

#### **Framework-Aware Path Resolution**
- **Next.js App Router**: Automatic detection and correct path usage
- **Monorepo Support**: Proper structure for Turborepo projects
- **Technology Agnostic**: No vendor lock-in to specific structures
- **Consistent Organization**: Standardized project organization

### 🔧 Technical Improvements

#### **Core Architecture**
- **Modular Design**: Clean separation between agents, plugins, and core system
- **Type Safety**: Comprehensive TypeScript definitions throughout
- **Error Handling**: Improved error messages and recovery suggestions
- **Performance**: Optimized plugin execution and file generation

#### **Plugin System**
- **Enhanced Interface**: `IEnhancedPlugin` with ParameterSchema support
- **Unified Interfaces**: Generated technology-agnostic APIs
- **Dynamic Questions**: Automatic question generation from schemas
- **Better Validation**: Comprehensive configuration validation

#### **Agent System**
- **Specialized Agents**: UIAgent, DBAgent, AuthAgent, OrchestratorAgent
- **Dynamic Discovery**: Real-time plugin awareness
- **Intelligent Recommendations**: Context-aware technology suggestions
- **Plugin Coordination**: Seamless orchestration of plugin execution

### 🎯 User Experience

#### **Simplified Workflow**
- **3 Steps Instead of 20+**: Describe, review, generate
- **Intelligent Defaults**: Minimal configuration required
- **Clear Recommendations**: Confidence scores and explanations
- **Fast Generation**: Complete projects in under 5 minutes

#### **Smart Question System**
- **Project Context Analysis**: Automatic project type detection
- **Feature Extraction**: Intelligent feature identification
- **Complexity Calculation**: Automatic complexity assessment
- **Technology Recommendations**: AI-powered suggestions

#### **Plugin Integration**
- **Seamless Discovery**: Agents automatically find relevant plugins
- **Smart Recommendations**: Context-aware plugin suggestions
- **Automatic Configuration**: Plugin-driven configuration
- **Unified APIs**: Consistent interfaces across all technologies

### 🐛 Bug Fixes

#### **Path Resolution**
- **Fixed Project Generation**: Projects now create in subdirectories instead of root
- **Fixed Configuration Files**: Railway, Drizzle, and environment files now in correct locations
- **Fixed Next.js Plugin**: App Router files now generate correctly
- **Fixed Path Conflicts**: Resolved EISDIR errors and path conflicts

#### **Configuration Management**
- **Fixed Plugin Configuration**: Plugins now receive correct configuration
- **Fixed Smart Config Storage**: Configuration properly stored in context state
- **Fixed Provider Validation**: Database providers now validate correctly
- **Fixed Dependency Installation**: Dependencies install in correct order

#### **CLI Execution**
- **Fixed Command Parsing**: CLI now executes correctly via `node bin/architech.js`
- **Fixed Import Paths**: Correct import paths for compiled JavaScript
- **Fixed User Input**: Proper initialization of user input in context
- **Fixed Project Path**: Correct project path resolution

### 📚 Documentation

#### **Complete Documentation Overhaul**
- **New Main README**: Comprehensive overview with quick start guide
- **Updated User Guide**: Reflects new simplified 3-step flow
- **Updated Architecture Overview**: Current agent-driven architecture
- **Updated Plugin Development**: Current plugin system and best practices
- **Updated Question System**: Current simplified question system

#### **New Documentation Structure**
- **Main README.md**: Project overview and quick start
- **docs/user-guide.md**: Complete usage guide
- **docs/architecture-overview.md**: System design and components
- **docs/plugin-development.md**: Plugin development guide
- **docs/question-generation-system.md**: Current question system

### 🔄 Migration Notes

#### **Breaking Changes**
- **Command Structure**: `architech create` → `architech new`
- **Question System**: Old progressive flow → New simplified 3-step flow
- **Plugin Interface**: Enhanced interface with ParameterSchema
- **Agent Interface**: New capabilities for plugin discovery

#### **Deprecated Features**
- **Old Template System**: Replaced with smart recommendations
- **Old Progressive Flow**: Replaced with simplified question system
- **Old Question Strategies**: Replaced with agent-driven questions
- **Old Path Resolution**: Replaced with framework-aware resolution

#### **New Features**
- **Agent-Driven Intelligence**: Dynamic plugin discovery and recommendations
- **Simplified Question System**: 3-step flow with smart defaults
- **Unified Plugin System**: ParameterSchema and unified interfaces
- **Framework-Aware Paths**: Automatic path resolution

## [0.1.0] - 2024-01-15

### 🚀 Initial Release

#### **Core Features**
- **CLI Framework**: Basic command-line interface
- **Plugin System**: Modular plugin architecture
- **Question System**: Basic question generation
- **Project Generation**: Basic project creation

#### **Supported Technologies**
- **Next.js 14**: App Router support
- **Drizzle ORM**: TypeScript-first ORM
- **Better Auth**: Modern authentication
- **Shadcn UI**: Beautiful components
- **Railway**: Deployment platform
- **Vitest**: Testing framework

#### **Project Types**
- **Blog**: Content management with SEO
- **E-commerce**: Online store with payments
- **SaaS**: Subscription-based applications
- **Dashboard**: Admin panels and analytics
- **API**: RESTful and GraphQL APIs
- **Portfolio**: Personal and business websites

#### **Documentation**
- **Basic User Guide**: Getting started guide
- **Plugin Development**: Plugin creation guide
- **Architecture Overview**: System design
- **API Reference**: Technical documentation

---

## Version History

### **v0.1.0** (Initial Release)
- Basic CLI functionality
- Plugin system foundation
- Question generation system
- Project generation capabilities

### **v0.2.0** (Current - Unreleased)
- Agent-driven intelligence
- Simplified 3-step question system
- Enhanced plugin system
- Framework-aware path resolution
- Complete documentation overhaul

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## Support

- 📧 **Email**: support@the-architech.dev
- 💬 **Discord**: [Join our community](https://discord.gg/the-architech)
- 🐛 **Issues**: [GitHub Issues](https://github.com/the-architech/cli/issues)
- 📖 **Documentation**: [docs.the-architech.dev](https://docs.the-architech.dev)

---

**The Architech CLI is evolving rapidly. This changelog tracks all major changes and improvements to help users understand what's new and what's changed.** 
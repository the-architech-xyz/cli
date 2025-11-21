# The Architech CLI

> **Generic, unopinionated code generation engine**

The Architech CLI is a powerful, framework-agnostic code generation tool that works with any marketplace to create production-ready applications from TypeScript genome files.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @the-architech-xyz/cli

# Create your first project (V2 format)
architech new my-app.genome.ts

# Or use a pre-built genome
architech new my-saas --genome saas-platform
```

## ✨ What's New in V2

- **Federated Composition Engine** - CLI resolves dependencies globally
- **Lock Files** - Reproducible builds with `genome.lock`
- **Multi-App Support** - Explicit app dependencies
- **Recipe Books** - Declarative package-to-module mapping
- **Full Transparency** - See exactly what modules are resolved

**Migrating from V1?** See the [V2 Migration Guide](../docs/V2_MIGRATION_GUIDE.md)

## 📚 Documentation

- **[V2 Migration Guide](../docs/V2_MIGRATION_GUIDE.md)** - Migrate from V1 to V2
- **[V2 Architecture](../docs/V2_ARCHITECTURE.md)** - Architecture overview
- **[Complete Guide](https://docs.thearchitech.dev)** - Full documentation
- **[CLI Reference](https://docs.thearchitech.dev/cli)** - Command reference  
- **[Genome Format](https://docs.thearchitech.dev/genome-format)** - TypeScript genomes
- **[AI Blueprint Guide](https://docs.thearchitech.dev/ai-blueprint-guide)** - AI blueprint creation

## 🛠️ Development

- **[Contributing](https://docs.thearchitech.dev/contributing)** - How to contribute
- **[Architecture](https://docs.thearchitech.dev/architecture)** - System architecture
- **[Examples](https://docs.thearchitech.dev/examples)** - Real-world examples

## 🎯 Key Features

- **Framework Agnostic** - Works with React, Vue, Angular, Svelte, etc.
- **Marketplace Driven** - Use any marketplace or create your own
- **Type Safe** - Full TypeScript support with autocomplete
- **AI Ready** - Complete blueprint API for AI agents
- **Extensible** - Plugin system for custom functionality

## 📦 Installation

```bash
# From source (development)
git clone https://github.com/the-architech-xyz/cli.git
cd cli
npm install
npm run build
npm link

# From npm (coming soon)
npm install -g @the-architech-xyz/cli
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://docs.thearchitech.dev/contributing) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by The Architech Team**
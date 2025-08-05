# 🎭 The Architech

> **Revolutionary AI-Powered Application Generator - Transforming weeks of work into minutes**

[![npm version](https://badge.fury.io/js/the-architech.svg)](https://badge.fury.io/js/the-architech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

The Architech is an intelligent CLI tool that generates modern, production-ready applications with the perfect tech stack for your needs. Powered by AI-driven recommendations and a modular plugin system.

## ✨ **Features**

- 🧠 **AI-Powered Recommendations** - Smart technology suggestions based on your project
- 🎯 **Simplified 3-Step Flow** - Describe, review, generate - that's it!
- 🔌 **Modular Plugin System** - 23+ plugins for databases, auth, UI, deployment, and more
- 🏗️ **Agent-Driven Architecture** - Intelligent orchestration with specialized agents
- 🚀 **Framework-Aware** - Automatic detection of Next.js App Router, monorepos, and more
- ⚡ **Lightning Fast** - Generate complete projects in under 5 minutes
- 🎨 **Modern Tech Stack** - Next.js 14, Drizzle ORM, Better Auth, Shadcn UI, and more

## 🚀 **Quick Start**

### **Installation**

```bash
# Global installation (recommended)
npm install -g the-architech

# Or run directly
npx the-architech new my-app
```

### **Create Your First Project**

```bash
# Interactive mode (recommended)
architech new my-app

# Quick start with defaults
architech new my-app --yes

# Specify project type
architech new my-app --project-type ecommerce
```

### **What You Get**

A complete, production-ready application with:

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** configuration
- ✅ **Drizzle ORM** with local SQLite (or Neon/Supabase)
- ✅ **Better Auth** authentication
- ✅ **Shadcn UI** components
- ✅ **Railway** deployment config
- ✅ **Vitest** testing setup
- ✅ **ESLint** and **Prettier**
- ✅ **GitHub Actions** workflows

## 🎯 **How It Works**

### **1. Describe Your Project**
```
🎭 Welcome to The Architech!

What would you like to build?
> A blog with payments and user authentication
```

### **2. Review Smart Recommendations**
```
🎯 I'll create a project with these features:

📊 Database: drizzle (90%)
   TypeScript-first ORM with excellent performance
🔐 Authentication: better-auth (90%)
   Modern, secure authentication
🎨 UI Library: shadcn-ui (85%)
   Beautiful, accessible components
🚀 Deployment: railway (80%)
   Full-stack deployment platform
```

### **3. Generate & Deploy**
```
✅ Project generated successfully!

📁 Project Structure:
   my-app/
   ├── app/                    # Next.js App Router
   ├── components/             # Shadcn UI components
   ├── lib/                    # Database & auth setup
   ├── drizzle.config.ts       # Database configuration
   ├── railway.json           # Deployment config
   └── package.json           # Dependencies & scripts

🚀 Next Steps:
   cd my-app
   npm run dev
```

## 🏗️ **Architecture**

### **Agent-Driven Intelligence**

The Architech uses specialized AI agents that understand your project context:

- **🎯 SmartRecommender** - Analyzes your input and suggests the perfect tech stack
- **❓ UnifiedQuestioner** - Presents recommendations and handles customization
- **🔧 DynamicQuestioner** - Generates configuration questions from plugin schemas
- **⚙️ OrchestratorAgent** - Coordinates the entire generation process

### **Plugin System**

23+ plugins provide technology implementations:

```
📦 Plugins Available:
├── 🗄️ Database: Drizzle, Prisma, Mongoose
├── 🔐 Auth: Better Auth, NextAuth.js
├── 🎨 UI: Shadcn UI, Chakra UI, Material-UI
├── 🚀 Deployment: Railway, Docker
├── 🧪 Testing: Vitest, Jest
├── 📧 Email: Resend, SendGrid
├── 💳 Payments: Stripe, PayPal
└── 📊 Monitoring: Sentry, Google Analytics
```

### **Framework-Aware Path Resolution**

Automatically detects and uses the correct project structure:

- **Next.js App Router**: Uses root `app/`, `components/`, `lib/` directories
- **Monorepo**: Uses `apps/web/src/app/` structure
- **Traditional**: Uses `src/app/` structure

## 📚 **Documentation**

- **[User Guide](./docs/user-guide.md)** - Complete usage guide
- **[Architecture Overview](./docs/architecture-overview.md)** - System design and components
- **[Plugin Development](./docs/plugin-development.md)** - Create custom plugins
- **[API Reference](./docs/api-reference.md)** - Technical documentation

## 🛠️ **Development**

### **Prerequisites**

- Node.js 16.0.0 or higher
- npm, yarn, pnpm, or bun
- Git (optional)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/the-architech/cli.git
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### **Running Tests**

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Plugin Development**

Want to add a new technology? Check out our [Plugin Development Guide](./docs/plugin-development.md) to learn how to create plugins that integrate seamlessly with The Architech.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Built with [Next.js](https://nextjs.org/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Authentication by [Better Auth](https://better-auth.com/)
- UI components by [Shadcn UI](https://ui.shadcn.com/)
- Deployment by [Railway](https://railway.app/)

## 📞 **Support**

- 📧 **Email**: support@the-architech.dev
- 💬 **Discord**: [Join our community](https://discord.gg/the-architech)
- 🐛 **Issues**: [GitHub Issues](https://github.com/the-architech/cli/issues)
- 📖 **Documentation**: [docs.the-architech.dev](https://docs.the-architech.dev)

---

**Made with ❤️ by The Architech Team**

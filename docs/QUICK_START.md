# 🚀 Quick Start Guide

> **Get up and running with The Architech in 5 minutes**

## 📋 Table of Contents

1. [Installation](#installation)
2. [Your First Project](#your-first-project)
3. [Understanding Genomes](#understanding-genomes)
4. [Exploring the CLI](#exploring-the-cli)
5. [Next Steps](#next-steps)

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- TypeScript 5.0+ (for custom genomes)

### Install The Architech CLI

```bash
# Install globally
npm install -g @the-architech/cli

# Verify installation
architech --version
```

## 🎯 Your First Project

### Step 1: Explore Available Templates

```bash
# List all available genome templates
architech list-genomes
```

You'll see something like:

```
🧬 Available Genome Templates

📱 SaaS Application
   Description: Complete SaaS application with authentication, payments, and dashboard
   Complexity: ⭐⭐⭐⭐⭐
   Path: marketplace/genomes/saas-app.genome.ts

📝 Blog Application
   Description: Modern blog with CMS, internationalization, and SEO
   Complexity: ⭐⭐⭐
   Path: marketplace/genomes/blog-app.genome.ts

🛒 E-commerce Platform
   Description: Full-stack e-commerce with payments, inventory, and admin panel
   Complexity: ⭐⭐⭐⭐⭐
   Path: marketplace/genomes/ecommerce-app.genome.ts

🚀 Ultimate Application
   Description: Showcases all The Architech capabilities with complete feature sets
   Complexity: ⭐⭐⭐⭐⭐
   Path: marketplace/genomes/ultimate-app.genome.ts
```

### Step 2: Create Your First Project

```bash
# Create a blog application (recommended for beginners)
architech new marketplace/genomes/blog-app.genome.ts
```

### Step 3: Experience the Beautiful CLI

Watch as The Architech creates your project with a beautiful, phase-oriented display:

```
🔍 Validating Genome...
   ✅ Completed in 45ms

📋 Planning Execution...
   ✅ Completed in 23ms

🏗️ Setting Up Framework...
   [1/3] 📦 Installing framework/nextjs...
   ✅ framework/nextjs

🔧 Installing Adapters...
   [2/3] 📦 Installing ui/shadcn-ui...
   ✅ ui/shadcn-ui
   [3/3] 📦 Installing database/drizzle...
   ✅ database/drizzle

🔗 Configuring Integrations...
   ✅ All integrations configured

✨ Finalizing Project...
   ✅ Dependencies installed

🎉 Project created successfully!

Next steps:
  cd blog-app
  npm install
  npm run dev

Happy coding! 🎉
```

### Step 4: Start Developing

```bash
# Navigate to your project
cd blog-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your new application!

## 🧬 Understanding Genomes

### What is a Genome?

A **genome** is a TypeScript file that defines your project configuration. It provides:

- **🧬 Type Safety**: Full autocomplete and compile-time validation
- **🎯 IntelliSense**: IDE support for all parameters
- **⚡ Fast Feedback**: Immediate error detection

### Basic Genome Structure

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
  project: {
    name: 'my-app',           // Project name
    framework: 'nextjs',      // Primary framework
    path: './my-app'          // Output directory
  },
  modules: [
    {
      id: 'framework/nextjs', // Module ID
      parameters: {           // Module configuration
        typescript: true,     // ← Full autocomplete
        tailwind: true,       // ← Type-safe parameters
        appRouter: true       // ← IntelliSense support
      }
    }
  ]
});
```

### Creating Your Own Genome

1. **Create a new file** (`my-saas.genome.ts`):

```typescript
import { defineGenome } from '@thearchitech.xyz/marketplace';

export default defineGenome({
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
        typescript: true,
        tailwind: true,
        appRouter: true
      }
    },
    {
      id: 'ui/shadcn-ui',
      parameters: {
        components: ['button', 'card', 'input'] // ← Autocomplete shows available components
      }
    }
  ]
});
```

2. **Generate your project**:

```bash
architech new my-saas.genome.ts
```

### Type Safety in Action

When you type in your IDE, you get:

```typescript
modules: [
  {
    id: 'ui/shadcn-ui',
    parameters: {
      components: [  // ← Autocomplete shows: 'button', 'card', 'input', 'dialog', etc.
        'button',
        'card'
      ],
      style: 'new-york'  // ← Autocomplete shows: 'new-york', 'default'
    }
  }
]
```

TypeScript will catch errors before execution:

```typescript
// ❌ This will show a TypeScript error
{
  id: 'ui/shadcn-ui',
  parameters: {
    components: ['invalid-component']  // ← TypeScript error: not assignable
  }
}
```

## 🔍 Exploring the CLI

### Available Commands

```bash
# Create a new project
architech new <genome.ts>

# List available templates
architech list-genomes

# Show help
architech --help

# Show version
architech --version
```

### Command Options

```bash
# Verbose mode (see detailed execution)
architech new my-app.genome.ts --verbose

# Dry run (show what would be created)
architech new my-app.genome.ts --dry-run

# Quiet mode (minimal output)
architech new my-app.genome.ts --quiet
```

### Verbose Mode

Use `--verbose` to see detailed execution information:

```bash
architech new my-saas.genome.ts --verbose
```

This shows:
- Detailed module loading information
- Blueprint execution details
- File modification operations
- Integration configuration steps
- Debug information for troubleshooting

## 🎯 Next Steps

### 1. Explore More Templates

```bash
# Try the SaaS application
architech new marketplace/genomes/saas-app.genome.ts

# Try the e-commerce platform
architech new marketplace/genomes/ecommerce-app.genome.ts

# Try the ultimate app (showcases all features)
architech new marketplace/genomes/ultimate-app.genome.ts
```

### 2. Customize Your Genome

Edit your genome file to add more modules:

```typescript
modules: [
  {
    id: 'framework/nextjs',
    parameters: { /* ... */ }
  },
  {
    id: 'ui/shadcn-ui',
    parameters: { /* ... */ }
  },
  // Add more modules
  {
    id: 'database/drizzle',
    parameters: {
      provider: 'neon',
      databaseType: 'postgresql'
    }
  },
  {
    id: 'auth/better-auth',
    parameters: {
      providers: ['github', 'google']
    }
  }
]
```

### 3. Learn About Modules

Explore the available modules:

```bash
# Browse the marketplace
ls marketplace/adapters/

# Check specific modules
ls marketplace/adapters/ui/
ls marketplace/adapters/database/
ls marketplace/adapters/auth/
```

### 4. Read the Documentation

- **[Genome Format](GENOME_FORMAT.md)** - Complete TypeScript genome reference
- **[CLI Reference](CLI_REFERENCE.md)** - Complete CLI command reference
- **[Architecture Guide](ARCHITECTURE.md)** - System architecture overview
- **[Modifier Cookbook](../marketplace/docs/MODIFIER_COOKBOOK.md)** - Advanced modifier usage
- **[Authoring Guide](../marketplace/docs/AUTHORING_GUIDE.md)** - Creating custom adapters

### 5. Join the Community

- **GitHub**: [https://github.com/the-architech/cli](https://github.com/the-architech/cli)
- **Discord**: [https://discord.gg/the-architech](https://discord.gg/the-architech)
- **Documentation**: [https://the-architech.dev/docs](https://the-architech.dev/docs)

## 🎉 Congratulations!

You've successfully:

- ✅ Installed The Architech CLI
- ✅ Created your first project
- ✅ Experienced the beautiful CLI output
- ✅ Learned about TypeScript genomes
- ✅ Explored the available commands

You're now ready to build amazing applications with The Architech! 🚀

## 🔧 Troubleshooting

### Common Issues

#### Genome File Not Found

```bash
Error: Genome file 'my-app.genome.ts' not found
```

**Solution:**
- Check the file path
- Ensure the file exists
- Use absolute path if needed

#### TypeScript Compilation Error

```bash
Error: TypeScript compilation failed
```

**Solution:**
- Check TypeScript syntax
- Verify imports are correct
- Use IDE to fix type errors

#### Module Not Found

```bash
Error: Module 'invalid-module' not found
```

**Solution:**
- Check module ID spelling
- Use autocomplete in IDE
- Verify module exists in marketplace

### Getting Help

- **Documentation**: [https://the-architech.dev/docs](https://the-architech.dev/docs)
- **GitHub Issues**: [https://github.com/the-architech/cli/issues](https://github.com/the-architech/cli/issues)
- **Discord Community**: [https://discord.gg/the-architech](https://discord.gg/the-architech)

---

**Happy coding! 🎉**

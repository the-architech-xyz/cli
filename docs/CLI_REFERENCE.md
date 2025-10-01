# 🖥️ CLI Reference

> **Complete reference for The Architech CLI commands**

## 📋 Table of Contents

1. [Installation](#installation)
2. [Global Options](#global-options)
3. [Commands](#commands)
4. [Examples](#examples)
5. [Troubleshooting](#troubleshooting)

## 🚀 Installation

### NPM (Recommended)

```bash
npm install -g @the-architech/cli
```

### Yarn

```bash
yarn global add @the-architech/cli
```

### PNPM

```bash
pnpm add -g @the-architech/cli
```

### Verify Installation

```bash
architech --version
# Output: 1.0.0
```

## ⚙️ Global Options

All commands support these global options:

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help information | - |
| `--version` | `-V` | Show version number | - |
| `--verbose` | `-v` | Enable verbose logging | `false` |
| `--dry-run` | `-d` | Show what would be done without executing | `false` |

## 📋 Commands

### `architech new`

Create a new project from a TypeScript genome file.

#### Usage

```bash
architech new <genome-file> [options]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `genome-file` | Path to the .genome.ts file | ✅ |

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--dry-run` | `-d` | Show what would be created without executing | `false` |
| `--verbose` | `-v` | Enable verbose logging | `false` |
| `--quiet` | `-q` | Suppress all output except errors | `false` |

#### Examples

```bash
# Create a new project
architech new my-saas.genome.ts

# Create with verbose logging
architech new my-saas.genome.ts --verbose

# Show what would be created
architech new my-saas.genome.ts --dry-run

# Quiet mode (minimal output)
architech new my-saas.genome.ts --quiet
```

#### Phase-Oriented Output

The `new` command provides a beautiful, phase-oriented progress display:

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

#### Verbose Mode

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

### `architech list-genomes`

List all available pre-built genome templates.

#### Usage

```bash
architech list-genomes
```

#### Description

Shows all available genome templates with their descriptions and complexity levels:

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

💡 Usage: architech new <path-to-genome>
```

#### Examples

```bash
# List all available genomes
architech list-genomes

# Use a genome template
architech new marketplace/genomes/saas-app.genome.ts
```

### `architech add` (V2 Feature)

Add new modules to an existing project.

#### Usage

```bash
architech add <module-id> [options]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `module-id` | Module ID to add (e.g., auth/better-auth) | ✅ |

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--path` | `-p` | Project path | `.` |
| `--version` | `-v` | Module version to install | `latest` |
| `--config` | `-c` | Path to custom configuration file | - |
| `--dry-run` | `-d` | Show what would be added without executing | `false` |

#### Examples

```bash
# Add authentication module
architech add auth/better-auth

# Add specific version
architech add ui/shadcn-ui --version 1.0.0

# Add with custom config
architech add database/drizzle --config ./drizzle-config.yaml
```

### `architech scale` (V2 Feature)

Scale a project to monorepo structure.

#### Usage

```bash
architech scale [options]
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--path` | `-p` | Project path | `.` |
| `--strategy` | `-s` | Scaling strategy | `pnpm-workspaces` |
| `--apps` | `-a` | Comma-separated list of apps | - |
| `--libs` | `-l` | Comma-separated list of libraries | - |
| `--dry-run` | `-d` | Show what would be scaled without executing | `false` |

#### Examples

```bash
# Scale to monorepo
architech scale

# Scale with specific strategy
architech scale --strategy nx

# Scale with custom apps and libraries
architech scale --apps "web,api" --libs "shared,ui"
```

## 📚 Examples

### Basic Project Creation

```bash
# List available genome templates
architech list-genomes

# Create a SaaS application
architech new marketplace/genomes/saas-app.genome.ts

# Create a blog application
architech new marketplace/genomes/blog-app.genome.ts

# Create with custom genome
architech new my-saas.genome.ts
```

### Development Workflow

```bash
# Create project from genome
architech new my-saas.genome.ts

# Navigate to project
cd my-saas

# Start development
npm run dev

# Add new features (V2)
architech add payment/stripe
architech add email/resend
```

### Testing and Validation

```bash
# Test genome without creating files
architech new my-saas.genome.ts --dry-run

# Validate with verbose output
architech new my-saas.genome.ts --verbose --dry-run

# Quiet mode for CI/CD
architech new my-saas.genome.ts --quiet
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Genome File Not Found

```bash
Error: Genome file 'my-saas.genome.ts' not found
```

**Solution:**
- Check the file path
- Ensure the file exists
- Use absolute path if needed

```bash
# Use absolute path
architech new /path/to/my-saas.genome.ts

# Check current directory
ls -la *.genome.ts
```

#### 2. TypeScript Compilation Error

```bash
Error: TypeScript compilation failed
```

**Solution:**
- Check TypeScript syntax
- Verify imports are correct
- Use IDE to fix type errors

```bash
# Check TypeScript compilation
npx tsc --noEmit my-saas.genome.ts

# Use verbose mode for detailed errors
architech new my-saas.genome.ts --verbose
```

#### 3. Module Not Found

```bash
Error: Module 'invalid-module' not found
```

**Solution:**
- Check module ID spelling
- Verify module exists in marketplace
- Use autocomplete in IDE

```bash
# List available genomes
architech list-genomes

# Check marketplace modules
ls marketplace/adapters/
```

#### 3. Permission Denied

```bash
Error: Permission denied when creating directory
```

**Solution:**
- Check directory permissions
- Run with appropriate permissions
- Use different output directory

```bash
# Use different directory
architech new my-recipe.yaml --path ./my-project

# Check permissions
ls -la
```

#### 4. Dependency Installation Failed

```bash
Error: npm install failed
```

**Solution:**
- Check internet connection
- Clear npm cache
- Use different package manager

```bash
# Clear npm cache
npm cache clean --force

# Use yarn instead
architech new my-recipe.yaml --package-manager yarn
```

### Debug Mode

Enable debug mode for detailed error information:

```bash
# Enable verbose logging
architech new my-recipe.yaml --verbose

# Enable debug mode
DEBUG=architech:* architech new my-recipe.yaml
```

### Log Files

Check log files for detailed error information:

```bash
# Check system logs
tail -f ~/.architech/logs/architech.log

# Check error logs
cat ~/.architech/logs/error.log
```

## 📖 Additional Resources

- [Genome Format Documentation](./GENOME_FORMAT.md)
- [Quick Start Guide](./QUICK_START.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Available Modules](../marketplace/adapters/)
- [Example Genomes](../marketplace/genomes/)

## 🤝 Getting Help

- **Documentation**: [https://the-architech.dev/docs](https://the-architech.dev/docs)
- **GitHub Issues**: [https://github.com/the-architech/cli/issues](https://github.com/the-architech/cli/issues)
- **Discord Community**: [https://discord.gg/the-architech](https://discord.gg/the-architech)

---

**Happy coding! 🚀**

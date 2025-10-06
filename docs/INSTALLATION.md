# 🚀 Installation Guide

> **Complete installation guide for The Architech CLI**

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Verification](#verification)
4. [Troubleshooting](#troubleshooting)
5. [Next Steps](#next-steps)

## 🔧 Prerequisites

Before installing The Architech CLI, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm, yarn, pnpm, or bun** - Package manager
- **TypeScript 5.0+** - For custom genomes (optional)
- **Git** - For cloning the repository

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check package manager
npm --version   # or yarn --version, pnpm --version, bun --version

# Check TypeScript (optional)
tsc --version   # Should be 5.0.0 or higher
```

## 🚀 Installation Methods

### Method 1: Build from Source (Current)

This is the current recommended method for development and testing.

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/the-architech/cli.git
cd cli

# Verify you're in the right directory
ls -la
# You should see: package.json, src/, docs/, etc.
```

#### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# This will install:
# - TypeScript and build tools
# - CLI dependencies
# - Type definitions
# - Development dependencies
```

#### Step 3: Build the Project

```bash
# Build the TypeScript code
npm run build

# This creates:
# - dist/ directory with compiled JavaScript
# - dist/index.js - Main CLI executable
# - dist/commands/ - Command implementations
# - dist/core/ - Core services
```

#### Step 4: Verify Installation

```bash
# Test the CLI
node dist/index.js --version

# Expected output:
# 1.0.0

# Test help command
node dist/index.js --help

# Expected output: Usage information and available commands
```

### Method 2: NPM Package (Coming Soon)

```bash
# This will be available soon
npm install -g @the-architech/cli

# Then use directly
architech --version
architech --help
```

### Method 3: Docker (Future)

```bash
# This will be available in the future
docker pull thearchitech/cli:latest
docker run --rm thearchitech/cli --version
```

## ✅ Verification

### Test Basic Functionality

```bash
# 1. Check version
node dist/index.js --version

# 2. Check help
node dist/index.js --help

# 3. List available genomes
node dist/index.js list-genomes

# 4. Test dry run with simple genome
node dist/index.js new /path/to/marketplace/genomes/simple-app.genome.ts --dry-run
```

### Expected Output

When everything is working correctly, you should see:

```bash
$ node dist/index.js --version
1.0.0

$ node dist/index.js list-genomes
🧬 Available Genome Templates

📱 Simple App
   Description: A minimal, production-ready application with essential features
   Complexity: ⭐⭐
   Path: marketplace/genomes/simple-app.genome.ts

📱 SaaS Starter
   Description: The perfect, production-ready foundation for your next subscription-based application
   Complexity: ⭐⭐⭐⭐
   Path: marketplace/genomes/saas-starter.genome.ts

# ... more genomes
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Node.js Version Too Old

**Error**: `SyntaxError: Unexpected token '??'`

**Solution**:
```bash
# Check Node.js version
node --version

# If less than 18.0.0, update Node.js
# Visit https://nodejs.org/ and download the latest LTS version
```

#### 2. Build Fails

**Error**: `npm run build` fails with TypeScript errors

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### 3. CLI Not Found

**Error**: `node dist/index.js: command not found`

**Solution**:
```bash
# Make sure you're in the correct directory
pwd
# Should show: /path/to/cli

# Check if dist directory exists
ls -la dist/
# Should show: index.js, commands/, core/, etc.

# If dist doesn't exist, build the project
npm run build
```

#### 4. Permission Denied

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use a Node version manager
# Install nvm: https://github.com/nvm-sh/nvm
nvm install 18
nvm use 18
```

#### 5. TypeScript Errors

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# If TypeScript is not installed globally
npm install -g typescript@latest

# Or use local TypeScript
npx tsc --version
```

### Getting Help

If you're still having issues:

1. **Check the logs**: Look for error messages in the terminal output
2. **Verify prerequisites**: Ensure Node.js 18+ is installed
3. **Clean install**: Remove `node_modules` and reinstall
4. **Check GitHub Issues**: [Report issues here](https://github.com/the-architech/cli/issues)
5. **Join Discord**: [Get help from the community](https://discord.gg/thearchitech)

## 🎯 Next Steps

Once installation is complete:

### 1. Create Your First Project

```bash
# Create a simple application
node dist/index.js new /path/to/marketplace/genomes/simple-app.genome.ts --dry-run

# If successful, create the actual project
node dist/index.js new /path/to/marketplace/genomes/simple-app.genome.ts
```

### 2. Explore the Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Genome Format](GENOME_FORMAT.md)** - Learn about TypeScript genomes
- **[CLI Reference](CLI_REFERENCE.md)** - Complete command reference
- **[Architecture Guide](ARCHITECTURE.md)** - Understand the system

### 3. Try Different Genomes

```bash
# List all available genomes
node dist/index.js list-genomes

# Try different complexity levels
node dist/index.js new /path/to/marketplace/genomes/blog-app.genome.ts --dry-run
node dist/index.js new /path/to/marketplace/genomes/saas-starter.genome.ts --dry-run
```

### 4. Create Custom Genomes

Learn how to create your own TypeScript genomes:

- **[Genome Format Guide](GENOME_FORMAT.md)**
- **[Examples](EXAMPLES.md)**
- **[Best Practices](BEST_PRACTICES.md)**

## 🎉 Success!

If you've reached this point, congratulations! You have successfully:

- ✅ Installed The Architech CLI
- ✅ Built the project from source
- ✅ Verified the installation
- ✅ Tested basic functionality

You're now ready to start building amazing applications with The Architech! 🚀

---

**Need help?** Join our [Discord community](https://discord.gg/thearchitech) or [open an issue](https://github.com/the-architech/cli/issues) on GitHub.

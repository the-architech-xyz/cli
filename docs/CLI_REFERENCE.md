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

Create a new project from an architech.yaml recipe.

#### Usage

```bash
architech new <recipe-file> [options]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `recipe-file` | Path to the architech.yaml recipe file | ✅ |

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--dry-run` | `-d` | Show what would be created without executing | `false` |
| `--verbose` | `-v` | Enable verbose logging | `false` |
| `--force` | `-f` | Overwrite existing files | `false` |
| `--skip-install` | `-s` | Skip dependency installation | `false` |

#### Examples

```bash
# Create a new project
architech new my-saas.yaml

# Create with verbose logging
architech new my-saas.yaml --verbose

# Show what would be created
architech new my-saas.yaml --dry-run

# Overwrite existing files
architech new my-saas.yaml --force

# Skip dependency installation
architech new my-saas.yaml --skip-install
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
# Create a simple Next.js project
architech new simple-nextjs.yaml

# Create a full-stack SaaS
architech new saas-boilerplate.yaml --verbose

# Create with custom name
architech new my-recipe.yaml
```

### Development Workflow

```bash
# Create project
architech new my-saas.yaml

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
# Test recipe without creating files
architech new my-recipe.yaml --dry-run

# Validate with verbose output
architech new my-recipe.yaml --verbose --dry-run
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Recipe File Not Found

```bash
Error: Recipe file 'my-recipe.yaml' not found
```

**Solution:**
- Check the file path
- Ensure the file exists
- Use absolute path if needed

```bash
# Use absolute path
architech new /path/to/my-recipe.yaml

# Check current directory
ls -la *.yaml
```

#### 2. Module Not Found

```bash
Error: Module 'invalid-module' not found
```

**Solution:**
- Check module ID spelling
- Verify module exists in adapters
- Check supported modules list

```bash
# List available modules
architech list-modules

# Check module documentation
architech docs module auth/better-auth
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

- [Recipe Format Documentation](./RECIPE_FORMAT.md)
- [Adapter Development Guide](./ADAPTER_DEVELOPMENT_GUIDE.md)
- [Available Modules](../src/adapters/)
- [Example Recipes](../examples/)

## 🤝 Getting Help

- **Documentation**: [https://the-architech.dev/docs](https://the-architech.dev/docs)
- **GitHub Issues**: [https://github.com/the-architech/cli/issues](https://github.com/the-architech/cli/issues)
- **Discord Community**: [https://discord.gg/the-architech](https://discord.gg/the-architech)

---

**Happy coding! 🚀**

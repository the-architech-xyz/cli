#!/usr/bin/env node

/**
 * The Architech CLI - Main Entry Point
 * 
 * Revolutionary AI-Powered Application Generator
 * Transforming weeks of work into minutes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { newCommand } from './commands/new.js';
import { scaleCommand } from './commands/scale.js';

// Import plugins command conditionally
let pluginsCmd: Command | null = null;
try {
  const { pluginsCommand } = await import('./commands/plugins.js');
  // Create a command that calls the async function
  pluginsCmd = new Command('plugins')
    .description('Manage plugins (temporarily disabled)')
    .action(async () => {
      await pluginsCommand();
    });
} catch (error) {
  // Plugins command is not available
}

const program = new Command();

// ============================================================================
// CLI CONFIGURATION
// ============================================================================

program
  .name('architech')
  .description('Revolutionary AI-Powered Application Generator')
  .version('0.1.0');

// ============================================================================
// COMMAND DEFINITIONS
// ============================================================================

// New project command
program
  .command('new [project-name]')
  .description('Create a new project with AI-powered recommendations')
  .option('-y, --yes', 'Accept all defaults')
  .option('--skip-git', 'Skip Git initialization')
  .option('--skip-install', 'Skip dependency installation')
  .option('--package-manager <manager>', 'Specify package manager (npm, yarn, pnpm, bun)')
  .option('--project-type <type>', 'Specify project type (blog, ecommerce, saas, api, portfolio)')
  .option('--verbose', 'Enable verbose output')
  .action(newCommand);

// Scale to monorepo command
program
  .command('scale')
  .description('Scale your project to a monorepo architecture')
  .option('-y, --yes', 'Accept all defaults')
  .option('--skip-git', 'Skip Git initialization')
  .option('--skip-install', 'Skip dependency installation')
  .option('--package-manager <manager>', 'Specify package manager (npm, yarn, pnpm, bun)')
  .option('--verbose', 'Enable verbose output')
  .action(scaleCommand);

// Add module command (placeholder for future)
program
  .command('add <module>')
  .description('Add a module to your existing project')
  .option('-f, --force', 'Force installation even if conflicts detected')
  .option('--skip-install', 'Skip dependency installation')
  .option('--verbose', 'Enable verbose output')
  .action((module, options) => {
    console.log(chalk.yellow('🚧 The "add" command is coming soon!'));
    console.log(chalk.gray(`Module: ${module}`));
    if (options.force) {
      console.log(chalk.gray('Force mode: enabled'));
    }
  });

// List command (placeholder for future)
program
  .command('list')
  .description('List available templates and modules')
  .option('--templates', 'Show available templates')
  .option('--modules', 'Show available modules')
  .action((options) => {
    console.log(chalk.blue('\n📦 Available Templates:'));
    console.log('  • nextjs-14     - Next.js 14 with App Router');
    console.log('  • nextjs-13     - Next.js 13 with Pages Router');
    console.log('  • react-18      - React 18 with Vite');
    console.log('  • vue-3         - Vue 3 with Composition API');
    
    console.log(chalk.blue('\n🔧 Available Modules:'));
    console.log('  • auth          - Authentication (Better Auth)');
    console.log('  • database      - Database (Drizzle ORM)');
    console.log('  • ui            - UI Components (Shadcn/ui)');
    console.log('  • payments      - Payment processing');
    console.log('  • admin         - Admin dashboard');
    console.log('  • email         - Email services');
    console.log('  • monitoring    - Application monitoring');
    
    console.log(chalk.blue('\n🎯 Quick Start:'));
    console.log('  architech new my-app          # Create a new project');
    console.log('  architech scale               # Scale to monorepo');
    console.log('  architech add auth            # Add authentication');
    console.log('  architech list --templates    # Show templates');
    console.log('  architech list --modules      # Show modules');
  });

// Info command (placeholder for future)
program
  .command('info')
  .description('Show project information and status')
  .action(() => {
    console.log(chalk.blue('\n📊 Project Information:'));
    console.log(chalk.gray('This command will show:'));
    console.log('  • Project structure (single-app vs monorepo)');
    console.log('  • Installed modules and plugins');
    console.log('  • Dependencies and versions');
    console.log('  • Configuration status');
    console.log(chalk.yellow('\n🚧 Coming soon!'));
  });

// Update command (placeholder for future)
program
  .command('update')
  .description('Update The Architech CLI to the latest version')
  .action(() => {
    console.log(chalk.blue('\n🔄 Updating The Architech CLI...'));
    console.log(chalk.gray('This will update the CLI to the latest version.'));
    console.log(chalk.yellow('\n🚧 Coming soon!'));
  });

// ============================================================================
// PLUGINS COMMAND (CONDITIONAL)
// ============================================================================

if (pluginsCmd) {
  program.addCommand(pluginsCmd);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

program.on('command:*', (operands) => {
  console.error(chalk.red(`Error: Unknown command '${operands[0]}'`));
  console.log(chalk.gray('Run --help for available commands.'));
  process.exit(1);
});

// ============================================================================
// HELP CUSTOMIZATION
// ============================================================================

program.addHelpText('after', `

Examples:
  $ architech new my-blog
  $ architech new my-store --project-type ecommerce
  $ architech scale
  $ architech plugins list

Documentation: https://the-architech.dev
GitHub: https://github.com/the-architech/cli
`);

// ============================================================================
// CLI EXECUTION
// ============================================================================

// Always parse if this is the main module or if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('architech')) {
  program.parse();
}

export { program }; 
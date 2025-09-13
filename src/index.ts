#!/usr/bin/env node

/**
 * The Architech CLI V1 - Agent-Based Architecture
 * 
 * Agent-based project generation from YAML recipes
 * Flow: architech.yaml → Orchestrator → Agents → Adapters → Blueprints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createNewCommand } from './commands/new.js';
import { createAddCommand } from './commands/add.js';
import { createScaleCommand } from './commands/scale.js';
import { createListGenomesCommand } from './commands/list-genomes.js';
import { createMarketplaceCommand } from './commands/marketplace.js';
import { displayBanner } from './core/cli/banner.js';

  const program = new Command();

// ============================================================================
// CLI CONFIGURATION
// ============================================================================

  program
    .name('architech')
  .description('The fastest way to build production-ready applications')
  .version('1.0.0');

// ============================================================================
// COMMAND DEFINITIONS
// ============================================================================

// Add all commands
program.addCommand(createNewCommand());
program.addCommand(createAddCommand());
program.addCommand(createScaleCommand());
program.addCommand(createListGenomesCommand());
program.addCommand(createMarketplaceCommand());

// Default command (show help)
  program
    .action(() => {
    displayBanner();
    console.log(chalk.blue.bold('🏗️ The Architech V1 - Agent-Based Architecture\n'));
    console.log(chalk.gray('Available commands:'));
    console.log(chalk.gray('  new           Create a new project from architech.yaml recipe or genome'));
    console.log(chalk.gray('  list-genomes  List all available project genome templates'));
    console.log(chalk.gray('  add           Add modules to existing project (V2)'));
    console.log(chalk.gray('  scale         Scale project to monorepo (V2)\n'));
    console.log(chalk.yellow('💡 Use "architech new <recipe.yaml>" or "architech new --genome <name> --name <project>" to create a new project!'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  architech new my-saas.yaml'));
    console.log(chalk.gray('  architech new --genome saas-boilerplate --name my-saas\n'));
  });

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
  $ architech new my-saas.yaml                    # Create new project from recipe
  $ architech new --genome saas-boilerplate --name my-saas  # Create from genome
  $ architech list-genomes                        # List available genomes
  $ architech add auth/better-auth                # Add auth module (V2)
  $ architech scale --strategy nx                 # Scale to monorepo (V2)

Documentation: https://the-architech.dev
GitHub: https://github.com/the-architech/cli
`);

// ============================================================================
// CLI EXECUTION
// ============================================================================

/**
 * Main execution function
 */
async function main(): Promise<void> {
  program.parse();
}

// Always parse if this is the main module or if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('architech') || process.argv[1]?.includes('index.js')) {
  main().catch((error) => {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  });
  }

export { program };
#!/usr/bin/env node

/**
 * The Architech CLI V1 - Agent-Based Architecture
 * 
 * Agent-based project generation from TypeScript genomes
 * Flow: genome.ts → Orchestrator → Agents → Adapters → Blueprints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createNewCommand } from './commands/new.js';
import { createAddCommand } from './commands/add.js';
import { createScaleCommand } from './commands/scale.js';
import { createMarketplaceCommand } from './commands/marketplace.js';
import { createAnalyzeCommand } from './commands/analyze.js';
import { createListCommand } from './commands/list.js';
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
program.addCommand(createMarketplaceCommand());
program.addCommand(createAnalyzeCommand());
program.addCommand(createListCommand());

// Default command (show help)
  program
    .action(() => {
    displayBanner();
  });

// ============================================================================
// ERROR HANDLING
// ============================================================================

program.on('command:*', (operands) => {
  console.error(chalk.red(`Error: Unknown command '${operands[0]}'`));
  process.exit(1);
});

// ============================================================================
// HELP CUSTOMIZATION
// ============================================================================

program.addHelpText('after', `

Examples:
  $ architech list                                # List available genome templates
  $ architech new saas-app                        # Create project from template
  $ architech new my-custom.genome.ts             # Create project from custom genome
  $ architech analyze my-saas.ts                  # Analyze genome structure and completeness
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
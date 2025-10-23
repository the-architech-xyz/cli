#!/usr/bin/env node
/**
 * The Architech CLI
 *
 * Type-safe project generation from TypeScript genome templates
 * Flow: Genome → Orchestrator → Module Resolution → Blueprint Execution → Project
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { createNewCommand } from './commands/new.js';
import { createAddCommand } from './commands/add.js';
import { createScaleCommand } from './commands/scale.js';
import { createListGenomesCommand } from './commands/list-genomes.js';
import { createMarketplaceCommand } from './commands/marketplace.js';
import { createAnalyzeCommand } from './commands/analyze.js';
import { createConfigCommand } from './commands/config.js';
import { displayBanner } from './core/cli/banner.js';
import { PathService } from './core/services/path/path-service.js';
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
program.addCommand(createAnalyzeCommand());
program.addCommand(createConfigCommand());
// Default command (show help)
program
    .action(() => {
    displayBanner();
    console.log(chalk.blue.bold('🏗️  The Architech — Stop Writing Boilerplate. Start Architecting.\n'));
    console.log(chalk.gray('Available commands:'));
    console.log(chalk.gray('  new           Create a new project from a genome template'));
    console.log(chalk.gray('  list-genomes  Browse all available project templates'));
    console.log(chalk.gray('  analyze       Analyze existing repository and detect architecture'));
    console.log(chalk.gray('  config        Manage CLI configuration'));
    console.log(chalk.gray('  marketplace   Explore the module marketplace\n'));
    console.log(chalk.dim('Coming soon:'));
    console.log(chalk.dim('  add           Add features to existing project'));
    console.log(chalk.dim('  scale         Scale project to monorepo structure\n'));
    console.log(chalk.yellow('💡 Quick start:'));
    console.log(chalk.gray('  architech new --genome hello-world'));
    console.log(chalk.gray('  architech list-genomes'));
    console.log(chalk.gray('  architech new --genome saas-starter\n'));
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
  $ architech new --genome hello-world            # Create minimal Next.js starter
  $ architech new --genome saas-starter           # Create full SaaS platform
  $ architech new /path/to/custom.genome.ts       # Create from custom genome file
  $ architech list-genomes                        # List available genomes
  $ architech analyze https://github.com/user/repo # Analyze existing repository
  $ architech analyze ./my-project --output genome.ts # Analyze local project
  $ architech config init                         # Create configuration file

Documentation: https://doc.thearchitech.xyz
GitHub: https://github.com/thearchitech-xyz/cli
`);
// ============================================================================
// CLI EXECUTION
// ============================================================================
/**
 * Main execution function
 */
async function main() {
    // Initialize CLI root path for centralized path resolution
    PathService.initializeCliRoot();
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
//# sourceMappingURL=index.js.map
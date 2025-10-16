/**
 * Config Command
 *
 * Manage Architech configuration
 * Usage: architech config <action>
 */
import { Command } from 'commander';
import { ArchitechConfigLoader } from '../core/services/config/index.js';
import { AgentLogger as Logger } from '../core/cli/logger.js';
import * as path from 'path';
export function createConfigCommand() {
    const command = new Command('config');
    command
        .description('Manage Architech configuration')
        .action(() => {
        command.help();
    });
    // Subcommand: config init
    command
        .command('init')
        .description('Create default configuration file')
        .option('--global', 'Create global user configuration', false)
        .action(async (options) => {
        const logger = new Logger();
        try {
            const scope = options.global ? 'user' : 'project';
            await ArchitechConfigLoader.createDefault(scope);
            const configPath = options.global
                ? path.join(process.env.HOME || '~', '.architechrc')
                : path.join(process.cwd(), 'architech.config.json');
            logger.info(`✅ Created ${scope} configuration: ${configPath}`);
            logger.info('');
            logger.info('📝 Edit the file to customize:');
            logger.info('  • Genome sources');
            logger.info('  • Custom aliases');
            logger.info('  • Cache settings');
        }
        catch (error) {
            logger.error(`❌ Failed to create config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    });
    // Subcommand: config show
    command
        .command('show')
        .description('Show current configuration')
        .action(async () => {
        const logger = new Logger();
        try {
            const config = await ArchitechConfigLoader.load(process.cwd());
            logger.info('📋 Current Configuration:\n');
            logger.info(JSON.stringify(config, null, 2));
            logger.info('');
        }
        catch (error) {
            logger.error(`❌ Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    });
    // Subcommand: config set
    command
        .command('set')
        .description('Set a configuration value')
        .argument('<key>', 'Configuration key (e.g., defaultMarketplace)')
        .argument('<value>', 'Value to set')
        .option('--global', 'Set in global user configuration', false)
        .action(async (key, value, options) => {
        const logger = new Logger();
        try {
            const scope = options.global ? 'user' : 'project';
            const config = await ArchitechConfigLoader.load(process.cwd());
            // Set the value (simple key-value for now)
            config[key] = value;
            // Save
            await ArchitechConfigLoader.save(config, scope, process.cwd());
            logger.info(`✅ Set ${key} = ${value} (${scope} scope)`);
        }
        catch (error) {
            logger.error(`❌ Failed to set config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    });
    // Subcommand: config add-source
    command
        .command('add-source')
        .description('Add a custom genome source')
        .requiredOption('--name <name>', 'Source name')
        .requiredOption('--type <type>', 'Source type (local|git|npm|url)')
        .requiredOption('--path <path>', 'Source path or URL')
        .option('--priority <priority>', 'Priority (lower = higher priority)', '10')
        .option('--global', 'Add to global configuration', false)
        .action(async (options) => {
        const logger = new Logger();
        try {
            const scope = options.global ? 'user' : 'project';
            const config = await ArchitechConfigLoader.load(process.cwd());
            // Initialize genomeSources if not exists
            if (!config.genomeSources) {
                config.genomeSources = [];
            }
            // Add new source
            config.genomeSources.push({
                name: options.name,
                type: options.type,
                path: options.path,
                priority: parseInt(options.priority),
                enabled: true
            });
            // Save
            await ArchitechConfigLoader.save(config, scope, process.cwd());
            logger.info(`✅ Added genome source: ${options.name}`);
            logger.info(`   Type: ${options.type}`);
            logger.info(`   Path: ${options.path}`);
            logger.info(`   Priority: ${options.priority}`);
        }
        catch (error) {
            logger.error(`❌ Failed to add source: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=config.js.map
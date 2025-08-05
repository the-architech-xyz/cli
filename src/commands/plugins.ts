/**
 * Plugins Command - TEMPORARILY DISABLED
 * 
 * This command needs to be rewritten for the new adapter system.
 * The old plugin system has been replaced with tech-agnostic adapters.
 */

import chalk from 'chalk';

/*
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
// import { PluginSystem } from '../core/plugin/plugin-system.js';
// import { PluginAdapter } from '../core/plugin/plugin-adapter.js';
import { CommandRunner } from '../core/cli/command-runner.js';
import { Logger } from '../core/cli/logger.js';
import { displaySuccess, displayError, displayInfo } from '../core/cli/banner.js';
import { ConfigProperty } from '../types/plugins.js';

export function pluginsCommand(): Command {
  const command = new Command('plugins')
    .description('Manage The Architech plugins')
    .alias('p');

  // List plugins command
  command
    .command('list')
    .description('List all available plugins')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tag <tag>', 'Filter by tag')
    .action(async (options) => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        
        let plugins: any[] = [];
        
        if (options.category) {
          plugins = pluginSystem.getPluginsByCategory(options.category);
        } else if (options.tag) {
          plugins = (pluginSystem.getRegistry() as any).getPluginsByTag(options.tag);
        } else {
          plugins = pluginSystem.getRegistry().getAll();
        }

        if (plugins.length === 0) {
          displayInfo('No plugins found');
          return;
        }

        console.log(chalk.blue.bold('\n📦 Available Plugins:\n'));
        
        // Group by category
        const byCategory: Record<string, any[]> = {};
        for (const plugin of plugins) {
          const metadata = plugin.getMetadata();
          const category = metadata.category;
          if (!byCategory[category]) {
            byCategory[category] = [];
          }
          byCategory[category].push(plugin);
        }

        for (const [category, categoryPlugins] of Object.entries(byCategory)) {
          console.log(chalk.yellow.bold(`\n${category.toUpperCase()} (${categoryPlugins.length}):`));
          
          for (const plugin of categoryPlugins) {
            const metadata = plugin.getMetadata();
            console.log(`  ${chalk.green(metadata.name)} ${chalk.gray(`(${metadata.id})`)}`);
            console.log(`    ${chalk.gray(metadata.description)}`);
            console.log(`    ${chalk.blue(`Tags: ${metadata.tags.join(', ')}`)}`);
            console.log(`    ${chalk.magenta(`Version: ${metadata.version}`)}`);
            console.log(`    ${chalk.cyan(`Author: ${metadata.author}`)}`);
            console.log('');
          }
        }

        displaySuccess(`Found ${plugins.length} plugins`);

      } catch (error) {
        displayError(`Failed to list plugins: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  // Search plugins command
  command
    .command('search <query>')
    .description('Search for plugins')
    .action(async (query) => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        const plugins = pluginSystem.searchPlugins(query);

        if (plugins.length === 0) {
          displayInfo(`No plugins found matching "${query}"`);
          return;
        }

        console.log(chalk.blue.bold(`\n🔍 Search Results for "${query}":\n`));
        
        for (const plugin of plugins) {
          const metadata = plugin.getMetadata();
          console.log(`${chalk.green(metadata.name)} ${chalk.gray(`(${metadata.id})`)}`);
          console.log(`  ${chalk.gray(metadata.description)}`);
          console.log(`  ${chalk.blue(`Category: ${metadata.category}`)}`);
          console.log(`  ${chalk.blue(`Tags: ${metadata.tags.join(', ')}`)}`);
          console.log('');
        }

        displaySuccess(`Found ${plugins.length} plugins matching "${query}"`);

      } catch (error) {
        displayError(`Failed to search plugins: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  // Install plugin command
  command
    .command('install <plugin-id>')
    .description('Install a plugin')
    .option('-c, --config <config>', 'Plugin configuration (JSON)')
    .option('-y, --yes', 'Skip interactive prompts')
    .action(async (pluginId, options) => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        const adapter = new PluginAdapter(pluginSystem);
        
        // Check if plugin exists
        const plugin = pluginSystem.getRegistry().get(pluginId);
        if (!plugin) {
          displayError(`Plugin "${pluginId}" not found`);
          return;
        }

        const metadata = plugin.getMetadata();
        displayInfo(`Installing ${metadata.name}...`);

        // Parse config if provided
        let config = {};
        if (options.config) {
          try {
            config = JSON.parse(options.config);
          } catch (e) {
            displayError('Invalid configuration JSON');
            return;
          }
        } else if (!options.yes) {
          // Interactive configuration
          config = await interactiveConfig(plugin);
        }

        // Create context for installation
        const context = {
          projectName: 'test-project',
          projectPath: process.cwd(),
          packageManager: 'npm',
          options: {
            skipGit: false,
            skipInstall: false,
            useDefaults: false,
            verbose: true
          },
          config: config,
          runner: new CommandRunner('npm', { verbose: true }),
          logger: pluginSystem.getLogger(),
          state: new Map(),
          dependencies: [],
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            env: Object.fromEntries(Object.entries(process.env).filter(([_, value]) => value !== undefined)) as Record<string, string>
          }
        };

        const result = await adapter.installPlugin(pluginId, context);

        if (result.success) {
          displaySuccess(`Successfully installed ${metadata.name}`);
          
          if (result.warnings && result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            for (const warning of result.warnings) {
              console.log(`  ${warning}`);
            }
          }

          // Show next steps
          console.log(chalk.blue('\n📋 Next Steps:'));
          console.log(`  1. Configure your environment variables`);
          console.log(`  2. Run 'npm install' to install dependencies`);
          console.log(`  3. Start your development server`);
        } else {
          displayError(`Failed to install ${metadata.name}`);
          if (result.errors && result.errors.length > 0) {
            for (const error of result.errors) {
              console.log(`  ${error.message}`);
            }
          }
        }

      } catch (error) {
        displayError(`Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  // Uninstall plugin command
  command
    .command('uninstall <plugin-id>')
    .description('Uninstall a plugin')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (pluginId, options) => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        const adapter = new PluginAdapter(pluginSystem);
        
        // Check if plugin exists
        const plugin = pluginSystem.getRegistry().get(pluginId);
        if (!plugin) {
          displayError(`Plugin "${pluginId}" not found`);
          return;
        }

        const metadata = plugin.getMetadata();

        // Confirm uninstallation
        if (!options.yes) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to uninstall ${metadata.name}?`,
              default: false
            }
          ]);

          if (!confirm) {
            displayInfo('Uninstallation cancelled');
            return;
          }
        }

        displayInfo(`Uninstalling ${metadata.name}...`);

        // Create context for uninstallation
        const context = {
          projectName: 'test-project',
          projectPath: process.cwd(),
          packageManager: 'npm',
          options: {
            skipGit: false,
            skipInstall: false,
            useDefaults: false,
            verbose: true
          },
          config: {},
          runner: new CommandRunner('npm', { verbose: true }),
          logger: pluginSystem.getLogger(),
          state: new Map(),
          dependencies: [],
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            env: Object.fromEntries(Object.entries(process.env).filter(([_, value]) => value !== undefined)) as Record<string, string>
          }
        };

        const result = await adapter.uninstallPlugin(pluginId, context);

        if (result.success) {
          displaySuccess(`Successfully uninstalled ${metadata.name}`);
          
          if (result.warnings && result.warnings.length > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            for (const warning of result.warnings) {
              console.log(`  ${warning}`);
            }
          }
        } else {
          displayError(`Failed to uninstall ${metadata.name}`);
          if (result.errors && result.errors.length > 0) {
            for (const error of result.errors) {
              console.log(`  ${error.message}`);
            }
          }
        }

      } catch (error) {
        displayError(`Failed to uninstall plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  // Info command
  command
    .command('info <plugin-id>')
    .description('Show detailed information about a plugin')
    .action(async (pluginId) => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        const plugin = pluginSystem.getRegistry().get(pluginId);
        
        if (!plugin) {
          displayError(`Plugin "${pluginId}" not found`);
          return;
        }

        const metadata = plugin.getMetadata();
        const compatibility = plugin.getCompatibility();
        const dependencies = plugin.getDependencies();
        const conflicts = plugin.getConflicts();
        const requirements = plugin.getRequirements();
        const configSchema = plugin.getConfigSchema();

        console.log(chalk.blue.bold(`\n📋 Plugin Information: ${metadata.name}\n`));
        
        console.log(`${chalk.green('ID:')} ${metadata.id}`);
        console.log(`${chalk.green('Name:')} ${metadata.name}`);
        console.log(`${chalk.green('Version:')} ${metadata.version}`);
        console.log(`${chalk.green('Description:')} ${metadata.description}`);
        console.log(`${chalk.green('Author:')} ${metadata.author}`);
        console.log(`${chalk.green('Category:')} ${metadata.category}`);
        console.log(`${chalk.green('License:')} ${metadata.license}`);
        console.log(`${chalk.green('Tags:')} ${metadata.tags.join(', ')}`);

        if (metadata.repository) {
          console.log(`${chalk.green('Repository:')} ${metadata.repository}`);
        }
        if (metadata.homepage) {
          console.log(`${chalk.green('Homepage:')} ${metadata.homepage}`);
        }
        if (metadata.documentation) {
          console.log(`${chalk.green('Documentation:')} ${metadata.documentation}`);
        }

        console.log(chalk.yellow.bold('\n🔧 Compatibility:'));
        console.log(`  Frameworks: ${compatibility.frameworks.join(', ')}`);
        console.log(`  Platforms: ${compatibility.platforms.join(', ')}`);
        console.log(`  Node Versions: ${compatibility.nodeVersions.join(', ')}`);
        console.log(`  Package Managers: ${compatibility.packageManagers.join(', ')}`);

        if (dependencies.length > 0) {
          console.log(chalk.yellow.bold('\n📦 Dependencies:'));
          for (const dep of dependencies) {
            console.log(`  ${dep}`);
          }
        }

        if (conflicts.length > 0) {
          console.log(chalk.yellow.bold('\n⚠️  Conflicts:'));
          for (const conflict of conflicts) {
            console.log(`  ${conflict}`);
          }
        }

        if (requirements.length > 0) {
          console.log(chalk.yellow.bold('\n🔍 Requirements:'));
          for (const req of requirements) {
            const optional = req.optional ? ' (optional)' : '';
            console.log(`  ${req.type}: ${req.name}${optional}`);
            console.log(`    ${req.description}`);
            if (req.version) {
              console.log(`    Version: ${req.version}`);
            }
          }
        }

        if (configSchema && configSchema.properties) {
          console.log(chalk.yellow.bold('\n⚙️  Configuration Options:'));
          for (const [key, prop] of Object.entries(configSchema.properties)) {
            const required = configSchema.required?.includes(key) ? ' (required)' : '';
            const typedProp = prop as ConfigProperty;
            console.log(`  ${key}${required}:`);
            console.log(`    Type: ${typedProp.type}`);
            console.log(`    Description: ${typedProp.description}`);
            if (typedProp.default !== undefined) {
              console.log(`    Default: ${JSON.stringify(typedProp.default)}`);
            }
            if (typedProp.enum) {
              console.log(`    Options: ${typedProp.enum.join(', ')}`);
            }
            console.log('');
          }
        }
        
      } catch (error) {
        displayError(`Failed to get plugin info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  // Debug command
  command
    .command('debug')
    .description('Show debug information about the plugin system')
    .action(async () => {
      try {
        const pluginSystem = PluginSystem.getInstance();
        pluginSystem.debugPlugins();
        displaySuccess('Debug information displayed');
      } catch (error) {
        displayError(`Failed to show debug info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

  return command;
}

// Helper function for interactive configuration
async function interactiveConfig(plugin: any): Promise<Record<string, any>> {
  const configSchema = plugin.getConfigSchema();
  const defaultConfig = plugin.getDefaultConfig();
  const config: Record<string, any> = {};

  if (!configSchema || !configSchema.properties) {
    return defaultConfig;
  }

  const questions = [];

  for (const [key, prop] of Object.entries(configSchema.properties)) {
    const isRequired = configSchema.required?.includes(key);
    const defaultValue = defaultConfig[key];
    const typedProp = prop as ConfigProperty;

    let question: any = {
      type: typedProp.type === 'boolean' ? 'confirm' : 'input',
      name: key,
      message: `${typedProp.description}${isRequired ? ' (required)' : ''}`,
      default: defaultValue
    };

    if (typedProp.type === 'array' && typedProp.items?.enum) {
      question.type = 'checkbox';
      question.choices = typedProp.items.enum.map((option: string) => ({
        name: option,
        value: option,
        checked: defaultValue?.includes(option)
      }));
    } else if (typedProp.enum) {
      question.type = 'list';
      question.choices = typedProp.enum;
    }

    questions.push(question);
  }

  const answers = await inquirer.prompt(questions);
  return answers;
} 
*/

export async function pluginsCommand(): Promise<void> {
  console.log(chalk.yellow('⚠️  Plugins command is temporarily disabled'));
  console.log(chalk.gray('The plugin system has been replaced with tech-agnostic adapters.'));
  console.log(chalk.gray('This command will be updated in a future release.'));
} 
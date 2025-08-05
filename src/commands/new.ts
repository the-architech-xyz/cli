/**
 * New Command - Create a new project with AI-powered recommendations
 * 
 * Handles the creation of new projects using the smart question system
 * and orchestrates the entire generation process.
 */

import chalk from 'chalk';
import { Command } from 'commander';
import path from 'path';
import { OrchestratorAgent } from '../agents/orchestrator-agent.js';
import { AgentContext, ExecutionOptions } from '../types/agents.js';
import { ProjectConfig } from '../types/smart-questions.js';
import { CommandRunner } from '../core/cli/command-runner.js';

interface NewCommandOptions {
  yes?: boolean;
  skipGit?: boolean;
  skipInstall?: boolean;
  packageManager?: string;
  projectType?: string;
  verbose?: boolean;
}

export async function newCommand(
  projectName: string | undefined,
  options: NewCommandOptions = {}
): Promise<void> {
  try {
    // Display welcome message
    console.log(chalk.blue.bold('🎭 Welcome to The Architech!\n'));

    // Validate project name
    if (!projectName) {
      console.error(chalk.red('❌ Project name is required'));
      console.log(chalk.gray('Usage: architech new <project-name>'));
      process.exit(1);
    }

    // Create execution options
    const executionOptions: ExecutionOptions = {
      skipGit: options.skipGit || false,
      skipInstall: options.skipInstall || false,
      useDefaults: options.yes || false,
      verbose: options.verbose || false
    };

    // Create project configuration
    const config: ProjectConfig = {
      projectName,
      projectType: options.projectType || 'custom',
      features: [],
      plugins: [],
      techStack: {},
      customizations: {},
      complexity: 'medium',
      estimatedTime: '5 minutes'
    };

    // Create agent context
    const context: AgentContext = {
      projectName,
      projectPath: path.resolve(path.join(process.cwd(), projectName)),
      userInput: options.projectType ? `Create a ${options.projectType} project` : 'Create a modern web application',
      config,
      options: executionOptions,
      logger: {
        info: (message: string) => console.log(chalk.blue(message)),
        warn: (message: string) => console.log(chalk.yellow(message)),
        error: (message: string) => console.log(chalk.red(message)),
        debug: (message: string) => {
          if (options.verbose) {
            console.log(chalk.gray(`[DEBUG] ${message}`));
          }
        },
        success: (message: string) => console.log(chalk.green(message)),
        log: (message: string) => console.log(message)
      },
      state: new Map(),
      packageManager: options.packageManager || 'npm',
      runner: new CommandRunner(),
      dependencies: [],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        env: Object.fromEntries(
          Object.entries(process.env).filter(([_, value]) => value !== undefined)
        ) as Record<string, string>
      }
    };

    // Execute orchestrator agent
    const orchestratorAgent = new OrchestratorAgent();
    const result = await orchestratorAgent.execute(context);

    if (result.success) {
      console.log(chalk.green.bold('\n✅ Project generated successfully!\n'));
      
      console.log(chalk.cyan('📁 Project Structure:'));
      console.log(`   ${config.projectName}/`);
      console.log('   ├── src/');
      console.log('   ├── public/');
      console.log('   ├── package.json');
      console.log('   └── README.md');
      
      console.log(chalk.cyan('\n🔧 Configuration:'));
      console.log(`   Project Type: ${config.projectType}`);
      console.log(`   Features: ${config.features.join(', ')}`);
      console.log(`   Plugins: ${config.plugins.join(', ')}`);
      console.log(`   Complexity: ${config.complexity}`);
      console.log(`   Estimated Time: ${config.estimatedTime}`);
      
      console.log(chalk.cyan('\n🚀 Next Steps:'));
      console.log(`   cd ${config.projectName}`);
      console.log('   npm install');
      console.log('   npm run dev');
      
      console.log(chalk.yellow('\n💡 Tip: Check the README.md for detailed setup instructions!'));
    } else {
      console.error(chalk.red('\n❌ Project generation failed'));
      if (result.errors && result.errors.length > 0) {
        console.error(chalk.red('Errors:'));
        result.errors.forEach((error: any) => {
          console.error(chalk.red(`  - ${error.message}`));
        });
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ An unexpected error occurred:'));
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

// Quick setup function for non-interactive mode
async function quickSetup(projectName: string, options: NewCommandOptions): Promise<void> {
  // Use default configuration for quick setup
  const config: ProjectConfig = {
    projectName,
    projectType: 'blog',
    features: ['database', 'authentication', 'ui'],
    plugins: ['nextjs', 'drizzle', 'better-auth', 'shadcn-ui'],
    techStack: {
      framework: { name: 'nextjs', reason: 'React framework for production', confidence: 0.9 },
      database: { name: 'drizzle', reason: 'TypeScript-first ORM', confidence: 0.9 },
      auth: { name: 'better-auth', reason: 'Modern authentication', confidence: 0.9 },
      ui: { name: 'shadcn-ui', reason: 'Beautiful components', confidence: 0.9 }
    },
    customizations: {},
    complexity: 'medium',
    estimatedTime: '3 minutes'
  };

  const executionOptions: ExecutionOptions = {
    skipGit: options.skipGit || false,
    skipInstall: options.skipInstall || false,
    useDefaults: true,
    verbose: options.verbose || false
  };

  const context: AgentContext = {
    projectName,
    projectPath: path.join(process.cwd(), projectName),
    userInput: 'Create a blog with authentication and beautiful UI',
    config,
    options: executionOptions,
    logger: {
      info: (message: string) => console.log(chalk.blue(message)),
      warn: (message: string) => console.log(chalk.yellow(message)),
      error: (message: string) => console.log(chalk.red(message)),
      debug: (message: string) => {
        if (options.verbose) {
          console.log(chalk.gray(`[DEBUG] ${message}`));
        }
      },
      success: (message: string) => console.log(chalk.green(message)),
      log: (message: string) => console.log(message)
    },
    state: new Map(),
    packageManager: options.packageManager || 'npm',
    runner: new CommandRunner(),
    dependencies: [],
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: Object.fromEntries(
        Object.entries(process.env).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>
    }
  };

  const orchestratorAgent = new OrchestratorAgent();
  const result = await orchestratorAgent.execute(context);

  if (result.success) {
    console.log(chalk.green.bold('\n✅ Project generated successfully!\n'));
    console.log(chalk.cyan('📁 Project Structure:'));
    console.log(`   ${config.projectName}/`);
    console.log('   ├── src/');
    console.log('   ├── public/');
    console.log('   ├── package.json');
    console.log('   └── README.md');
    
    console.log(chalk.cyan('\n🚀 Next Steps:'));
    console.log(`   cd ${config.projectName}`);
    console.log('   npm install');
    console.log('   npm run dev');
  } else {
    console.error(chalk.red('\n❌ Project generation failed'));
    process.exit(1);
  }
} 
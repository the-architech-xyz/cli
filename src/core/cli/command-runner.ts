/**
 * CommandRunner - Package Manager Agnostic Command Execution
 * 
 * Validated in Phase 0 Research with 75% success rate across package managers.
 * Provides a unified interface for npm, yarn, pnpm, and bun.
 */

import { execSync, spawn, SpawnOptions, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'auto';

export interface CommandRunnerOptions {
  verbose?: boolean;
  silent?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface PackageManagerCommands {
  create: string[];
  install: string[];
  installDev: string[];
  run: string[];
  version: string[];
  init: string[];
  exec: string[];
}

export class CommandRunner {
  private verbose: boolean;
  private packageManager: PackageManager;
  private commands: PackageManagerCommands;

  constructor(packageManager: PackageManager = 'auto', options: CommandRunnerOptions = {}) {
    this.verbose = options.verbose || false;
    this.packageManager = packageManager === 'auto' 
      ? this.detectPackageManager() 
      : packageManager;
    
    this.commands = this.getPackageManagerCommands(this.packageManager);
    
    if (this.verbose) {
      console.log(chalk.blue(`🔧 Using package manager: ${this.packageManager}`));
    }
  }

  // Public getter for package manager
  getPackageManager(): PackageManager {
    return this.packageManager;
  }

  // Public getter for create command
  getCreateCommand(): string[] {
    return this.commands.create;
  }

  private detectPackageManager(): PackageManager {
    // Check which package managers are available
    const available: PackageManager[] = [];
    
    try {
      execSync('npm --version', { stdio: 'ignore' });
      available.push('npm');
    } catch {}
    
    try {
      execSync('yarn --version', { stdio: 'ignore' });
      available.push('yarn');
    } catch {}
    
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
      available.push('pnpm');
    } catch {}
    
    try {
      execSync('bun --version', { stdio: 'ignore' });
      available.push('bun');
    } catch {}

    if (this.verbose) {
      console.log(chalk.gray(`📦 Available package managers: ${available.join(', ')}`));
    }

    // Check parent directories for existing projects (traversing up)
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      if (existsSync(path.join(currentDir, 'yarn.lock'))) {
        if (this.verbose) console.log(chalk.yellow('📄 Found yarn.lock'));
        return available.includes('yarn') ? 'yarn' : 'npm';
      }
      if (existsSync(path.join(currentDir, 'pnpm-lock.yaml'))) {
        if (this.verbose) console.log(chalk.yellow('📄 Found pnpm-lock.yaml'));
        return available.includes('pnpm') ? 'pnpm' : 'npm';
      }
      if (existsSync(path.join(currentDir, 'bun.lockb'))) {
        if (this.verbose) console.log(chalk.yellow('📄 Found bun.lockb'));
        return available.includes('bun') ? 'bun' : 'npm';
      }
      currentDir = path.dirname(currentDir);
    }

    // Default preference order: yarn > npm > pnpm > bun
    if (available.includes('yarn')) return 'yarn';
    if (available.includes('npm')) return 'npm';
    if (available.includes('pnpm')) return 'pnpm';
    if (available.includes('bun')) return 'bun';
    
    throw new Error('No package manager found! Please install npm, yarn, pnpm, or bun.');
  }

  private getPackageManagerCommands(pm: PackageManager): PackageManagerCommands {
    const commands: Record<PackageManager, PackageManagerCommands> = {
      npm: {
        create: ['npx', 'create-next-app@latest'],
        install: ['npm', 'install'],
        installDev: ['npm', 'install', '--save-dev'],
        run: ['npm', 'run'],
        version: ['npm', '--version'],
        init: ['npm', 'init', '-y'],
        exec: ['npx']
      },
      yarn: {
        create: ['yarn', 'create', 'next-app'],
        install: ['yarn', 'add'],
        installDev: ['yarn', 'add', '--dev'],
        run: ['yarn'],
        version: ['yarn', '--version'],
        init: ['yarn', 'init', '-y'],
        exec: ['yarn', 'dlx']
      },
      pnpm: {
        create: ['pnpm', 'create', 'next-app'],
        install: ['pnpm', 'install'],
        installDev: ['pnpm', 'add', '--save-dev'],
        run: ['pnpm', 'run'],
        version: ['pnpm', '--version'],
        init: ['pnpm', 'init', '-y'],
        exec: ['pnpx']
      },
      bun: {
        create: ['bunx', 'create-next-app@latest'],
        install: ['bun', 'install'],
        installDev: ['bun', 'add', '--development'],
        run: ['bun', 'run'],
        version: ['bun', '--version'],
        init: ['bun', 'init', '-y'],
        exec: ['bunx']
      },
      auto: {
        create: ['npx', 'create-next-app@latest'],
        install: ['npm', 'install'],
        installDev: ['npm', 'install', '--save-dev'],
        run: ['npm', 'run'],
        version: ['npm', '--version'],
        init: ['npm', 'init', '-y'],
        exec: ['npx']
      }
    };
    
    return commands[pm] || commands.npm;
  }

  async execCommand(cmdArray: string[], options: CommandRunnerOptions = {}): Promise<CommandResult> {
    const [command, ...args] = cmdArray;
    
    if (!command) {
      throw new Error('Command cannot be undefined or empty');
    }
    
    const cmdString = `${command} ${args.join(' ')}`;
    
    // Enhanced spinner with package manager context
    const spinner = ora({
      text: `${cmdString}`,
      spinner: 'dots',
      color: 'cyan'
    });

    if (!options.silent) {
      spinner.start();
    }
    
    return new Promise((resolve, reject) => {
      const spawnOptions: SpawnOptions = {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
        cwd: options.cwd || process.cwd(),
        env: { 
          ...process.env, 
          ...options.env,
          // Force non-interactive mode for common tools
          CI: 'true',
          FORCE_COLOR: '1',
          NODE_ENV: 'production'
        }
      };

      const childProcess: ChildProcess = spawn(command, args, spawnOptions);

      let stdout = '';
      let stderr = '';

      if (options.silent && childProcess.stdout && childProcess.stderr) {
        childProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      childProcess.on('close', (code: number | null) => {
        if (!options.silent) {
          spinner.stop();
        }
        
        if (code === 0) {
          if (!options.silent) {
            console.log(chalk.green(`✅ Completed: ${command}`));
          }
          resolve({ stdout, stderr, code: code || 0 });
        } else {
          if (!options.silent) {
            console.log(chalk.red(`❌ Failed: ${cmdString} (exit code: ${code})`));
          }
          reject(new Error(`Command failed: ${cmdString}\nExit code: ${code}\nStderr: ${stderr}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        if (!options.silent) {
          spinner.fail(`❌ Error: ${cmdString}`);
        }
        reject(error);
      });
    });
  }

  async getVersion(): Promise<string> {
    try {
      const result = await this.execCommand(this.commands.version, { silent: true });
      return result.stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get ${this.packageManager} version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createProject(projectName: string, framework = 'nextjs', options: string[] = []): Promise<CommandResult> {
    const createCmd = [...this.commands.create, projectName, ...options];
    return this.execCommand(createCmd);
  }

  async install(packages: string[] = [], isDev = false, cwd = process.cwd()): Promise<CommandResult> {
    const installCmd = isDev ? this.commands.installDev : this.commands.install;
    const fullCmd = packages.length > 0 ? [...installCmd, ...packages] : installCmd;
    
    return this.execCommand(fullCmd, { cwd });
  }

  async installNonInteractive(packages: string[] = [], isDev = false, cwd = process.cwd()): Promise<CommandResult> {
    const installCmd = isDev ? this.commands.installDev : this.commands.install;
    const fullCmd = packages.length > 0 ? [...installCmd, ...packages] : installCmd;
    
    // Add non-interactive flags based on package manager
    const nonInteractiveFlags = this.getNonInteractiveFlags();
    const finalCmd = [...fullCmd, ...nonInteractiveFlags];
    
    return this.execCommand(finalCmd, { 
      cwd,
      env: {
        CI: 'true',
        FORCE_COLOR: '1',
        NODE_ENV: 'production'
      }
    });
  }

  private getNonInteractiveFlags(): string[] {
    switch (this.packageManager) {
      case 'npm':
        return ['--yes', '--silent'];
      case 'yarn':
        return ['--silent'];
      case 'pnpm':
        return ['--silent'];
      case 'bun':
        return ['--silent'];
      default:
        return ['--yes', '--silent'];
    }
  }

  async runScript(scriptName: string, cwd = process.cwd()): Promise<CommandResult> {
    const runCmd = [...this.commands.run, scriptName];
    return this.execCommand(runCmd, { cwd });
  }

  async exec(toolName: string, args: string[] = [], cwd = process.cwd()): Promise<CommandResult> {
    const execCmd = [...this.commands.exec, toolName, ...args];
    return this.execCommand(execCmd, { cwd });
  }

  /**
   * Execute a command non-interactively by providing input via stdin
   * Useful for CLI tools that ask for user input
   */
  async execNonInteractive(toolName: string, args: string[] = [], input: string[] = [], cwd = process.cwd()): Promise<CommandResult> {
    const execCmd = [...this.commands.exec, toolName, ...args];
    
    if (this.verbose) {
      console.log(chalk.blue(`🔧 Executing non-interactive: ${execCmd.join(' ')}`));
    }
    
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn(execCmd[0], execCmd.slice(1), {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      
      child.on('error', (error: Error) => {
        reject(error);
      });
      
      child.on('close', (code: number) => {
        resolve({
          stdout,
          stderr,
          code
        });
      });
      
      // Send input to stdin
      if (input.length > 0) {
        child.stdin.write(input.join('\n') + '\n');
        child.stdin.end();
      }
    });
  }

  // Helper method for The Architech specific operations
  async initProject(projectPath: string, framework = 'nextjs', options: Record<string, unknown> = {}): Promise<CommandResult> {
    const projectName = path.basename(projectPath);
    const parentDir = path.dirname(projectPath);
    
    // Create Next.js project with all our preferred settings
    const createOptions = [
      '--typescript',
      '--tailwind', 
      '--eslint',
      '--app',
      '--src-dir',
      '--import-alias', '@/*',
      '--yes' // Non-interactive
    ];
    
    return this.execCommand(
      [...this.commands.create, projectName, ...createOptions], 
      { cwd: parentDir }
    );
  }
}

export default CommandRunner; 
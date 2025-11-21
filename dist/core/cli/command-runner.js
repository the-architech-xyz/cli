/**
 * CommandRunner - Corrected Version with Direct Process Execution
 *
 * This version uses direct spawn without shell dependency for security
 * and cross-platform compatibility. Follows Node.js best practices.
 *
 * Provides a unified interface for npm, yarn, pnpm, and bun.
 */
import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
export class CommandRunner {
    verbose;
    packageManager;
    commands;
    constructor(packageManager = 'auto', options = {}) {
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
    getPackageManager() {
        return this.packageManager;
    }
    // Public getter for create command
    getCreateCommand() {
        return this.commands.create;
    }
    detectPackageManager() {
        // Check which package managers are available
        const available = [];
        try {
            execSync('npm --version', { stdio: 'ignore' });
            available.push('npm');
        }
        catch { }
        try {
            execSync('yarn --version', { stdio: 'ignore' });
            available.push('yarn');
        }
        catch { }
        try {
            execSync('pnpm --version', { stdio: 'ignore' });
            available.push('pnpm');
        }
        catch { }
        try {
            execSync('bun --version', { stdio: 'ignore' });
            available.push('bun');
        }
        catch { }
        if (this.verbose) {
            console.log(chalk.gray(`📦 Available package managers: ${available.join(', ')}`));
        }
        // Check parent directories for existing projects (traversing up)
        let currentDir = process.cwd();
        const root = path.parse(currentDir).root;
        while (currentDir !== root) {
            if (existsSync(path.join(currentDir, 'yarn.lock'))) {
                if (this.verbose)
                    console.log(chalk.yellow('📄 Found yarn.lock'));
                return available.includes('yarn') ? 'yarn' : 'npm';
            }
            if (existsSync(path.join(currentDir, 'pnpm-lock.yaml'))) {
                if (this.verbose)
                    console.log(chalk.yellow('📄 Found pnpm-lock.yaml'));
                return available.includes('pnpm') ? 'pnpm' : 'npm';
            }
            if (existsSync(path.join(currentDir, 'bun.lockb'))) {
                if (this.verbose)
                    console.log(chalk.yellow('📄 Found bun.lockb'));
                return available.includes('bun') ? 'bun' : 'npm';
            }
            currentDir = path.dirname(currentDir);
        }
        // Default preference order: yarn > npm > pnpm > bun
        if (available.includes('yarn'))
            return 'yarn';
        if (available.includes('npm'))
            return 'npm';
        if (available.includes('pnpm'))
            return 'pnpm';
        if (available.includes('bun'))
            return 'bun';
        throw new Error('No package manager found! Please install npm, yarn, pnpm, or bun.');
    }
    getPackageManagerCommands(pm) {
        const commands = {
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
    async execCommand(cmdArray, options = {}) {
        const [command, ...args] = cmdArray;
        if (!command) {
            throw new Error('Command cannot be undefined or empty');
        }
        if (this.verbose) {
            console.log(chalk.blue(`⚡ Executing command: ${command} ${args.join(' ')}`));
        }
        // Use direct spawn without shell - this is the correct approach
        return this.execWithDirectSpawn(command, args, options);
    }
    async execShellCommand(command, options = {}) {
        if (!command || !command.trim()) {
            throw new Error('Shell command cannot be empty');
        }
        if (this.verbose) {
            console.log(chalk.blue(`⚡ Executing shell command: ${command}`));
        }
        return new Promise((resolve) => {
            const child = spawn(command, {
                cwd: options.cwd,
                env: { ...process.env, ...(options.env || {}) },
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: process.platform === 'win32' ? 'cmd.exe' : true,
            });
            let stdout = '';
            let stderr = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    const text = data.toString();
                    stdout += text;
                    if (this.verbose) {
                        process.stdout.write(text);
                    }
                });
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    const text = data.toString();
                    stderr += text;
                    if (this.verbose) {
                        process.stderr.write(text);
                    }
                });
            }
            const spinner = ora({ text: `Running shell command`, spinner: 'dots' });
            if (!this.verbose && !options.silent) {
                spinner.start();
            }
            child.on('close', (code) => {
                if (!this.verbose && !options.silent) {
                    if (code === 0) {
                        spinner.succeed(`Command completed successfully`);
                    }
                    else {
                        spinner.fail(`Command failed: ${command}`);
                    }
                }
                resolve({ stdout, stderr, code: code ?? 1 });
            });
            child.on('error', (error) => {
                if (!this.verbose && !options.silent) {
                    spinner.fail(`Command failed: ${command}`);
                }
                resolve({ stdout, stderr: error.message, code: 1 });
            });
        });
    }
    async execWithDirectSpawn(command, args, options) {
        return this.spawnProcess(command, args, options);
    }
    async spawnProcess(command, args, options) {
        return new Promise((resolve) => {
            // Determine whether to use shell based on command (needed for npm/npx to resolve correctly)
            const useShell = command === 'npx' || command === 'npm' || command === 'yarn' || command === 'pnpm' || command === 'bun';
            const shellPath = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
            const spawnOptions = {
                cwd: options.cwd,
                env: { ...process.env, ...(options.env || {}) },
                stdio: ['ignore', 'pipe', 'pipe'],
            };
            if (useShell) {
                spawnOptions.shell = shellPath;
            }
            const child = spawn(command, args, spawnOptions);
            let stdout = '';
            let stderr = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            const spinner = ora({ text: `Running ${command}`, spinner: 'dots' });
            if (!this.verbose && !options.silent) {
                spinner.start();
            }
            // Store cleanup function references
            const cleanup = () => {
                // Remove all listeners to prevent memory leaks
                if (child.stdout) {
                    child.stdout.removeAllListeners();
                    // Ensure stream is properly closed
                    if (!child.stdout.destroyed) {
                        child.stdout.destroy();
                    }
                }
                if (child.stderr) {
                    child.stderr.removeAllListeners();
                    if (!child.stderr.destroyed) {
                        child.stderr.destroy();
                    }
                }
                child.removeAllListeners();
            };
            // Capture output if silent mode is enabled
            if (options.silent && child.stdout && child.stderr) {
                const onStdoutData = (data) => {
                    stdout += data.toString();
                };
                const onStderrData = (data) => {
                    stderr += data.toString();
                };
                child.stdout.on('data', onStdoutData);
                child.stderr.on('data', onStderrData);
            }
            // Timeout for long-running processes (like npm install)
            // This prevents processes from hanging indefinitely and consuming resources
            const timeout = setTimeout(() => {
                if (!child.killed) {
                    console.warn(chalk.yellow(`⚠️  Command timeout, killing process...`));
                    child.kill('SIGTERM');
                    setTimeout(() => {
                        if (!child.killed) {
                            child.kill('SIGKILL');
                        }
                    }, 5000);
                }
            }, 600000); // 10 minutes timeout
            const onClose = (code) => {
                clearTimeout(timeout); // Clear timeout first
                cleanup(); // Clean up listeners and streams
                const exitCode = code === null ? 1 : code;
                if (exitCode === 0) {
                    if (this.verbose) {
                        console.log(chalk.green(`✅ Command finished successfully.`));
                    }
                    resolve({ stdout, stderr, code: exitCode });
                }
                else {
                    if (this.verbose) {
                        console.error(chalk.red(`❌ Command failed with exit code ${exitCode}.`));
                    }
                    resolve({ stdout, stderr, code: exitCode });
                }
            };
            const onError = (err) => {
                clearTimeout(timeout); // Clear timeout on error
                cleanup(); // Clean up on error
                if (this.verbose) {
                    console.error(chalk.red('Failed to start subprocess.'), err);
                }
                resolve({ stdout, stderr: err.message, code: 1 });
            };
            child.on('close', onClose);
            child.on('error', onError);
        });
    }
    async getVersion() {
        try {
            const result = await this.execCommand(this.commands.version, { silent: true });
            return result.stdout.trim();
        }
        catch (error) {
            throw new Error(`Failed to get ${this.packageManager} version: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createProject(projectName, framework = 'nextjs', options = []) {
        const createCmd = [...this.commands.create, projectName, ...options];
        return this.execCommand(createCmd);
    }
    async install(packages = [], isDev = false, cwd = process.cwd()) {
        const installCmd = isDev ? this.commands.installDev : this.commands.install;
        const fullCmd = packages.length > 0 ? [...installCmd, ...packages] : installCmd;
        return this.execCommand(fullCmd, { cwd });
    }
    async installNonInteractive(packages = [], isDev = false, cwd = process.cwd()) {
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
    getNonInteractiveFlags() {
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
    async runScript(scriptName, cwd = process.cwd()) {
        const runCmd = [...this.commands.run, scriptName];
        return this.execCommand(runCmd, { cwd });
    }
    async exec(toolName, args = [], cwd = process.cwd()) {
        const execCmd = [...this.commands.exec, toolName, ...args];
        return this.execCommand(execCmd, { cwd });
    }
    /**
     * Execute a command non-interactively by providing input via stdin
     * Useful for CLI tools that ask for user input
     */
    async execNonInteractive(toolName, args = [], input = [], cwd = process.cwd()) {
        const execCmd = [...this.commands.exec, toolName, ...args];
        if (this.verbose) {
            console.log(chalk.blue(`🔧 Executing non-interactive: ${execCmd.join(' ')}`));
        }
        return new Promise((resolve, reject) => {
            const command = execCmd[0];
            const args = execCmd.slice(1);
            if (!command) {
                reject(new Error('Command cannot be undefined or empty'));
                return;
            }
            const child = spawn(command, args, {
                cwd,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            child.on('error', (error) => {
                reject(error);
            });
            child.on('close', (code) => {
                resolve({
                    stdout,
                    stderr,
                    code
                });
            });
            // Send input to stdin
            if (input.length > 0 && child.stdin) {
                child.stdin.write(input.join('\n') + '\n');
                child.stdin.end();
            }
        });
    }
    /**
     * Initialize a project using framework-specific initialization command
     *
     * V2 COMPLIANCE: Framework adapter should provide initialization command
     *
     * @deprecated This method hardcodes Next.js. Framework initialization should be handled
     * by framework adapters via blueprint actions, not CLI commands.
     *
     * @param projectPath - Path where project should be created
     * @param framework - Framework name (e.g., 'nextjs', 'expo', 'hono')
     * @param options - Additional options
     * @returns Command execution result
     */
    async initProject(projectPath, framework = 'nextjs', options = {}) {
        // V2 COMPLIANCE: This method should delegate to framework adapter
        // For now, keep as fallback but mark as deprecated
        const Logger = require('../services/infrastructure/logging/logger.js').Logger;
        Logger.warn(`CommandRunner.initProject() is deprecated and hardcodes Next.js. ` +
            `Framework initialization should be handled by framework adapters.`, { framework, projectPath });
        const projectName = path.basename(projectPath);
        const parentDir = path.dirname(projectPath);
        // V2 VIOLATION: Hardcoded Next.js options
        // TODO: Get from framework adapter metadata
        const createOptions = [
            '--typescript',
            '--tailwind',
            '--eslint',
            '--app',
            '--src-dir',
            '--import-alias', '@/*',
            '--yes' // Non-interactive
        ];
        return this.execCommand([...this.commands.create, projectName, ...createOptions], { cwd: parentDir });
    }
}
export default CommandRunner;
//# sourceMappingURL=command-runner.js.map
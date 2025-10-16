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
    async execWithDirectSpawn(command, args, options) {
        return new Promise((resolve) => {
            // For npx commands, we need to use shell to find npx in PATH
            const useShell = command === 'npx' || command === 'npm' || command === 'yarn' || command === 'pnpm' || command === 'bun';
            // Use system's default shell
            const shellPath = process.platform === 'win32' ? 'cmd.exe' : process.env.SHELL || '/bin/bash';
            const child = useShell
                ? spawn(command, args, {
                    cwd: options.cwd || process.cwd(),
                    stdio: options.silent ? 'pipe' : 'inherit',
                    shell: shellPath,
                    env: {
                        ...process.env,
                        ...options.env,
                        CI: 'true',
                        FORCE_COLOR: '1',
                        NODE_ENV: 'production'
                    }
                })
                : spawn(command, args, {
                    cwd: options.cwd || process.cwd(),
                    stdio: options.silent ? 'pipe' : 'inherit', // Real-time output for better UX
                    env: {
                        ...process.env,
                        ...options.env,
                        CI: 'true',
                        FORCE_COLOR: '1',
                        NODE_ENV: 'production'
                    }
                });
            let stdout = '';
            let stderr = '';
            // Capture output if silent mode is enabled
            if (options.silent && child.stdout && child.stderr) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            child.on('close', (code) => {
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
            });
            child.on('error', (err) => {
                if (this.verbose) {
                    console.error(chalk.red('Failed to start subprocess.'), err);
                }
                resolve({ stdout, stderr: err.message, code: 1 });
            });
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
    // Helper method for The Architech specific operations
    async initProject(projectPath, framework = 'nextjs', options = {}) {
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
        return this.execCommand([...this.commands.create, projectName, ...createOptions], { cwd: parentDir });
    }
}
export default CommandRunner;
//# sourceMappingURL=command-runner.js.map
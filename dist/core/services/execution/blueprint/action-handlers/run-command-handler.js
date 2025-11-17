/**
 * Run Command Handler
 *
 * Handles RUN_COMMAND actions by executing shell commands.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */
import { BaseActionHandler } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { CommandRunner } from '../../../../cli/command-runner.js';
import { TemplateService } from '../../../file-system/template/template-service.js';
import { promises as fs } from 'fs';
import { join } from 'path';
export class RunCommandHandler extends BaseActionHandler {
    commandRunner;
    constructor() {
        super();
        this.commandRunner = new CommandRunner();
    }
    getSupportedActionType() {
        return 'RUN_COMMAND';
    }
    async handle(action, context, projectRoot, vfs) {
        const validation = this.validateAction(action);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        // Type guard to narrow the action type
        const runAction = action;
        if (!runAction.command) {
            return { success: false, error: 'RUN_COMMAND action missing command' };
        }
        // Process template command using the sophisticated template service
        const command = TemplateService.processTemplate(runAction.command, context);
        try {
            console.log(`  ⚡ Running command: ${command}`);
            console.log(`  📁 Working directory: ${projectRoot}`);
            // For create-next-app commands, ensure the directory is clean
            if (command.includes('create-next-app')) {
                await this.ensureCleanDirectory(projectRoot);
            }
            // Determine if the command requires a shell (handles cd, &&, ||, pipes, redirects)
            const requiresShell = this.requiresShellExecution(command);
            console.log(`  🔧 Shell execution: ${requiresShell ? 'enabled' : 'disabled'}`);
            let result;
            if (requiresShell) {
                result = await this.commandRunner.execShellCommand(command, {
                    cwd: projectRoot
                });
            }
            else {
                const commandParts = this.tokenizeCommand(command);
                const [cmd, ...args] = commandParts;
                if (!cmd) {
                    return { success: false, error: 'Command is empty after processing' };
                }
                result = await this.commandRunner.execCommand([cmd, ...args], {
                    cwd: projectRoot
                });
            }
            if (result.code === 0) {
                console.log(`  ✅ Command executed successfully`);
                return {
                    success: true,
                    message: `Command executed: ${command}`
                };
            }
            else {
                return {
                    success: false,
                    error: `Command failed with exit code ${result.code}: ${result.stderr}`
                };
            }
        }
        catch (error) {
            const architechError = ArchitechError.internalError(`Command execution error: ${error instanceof Error ? error.message : 'Unknown error'}`, { operation: 'run_command', command: runAction.command });
            return {
                success: false,
                error: architechError.getUserMessage()
            };
        }
    }
    /**
     * Ensures the target directory is clean for create-next-app
     * This prevents the "context conflict" issue where create-next-app
     * sees existing files and creates a subdirectory instead
     */
    async ensureCleanDirectory(projectRoot) {
        try {
            // Check if directory exists
            const stats = await fs.stat(projectRoot).catch(() => null);
            if (stats) {
                if (stats.isDirectory()) {
                    // Directory exists, check if it's empty
                    const files = await fs.readdir(projectRoot);
                    if (files.length > 0) {
                        console.log(`  🧹 Cleaning directory: ${projectRoot}`);
                        // Remove all files and directories except hidden ones
                        for (const file of files) {
                            if (!file.startsWith('.')) {
                                const filePath = join(projectRoot, file);
                                const fileStats = await fs.stat(filePath);
                                if (fileStats.isDirectory()) {
                                    await fs.rmdir(filePath, { recursive: true });
                                }
                                else {
                                    await fs.unlink(filePath);
                                }
                            }
                        }
                    }
                }
                else {
                    // It's a file, remove it and create directory
                    await fs.unlink(projectRoot);
                    await fs.mkdir(projectRoot, { recursive: true });
                }
            }
            else {
                // Directory doesn't exist, create it
                await fs.mkdir(projectRoot, { recursive: true });
            }
        }
        catch (error) {
            console.log(`  ⚠️  Warning: Could not clean directory ${projectRoot}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Don't throw - let the command try to run anyway
        }
    }
    /**
     * Determine if a command string requires shell execution
     */
    requiresShellExecution(command) {
        const trimmed = command.trim();
        if (!trimmed) {
            return false;
        }
        const shellOperators = ['&&', '||', '|', ';', '>>', '<<', '>', '<'];
        if (shellOperators.some(op => trimmed.includes(op))) {
            return true;
        }
        // Commands starting with cd / export / set require shell builtins
        if (/^(cd|export|set) /i.test(trimmed)) {
            return true;
        }
        return false;
    }
    /**
     * Tokenize a command string into arguments, respecting quotes
     */
    tokenizeCommand(command) {
        const matches = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        return matches.map(part => {
            if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
                return part.slice(1, -1);
            }
            return part;
        });
    }
}
//# sourceMappingURL=run-command-handler.js.map
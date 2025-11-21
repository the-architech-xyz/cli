/**
 * CommandRunner - Corrected Version with Direct Process Execution
 *
 * This version uses direct spawn without shell dependency for security
 * and cross-platform compatibility. Follows Node.js best practices.
 *
 * Provides a unified interface for npm, yarn, pnpm, and bun.
 */
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
export declare class CommandRunner {
    private verbose;
    private packageManager;
    private commands;
    constructor(packageManager?: PackageManager, options?: CommandRunnerOptions);
    getPackageManager(): PackageManager;
    getCreateCommand(): string[];
    private detectPackageManager;
    private getPackageManagerCommands;
    execCommand(cmdArray: string[], options?: CommandRunnerOptions): Promise<CommandResult>;
    execShellCommand(command: string, options?: CommandRunnerOptions): Promise<CommandResult>;
    private execWithDirectSpawn;
    private spawnProcess;
    getVersion(): Promise<string>;
    createProject(projectName: string, framework?: string, options?: string[]): Promise<CommandResult>;
    install(packages?: string[], isDev?: boolean, cwd?: string): Promise<CommandResult>;
    installNonInteractive(packages?: string[], isDev?: boolean, cwd?: string): Promise<CommandResult>;
    private getNonInteractiveFlags;
    runScript(scriptName: string, cwd?: string): Promise<CommandResult>;
    exec(toolName: string, args?: string[], cwd?: string): Promise<CommandResult>;
    /**
     * Execute a command non-interactively by providing input via stdin
     * Useful for CLI tools that ask for user input
     */
    execNonInteractive(toolName: string, args?: string[], input?: string[], cwd?: string): Promise<CommandResult>;
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
    initProject(projectPath: string, framework?: string, options?: Record<string, unknown>): Promise<CommandResult>;
}
export default CommandRunner;

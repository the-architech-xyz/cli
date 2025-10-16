/**
 * Enhanced Logger for Beautiful CLI Output
 *
 * Provides a clean, phase-oriented experience for users while preserving
 * detailed debugging information for verbose mode.
 */
export interface LoggerOptions {
    verbose: boolean;
    quiet: boolean;
}
export interface PhaseInfo {
    name: string;
    description: string;
    emoji: string;
}
export declare class EnhancedLogger {
    private verbose;
    private quiet;
    private currentPhase;
    private phaseStartTime;
    private totalModules;
    private completedModules;
    private static readonly PHASES;
    constructor(options: LoggerOptions);
    /**
     * Start a new phase
     */
    startPhase(phaseKey: string): void;
    /**
     * Complete the current phase
     */
    completePhase(): void;
    /**
     * Set total module count for progress tracking
     */
    setTotalModules(count: number): void;
    /**
     * Log module progress
     */
    logModuleProgress(moduleId: string, status: 'installing' | 'configuring' | 'completed' | 'failed'): void;
    /**
     * Log success message
     */
    success(message: string): void;
    /**
     * Log error message
     */
    error(message: string): void;
    /**
     * Log warning message
     */
    warn(message: string): void;
    /**
     * Log info message
     */
    info(message: string): void;
    /**
     * Log next steps after successful completion
     */
    logNextSteps(projectPath: string, projectName: string): void;
    /**
     * Log debug information (verbose mode only)
     */
    debug(message: string, data?: any): void;
    /**
     * Log verbose information (verbose mode only)
     */
    logVerbose(message: string, data?: any): void;
    /**
     * Log action details (verbose mode only)
     */
    logAction(action: string, details: string): void;
    /**
     * Log VFS operations (verbose mode only)
     */
    logVFS(operation: string, file: string): void;
    /**
     * Log template processing (verbose mode only)
     */
    logTemplate(template: string, result: string): void;
    /**
     * Log modifier usage (verbose mode only)
     */
    logModifier(modifier: string, file: string): void;
    /**
     * Log package installation (verbose mode only)
     */
    logPackageInstall(packages: string[]): void;
    /**
     * Log environment variable (verbose mode only)
     */
    logEnvVar(key: string, value: string): void;
}

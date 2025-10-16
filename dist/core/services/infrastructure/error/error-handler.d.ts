/**
 * Error Handler - Standardized Error Handling
 *
 * Provides consistent error handling, formatting, and recovery suggestions
 * across the entire CLI application.
 */
import { ErrorContext, ErrorResult, SuccessResult, ErrorCode, ErrorHandlerOptions } from './error-types.js';
export { ErrorCode } from './error-types.js';
export declare class ErrorHandler {
    private static options;
    /**
     * Configure error handler options
     */
    static configure(options: Partial<ErrorHandlerOptions>): void;
    /**
     * Create a standardized error result
     */
    static createError(message: string, context: Omit<ErrorContext, 'timestamp'>, errorCode?: ErrorCode, recoverable?: boolean, recoverySuggestion?: string): ErrorResult;
    /**
     * Create a success result
     */
    static createSuccess(context: Omit<ErrorContext, 'timestamp'>, message?: string, data?: unknown): SuccessResult & {
        data?: unknown;
    };
    /**
     * Handle file system errors
     */
    static handleFileError(error: unknown, filePath: string, operation: string, recoverable?: boolean): ErrorResult;
    /**
     * Handle action execution errors
     */
    static handleActionError(error: unknown, actionType: string, moduleId: string, agentCategory?: string): ErrorResult;
    /**
     * Handle template processing errors
     */
    static handleTemplateError(error: unknown, template: string, operation: string): ErrorResult;
    /**
     * Handle blueprint execution errors
     */
    static handleBlueprintError(error: unknown, blueprintId: string, actionIndex?: number): ErrorResult;
    /**
     * Handle agent execution errors
     */
    static handleAgentError(error: unknown, agentCategory: string, moduleId: string): ErrorResult;
    /**
     * Handle VFS errors
     */
    static handleVFSError(error: unknown, operation: string, filePath?: string): ErrorResult;
    /**
     * Handle command execution errors
     */
    static handleCommandError(error: unknown, command: string, exitCode?: number): ErrorResult;
    /**
     * Wrap an existing error with additional context
     */
    static wrapError(originalError: ErrorResult, additionalContext: Partial<ErrorContext>): ErrorResult;
    /**
     * Determine error code based on error type and operation
     */
    private static determineFileErrorCode;
    /**
     * Determine error code based on action type
     */
    private static determineActionErrorCode;
    /**
     * Format error for logging
     */
    static formatError(error: ErrorResult): string;
    /**
     * Check if an error is recoverable
     */
    static isRecoverable(error: ErrorResult): boolean;
    /**
     * Get recovery suggestion for an error
     */
    static getRecoverySuggestion(error: ErrorResult): string | undefined;
    /**
     * Create a summary of multiple errors
     */
    static summarizeErrors(errors: ErrorResult[]): string;
    /**
     * Handle critical errors that should stop execution
     */
    static handleCriticalError(error: unknown, traceId: string, operation: string, verbose?: boolean): ErrorResult;
    /**
     * Handle module failure with user-friendly messages
     */
    static reportModuleFailure(moduleId: string, error: string, verbose?: boolean): ErrorResult;
    /**
     * Handle batch execution failures
     */
    static handleBatchFailure(batchNumber: number, errors: string[], verbose?: boolean): ErrorResult;
    /**
     * Handle dependency installation failures
     */
    static handleDependencyFailure(error: unknown, verbose?: boolean): ErrorResult;
    /**
     * Format error for user display (respects verbose mode)
     */
    static formatUserError(error: ErrorResult, verbose?: boolean): string;
}

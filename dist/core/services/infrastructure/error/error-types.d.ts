/**
 * Error Types - Standardized Error Handling
 *
 * Defines types and interfaces for consistent error handling across the CLI.
 */
export interface ErrorContext {
    /** The operation that was being performed when the error occurred */
    operation: string;
    /** File path involved in the error (if applicable) */
    filePath?: string;
    /** Type of action that failed (if applicable) */
    actionType?: string;
    /** Module ID where the error occurred (if applicable) */
    moduleId?: string;
    /** Agent category where the error occurred (if applicable) */
    agentCategory?: string;
    /** Timestamp when the error occurred */
    timestamp: Date;
    /** Additional context data */
    metadata?: Record<string, any>;
}
export interface ErrorResult {
    /** Whether the operation was successful */
    success: false;
    /** Human-readable error message */
    error: string;
    /** Context information about the error */
    context: ErrorContext;
    /** Whether this error is recoverable */
    recoverable: boolean;
    /** Suggested recovery action (if recoverable) */
    recoverySuggestion?: string;
    /** Error code for programmatic handling */
    errorCode?: string;
}
export interface SuccessResult {
    /** Whether the operation was successful */
    success: true;
    /** Optional success message */
    message?: string;
    /** Context information about the successful operation */
    context: Omit<ErrorContext, 'timestamp'> & {
        timestamp: Date;
    };
}
export type OperationResult<T = any> = ErrorResult | (SuccessResult & {
    data?: T;
});
export declare enum ErrorCode {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FILE_READ_ERROR = "FILE_READ_ERROR",
    FILE_WRITE_ERROR = "FILE_WRITE_ERROR",
    FILE_PERMISSION_ERROR = "FILE_PERMISSION_ERROR",
    DIRECTORY_CREATION_ERROR = "DIRECTORY_CREATION_ERROR",
    TEMPLATE_SYNTAX_ERROR = "TEMPLATE_SYNTAX_ERROR",
    TEMPLATE_VARIABLE_NOT_FOUND = "TEMPLATE_VARIABLE_NOT_FOUND",
    TEMPLATE_CONDITIONAL_ERROR = "TEMPLATE_CONDITIONAL_ERROR",
    BLUEPRINT_VALIDATION_ERROR = "BLUEPRINT_VALIDATION_ERROR",
    ACTION_EXECUTION_ERROR = "ACTION_EXECUTION_ERROR",
    MODIFIER_NOT_FOUND = "MODIFIER_NOT_FOUND",
    MODIFIER_EXECUTION_ERROR = "MODIFIER_EXECUTION_ERROR",
    AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
    AGENT_EXECUTION_ERROR = "AGENT_EXECUTION_ERROR",
    MODULE_LOADING_ERROR = "MODULE_LOADING_ERROR",
    CONFIG_VALIDATION_ERROR = "CONFIG_VALIDATION_ERROR",
    ADAPTER_NOT_FOUND = "ADAPTER_NOT_FOUND",
    INTEGRATION_ERROR = "INTEGRATION_ERROR",
    VFS_ERROR = "VFS_ERROR",
    COMMAND_EXECUTION_ERROR = "COMMAND_EXECUTION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    CRITICAL_ERROR = "CRITICAL_ERROR",
    MODULE_EXECUTION_ERROR = "MODULE_EXECUTION_ERROR",
    BATCH_EXECUTION_ERROR = "BATCH_EXECUTION_ERROR",
    DEPENDENCY_INSTALLATION_ERROR = "DEPENDENCY_INSTALLATION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export interface ErrorHandlerOptions {
    /** Whether to include stack traces in error messages */
    includeStackTraces?: boolean;
    /** Whether to log errors to console */
    logToConsole?: boolean;
    /** Custom error formatter function */
    formatter?: (error: ErrorResult) => string;
}

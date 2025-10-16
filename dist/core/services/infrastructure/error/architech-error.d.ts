/**
 * ArchitechError - Standardized Error Class
 *
 * Provides a consistent error format across all services with:
 * - Error codes for programmatic handling
 * - Context information for debugging
 * - User-friendly messages
 * - Structured error data
 */
export declare enum ArchitechErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_PARAMETERS = "INVALID_PARAMETERS",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    MODULE_NOT_FOUND = "MODULE_NOT_FOUND",
    MODULE_LOAD_FAILED = "MODULE_LOAD_FAILED",
    MODULE_EXECUTION_FAILED = "MODULE_EXECUTION_FAILED",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FILE_WRITE_FAILED = "FILE_WRITE_FAILED",
    VFS_ERROR = "VFS_ERROR",
    BLUEPRINT_EXECUTION_FAILED = "BLUEPRINT_EXECUTION_FAILED",
    ACTION_HANDLER_NOT_FOUND = "ACTION_HANDLER_NOT_FOUND",
    MODIFIER_NOT_FOUND = "MODIFIER_NOT_FOUND",
    CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY",
    MISSING_DEPENDENCY = "MISSING_DEPENDENCY",
    DEPENDENCY_CONFLICT = "DEPENDENCY_CONFLICT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    COMMAND_EXECUTION_FAILED = "COMMAND_EXECUTION_FAILED",
    BUILD_FAILED = "BUILD_FAILED",
    INSTALL_FAILED = "INSTALL_FAILED"
}
export interface ArchitechErrorContext {
    operation?: string;
    moduleId?: string;
    filePath?: string;
    actionType?: string;
    modifierName?: string;
    command?: string;
    [key: string]: any;
}
export declare class ArchitechError extends Error {
    readonly code: ArchitechErrorCode;
    readonly context: ArchitechErrorContext;
    readonly timestamp: Date;
    readonly isUserFriendly: boolean;
    constructor(message: string, code: ArchitechErrorCode, context?: ArchitechErrorContext, isUserFriendly?: boolean);
    /**
     * Create a user-friendly error message
     */
    getUserMessage(): string;
    /**
     * Create a detailed error message for debugging
     */
    getDebugMessage(): string;
    /**
     * Get context information for user messages
     */
    private getContextInfo;
    /**
     * Convert to JSON for logging
     */
    toJSON(): object;
    /**
     * Static factory methods for common error types
     */
    static validationError(message: string, context?: ArchitechErrorContext): ArchitechError;
    static moduleNotFound(moduleId: string): ArchitechError;
    static fileNotFound(filePath: string): ArchitechError;
    static blueprintExecutionFailed(blueprintId: string, reason: string): ArchitechError;
    static actionHandlerNotFound(actionType: string): ArchitechError;
    static modifierNotFound(modifierName: string): ArchitechError;
    static commandExecutionFailed(command: string, reason: string): ArchitechError;
    static buildFailed(reason: string): ArchitechError;
    static internalError(message: string, context?: ArchitechErrorContext): ArchitechError;
}

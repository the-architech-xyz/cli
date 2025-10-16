/**
 * ArchitechError - Standardized Error Class
 *
 * Provides a consistent error format across all services with:
 * - Error codes for programmatic handling
 * - Context information for debugging
 * - User-friendly messages
 * - Structured error data
 */
export var ArchitechErrorCode;
(function (ArchitechErrorCode) {
    // Validation Errors
    ArchitechErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ArchitechErrorCode["INVALID_PARAMETERS"] = "INVALID_PARAMETERS";
    ArchitechErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Module Errors
    ArchitechErrorCode["MODULE_NOT_FOUND"] = "MODULE_NOT_FOUND";
    ArchitechErrorCode["MODULE_LOAD_FAILED"] = "MODULE_LOAD_FAILED";
    ArchitechErrorCode["MODULE_EXECUTION_FAILED"] = "MODULE_EXECUTION_FAILED";
    // File System Errors
    ArchitechErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ArchitechErrorCode["FILE_WRITE_FAILED"] = "FILE_WRITE_FAILED";
    ArchitechErrorCode["VFS_ERROR"] = "VFS_ERROR";
    // Blueprint Errors
    ArchitechErrorCode["BLUEPRINT_EXECUTION_FAILED"] = "BLUEPRINT_EXECUTION_FAILED";
    ArchitechErrorCode["ACTION_HANDLER_NOT_FOUND"] = "ACTION_HANDLER_NOT_FOUND";
    ArchitechErrorCode["MODIFIER_NOT_FOUND"] = "MODIFIER_NOT_FOUND";
    // Dependency Errors
    ArchitechErrorCode["CIRCULAR_DEPENDENCY"] = "CIRCULAR_DEPENDENCY";
    ArchitechErrorCode["MISSING_DEPENDENCY"] = "MISSING_DEPENDENCY";
    ArchitechErrorCode["DEPENDENCY_CONFLICT"] = "DEPENDENCY_CONFLICT";
    // System Errors
    ArchitechErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ArchitechErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    ArchitechErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Command Errors
    ArchitechErrorCode["COMMAND_EXECUTION_FAILED"] = "COMMAND_EXECUTION_FAILED";
    ArchitechErrorCode["BUILD_FAILED"] = "BUILD_FAILED";
    ArchitechErrorCode["INSTALL_FAILED"] = "INSTALL_FAILED";
})(ArchitechErrorCode || (ArchitechErrorCode = {}));
export class ArchitechError extends Error {
    code;
    context;
    timestamp;
    isUserFriendly;
    constructor(message, code, context = {}, isUserFriendly = true) {
        super(message);
        this.name = 'ArchitechError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date();
        this.isUserFriendly = isUserFriendly;
        // Ensure proper prototype chain
        Object.setPrototypeOf(this, ArchitechError.prototype);
    }
    /**
     * Create a user-friendly error message
     */
    getUserMessage() {
        if (!this.isUserFriendly) {
            return 'An unexpected error occurred. Please run with --verbose for more details.';
        }
        const baseMessage = this.message;
        const contextInfo = this.getContextInfo();
        return contextInfo ? `${baseMessage} (${contextInfo})` : baseMessage;
    }
    /**
     * Create a detailed error message for debugging
     */
    getDebugMessage() {
        const contextStr = Object.entries(this.context)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        return `[${this.code}] ${this.message}${contextStr ? ` | Context: ${contextStr}` : ''}`;
    }
    /**
     * Get context information for user messages
     */
    getContextInfo() {
        const parts = [];
        if (this.context.moduleId) {
            parts.push(`module: ${this.context.moduleId}`);
        }
        if (this.context.filePath) {
            parts.push(`file: ${this.context.filePath}`);
        }
        if (this.context.actionType) {
            parts.push(`action: ${this.context.actionType}`);
        }
        return parts.join(', ');
    }
    /**
     * Convert to JSON for logging
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            isUserFriendly: this.isUserFriendly,
            stack: this.stack
        };
    }
    /**
     * Static factory methods for common error types
     */
    static validationError(message, context = {}) {
        return new ArchitechError(message, ArchitechErrorCode.VALIDATION_ERROR, context);
    }
    static moduleNotFound(moduleId) {
        return new ArchitechError(`Module '${moduleId}' not found`, ArchitechErrorCode.MODULE_NOT_FOUND, { moduleId });
    }
    static fileNotFound(filePath) {
        return new ArchitechError(`File '${filePath}' not found`, ArchitechErrorCode.FILE_NOT_FOUND, { filePath });
    }
    static blueprintExecutionFailed(blueprintId, reason) {
        return new ArchitechError(`Blueprint '${blueprintId}' execution failed: ${reason}`, ArchitechErrorCode.BLUEPRINT_EXECUTION_FAILED, { moduleId: blueprintId });
    }
    static actionHandlerNotFound(actionType) {
        return new ArchitechError(`No handler found for action type '${actionType}'`, ArchitechErrorCode.ACTION_HANDLER_NOT_FOUND, { actionType });
    }
    static modifierNotFound(modifierName) {
        return new ArchitechError(`Modifier '${modifierName}' not found`, ArchitechErrorCode.MODIFIER_NOT_FOUND, { modifierName });
    }
    static commandExecutionFailed(command, reason) {
        return new ArchitechError(`Command '${command}' failed: ${reason}`, ArchitechErrorCode.COMMAND_EXECUTION_FAILED, { command });
    }
    static buildFailed(reason) {
        return new ArchitechError(`Build failed: ${reason}`, ArchitechErrorCode.BUILD_FAILED, { operation: 'build' });
    }
    static internalError(message, context = {}) {
        return new ArchitechError(message, ArchitechErrorCode.INTERNAL_ERROR, context, false // Not user-friendly by default
        );
    }
}
//# sourceMappingURL=architech-error.js.map
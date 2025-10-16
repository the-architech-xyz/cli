/**
 * Error Types - Standardized Error Handling
 *
 * Defines types and interfaces for consistent error handling across the CLI.
 */
export var ErrorCode;
(function (ErrorCode) {
    // File System Errors
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_READ_ERROR"] = "FILE_READ_ERROR";
    ErrorCode["FILE_WRITE_ERROR"] = "FILE_WRITE_ERROR";
    ErrorCode["FILE_PERMISSION_ERROR"] = "FILE_PERMISSION_ERROR";
    ErrorCode["DIRECTORY_CREATION_ERROR"] = "DIRECTORY_CREATION_ERROR";
    // Template Processing Errors
    ErrorCode["TEMPLATE_SYNTAX_ERROR"] = "TEMPLATE_SYNTAX_ERROR";
    ErrorCode["TEMPLATE_VARIABLE_NOT_FOUND"] = "TEMPLATE_VARIABLE_NOT_FOUND";
    ErrorCode["TEMPLATE_CONDITIONAL_ERROR"] = "TEMPLATE_CONDITIONAL_ERROR";
    // Blueprint Execution Errors
    ErrorCode["BLUEPRINT_VALIDATION_ERROR"] = "BLUEPRINT_VALIDATION_ERROR";
    ErrorCode["ACTION_EXECUTION_ERROR"] = "ACTION_EXECUTION_ERROR";
    ErrorCode["MODIFIER_NOT_FOUND"] = "MODIFIER_NOT_FOUND";
    ErrorCode["MODIFIER_EXECUTION_ERROR"] = "MODIFIER_EXECUTION_ERROR";
    // Agent Errors
    ErrorCode["AGENT_NOT_FOUND"] = "AGENT_NOT_FOUND";
    ErrorCode["AGENT_EXECUTION_ERROR"] = "AGENT_EXECUTION_ERROR";
    ErrorCode["MODULE_LOADING_ERROR"] = "MODULE_LOADING_ERROR";
    // Configuration Errors
    ErrorCode["CONFIG_VALIDATION_ERROR"] = "CONFIG_VALIDATION_ERROR";
    ErrorCode["ADAPTER_NOT_FOUND"] = "ADAPTER_NOT_FOUND";
    ErrorCode["INTEGRATION_ERROR"] = "INTEGRATION_ERROR";
    // System Errors
    ErrorCode["VFS_ERROR"] = "VFS_ERROR";
    ErrorCode["COMMAND_EXECUTION_ERROR"] = "COMMAND_EXECUTION_ERROR";
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Execution Errors
    ErrorCode["CRITICAL_ERROR"] = "CRITICAL_ERROR";
    ErrorCode["MODULE_EXECUTION_ERROR"] = "MODULE_EXECUTION_ERROR";
    ErrorCode["BATCH_EXECUTION_ERROR"] = "BATCH_EXECUTION_ERROR";
    ErrorCode["DEPENDENCY_INSTALLATION_ERROR"] = "DEPENDENCY_INSTALLATION_ERROR";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (ErrorCode = {}));
//# sourceMappingURL=error-types.js.map
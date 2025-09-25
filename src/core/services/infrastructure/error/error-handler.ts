/**
 * Error Handler - Standardized Error Handling
 * 
 * Provides consistent error handling, formatting, and recovery suggestions
 * across the entire CLI application.
 */

import { 
  ErrorContext, 
  ErrorResult, 
  SuccessResult, 
  OperationResult, 
  ErrorCode, 
  ErrorHandlerOptions 
} from './error-types.js';

export { ErrorCode } from './error-types.js';

export class ErrorHandler {
  private static options: Required<ErrorHandlerOptions> = {
    includeStackTraces: false,
    logToConsole: true,
    formatter: (error) => `[${error.context.operation}] ${error.error}`
  };

  /**
   * Configure error handler options
   */
  static configure(options: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Create a standardized error result
   */
  static createError(
    message: string,
    context: Omit<ErrorContext, 'timestamp'>,
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    recoverable: boolean = false,
    recoverySuggestion?: string
  ): ErrorResult {
    const error: ErrorResult = {
      success: false,
      error: message,
      context: {
        ...context,
        timestamp: new Date()
      },
      recoverable,
      errorCode,
      ...(recoverySuggestion && { recoverySuggestion })
    };

    if (this.options.logToConsole) {
      console.error(this.options.formatter(error));
    }

    return error;
  }

  /**
   * Create a success result
   */
  static createSuccess(
    context: Omit<ErrorContext, 'timestamp'>,
    message?: string,
    data?: unknown
  ): SuccessResult & { data?: unknown } {
    return {
      success: true,
      ...(message && { message }),
      context: {
        ...context,
        timestamp: new Date()
      },
      data
    };
  }

  /**
   * Handle file system errors
   */
  static handleFileError(
    error: unknown,
    filePath: string,
    operation: string,
    recoverable: boolean = false
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown file operation error';
    const errorCode = this.determineFileErrorCode(error, operation);
    
    return this.createError(
      `File ${operation} failed for ${filePath}: ${message}`,
      { operation, filePath },
      errorCode,
      recoverable,
      recoverable ? `Check file permissions and try again` : undefined
    );
  }

  /**
   * Handle action execution errors
   */
  static handleActionError(
    error: unknown,
    actionType: string,
    moduleId: string,
    agentCategory?: string
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown action error';
    const errorCode = this.determineActionErrorCode(error, actionType);
    
    return this.createError(
      `Action ${actionType} failed in module ${moduleId}: ${message}`,
      {
        operation: 'action_execution', 
        actionType, 
        moduleId,
        ...(agentCategory && { agentCategory })
      },
      errorCode,
      true,
      `Check module configuration and try again`
    );
  }

  /**
   * Handle template processing errors
   */
  static handleTemplateError(
    error: unknown,
    template: string,
    operation: string
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown template error';
    
    return this.createError(
      `Template processing failed during ${operation}: ${message}`,
      { 
        operation, 
        metadata: { template: template.substring(0, 100) + '...' }
      },
      ErrorCode.TEMPLATE_SYNTAX_ERROR,
      true,
      `Check template syntax and variable references`
    );
  }

  /**
   * Handle blueprint execution errors
   */
  static handleBlueprintError(
    error: unknown,
    blueprintId: string,
    actionIndex?: number
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown blueprint error';
    const context: Omit<ErrorContext, 'timestamp'> = {
      operation: 'blueprint_execution',
      moduleId: blueprintId,
      metadata: { actionIndex }
    };
    
    return this.createError(
      `Blueprint execution failed for ${blueprintId}: ${message}`,
      context,
      ErrorCode.BLUEPRINT_VALIDATION_ERROR,
      true,
      `Check blueprint configuration and dependencies`
    );
  }

  /**
   * Handle agent execution errors
   */
  static handleAgentError(
    error: unknown,
    agentCategory: string,
    moduleId: string
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown agent error';
    
    return this.createError(
      `Agent ${agentCategory} failed for module ${moduleId}: ${message}`,
      { 
        operation: 'agent_execution', 
        agentCategory, 
        moduleId
      },
      ErrorCode.AGENT_EXECUTION_ERROR,
      true,
      `Check agent configuration and module requirements`
    );
  }

  /**
   * Handle VFS errors
   */
  static handleVFSError(
    error: unknown,
    operation: string,
    filePath?: string
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown VFS error';
    
    return this.createError(
      `VFS ${operation} failed${filePath ? ` for ${filePath}` : ''}: ${message}`,
      {
        operation: `vfs_${operation}`,
        ...(filePath && { filePath })
      },
      ErrorCode.VFS_ERROR,
      false,
      `Check VFS state and try again`
    );
  }

  /**
   * Handle command execution errors
   */
  static handleCommandError(
    error: unknown,
    command: string,
    exitCode?: number
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown command error';
    
    return this.createError(
      `Command execution failed: ${command}${exitCode ? ` (exit code: ${exitCode})` : ''}: ${message}`,
      { 
        operation: 'command_execution',
        metadata: { command, exitCode }
      },
      ErrorCode.COMMAND_EXECUTION_ERROR,
      true,
      `Check command syntax and dependencies`
    );
  }

  /**
   * Wrap an existing error with additional context
   */
  static wrapError(
    originalError: ErrorResult,
    additionalContext: Partial<ErrorContext>
  ): ErrorResult {
    return {
      ...originalError,
      context: {
        ...originalError.context,
        ...additionalContext,
        timestamp: new Date()
      }
    };
  }

  /**
   * Determine error code based on error type and operation
   */
  private static determineFileErrorCode(error: unknown, operation: string): ErrorCode {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) return ErrorCode.FILE_NOT_FOUND;
      if (error.message.includes('EACCES') || error.message.includes('permission')) {
        return ErrorCode.FILE_PERMISSION_ERROR;
      }
      if (operation.includes('read')) return ErrorCode.FILE_READ_ERROR;
      if (operation.includes('write')) return ErrorCode.FILE_WRITE_ERROR;
      if (operation.includes('mkdir')) return ErrorCode.DIRECTORY_CREATION_ERROR;
    }
    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Determine error code based on action type
   */
  private static determineActionErrorCode(error: unknown, actionType: string): ErrorCode {
    if (actionType.includes('ENHANCE_FILE')) return ErrorCode.MODIFIER_EXECUTION_ERROR;
    if (actionType.includes('MERGE_JSON')) return ErrorCode.BLUEPRINT_VALIDATION_ERROR;
    // For general action execution errors, use ACTION_EXECUTION_ERROR
    return ErrorCode.ACTION_EXECUTION_ERROR;
  }

  /**
   * Format error for logging
   */
  static formatError(error: ErrorResult): string {
    return this.options.formatter(error);
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverable(error: ErrorResult): boolean {
    return error.recoverable;
  }

  /**
   * Get recovery suggestion for an error
   */
  static getRecoverySuggestion(error: ErrorResult): string | undefined {
    return error.recoverySuggestion;
  }

  /**
   * Create a summary of multiple errors
   */
  static summarizeErrors(errors: ErrorResult[]): string {
    if (errors.length === 0) return 'No errors';
    
    const recoverable = errors.filter(e => e.recoverable).length;
    const nonRecoverable = errors.length - recoverable;
    
    return `${errors.length} errors (${recoverable} recoverable, ${nonRecoverable} non-recoverable)`;
  }

  /**
   * Handle critical errors that should stop execution
   */
  static handleCriticalError(
    error: unknown,
    traceId: string,
    operation: string,
    verbose: boolean = false
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown critical error';
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    const userFriendlyMessage = verbose 
      ? `Critical error in ${operation}: ${message}${stackTrace ? `\n\nStack trace:\n${stackTrace}` : ''}`
      : `An error occurred during ${operation}. For more details, run with --verbose.`;
    
    return this.createError(
      userFriendlyMessage,
      { 
        operation, 
        traceId,
        metadata: { verbose, originalError: message }
      },
      ErrorCode.CRITICAL_ERROR,
      false,
      verbose ? undefined : 'Run with --verbose for detailed error information'
    );
  }

  /**
   * Handle module failure with user-friendly messages
   */
  static reportModuleFailure(
    moduleId: string,
    error: string,
    verbose: boolean = false
  ): ErrorResult {
    const userFriendlyMessage = verbose
      ? `Module ${moduleId} failed: ${error}`
      : `Failed to install module '${moduleId}'. For more details, run with --verbose.`;
    
    return this.createError(
      userFriendlyMessage,
      { 
        operation: 'module_execution',
        moduleId,
        metadata: { verbose, originalError: error }
      },
      ErrorCode.MODULE_EXECUTION_ERROR,
      true,
      verbose ? undefined : 'Run with --verbose for detailed error information'
    );
  }

  /**
   * Handle batch execution failures
   */
  static handleBatchFailure(
    batchNumber: number,
    errors: string[],
    verbose: boolean = false
  ): ErrorResult {
    const userFriendlyMessage = verbose
      ? `Batch ${batchNumber} failed: ${errors.join(', ')}`
      : `Execution failed at batch ${batchNumber}. For more details, run with --verbose.`;
    
    return this.createError(
      userFriendlyMessage,
      { 
        operation: 'batch_execution',
        metadata: { batchNumber, verbose, originalErrors: errors }
      },
      ErrorCode.BATCH_EXECUTION_ERROR,
      false,
      verbose ? undefined : 'Run with --verbose for detailed error information'
    );
  }

  /**
   * Handle dependency installation failures
   */
  static handleDependencyFailure(
    error: unknown,
    verbose: boolean = false
  ): ErrorResult {
    const message = error instanceof Error ? error.message : 'Unknown dependency error';
    const userFriendlyMessage = verbose
      ? `Dependency installation failed: ${message}`
      : 'Failed to install dependencies. For more details, run with --verbose.';
    
    return this.createError(
      userFriendlyMessage,
      { 
        operation: 'dependency_installation',
        metadata: { verbose, originalError: message }
      },
      ErrorCode.DEPENDENCY_INSTALLATION_ERROR,
      true,
      verbose ? undefined : 'Run with --verbose for detailed error information'
    );
  }

  /**
   * Format error for user display (respects verbose mode)
   */
  static formatUserError(error: ErrorResult, verbose: boolean = false): string {
    if (verbose) {
      return `${error.error}${error.recoverySuggestion ? `\n\nSuggestion: ${error.recoverySuggestion}` : ''}`;
    } else {
      return error.error;
    }
  }
}

/**
 * ArchitechError - Standardized Error Class
 * 
 * Provides a consistent error format across all services with:
 * - Error codes for programmatic handling
 * - Context information for debugging
 * - User-friendly messages
 * - Structured error data
 */

export enum ArchitechErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Module Errors
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  MODULE_LOAD_FAILED = 'MODULE_LOAD_FAILED',
  MODULE_EXECUTION_FAILED = 'MODULE_EXECUTION_FAILED',
  
  // File System Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  VFS_ERROR = 'VFS_ERROR',
  
  // Blueprint Errors
  BLUEPRINT_EXECUTION_FAILED = 'BLUEPRINT_EXECUTION_FAILED',
  ACTION_HANDLER_NOT_FOUND = 'ACTION_HANDLER_NOT_FOUND',
  MODIFIER_NOT_FOUND = 'MODIFIER_NOT_FOUND',
  
  // Dependency Errors
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  DEPENDENCY_CONFLICT = 'DEPENDENCY_CONFLICT',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Command Errors
  COMMAND_EXECUTION_FAILED = 'COMMAND_EXECUTION_FAILED',
  BUILD_FAILED = 'BUILD_FAILED',
  INSTALL_FAILED = 'INSTALL_FAILED'
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

export class ArchitechError extends Error {
  public readonly code: ArchitechErrorCode;
  public readonly context: ArchitechErrorContext;
  public readonly timestamp: Date;
  public readonly isUserFriendly: boolean;

  constructor(
    message: string,
    code: ArchitechErrorCode,
    context: ArchitechErrorContext = {},
    isUserFriendly: boolean = true
  ) {
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
  getUserMessage(): string {
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
  getDebugMessage(): string {
    const contextStr = Object.entries(this.context)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return `[${this.code}] ${this.message}${contextStr ? ` | Context: ${contextStr}` : ''}`;
  }

  /**
   * Get context information for user messages
   */
  private getContextInfo(): string {
    const parts: string[] = [];
    
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
  toJSON(): object {
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
  static validationError(message: string, context: ArchitechErrorContext = {}): ArchitechError {
    return new ArchitechError(message, ArchitechErrorCode.VALIDATION_ERROR, context);
  }

  static moduleNotFound(moduleId: string): ArchitechError {
    return new ArchitechError(
      `Module '${moduleId}' not found`,
      ArchitechErrorCode.MODULE_NOT_FOUND,
      { moduleId }
    );
  }

  static fileNotFound(filePath: string): ArchitechError {
    return new ArchitechError(
      `File '${filePath}' not found`,
      ArchitechErrorCode.FILE_NOT_FOUND,
      { filePath }
    );
  }

  static blueprintExecutionFailed(blueprintId: string, reason: string): ArchitechError {
    return new ArchitechError(
      `Blueprint '${blueprintId}' execution failed: ${reason}`,
      ArchitechErrorCode.BLUEPRINT_EXECUTION_FAILED,
      { moduleId: blueprintId }
    );
  }

  static actionHandlerNotFound(actionType: string): ArchitechError {
    return new ArchitechError(
      `No handler found for action type '${actionType}'`,
      ArchitechErrorCode.ACTION_HANDLER_NOT_FOUND,
      { actionType }
    );
  }

  static modifierNotFound(modifierName: string): ArchitechError {
    return new ArchitechError(
      `Modifier '${modifierName}' not found`,
      ArchitechErrorCode.MODIFIER_NOT_FOUND,
      { modifierName }
    );
  }

  static commandExecutionFailed(command: string, reason: string): ArchitechError {
    return new ArchitechError(
      `Command '${command}' failed: ${reason}`,
      ArchitechErrorCode.COMMAND_EXECUTION_FAILED,
      { command }
    );
  }

  static buildFailed(reason: string): ArchitechError {
    return new ArchitechError(
      `Build failed: ${reason}`,
      ArchitechErrorCode.BUILD_FAILED,
      { operation: 'build' }
    );
  }

  static internalError(message: string, context: ArchitechErrorContext = {}): ArchitechError {
    return new ArchitechError(
      message,
      ArchitechErrorCode.INTERNAL_ERROR,
      context,
      false // Not user-friendly by default
    );
  }
}

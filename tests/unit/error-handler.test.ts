/**
 * Error Handler Unit Tests
 * 
 * Tests the standardized error handling functionality
 */

import { describe, it, expect } from 'vitest';
import { ErrorHandler, ErrorCode } from '../../src/core/services/error/error-handler.js';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('should create a standardized error result', () => {
      const error = ErrorHandler.createError(
        'Test error message',
        { operation: 'test_operation' },
        ErrorCode.UNKNOWN_ERROR,
        true,
        'Test recovery suggestion'
      );

      expect(error.success).toBe(false);
      expect(error.error).toBe('Test error message');
      expect(error.context.operation).toBe('test_operation');
      expect(error.context.timestamp).toBeInstanceOf(Date);
      expect(error.recoverable).toBe(true);
      expect(error.errorCode).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.recoverySuggestion).toBe('Test recovery suggestion');
    });

    it('should create error with minimal context', () => {
      const error = ErrorHandler.createError(
        'Minimal error',
        { operation: 'minimal' }
      );

      expect(error.success).toBe(false);
      expect(error.error).toBe('Minimal error');
      expect(error.context.operation).toBe('minimal');
      expect(error.recoverable).toBe(false);
      expect(error.errorCode).toBe(ErrorCode.UNKNOWN_ERROR);
    });
  });

  describe('createSuccess', () => {
    it('should create a success result', () => {
      const success = ErrorHandler.createSuccess(
        { operation: 'test_operation' },
        'Test success message',
        'test'
      );

      expect(success.success).toBe(true);
      expect(success.message).toBe('Test success message');
      expect(success.context.operation).toBe('test_operation');
      expect(success.context.timestamp).toBeInstanceOf(Date);
      expect(success.data).toBe('test');
    });

    it('should create success without message or data', () => {
      const success = ErrorHandler.createSuccess(
        { operation: 'minimal' }
      );

      expect(success.success).toBe(true);
      expect(success.message).toBeUndefined();
      expect(success.data).toBeUndefined();
    });
  });

  describe('handleFileError', () => {
    it('should handle file not found error', () => {
      const error = new Error('ENOENT: no such file or directory');
      const result = ErrorHandler.handleFileError(error, '/test/file.txt', 'read');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File read failed for /test/file.txt');
      expect(result.errorCode).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(result.context.filePath).toBe('/test/file.txt');
      expect(result.context.operation).toBe('read');
    });

    it('should handle permission error', () => {
      const error = new Error('EACCES: permission denied');
      const result = ErrorHandler.handleFileError(error, '/test/file.txt', 'write');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.FILE_PERMISSION_ERROR);
    });

    it('should handle generic file error', () => {
      const error = new Error('Generic file error');
      const result = ErrorHandler.handleFileError(error, '/test/file.txt', 'create', true);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.recoverable).toBe(true);
    });
  });

  describe('handleActionError', () => {
    it('should handle action execution error', () => {
      const error = new Error('Action failed');
      const result = ErrorHandler.handleActionError(
        error,
        'CREATE_FILE',
        'test-module',
        'framework'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Action CREATE_FILE failed in module test-module');
      expect(result.errorCode).toBe(ErrorCode.ACTION_EXECUTION_ERROR);
      expect(result.context.actionType).toBe('CREATE_FILE');
      expect(result.context.moduleId).toBe('test-module');
      expect(result.context.agentCategory).toBe('framework');
      expect(result.recoverable).toBe(true);
    });

    it('should handle enhance file error', () => {
      const error = new Error('Modifier failed');
      const result = ErrorHandler.handleActionError(
        error,
        'ENHANCE_FILE',
        'test-module'
      );

      expect(result.errorCode).toBe(ErrorCode.MODIFIER_EXECUTION_ERROR);
    });
  });

  describe('handleTemplateError', () => {
    it('should handle template processing error', () => {
      const error = new Error('Template syntax error');
      const result = ErrorHandler.handleTemplateError(
        error,
        'Hello {{project.name}}!',
        'process'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template processing failed during process');
      expect(result.errorCode).toBe(ErrorCode.TEMPLATE_SYNTAX_ERROR);
      expect(result.recoverable).toBe(true);
      expect(result.context.metadata?.template).toContain('Hello {{project.name}}!');
    });
  });

  describe('handleBlueprintError', () => {
    it('should handle blueprint execution error', () => {
      const error = new Error('Blueprint validation failed');
      const result = ErrorHandler.handleBlueprintError(
        error,
        'test-blueprint',
        5
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Blueprint execution failed for test-blueprint');
      expect(result.errorCode).toBe(ErrorCode.BLUEPRINT_VALIDATION_ERROR);
      expect(result.context.moduleId).toBe('test-blueprint');
      expect(result.context.metadata?.actionIndex).toBe(5);
    });
  });

  describe('handleAgentError', () => {
    it('should handle agent execution error', () => {
      const error = new Error('Agent failed');
      const result = ErrorHandler.handleAgentError(
        error,
        'framework',
        'test-module'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent framework failed for module test-module');
      expect(result.errorCode).toBe(ErrorCode.AGENT_EXECUTION_ERROR);
      expect(result.context.agentCategory).toBe('framework');
      expect(result.context.moduleId).toBe('test-module');
    });
  });

  describe('handleVFSError', () => {
    it('should handle VFS error', () => {
      const error = new Error('VFS operation failed');
      const result = ErrorHandler.handleVFSError(
        error,
        'create',
        '/test/file.txt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('VFS create failed for /test/file.txt');
      expect(result.errorCode).toBe(ErrorCode.VFS_ERROR);
      expect(result.context.operation).toBe('vfs_create');
      expect(result.context.filePath).toBe('/test/file.txt');
      expect(result.recoverable).toBe(false);
    });
  });

  describe('handleCommandError', () => {
    it('should handle command execution error', () => {
      const error = new Error('Command failed');
      const result = ErrorHandler.handleCommandError(
        error,
        'npm install',
        1
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command execution failed: npm install (exit code: 1)');
      expect(result.errorCode).toBe(ErrorCode.COMMAND_EXECUTION_ERROR);
      expect(result.context.metadata?.command).toBe('npm install');
      expect(result.context.metadata?.exitCode).toBe(1);
    });
  });

  describe('wrapError', () => {
    it('should wrap existing error with additional context', () => {
      const originalError = ErrorHandler.createError(
        'Original error',
        { operation: 'original' }
      );

      const wrappedError = ErrorHandler.wrapError(originalError, {
        moduleId: 'test-module',
        filePath: '/test/file.txt'
      });

      expect(wrappedError.error).toBe('Original error');
      expect(wrappedError.context.operation).toBe('original');
      expect(wrappedError.context.moduleId).toBe('test-module');
      expect(wrappedError.context.filePath).toBe('/test/file.txt');
      expect(wrappedError.context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('utility methods', () => {
    it('should check if error is recoverable', () => {
      const recoverableError = ErrorHandler.createError(
        'Recoverable error',
        { operation: 'test' },
        ErrorCode.UNKNOWN_ERROR,
        true
      );

      const nonRecoverableError = ErrorHandler.createError(
        'Non-recoverable error',
        { operation: 'test' },
        ErrorCode.UNKNOWN_ERROR,
        false
      );

      expect(ErrorHandler.isRecoverable(recoverableError)).toBe(true);
      expect(ErrorHandler.isRecoverable(nonRecoverableError)).toBe(false);
    });

    it('should get recovery suggestion', () => {
      const error = ErrorHandler.createError(
        'Test error',
        { operation: 'test' },
        ErrorCode.UNKNOWN_ERROR,
        true,
        'Test recovery suggestion'
      );

      expect(ErrorHandler.getRecoverySuggestion(error)).toBe('Test recovery suggestion');
    });

    it('should summarize multiple errors', () => {
      const errors = [
        ErrorHandler.createError('Error 1', { operation: 'test1' }, ErrorCode.UNKNOWN_ERROR, true),
        ErrorHandler.createError('Error 2', { operation: 'test2' }, ErrorCode.UNKNOWN_ERROR, false),
        ErrorHandler.createError('Error 3', { operation: 'test3' }, ErrorCode.UNKNOWN_ERROR, true)
      ];

      const summary = ErrorHandler.summarizeErrors(errors);
      expect(summary).toBe('3 errors (2 recoverable, 1 non-recoverable)');
    });

    it('should handle empty error array', () => {
      const summary = ErrorHandler.summarizeErrors([]);
      expect(summary).toBe('No errors');
    });
  });
});
